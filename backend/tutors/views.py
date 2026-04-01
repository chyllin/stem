from typing import cast, TypedDict, Optional
from decimal import Decimal

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError

from .models import Tutor_Profile, TutorLikes, TutorRating, Status
from .serializers import (
    TutorProfileSerializer,
    TutorSearchSerializer,
    TutorRatingSerializer,
)
from .utils.search import normalize_for_search
from user_auth.utils.mail import send_tutor_signup_email
from user_auth.utils.sanitize import validate_request_data

from django.db.models import Sum, Avg, F, ExpressionWrapper, FloatField, DecimalField
from django.db.models.functions import Cast, Coalesce
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q


class Tutor_Signup_View(generics.CreateAPIView):
    """
    View to create a new tutor profile (signup).

    Accepts POST with validated tutor profile data.
    Returns 201 Created with the created profile on success.
    Sends a welcome email to the tutor's email address.
    Requires no authentication.
    """

    queryset = Tutor_Profile.objects.all()
    serializer_class = TutorProfileSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):

        instance = serializer.save()
        to_email = serializer.validated_data.get("email") or getattr(
            instance, "email", None
        )
        full_name = serializer.validated_data.get("full_name") or getattr(
            instance, "full_name", None
        )
        if to_email is not None and full_name is not None:
            send_tutor_signup_email(
                to_email=to_email, 
                full_name=full_name, 
                fail_silently=True
            )

class TutorListPagination(PageNumberPagination):
    """
    Pagination class for tutor list results.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

class EarningsStats(TypedDict):
    total_paid: Optional[Decimal]
    total_pending: Optional[Decimal]
    transaction_count: int

class Tutor_Profile_List_View(generics.ListAPIView):
    """
    View to list all tutor profiles.

    Accepts GET request.
    Returns a list of all tutor profiles.
    Requires authentication.
    """

    serializer_class = TutorProfileSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = TutorListPagination

    def get_queryset(self):
        # We use .annotate() to attach extra data to each object in the query
        return Tutor_Profile.objects.annotate(
            total_count=Count("bookings"),
            completed_count=Count("bookings", filter=Q(bookings__status="Completed")),
        ).order_by(
            "-average_rating"
        )  # Optional: order by best tutors first

    def list(self, request, *args, **kwargs):
        # Add filtering logic here if needed
        return super().list(request, *args, **kwargs)


class Top_Tutors_View(generics.ListAPIView):
    """
    View to retrieve the highest-performing tutors.
    Sorted by average rating and then by completion rate.
    """

    serializer_class = TutorProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            Tutor_Profile.objects.annotate(
                total_count=Count("bookings"),
                completed_count=Count(
                    "bookings", filter=Q(bookings__status="Completed")
                ),
            )
            .annotate(
                # Calculate a temporary completion_score for sorting (0.0 to 1.0)
                # Coalesce handles cases where there are 0 bookings to avoid NULL
                completion_score=Coalesce(
                    ExpressionWrapper(
                        Cast("completed_count", FloatField())
                        / Cast("total_count", FloatField()),
                        output_field=FloatField(),
                    ),
                    0.0,
                )
            )
            .order_by("-average_rating", "-completion_score")[:10]
        )  # Top 10 tutors


class Tutor_Earnings_Summary_View(APIView):
    """
    View to retrieve total earnings (Paid and Pending) for a tutor.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            clean_params = validate_request_data(
                request.query_params, content_length=255
            )
        except ValidationError as e:
            raise ValidationError(e)

        try:
            tutor_id = clean_params["id"]
        except KeyError:
            raise ValidationError({"id": "This field is required."})

        tutor = get_object_or_404(Tutor_Profile, id=tutor_id)

        # Aggregate different buckets of money in a single query
        stats: EarningsStats = tutor.earnings_records.aggregate(  # type:ignore
            total_paid=Sum("amount", filter=Q(status="Paid")),
            total_pending=Sum("amount", filter=Q(status="Pending")),
            transaction_count=Count("id"),
        )

        return Response(
            {
                "tutor_id": tutor.id,
                "full_name": tutor.full_name,
                # Ensure we return 0.00 instead of None for empty records
                "total_paid": stats["total_paid"] or 0.00,
                "total_pending": stats["total_pending"] or 0.00,
                "total_transactions": stats["transaction_count"],
            },
            status=status.HTTP_200_OK,
        )


