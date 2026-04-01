import uuid

from django.db import models
from django.contrib.auth import get_user_model

from user_auth.utils.model_fields import CryptoMixin

User = get_user_model()

class Parent_Profile(CryptoMixin, models.Model):

    """
    Parent Profile model with automatic field encryption.
    
    Fields specified in encrypted_fields will be automatically encrypted before saving.
    Fields specified in hashed_fields will also have their hash stored in {field_name}_hash.
    """
    
    # Fields to automatically encrypt
    """"
    encrypted_fields = [
        'phone_number',
        'email',
        'location',
        'id_number',
        'full_name',
        'id_type',
        'profile_picture_key',
        'preferences'
    ]
    """
    # Fields that also need hashing (requires {field_name}_hash field)
    hashed_fields = ['email']

    id = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
        null=False,
        unique=True
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='parent_profile',
        null=False,
    )

    class Id_Type(models.TextChoices):
        PASSPORT = 'Passport', 'passport'
        DRIVER_LICENSE = 'Driver License', 'driver_license'
        NATIONAL_ID = 'National ID', 'national_id'
        VOTER_ID = 'Voter ID', 'voter_id'

    full_name = models.TextField(null=True, editable=True)
    email = models.TextField(null=True, editable=True) 
    phone_number = models.TextField(null=True, editable=True)
    location = models.TextField(null=True, editable=True)
    id_number = models.TextField(null=True, editable=True)
    id_type = models.TextField(null=True, editable=True, choices=Id_Type.choices)
    id_verified = models.BooleanField(default=False)
    number_of_children = models.IntegerField(null=True, editable=True)
    child_grade = models.TextField(null=True, editable=True)
    subjects_needed = models.TextField(null=True, editable=True)
    profile_picture_key = models.TextField(null=True, editable=True)
    verified = models.BooleanField(default=False)  
    favorite_tutors = models.TextField(null=True, editable=True) 
    total_bookings = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=10, decimal_places=2)
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    preferences = models.TextField(null=True, editable=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    email_hash = models.CharField(max_length=64, null=True, editable=True)  # For hashed email lookup
