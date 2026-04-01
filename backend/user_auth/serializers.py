from rest_framework import serializers

from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model

from .models import Role
from tutors.models import Tutor_Profile
from parent.models import Parent_Profile

User = get_user_model()


class CustomUserSerializer(serializers.ModelSerializer):

    """
    Serializer for Custom_User model with POST validation.
    Handles creation and validation of user accounts.
    """

    # Password field - write-only, not returned in responses
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        error_messages={
            'required': 'password is required.',
            'invalid': 'password does not meet security requirements.',
        }
    )

    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        error_messages={
            "required": "password_confirm is required.",
            "invalid": "password does not meet security requirements.",
        },
    )

    username = serializers.CharField(
        required=True,
        error_messages={
            'required': 'username is required.',
            'invalid': 'username must be a valid string.',
        }
    )

    email = serializers.EmailField(
        required=True,
        error_messages={
            'invalid': 'email must be a valid email address.',
        }
    )

    first_name = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        error_messages={
            'invalid': 'first_name must be a valid string.',
        }
    )

    last_name = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        error_messages={
            'invalid': 'last_name must be a valid string.',
        }
    )

    phone_number = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        error_messages={
            'invalid': 'phone_number must be a valid phone number.',
        }
    )

    location = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        error_messages={
            'invalid': 'location must be a valid string.',
        }
    )

    device = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        error_messages={
            'invalid': 'device must be a valid string.',
        }
    )

    role = serializers.ChoiceField(
        choices=Role.choices,
        required=False,
        allow_null=True,
        allow_blank=True,
        error_messages={
            'invalid_choice': 'role must be one of: Admin, Developer, Manager, Operations, Security, Marketing, Finance, Tutor, Student, Parent.',
        }
    )

    # Read-only fields (computed/default fields)
    id = serializers.UUIDField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)
    last_login = serializers.DateTimeField(read_only=True)
    email_hash = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'phone_number',
            'location',
            'device',
            'role',
            'is_verified',
            'is_staff',
            'is_superuser',
            'is_active',
            'date_joined',
            'last_login',
            'email_hash',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

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
        return value.strip().lower()

    def validate_phone_number(self, value):
        """
        Validate phone number format if provided.
        Basic validation - can be enhanced with regex if needed.
        """
        if value:
            # Remove common phone number characters for validation
            cleaned = value.replace('-', '').replace(' ', '').replace('(', '').replace(')', '').replace('+', '')
            if not cleaned.isdigit():
                raise serializers.ValidationError("Phone number must contain only digits and common formatting characters.")
            if len(cleaned) < 10:
                raise serializers.ValidationError("Phone number must be at least 10 digits.")
        return value

    def validate_role(self, value):
        """
        Validate role if provided.
        """
        if value:
            valid_choices = [str(choice[0]) for choice in Role.choices if choice[0]]
            if value not in valid_choices:
                raise serializers.ValidationError(
                    f"role must be one of: {', '.join(valid_choices)}."
                )
        return value

    def validate(self, attrs):
        """
        Object-level validation for POST requests.
        """
        # Validate password confirmation
        if self.instance is None:  # This is a POST request (create)
            password = attrs.get('password')
            password_confirm = attrs.get('password_confirm')

            if password and password_confirm:
                if password != password_confirm:
                    raise serializers.ValidationError({
                        'password_confirm': 'Passwords do not match.'
                    })

        # Validate username uniqueness (only for new instances)
        if self.instance is None:
            username = attrs.get('username')
            if username and User.objects.filter(username=username).exists():
                raise serializers.ValidationError({
                    'username': 'A user with this username already exists.'
                })

        # Validate email uniqueness (only for new instances)
        if self.instance is None:
            email = attrs.get('email')
            if email and User.objects.filter(email=email).exists():
                raise serializers.ValidationError({
                    'email': 'A user with this email already exists.'
                })

        return attrs

    def create(self, validated_data):
        """
        Create and return a new Custom_User instance with hashed password.
        """
        validated_data.pop('password_confirm', None)
        role = validated_data.pop("role", None)

        user = User.objects.create_user(**validated_data)

        if role == Role.TUTOR:
            Tutor_Profile.objects.create(user=user)
            
        if role == Role.PARENT:
            Parent_Profile.objects.create(user=user)

        return user

    def update(self, instance, validated_data):
        """
        Update and return an existing Custom_User instance.
        """
        # Remove password_confirm if present
        validated_data.pop('password_confirm', None)

        # Handle password update if provided
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change endpoint.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        error_messages={
            'required': 'new_password is required.',
            'invalid': 'new_password does not meet security requirements.',
        }
    )
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate_old_password(self, value):
        """Check that old_password is correct for the current user."""
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError('Authentication required.')
        user = request.user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('new_password_confirm'):
            raise serializers.ValidationError({
                'new_password_confirm': 'New passwords do not match.'
            })
        return attrs