class Tutor_Earnings_By_Subject_View(APIView):
    """
    View to get a breakdown of a tutor's earnings grouped by subject.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            clean_params = validate_request_data(
                request.query_params, content_length=255
            )
        except ValidationError as e:
            raise ValidationError(e)

        try:
            tutor_id = clean_params["id"]
        except KeyError:
            raise ValidationError({"id": "This field is required."})

        tutor = get_object_or_404(Tutor_Profile, id=tutor_id)

        # 1. Get earnings with an annotation for how many subjects are in each booking
        earnings_with_subject_counts = tutor.earnings_records.filter(  # type:ignore
            status="Paid"
        ).annotate(subject_count=Count("booking__subjects"))

        # 2. Group by subject and divide the amount by the count
        report = (
            earnings_with_subject_counts
            .values(subject_name=F('booking__subjects__name'))
            .annotate(
                total_earned=Sum(
                    ExpressionWrapper(
                        F('amount') / F('subject_count'),
                        output_field=DecimalField()
                    )
                )
            )
            .order_by('-total_earned')
        )

        return Response(
            {"tutor_id": tutor.id, "earnings_by_subject": list(report)},
            status=status.HTTP_200_OK,
        )


class Single_Tutor_Completion_Rate_View(APIView):
    """
    View to get the completion rate for a specific tutor by ID query-param.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # 1. Get the tutor ID from query parameters
        try:
            clean_params = validate_request_data(
                request.query_params, content_length=255
            )
        except ValidationError as e:
            raise ValidationError(e)

        try:
            tutor_id = clean_params["id"]
        except KeyError:
            raise ValidationError({"id": "This field is required."})

        # 2. Fetch the tutor with annotations to avoid N+1 queries in the serializer
        # This executes a single SQL JOIN + COUNT query
        queryset = Tutor_Profile.objects.annotate(
            total_count=Count("bookings"),
            completed_count=Count("bookings", filter=Q(bookings__status="Completed")),
        )

        tutor = get_object_or_404(queryset, id=tutor_id)

        # 3. Use your existing serializer
        # Because we annotated total_count/completed_count, your
        # get_completion_rate method will work perfectly.
        serializer = TutorProfileSerializer(tutor)

        return Response(
            {
                "tutor_id": tutor.id,
                "full_name": tutor.full_name,
                "completion_rate": serializer.data.get(  # type:ignore
                    "completion_rate"
                ),
            },
            status=status.HTTP_200_OK,
        )


class Tutor_Profile_Detail_View(generics.RetrieveAPIView):
    """
    View to retrieve a specific tutor profile.

    Accepts GET request with tutor profile ID.
    Returns the tutor profile details.
    Requires authentication.
    """

    queryset = Tutor_Profile.objects.all()
    serializer_class = TutorProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"


class Tutor_Profile_Update_View(generics.UpdateAPIView):
    """
    View to update a tutor profile.

    Accepts PUT/PATCH request with tutor profile ID and updated data.
    Returns the updated tutor profile.
    Requires authentication.
    """

    queryset = Tutor_Profile.objects.all()
    serializer_class = TutorProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"


class Tutor_Profile_Delete_View(generics.DestroyAPIView):
    """
    View to delete a tutor profile.

    Accepts DELETE request with tutor profile ID.
    Returns 204 No Content on success.
    Requires authentication.
    """

    queryset = Tutor_Profile.objects.all()
    serializer_class = TutorProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"


