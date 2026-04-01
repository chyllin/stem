"""
Model mixin for automatic field encryption and decryption using Crypto utility.

This mixin automatically encrypts specified fields before saving to the database,
and decrypts them when fetching from the database, eliminating the need to
manually handle encryption/decryption in your application logic.
"""
from logging import getLogger
from user_auth.utils.crypto import Crypto
from typing import Any, Dict, List, Optional, Tuple, Type, TypeVar

T = TypeVar("T", bound="CryptoMixin")

logger = getLogger(__name__)

class CryptoMixin:
    """
    Mixin class that automatically encrypts/decrypts specified model fields.
    """

    # Class attributes to be defined in subclasses
    encrypted_fields: List[str] = []  # List of field names to encrypt
    hashed_fields: List[str] = []  # List of field names that also need hashing

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize the mixin and create crypto instance."""
        super().__init__(*args, **kwargs)
        self._crypto = Crypto()
        self._original_values: Dict[str, Any] = (
            {}
        )  # Store original values to detect changes

    def _is_encrypted(self, value: Any) -> bool:
        """
        Check if a value is already encrypted.
        Encrypted values are base64 strings, so we check for base64-like patterns.
        """
        if not value or not isinstance(value, str):
            return False

        try:
            import base64

            # Try to decode as base64 - if it works and is reasonably long, likely encrypted
            decoded = base64.urlsafe_b64decode(value)
            return (
                len(decoded) > 12
            )  # Encrypted data includes nonce (12 bytes) + ciphertext
        except Exception:
            return False

    def _get_associated_data(self) -> str:
        """
        Get the associated data for encryption (typically the model's ID).
        Uses the primary key if available, otherwise uses a placeholder.
        """
        pk_field = self._meta.pk  # type: ignore[attr-defined]
        pk_value = getattr(self, pk_field.name, None)

        if pk_value:
            return str(pk_value)

        return str(self.__class__.__name__)

    @classmethod
    def from_db(
        cls: Type[T], db: str, field_names: Tuple[str, ...], values: Tuple[Any, ...]
    ) -> T:
        """
        Hook executed when an instance is loaded from the database (.get, .filter, etc).
        We intercept this to decrypt the fields immediately.
        """
        # Create the instance using Django's standard from_db
        instance = super().from_db(db, field_names, values)  # type: ignore[misc]

        # We need the associated data (like the PK) to decrypt properly
        associated_data = instance._get_associated_data()

        for field_name in cls.encrypted_fields:
            if field_name in field_names:
                value = getattr(instance, field_name, None)

                # Check if it actually looks encrypted before trying to decrypt
                if value and instance._is_encrypted(value):
                    try:
                        decrypted_value = instance._crypto.decrypt(
                            value, associated_data=associated_data
                        )
                        if decrypted_value is not None:
                            setattr(instance, field_name, decrypted_value)
                    except Exception as e:
                        logger.error(
                            "Failed Decrypting Data on Load",
                            extra={"error": e}
                            )

        return instance

    def refresh_from_db(
        self, using: Optional[str] = None, fields: Optional[List[str]] = None
    ) -> None:
        """
        Hook executed when instance.refresh_from_db() is called.
        Ensures fields don't revert to ciphertext in memory.
        """
        super().refresh_from_db(using=using, fields=fields)  # type: ignore[misc]

        associated_data = self._get_associated_data()

        for field_name in self.encrypted_fields:
            # Only process if fields is None (refresh all) or this field was requested
            if fields is None or field_name in fields:
                value = getattr(self, field_name, None)

                if value and self._is_encrypted(value):
                    try:
                        decrypted_value = self._crypto.decrypt(
                            value, associated_data=associated_data
                        )
                        if decrypted_value is not None:
                            setattr(self, field_name, decrypted_value)
                    except Exception:
                        pass

    def save(self, *args: Any, **kwargs: Any) -> None:
        """
        Override save method to automatically encrypt specified fields.
        """
        # Ensure encrypted_fields is defined
        if not hasattr(self, "encrypted_fields") or not isinstance(
            self.encrypted_fields, list
        ):
            raise AttributeError(
                f"{self.__class__.__name__} must define 'encrypted_fields' as a list of field names to encrypt."
            )

        is_new_instance = self.pk is None  # type: ignore[attr-defined]
        original_values = {}

        # Store original values for fields that need hashing (before encryption)
        if hasattr(self, "hashed_fields") and isinstance(self.hashed_fields, list):
            for field_name in self.hashed_fields:
                if hasattr(self, field_name):
                    field_value = getattr(self, field_name, None)
                    if field_value and not self._is_encrypted(field_value):
                        original_values[field_name] = field_value

        associated_data = self._get_associated_data()

        needs_initial_save = is_new_instance and (
            associated_data == str(self.__class__.__name__) or not associated_data
        )

        if needs_initial_save:
            super().save(*args, **kwargs)  # type: ignore[misc]
            associated_data = str(self.pk)  # type: ignore[attr-defined]

        # Handle fields that need hashing first (before encryption)
        if hasattr(self, "hashed_fields") and isinstance(self.hashed_fields, list):
            for field_name in self.hashed_fields:
                hash_field_name = f"{field_name}_hash"

                if hasattr(self, hash_field_name):
                    value_to_hash = original_values.get(field_name) or getattr(
                        self, field_name, None
                    )

                    if value_to_hash and not self._is_encrypted(value_to_hash):
                        hashed_value = self._crypto.hash_data(value_to_hash)
                        if hashed_value:
                            setattr(self, hash_field_name, hashed_value)

        # Encrypt specified fields
        for field_name in self.encrypted_fields:
            if not hasattr(self, field_name):
                continue

            field_value = getattr(self, field_name, None)

            if field_value is None or field_value == "":
                continue

            if self._is_encrypted(field_value):
                continue

            encrypted_value = self._crypto.encrypt(
                field_value, associated_data=associated_data
            )

            if encrypted_value:
                setattr(self, field_name, encrypted_value)

        if needs_initial_save:
            update_fields = list(self.encrypted_fields)
            if hasattr(self, "hashed_fields"):
                update_fields.extend(
                    [
                        f"{f}_hash"
                        for f in self.hashed_fields
                        if hasattr(self, f"{f}_hash")
                    ]
                )
            super().save(*args, **kwargs, update_fields=update_fields)  # type: ignore[misc]
        else:
            super().save(*args, **kwargs)  # type: ignore[misc]
