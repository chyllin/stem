from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

from .utils.model_fields import CryptoMixin


class Role(models.TextChoices):
    ADMIN = "Admin", "admin"
    DEVELOPER = "Developer", "developer"
    MANAGER = "Manager", "manager"
    OPERATIONS = "Operations", "operations"
    SECURITY = "Security", "security"
    MARKETING = "Marketing", "marketing"
    FINANCE = "Finance", "finance"
    TUTOR = "Tutor", "tutor"
    STUDENT = "Student", "student"
    PARENT = "Parent", "parent"


class Custom_User(CryptoMixin, AbstractUser):

    """
    Custom User model with automatic field encryption.
    
    Fields specified in encrypted_fields will be automatically encrypted before saving.
    Fields specified in hashed_fields will also have their hash stored in {field_name}_hash.
    """

    # Fields to automatically encrypt
    """encrypted_fields = [
        'phone_number',
        'email',
        'location',
        'device',
        'role'
    ]"""

    # Fields that also need hashing (requires {field_name}_hash field)
    hashed_fields = ['email']

    class Role(models.TextChoices):
        ADMIN = 'Admin', 'admin'
        DEVELOPER = 'Developer', 'developer'
        MANAGER = 'Manager', 'manager'
        OPERATIONS = 'Operations', 'operations'
        SECURITY = 'Security', 'security'
        MARKETING = 'Marketing', 'marketing'
        FINANCE = 'Finance', 'finance'
        TUTOR = 'Tutor', 'tutor'
        STUDENT = 'Student', 'student'
        PARENT = 'Parent', 'parent'

    id = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
        null=False,
        unique=True
    )

    role = models.TextField(null=True, editable=True, choices=Role.choices)
    is_verified = models.BooleanField(default=False)  # type: ignore[assignment]
    phone_number = models.TextField(null=True, editable=True)
    location = models.TextField(null=True, editable=True)
    device = models.TextField(null=True, editable=True)

    email_hash = models.TextField(null=True, editable=True)  # For hashed email lookup
