import uuid
from decimal import Decimal

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _

from user_auth.utils.model_fields import CryptoMixin
from .utils.search import generate_subjects_slug, generate_location_slug

User = get_user_model()


class BookingStatus(models.TextChoices):
    PENDING = "Pending", _("Pending")
    COMPLETED = "Completed", _("Completed")
    CANCELLED = "Cancelled", _("Cancelled")

class EarningStatus(models.TextChoices):
    PENDING = "Pending", _("Pending")
    PAID = "Paid", _("Paid")
    CANCELLED = "Cancelled", _("Cancelled")

class Status(models.TextChoices):
    ACTIVE = "Active", "active"
    INACTIVE = "Inactive", "inactive"
    SUSPENDED = "Suspended", "suspended"

class Id_Type(models.TextChoices):
    PASSPORT = "Passport", "passport"
    DRIVER_LICENSE = "Driver License", "driver_license"
    NATIONAL_ID = "National ID", "national_id"
    VOTER_ID = "Voter ID", "voter_id"
    CERTIFICATE = "Certificate", "Certificate"


class Tutor_Profile(CryptoMixin, models.Model):
    """
    Tutor Profile model with automatic field encryption.

    Fields specified in encrypted_fields will be automatically encrypted before saving.
    Fields specified in hashed_fields will also have their hash stored in {field_name}_hash.
    """

    """# Fields to automatically encrypt
    encrypted_fields = [
        "full_name",
        "email",
        "phone_number",
        "location",
        "id_number",
        "id_type",
        "qualifications",
        "age",
        "profile_picture_key",
        "subjects",
        "bio",
        "availability",
    ]"""

    # Fields that also need hashing (requires {field_name}_hash field)
    hashed_fields = ["email"]

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
        related_name="tutor_profile",
        null=False,
    )

    full_name = models.TextField(editable=True)

    email = models.TextField(editable=True)
    email_hash = models.TextField(null=True, editable=True)  # For hashed email lookup
    phone_number = models.TextField(editable=True)

    age = models.TextField(editable=True)
    id_number = models.TextField(editable=True)
    id_type = models.TextField(editable=True, choices=Id_Type.choices)
    id_verified = models.BooleanField(default=False)

    experience_years = models.IntegerField(editable=True)
    qualifications = models.TextField(editable=True)

    location = models.TextField(editable=True)

    # Normalized / searchable versions of encrypted fields
    subjects_slug = models.SlugField(
        max_length=500,
        null=True,
        blank=True,
        editable=False,
        db_index=True,
    )
    location_slug = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        editable=False,
        db_index=True,
    )

    profile_picture_url = models.TextField(editable=True)

    verified = models.BooleanField(default=False)

    total_sessions = models.IntegerField(default=0)
    average_rating = models.DecimalField(
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        decimal_places=1,
        max_digits=2,
    )
    total_likes = models.IntegerField(default=0)
    response_time_hours = models.IntegerField(editable=True)
    completion_rate = models.FloatField(default=0.0)

    status = models.CharField(max_length=20, choices=Status.choices)

    subjects = models.TextField(editable=True)
    bio = models.TextField(null=True, editable=True)
    availability = models.TextField(editable=True)
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2, editable=True)

    def save(self, *args, **kwargs):
        """
        Override save to generate search-friendly slugs for subjects and location
        before CryptoMixin encrypts the underlying fields.
        """
        # Only generate slugs from plain-text values (skip if already encrypted)
        subjects_value = getattr(self, "subjects", None)
        if subjects_value and not self._is_encrypted(subjects_value):
            self.subjects_slug = generate_subjects_slug(subjects_value) or None

        location_value = getattr(self, "location", None)
        if location_value and not self._is_encrypted(location_value):
            self.location_slug = generate_location_slug(location_value) or None

        super().save(*args, **kwargs)


class Subject(models.Model):

    name = models.CharField(max_length=100, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name

class TutorEarnings(models.Model):

    tutor = models.ForeignKey(
        "Tutor_Profile",
        on_delete=models.CASCADE,
        related_name="earnings_records",
        null=False
    )
    # OneToOne ensures one booking can't be paid for twice
    booking = models.OneToOneField(
        "Booking",
        on_delete=models.SET_NULL,
        null=True,
        related_name="earning_record",
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    status = models.CharField(
        max_length=20, 
        choices=EarningStatus.choices, 
        default=EarningStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.amount} for {self.tutor.full_name} ({self.status})"


class Booking(CryptoMixin, models.Model):

    encrypted_fields = [
        "notes", 
    ]

    tutor = models.ForeignKey(
        Tutor_Profile, 
        on_delete=models.CASCADE, 
        related_name="bookings",
        null=False
    )
    subjects = models.ManyToManyField(
        Subject, 
        null=True,
        related_name="bookings"
    )
    notes = models.TextField(null=True, blank=True, max_length=500)
    status = models.CharField(
        max_length=20, 
        choices=BookingStatus.choices, 
        default=BookingStatus.PENDING
    )
    scheduled_at = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Booking for {self.tutor.full_name} - {self.status}"


class TutorRating(models.Model):
    tutor = models.ForeignKey(
        "Tutor_Profile",
        on_delete=models.CASCADE,
        related_name="ratings",
        null=False
    )
    # 1.0-5.0 star rating system
    score = models.DecimalField(
        validators=[MinValueValidator(1.0), 
                    MaxValueValidator(5.0)],
        decimal_places=1,
        max_digits=2,
    )
    reviewer = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="reviews",
        null=False
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.score} for {self.tutor}"


class TutorLikes(models.Model):
    tutor = models.ForeignKey(
        "Tutor_Profile",
        on_delete=models.CASCADE,
        related_name="likes",
    )

    like = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.like} for {self.tutor}"
