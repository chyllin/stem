---
name: Tutor sessions and rating statistics views
overview: "Create two aggregate statistics views: one for total tutor sessions (sum across all tutors) and one for average tutor rating (average of tutor ratings), with optional status filtering via query parameter."
todos:
  - id: add_aggregation_imports
    content: Add Sum and Avg imports from django.db.models to views.py
    status: pending
  - id: create_sessions_view
    content: Create Total_Tutor_Sessions_View with status filtering and Sum aggregation
    status: pending
  - id: create_rating_view
    content: Create Average_Tutor_Rating_View with status filtering and Avg aggregation, excluding 0.0 ratings
    status: pending
  - id: add_url_routes
    content: Add stats/sessions/ and stats/rating/ routes to tutors/urls.py
    status: pending
isProject: false
---

# Tutor Sessions and Rating Statistics Views

## Overview

Create two API views that return aggregate statistics:

1. **Total Tutor Sessions View** - Sum of `total_sessions` across all tutors
2. **Average Tutor Rating View** - Average of `average_rating` across all tutors

Both views will support optional status filtering via query parameter, similar to the existing `Total_Tutor_Count_View` pattern.

## Implementation Steps

### 1. Create Total Tutor Sessions View

**File**: `backend/tutors/views.py`

- Create `Total_Tutor_Sessions_View(generics.ListAPIView)`:
  - Similar pattern to `Total_Tutor_Count_View`
  - Use `permission_classes = [AllowAny]` (or match existing pattern)
  - Override `list()` method to:
    - Get queryset filtered by status (if provided via query param)
    - Aggregate: `total_sessions_sum = queryset.aggregate(Sum('total_sessions'))['total_sessions__sum'] or 0`
    - Return JSON: `{'total_sessions': total_sessions_sum}`
  - Support query parameter `status` (optional):
    - If `status` provided: filter `queryset.filter(status=status)`
    - If not provided: include all tutors
    - Validate status value against `Tutor_Profile.Status.choices`

### 2. Create Average Tutor Rating View

**File**: `backend/tutors/views.py`

- Create `Average_Tutor_Rating_View(generics.ListAPIView)`:
  - Similar pattern to above
  - Override `list()` method to:
    - Get queryset filtered by status (if provided)
    - Filter out tutors with `average_rating=0.0` (or handle nulls) - only count tutors who have ratings
    - Aggregate: `avg_rating = queryset.exclude(average_rating=0.0).aggregate(Avg('average_rating'))['average_rating__avg']`
    - Round to 2 decimal places: `round(avg_rating, 2) if avg_rating else 0.0`
    - Return JSON: `{'average_rating': avg_rating, 'tutors_with_ratings': count}`
  - Support same `status` query parameter filtering

### 3. Add URL Routes

**File**: `backend/tutors/urls.py`

- Add routes:
  - `path('stats/sessions/', views.Total_Tutor_Sessions_View.as_view(), name='total-tutor-sessions')`
  - `path('stats/rating/', views.Average_Tutor_Rating_View.as_view(), name='average-tutor-rating')`

### 4. Import Required Functions

**File**: `backend/tutors/views.py`

- Add imports:
  - `from django.db.models import Sum, Avg` (for aggregation)
  - Ensure `Tutor_Profile.Status` is accessible

## Data Flow

```
GET /api/v1/tutors/stats/sessions/?status=Active
  ↓
Total_Tutor_Sessions_View.list()
  ↓
Filter by status (if provided)
  ↓
Aggregate: Sum(total_sessions)
  ↓
Response: {"total_sessions": 1250}

GET /api/v1/tutors/stats/rating/?status=Active
  ↓
Average_Tutor_Rating_View.list()
  ↓
Filter by status (if provided)
  ↓
Exclude tutors with 0.0 rating
  ↓
Aggregate: Avg(average_rating)
  ↓
Response: {"average_rating": 4.35, "tutors_with_ratings": 45}
```

## Example API Usage

```
GET /api/v1/tutors/stats/sessions/
GET /api/v1/tutors/stats/sessions/?status=Active
GET /api/v1/tutors/stats/rating/
GET /api/v1/tutors/stats/rating/?status=Active
```

## Response Format

**Total Sessions:**

```json
{
  "total_sessions": 1250
}
```

**Average Rating:**

```json
{
  "average_rating": 4.35,
  "tutors_with_ratings": 45
}
```

## Considerations

- Handle edge cases: no tutors, all tutors have 0.0 rating
- Status validation: ensure status query param matches valid choices
- Consider adding count of tutors included in calculation for transparency
- May want to add authentication/permission requirements if needed

