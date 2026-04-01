---
name: Tutor search view with slug fields
overview: Add slug/normalized fields to Tutor_Profile model for searchable subjects and location, then create a search view that filters tutors by subjects, location, experience_years, and rating using partial matching.
todos:
  - id: add_slug_fields
    content: Add subjects_slug and location_slug fields to Tutor_Profile model with db_index=True
    status: pending
  - id: create_search_utils
    content: Create tutors/utils/search.py with normalize_for_search, generate_subjects_slug, and generate_location_slug functions
    status: pending
  - id: update_model_save
    content: Override save() in Tutor_Profile to auto-generate slugs from plain text before encryption
    status: pending
  - id: create_search_serializer
    content: Create TutorSearchSerializer with essential fields for search results
    status: pending
  - id: create_search_view
    content: Create Tutor_Search_View with filtering by subjects_slug, location_slug, experience_years, and average_rating
    status: pending
  - id: add_search_url
    content: Add search/ route to tutors/urls.py
    status: pending
  - id: create_migration
    content: Generate and run Django migration for new slug fields
    status: pending
isProject: false
---

# Tutor Search Implementation Plan

## Overview

Implement a search view for tutors that allows filtering by subjects, location, experience_years, and rating. Since `subjects` and `location` are encrypted fields, we'll add slug/normalized fields (`subjects_slug`, `location_slug`) to enable partial/fuzzy search while keeping the original encrypted data secure.

## Implementation Steps

### 1. Add Slug Fields to Tutor_Profile Model

**File**: `backend/tutors/models.py`

- Add two new fields:
  - `subjects_slug = models.CharField(max_length=500, null=True, blank=True, db_index=True)` - Normalized, searchable version of subjects
  - `location_slug = models.CharField(max_length=200, null=True, blank=True, db_index=True)` - Normalized, searchable version of location
- Add `db_index=True` for performance on search queries
- These fields will store lowercase, normalized versions (e.g., "mathematics, physics" → "mathematics physics")

### 2. Create Slug Generation Utility

**File**: `backend/tutors/utils/search.py` (new file)

- Create `normalize_for_search(value: str) -> str` function:
  - Convert to lowercase
  - Remove special characters (keep alphanumeric and spaces)
  - Normalize whitespace (multiple spaces → single space)
  - Trim leading/trailing spaces
- Create `generate_subjects_slug(subjects: str) -> str`:
  - Split by comma if subjects contain commas
  - Normalize each subject
  - Join with single space
- Create `generate_location_slug(location: str) -> str`:
  - Normalize location string
  - Remove common location words if needed (optional)

### 3. Update CryptoMixin or Tutor_Profile Save Method

**File**: `backend/tutors/models.py`

- Override `save()` method in `Tutor_Profile` to auto-generate slugs:
  - Before calling `super().save()`, check if `subjects` or `location` have changed
  - If plain text (not encrypted yet), generate slugs using utility functions
  - Set `subjects_slug` and `location_slug` before encryption happens
  - This ensures slugs are generated from plain text before encryption

### 4. Create Search Serializer

**File**: `backend/tutors/serializers.py`

- Create `TutorSearchSerializer` class:
  - Include essential fields for search results: `id`, `full_name`, `subjects`, `location`, `experience_years`, `average_rating`, `hourly_rate`, `verified`, `status`
  - Use `SerializerMethodField` for `subjects` and `location` to decrypt on-the-fly if needed, or return slug values
  - Keep it lightweight for search results (don't include all fields)

### 5. Create Search View

**File**: `backend/tutors/views.py`

- Create `Tutor_Search_View(generics.ListAPIView)`:
  - Accept query parameters: `subjects`, `location`, `experience_years`, `rating` (min rating)
  - Filter queryset:
    - `subjects_slug__icontains=subjects` (if subjects param provided)
    - `location_slug__icontains=location` (if location param provided)
    - `experience_years__gte=experience_years` (if provided, for minimum experience)
    - `average_rating__gte=rating` (if provided, for minimum rating)
    - `status='Active'` (only show active tutors by default, or make configurable)
  - Use `TutorSearchSerializer` for response
  - Allow unauthenticated access or make it configurable
  - Add pagination support

### 6. Add Search URL Route

**File**: `backend/tutors/urls.py`

- Add route: `path('search/', views.Tutor_Search_View.as_view(), name='tutor-search')`
- Place before the detail route to avoid conflicts

### 7. Update Existing Serializer (Optional)

**File**: `backend/tutors/serializers.py`

- Update `TutorProfileSerializer` to include slug fields in `Meta.fields` if needed for admin/debugging
- Or keep them read-only/internal

## Data Flow

```
User Search Request
  ↓
Query Params: subjects="math", location="accra", experience_years=2, rating=4.0
  ↓
Tutor_Search_View.get_queryset()
  ↓
Filter: subjects_slug__icontains="math", location_slug__icontains="accra", experience_years__gte=2, average_rating__gte=4.0
  ↓
TutorSearchSerializer (decrypts full_name, subjects, location for display)
  ↓
JSON Response with matching tutors
```

## Migration Required

- Create Django migration for new `subjects_slug` and `location_slug` fields
- Consider data migration to populate slugs for existing records

## Example API Usage

```
GET /api/v1/tutors/search/?subjects=mathematics&location=accra&experience_years=3&rating=4.5
```

## Considerations

- Slug fields are not encrypted (by design, for searchability)
- Ensure slug generation handles edge cases (empty strings, special characters)
- Consider adding full-text search indexes if database supports it (PostgreSQL)
- May want to add `verified=True` filter option
- Consider rate limiting on search endpoint if public

