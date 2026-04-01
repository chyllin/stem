import re
from typing import Optional


def normalize_for_search(value: Optional[str]) -> str:
    """
    Normalize arbitrary text for case-insensitive, partial search.

    - Lowercase
    - Remove non-alphanumeric characters (keep spaces and commas)
    - Collapse repeated whitespace
    """
    if not value:
        return ""

    # Lowercase and strip outer whitespace
    value = value.lower().strip()

    # Replace any character that is not a-z, 0-9, comma, or whitespace with a space
    value = re.sub(r"[^a-z0-9,\s]+", " ", value)

    # Collapse multiple whitespace into a single space
    value = re.sub(r"\s+", " ", value)

    return value.strip()


def generate_subjects_slug(subjects: Optional[str]) -> str:
    """
    Generate a search-friendly slug for subjects stored as a single string.

    Example:
        "Mathematics, Physics, Chemistry"
        -> "mathematics physics chemistry"
    """
    if not subjects:
        return ""

    # Split by comma first
    parts = [part.strip() for part in subjects.split(",") if part.strip()]
    if not parts:
        return ""

    normalized_parts = [normalize_for_search(part) for part in parts if normalize_for_search(part)]
    # Join with a single space so partial icontains searches are simple
    return " ".join(normalized_parts)


def generate_location_slug(location: Optional[str]) -> str:
    """
    Generate a search-friendly slug for location.

    Example:
        "Accra, Ghana" -> "accra ghana"
    """
    if not location:
        return ""

    # Normalize and then drop commas by replacing them with spaces
    normalized = normalize_for_search(location)
    normalized = normalized.replace(",", " ")
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip()

