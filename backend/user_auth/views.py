from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenBlacklistView,
)

from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.conf import settings

from .serializers import CustomUserSerializer, ChangePasswordSerializer
from .utils.sanitize import validate_request_data
from .utils.crypto import Crypto

crypto = Crypto()
User = get_user_model()


class User_Register_View(generics.CreateAPIView):
    """
    View to register a new user account.

    Accepts POST with validated user data including password.
    Returns 201 Created with the created user (password excluded) on success.
    Public endpoint - no authentication required for registration.
    """

    queryset = User.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [AllowAny]


class User_List_View(generics.ListAPIView):
    """
    View to list all users.

    Accepts GET request.
    Returns a list of all users (passwords excluded).
    Requires authentication.
    """

    queryset = User.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]


class User_Detail_View(generics.RetrieveAPIView):
    """
    View to retrieve a specific user.

    Accepts GET request with user ID.
    Returns the user details (password excluded).
    Requires authentication.
    """

    queryset = User.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"


class User_Update_View(generics.UpdateAPIView):
    """
    View to update a user account.

    Accepts PUT/PATCH request with user ID and updated data.
    Returns the updated user (password excluded).
    Requires authentication.
    """

    queryset = User.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"


class User_Delete_View(generics.DestroyAPIView):
    """
    View to delete a user account.

    Accepts DELETE request with user ID.
    Returns 204 No Content on success.
    Requires authentication.
    """

    queryset = User.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"


# ---------- Auth: Login, Refresh, Logout, Change Password ----------


class Login_View(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        try:
            clean = validate_request_data(request.data, content_length=255)
        except ValidationError as e:
            raise ValidationError(str(e))

        username = clean.get("username")
        password = clean.get("password")
        email = clean.get("email")
        # print(username, password, email)

        if not password:
            raise ValidationError('Password is required')

        if not username and email:
            email_hash = crypto.hash_data(email)
            user_obj = User.objects.get(email_hash=email_hash)
            username = user_obj.username

        user = authenticate(request=request, username=username, password=password)
        if not user:
            raise AuthenticationFailed("Invalid Credentials")

        refresh = RefreshToken.for_user(user)
        access_token = AccessToken.for_user(user)

        userr = User.objects.get(id=user.id)  # type:ignore

        response = Response(
            {
                "id": user.id,  # type:ignore
                "username": userr.username,
                "email": userr.email,
                "role": userr.role,  # type:ignore
            },
            status=status.HTTP_200_OK,
        )

        response.set_cookie(
            key=settings.SIMPLE_JWT["AUTH_COOKIE"],
            value=str(access_token),
            httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
            secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
            samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
            path="/",
            max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
        )

        response.set_cookie(
            key=settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"],
            value=str(refresh),
            httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
            secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
            samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
            path="/",
            max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
        )

        # print("Cookies set successfully")
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {"id": user.id, "username": user.username, "email": user.email},
            status=status.HTTP_200_OK,
        )


class Refresh_Token_View(TokenRefreshView):
    """
    Refresh tokens: POST with refresh token (in body or cookie).
    Returns new access token (and optionally new refresh token if rotation is on).
    Public endpoint (only needs valid refresh token).
    """

    permission_classes = [AllowAny]


class Logout_View(TokenBlacklistView):
    """
    Logout: POST with refresh token in body as {"refresh": "<refresh_token>"}.
    Blacklists the refresh token so it can no longer be used.
    """

    permission_classes = [AllowAny]


class Change_Password_View(APIView):
    """
    Change password: POST with old_password, new_password, new_password_confirm.
    Requires authentication (JWT).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = request.user
        new_password = serializer.validated_data["new_password"]  # type: ignore[index]
        user.set_password(new_password)
        user.save()
        return Response(
            {"detail": "Password changed successfully."}, status=status.HTTP_200_OK
        )