class TutorSearchPagination(PageNumberPagination):
    """
    Pagination class for tutor search results.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class Tutor_Search_View(generics.ListAPIView):
    """
    Search view for tutor profiles.

    Query params:
      - subjects: partial match on normalized subjects
      - location: partial match on normalized location
      - experience_years: minimum years of experience (integer)
      - rating: minimum average rating (float)
      - page: page number for pagination (default: 1)
      - page_size: number of results per page (default: 20, max: 100)
    """

    serializer_class = TutorSearchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = TutorSearchPagination

    def get_queryset(self):
        request = cast(Request, self.request)

        queryset = Tutor_Profile.objects.all()

        # Only show active tutors by default
        queryset = queryset.filter(status=Status.ACTIVE)

        try:
            clean_params = validate_request_data(
                dict(request.query_params), content_length=255
            )
        except ValidationError:
            # If validation fails, return empty queryset
            # Error will be handled in list() method
            return queryset.none()

        params = clean_params

        subjects = params.get("subjects", None)
        if subjects:
            normalized_subjects = normalize_for_search(str(subjects))
            if normalized_subjects:
                queryset = queryset.filter(subjects_slug__icontains=normalized_subjects)

        location = params.get("location", None)
        if location:
            normalized_location = normalize_for_search(str(location))
            if normalized_location:
                queryset = queryset.filter(location_slug__icontains=normalized_location)

        experience_years = params.get("experience_years", None)
        if experience_years:
            try:
                experience_value = int(str(experience_years))
                queryset = queryset.filter(experience_years__gte=experience_value)
            except (TypeError, ValueError):
                pass

        rating = params.get("rating", None)
        if rating:
            try:
                rating_value = float(str(rating))
                queryset = queryset.filter(average_rating__gte=rating_value)
            except (TypeError, ValueError):
                pass

        return queryset


class Total_Tutor_Count_View(generics.ListAPIView):
    """
    View to get the total number of tutors.
    """

    queryset = Tutor_Profile.objects.all()  # type: ignore[attr-defined]
    serializer_class = TutorProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Tutor_Profile.objects.all()  # type: ignore[attr-defined]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        total_count = queryset.count()
        return Response({"total_count": total_count})


class Total_Tutor_Sessions_View(generics.ListAPIView):
    """
    View to get the total number of tutor sessions across all tutors.

    Query params:
      - status: Optional filter by tutor status (Active, Inactive, Suspended)
    """

    queryset = Tutor_Profile.objects.all()  # type: ignore[attr-defined]
    serializer_class = TutorProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        request = cast(Request, self.request)
        queryset = Tutor_Profile.objects.all()

        try:
            clean = validate_request_data(
                dict(request.query_params), content_length=255
            )
        except ValidationError as e:
            raise ValidationError(e)

        # Filter by status if provided
        status_param = clean.get("status", None)
        if status_param:
            # Validate status against choices
            valid_statuses = [choice[0] for choice in Status.choices]
            if status_param in valid_statuses:
                queryset = queryset.filter(status=status_param)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        result = queryset.aggregate(total_sessions_sum=Sum("total_sessions"))
        total_sessions = result["total_sessions_sum"] or 0

        return Response({"total_sessions": total_sessions})


class Average_Tutor_Rating_View(generics.ListAPIView):
    """
    View to get the average rating across all tutors.

    Query params:
      - status: Optional filter by tutor status (Active, Inactive, Suspended)
    """

    queryset = Tutor_Profile.objects.all()
    serializer_class = TutorProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        request = cast(Request, self.request)
        try:
            clean = validate_request_data(
                dict(request.query_params), content_length=255
            )
        except ValidationError as e:
            raise ValidationError(e)
        queryset = Tutor_Profile.objects.all()

        # Filter by status if provided
        status_param = clean.get("status", None)
        if status_param:
            # Validate status against choices
            valid_statuses = [choice[0] for choice in Status.choices]
            if status_param in valid_statuses:
                queryset = queryset.filter(status=status_param)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        # Exclude tutors with 0.0 rating (tutors who haven't received ratings yet)
        queryset_with_ratings = queryset.exclude(average_rating=0.0)

        # Count tutors with ratings
        tutors_with_ratings_count = queryset_with_ratings.count()

        # Calculate average rating
        result = queryset_with_ratings.aggregate(avg_rating=Avg("average_rating"))
        avg_rating = result["avg_rating"]

        # Round to 2 decimal places if rating exists, otherwise return 0.0
        if avg_rating is not None:
            avg_rating = round(avg_rating, 2)
        else:
            avg_rating = 0.0

        return Response(
            {
                "average_rating": avg_rating,
                "tutors_with_ratings": tutors_with_ratings_count,
            }
        )


class Single_Tutor_Average_Rating_View(APIView):
    """
    View to get the dynamically calculated average rating for a single tutor.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            clean = validate_request_data(
                dict(request.query_params), content_length=255
            )
        except ValidationError as e:
            raise ValidationError(e)

        # 1. Get the ID from query params
        tutor_id = clean.get("id")

        if not tutor_id:
            raise ValidationError("Tutor ID parameter is required.")

        # 2. Fetch the specific tutor (returns 404 automatically if not found)
        tutor = get_object_or_404(Tutor_Profile, id=tutor_id)

        # 3. Aggregate the individual scores using the related_name 'ratings'
        # This executes a single, efficient SQL query: SELECT AVG(score) FROM tutorrating WHERE tutor_id = X
        aggregation = tutor.ratings.aggregate(avg_score=Avg("score"))  # type:ignore
        avg_rating = aggregation["avg_score"]

        # 4. Count the total number of ratings
        total_ratings = tutor.ratings.count()  # type:ignore

        # 5. Format the result
        return Response(
            {
                "tutor_id": tutor.id,
                "average_rating": (
                    round(avg_rating, 2) if avg_rating is not None else 0.0
                ),
                "total_ratings": total_ratings,
            }
        )


