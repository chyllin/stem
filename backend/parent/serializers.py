from rest_framework import serializers

from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

from .models import Parent_Profile

User = get_user_model()


class ParentProfileSerializer(serializers.ModelSerializer):
    
    """
    Serializer for Parent_Profile model with POST validation.
    Handles creation and validation of parent profiles.
    """
    
    # Explicit field definitions for better validation control
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),  
        required=True,
        error_messages={
            'required': 'user is required.',
            'does_not_exist': 'Invalid user. User does not exist.',
        }
    )
    
    full_name = serializers.CharField(
        max_length=None,
        required=True,
        error_messages={
            'invalid': 'full_name must be a valid string.',
        }
    )
    
    email = serializers.EmailField(
        required=True,
        error_messages={
            'invalid': 'email must be a valid email address.',
        }
    )
    
    phone_number = serializers.CharField(
        required=True,
        error_messages={
            'invalid': 'phone_number must be a valid phone number.',
        }
    )
    
    location = serializers.CharField(
        required=True,
        error_messages={
            'invalid': 'location must be a valid string.',
        }
    )
    
    id_number = serializers.CharField(
        required=True,
        error_messages={
            'invalid': 'id_number must be a valid alphanumeric string.',
        }
    )
    
    id_type = serializers.ChoiceField(
        choices=Parent_Profile.Id_Type.choices,
        required=True,
        error_messages={
            'invalid_choice': 'id_type must be one of: Passport, Driver License, National ID, Voter ID.',
        }
    )
    
    number_of_children = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=0,
        error_messages={
            'invalid': 'number_of_children must be a valid positive integer.',
            'min_value': 'number_of_children cannot be negative.',
        }
    )
    
    child_grade = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        error_messages={
            'invalid': 'child_grade must be a valid string.',
        }
    )
    
    subjects_needed = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        error_messages={
            'invalid': 'subjects_needed must be a valid string.',
        }
    )
    
    profile_picture_key = serializers.CharField(
        max_length=None,
        required=False,
        allow_null=True,
        allow_blank=True,
        error_messages={
            'invalid': 'profile_picture_key must be a valid string.',
        }
    )
    
    favorite_tutors = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        error_messages={
            'invalid': 'favorite_tutors must be a valid string.',
        }
    )
    
    preferences = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        error_messages={
            'invalid': 'preferences must be a valid string.',
        }
    )
    
    # Read-only fields (computed/default fields)
    id = serializers.UUIDField(read_only=True)
    id_verified = serializers.BooleanField(read_only=True)
    verified = serializers.BooleanField(read_only=True)
    total_bookings = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    email_hash = serializers.CharField(read_only=True)
    
    class Meta:
        model = Parent_Profile
        fields = [
            'id',
            'user',
            'full_name',
            'email',
            'phone_number',
            'location',
            'id_number',
            'id_type',
            'id_verified',
            'number_of_children',
            'child_grade',
            'subjects_needed',
            'profile_picture_key',
            'verified',
            'favorite_tutors',
            'total_bookings',
            'total_spent',
            'preferences',
            'created_at',
            'email_hash',
        ]
    
    def __init__(self, *args, **kwargs):
        """
        Initialize serializer and set user queryset dynamically.
        """
        super().__init__(*args, **kwargs)
        # Import here to avoid circular imports
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.fields['user'].queryset = User.objects.all()  # type: ignore[index]
    
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
    
    def validate_number_of_children(self, value):
        """
        Validate number_of_children if provided.
        """
        if value is not None and value < 0:
            raise serializers.ValidationError("Number of children cannot be negative.")
        return value
    
    def validate_id_type(self, value):
        """
        Validate id_type if provided.
        """
        if value:
            valid_choices = [str(choice[0]) for choice in Parent_Profile.Id_Type.choices if choice[0]]
            if value not in valid_choices:
                raise serializers.ValidationError(
                    f"id_type must be one of: {', '.join(valid_choices)}."
                )
        return value
    
    def validate(self, attrs):
        """
        Object-level validation for POST requests.
        """
        # Ensure user is provided for POST requests
        if self.instance is None:  # This is a POST request (create)
            if 'user' not in attrs:
                raise serializers.ValidationError({
                    'user': 'user is required for creating a parent profile.'
                })
        
        # Validate that if id_number is provided, id_type should also be provided
        if attrs.get('id_number') and not attrs.get('id_type'):
            raise serializers.ValidationError({
                'id_type': 'id_type is required when id_number is provided.'
            })
        
        # Validate that if id_type is provided, id_number should also be provided
        if attrs.get('id_type') and not attrs.get('id_number'):
            raise serializers.ValidationError({
                'id_number': 'id_number is required when id_type is provided.'
            })
        
        return attrs
    
    def create(self, validated_data):
        """
        Create and return a new Parent_Profile instance.
        """
        return Parent_Profile.objects.create(**validated_data)  # type: ignore[attr-defined]
