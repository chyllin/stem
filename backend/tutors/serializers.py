from typing import Any
import phonenumbers

from rest_framework import serializers

from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

from .models import Tutor_Profile, TutorRating, Status, Id_Type
from .utils.validate import validate_ghana_card

User = get_user_model()


class TutorProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for Tutor_Profile model with POST validation.
    Handles creation and validation of tutor profiles.
    """
    # Explicit field definitions for better validation control
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=True,
        error_messages={
            "required": "user is required.",
            "does_not_exist": "Invalid user. User does not exist.",
        },
    )

    full_name = serializers.CharField(
        max_length=250,
        required=True,
        error_messages={
            "invalid": "full_name must be a valid string.",
        },
    )

    email = serializers.EmailField(
        max_length=255,
        required=True,
        error_messages={
            "invalid": "email must be a valid email address.",
        },
    )

    phone_number = serializers.CharField(
        required=True,
        error_messages={
            "invalid": "phone_number must be a valid phone number.",
        },
    )

    age = serializers.IntegerField(
        required=True,
        min_value=0,
        max_value=150,
        error_messages={
            "invalid": "age must be a valid integer.",
        },
    )

    id_number = serializers.CharField(
        required=True,
        error_messages={
            "invalid": "id_number must be a valid alphanumeric string.",
        },
    )

    id_type = serializers.ChoiceField(
        choices=Id_Type.choices,
        required=True,
        error_messages={
            "invalid_choice": "id_type must be one of: Passport, Driver License, National ID, Voter ID, Certificate.",
        },
    )

    experience_years = serializers.IntegerField(
        required=True,
        min_value=0,
        max_value=100,
        error_messages={
            "invalid": "experience_years must be a valid positive integer.",
            "min_value": "experience_years cannot be negative.",
        },
    )

    qualifications = serializers.ListField(
        child=serializers.CharField(max_length=255),
        required=True,
        error_messages={
            "invalid": "qualifications must be a valid string.",
        },
    )

    location = serializers.CharField(
        required=True,
        error_messages={
            "invalid": "location must be a valid string.",
        },
    )

    profile_picture_url = serializers.URLField(
        max_length=500,
        required=False,
        allow_null=True,
        allow_blank=True,
        error_messages={
            "invalid": "profile_picture_url must be a valid url.",
        },
    )

    response_time_hours = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=0,
        error_messages={
            "invalid": "response_time_hours must be a valid integer.",
            "min_value": "response_time_hours cannot be negative.",
        },
    )

    status = serializers.ChoiceField(
        choices=Status.choices,
        required=True,
        error_messages={
            "invalid_choice": "status must be one of: Active, Inactive, Suspended.",
        },
    )

    subjects = serializers.ListField(
        child = serializers.CharField(max_length=50),
        required=True,
        error_messages={
            "invalid": "subjects must be a valid string.",
        },
    )

    bio = serializers.CharField(
        required=True,
        error_messages={
            "invalid": "bio must be a valid string.",
        },
    )

    availability = serializers.CharField(
        required=True,
        error_messages={
            "invalid": "availability must be a valid string.",
        },
    )

    hourly_rate = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        required=False,
        allow_null=True,
        min_value=0,
        error_messages={
            "invalid": "hourly_rate must be a valid decimal number.",
            "max_digits": "hourly_rate cannot have more than 6 digits total.",
            "max_decimal_places": "hourly_rate cannot have more than 2 decimal places.",
            "min_value": "hourly_rate cannot be negative.",
        },
    )
    completion_rate = serializers.SerializerMethodField()

    # Read-only fields (computed/default fields)
    id = serializers.UUIDField(read_only=True)
    id_verified = serializers.BooleanField(read_only=True)
    verified = serializers.BooleanField(read_only=True)
    total_sessions = serializers.IntegerField(read_only=True)
    average_rating = serializers.DecimalField(
        max_digits=2, decimal_places=1, read_only=True
    )
    total_likes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tutor_Profile
        fields = [
            "id",
            "user",
            "full_name",
            "email",
            "phone_number",
            "age",
            "id_number",
            "id_type",
            "id_verified",
            "experience_years",
            "qualifications",
            "location",
            "profile_picture_key",
            "verified",
            "total_sessions",
            "average_rating",
            "total_likes",
            "response_time_hours",
            "completion_rate",
            "status",
            "subjects",
            "bio",
            "availability",
            "hourly_rate",
        ]

    def __init__(self, *args, **kwargs):
        """
        Initialize serializer and set user queryset dynamically.
        """
        super().__init__(*args, **kwargs)
        from django.contrib.auth import get_user_model

        User = get_user_model()
        self.fields["user"].queryset = User.objects.all()  # type: ignore

    def get_completion_rate(self, obj: Any) -> str:
        # Check if the values were annotated to avoid extra DB hits
        total = getattr(obj, "total_count", obj.bookings.count())
        completed = getattr(
            obj, "completed_count", obj.bookings.filter(status="Completed").count()
        )

        if total == 0:
            return "0%"

        rate = (completed / total) * 100
        return f"{round(rate)}%"

    def validate_email(self, value):
        """
        Validate email format if provided.
        """
        if value:
            email_validator = EmailValidator()
            try:
                email_validator(value)
            except ValidationError:
                raise serializers.ValidationError("Enter a valid email address.")
        return value

    def validate_phone_number(self, value):
        try:
            # Parse the number.
            # Note: value must include a country code (e.g., +1...)
            # unless you provide a default region code.
            parsed_number = phonenumbers.parse(value, "GH")

            # Check if the number is physically possible and valid for its region
            if not phonenumbers.is_valid_number(
                parsed_number
            ) or not phonenumbers.is_possible_number(parsed_number):
                raise serializers.ValidationError(
                    "The phone number provided is not valid."
                )

            # Return the number in E.164 format (global standard)
            return phonenumbers.format_number(
                parsed_number, phonenumbers.PhoneNumberFormat.E164
            )

        except phonenumbers.NumberParseException:
            raise serializers.ValidationError(
                "Phone number must be in ghanaian format (e.g. +23325550111)."
            )

    def validate_id_number(self, value):
        """
        Validate ID number format.
        If the value looks like a Ghana card (starts with GHA-), validate it.
        Full validation with id_type check happens in validate() method.
        """
        if value:
            if not value.startswith("GHA-"):
                raise serializers.ValidationError(
                    "Enter a valid Ghana Card ID. Format should be: GHA-XXXXXXXXX-X"
                )

            # If it looks like a Ghana card format, validate it
            if not validate_ghana_card(value):
                raise serializers.ValidationError(
                    "Invalid Ghana card number. Format should be: GHA-XXXXXXXXX-X"
                )

        return value

    def validate_age(self, value):
        """
        Validate age if provided (stored as string in model).
        """
        if value:
            try:
                age_int = int(value)
                if age_int <= 0 or age_int >= 150:
                    raise serializers.ValidationError("Age must be between 0 and 150.")
            except ValueError:
                raise serializers.ValidationError("Age must be a valid number.")
        return age_int

    def validate_experience_years(self, value):
        """
        Validate experience_years if provided.
        """
        if value is not None and value <= 0:
            raise serializers.ValidationError("Experience years cannot be negative.")
        return int(value)

    def validate_response_time_hours(self, value):
        """
        Validate response_time_hours if provided.
        """
        if value is not None and value <= 0:
            raise serializers.ValidationError("Response time hours cannot be negative.")
        return value

    def validate_hourly_rate(self, value):
        """
        Validate hourly_rate if provided.
        """
        if value is not None:
            if value < 0:
                raise serializers.ValidationError("Hourly rate cannot be negative.")
            if value > 999999.99:
                raise serializers.ValidationError(
                    "Hourly rate cannot exceed 999999.99."
                )
        return value

    def validate_id_type(self, value):
        """
        Validate id_type if provided.
        """
        if value:
            valid_choices = [choice[0] for choice in Id_Type.choices]
            if value not in valid_choices:
                raise serializers.ValidationError(
                    f"id_type must be one of: {', '.join(valid_choices)}."  # type: ignore
                )
        return value

    def validate_status(self, value):
        """
        Validate status if provided.
        """
        if value:
            valid_choices = [choice[0] for choice in Status.choices]
            if value not in valid_choices:
                raise serializers.ValidationError(
                    f"status must be one of: {', '.join(valid_choices)}."  # type: ignore
                )
        return value

    def validate(self, attrs):
        """
        Object-level validation for POST requests.
        """
        # Ensure user is provided for POST requests
        if self.instance is None:  # This is a POST request (create)
            if "user" not in attrs:
                raise serializers.ValidationError(
                    {"user": "user is required for creating a tutor profile."}
                )

        # Validate that if id_number is provided, id_type should also be provided
        if attrs.get("id_number") and not attrs.get("id_type"):
            raise serializers.ValidationError(
                {"id_type": "id_type is required when id_number is provided."}
            )

        # Validate that if id_type is provided, id_number should also be provided
        if attrs.get("id_type") and not attrs.get("id_number"):
            raise serializers.ValidationError(
                {"id_number": "id_number is required when id_type is provided."}
            )

        # Validate Ghana card format if id_type is National ID
        id_number = attrs.get("id_number")
        id_type = attrs.get("id_type")

        # only National ID (Ghana card) is allowed
        if id_type and not id_type == Id_Type.NATIONAL_ID[0]:
            raise serializers.ValidationError(
                {"id_type": "id_type must be National ID (Ghana card)"}
            )

        if id_number and id_type == Id_Type.NATIONAL_ID[0]:
            if not validate_ghana_card(id_number):
                raise serializers.ValidationError(
                    {
                        "id_number": "Invalid Ghana card number. Format should be: GHA-XXXXXXXXX-X"
                    }
                )

        return attrs

    def create(self, validated_data):
        """
        Create and return a new Tutor_Profile instance.
        """
        return Tutor_Profile.objects.create(**validated_data)  # type: ignore


class TutorSearchSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for tutor search results.
    """

    class Meta:
        model = Tutor_Profile
        fields = [
            "id",
            "full_name",
            "subjects",
            "location",
            "experience_years",
            "average_rating",
            "hourly_rate",
            "verified",
            "status",
        ]


class TutorRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorRating
        fields = ["tutor", "score", "created_at"]
        read_only_fields = ["created_at"]

    def validate_score(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value