class Add_Tutor_Rating_View(generics.CreateAPIView):
    """
    View to submit a new rating for a tutor.
    Expects JSON: {"tutor": <id>, "score": 5}
    """

    queryset = TutorRating.objects.all()
    serializer_class = TutorRatingSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            clean = validate_request_data(dict(request.data), content_length=255)
        except ValidationError as e:
            raise ValidationError(e)

        serializer = self.get_serializer(data=clean)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Custom response to show the updated status
        return Response(
            {"message": "Rating submitted successfully.", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )


class Tutor_Likes_View(APIView):
    """
    View to retrieve the total like count or add a new like for a tutor.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            clean = validate_request_data(
                dict(request.query_params), content_length=255
            )
        except ValidationError as e:
            raise ValidationError(e)

        tutor_id = clean.get("id")

        if not tutor_id:
            raise ValidationError("Tutor ID is required")

        tutor = get_object_or_404(Tutor_Profile, id=tutor_id)

        # Count the total number of records in the TutorLikes table for this tutor
        total_likes = tutor.likes.count()  # type:ignore

        return Response(
            {"tutor_id": tutor.id, "total_likes": int(total_likes)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, *args, **kwargs):
        try:
            clean = validate_request_data(
                dict(request.query_params), content_length=255
            )
        except ValidationError as e:
            raise ValidationError(e)

        tutor_id = clean.get("id")

        if not tutor_id:
            raise ValidationError("Tutor ID is required to like a profile.")

        tutor = get_object_or_404(Tutor_Profile, id=tutor_id)

        # Create the like record
        # Note: 'like' defaults to 1 based in the model validation, but we explicitly pass it
        TutorLikes.objects.create(tutor=tutor, like=1)

        total_likes = tutor.likes.count()  # type:ignore

        return Response(
            {"message": "Like added successfully.", "total_likes": int(total_likes)},
            status=status.HTTP_201_CREATED,
        )
