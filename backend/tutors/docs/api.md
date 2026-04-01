# Tutors API Documentation

## Base URL
```
/api/v1/tutors/
```

## Authentication
Most endpoints require JWT authentication. Include the access token cookies:
```
Add HTTPOnly Cookies to requests 
```

---

## Endpoints

### 1. Tutor Signup
Create a new tutor profile.

**Endpoint:** `POST /api/v1/tutors/signup/`  
**Authentication:** Required  
**Description:** Creates a new tutor profile and sends a welcome email.

**Request Body:**
```json
{
  "user": "<user_uuid>",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+233123456789",
  "age": "30",
  "id_number": "GHA-123456789-0",
  "id_type": "National ID",
  "experience_years": 5,
  "qualifications": "MSc Computer Science",
  "location": "Accra, Ghana",
  "subjects": "Mathematics, Physics, Chemistry",
  "bio": "Experienced tutor with 5 years...",
  "availability": "Monday-Friday, 9am-5pm",
  "hourly_rate": "50.00",
  "response_time_hours": 2,
  "status": "Active"
}
```

**Response:** `201 Created`
```json
{
  "id": "<uuid>",
  "user": "<user_uuid>",
  "full_name": "John Doe",
  "email": "john@example.com",
  ...
}
```

**Validation:**
- Phone number: Validated and normalized to E.164 format
- ID number: Ghana card format validated (GHA-XXXXXXXXX-X) when id_type is "National ID"
- Email: Valid email format required

---

### 2.1 List Tutors
Get all tutor profiles.

**Endpoint:** `GET /api/v1/tutors/`  
**Authentication:** Required  
**Description:** Returns a list of all tutor profiles.

**Response:** `200 OK`
```json
[
  {
    "id": "<uuid>",
    "user": "<user_uuid>",
    "full_name": "John Doe",
    "email": "john@example.com",
    ...
  },
  ...
]
```
---

### 2.2 Top Performers
Get all top performing tutors.

**Endpoint:** `GET /api/v1/tutors/top-performers/`
**Authentication:** Required 
**Description:** Returns the top 10 tutors ranked by average_rating followed by completion_rate.

---

### 2.3 Search Tutors
Search For Tutors using specific keywords

**Endpoint:** `GET /api/v1/tutors/search/`
**Authentication:** Required
**Query Parameters:** subjects, location, experience_years, rating.

### 3. Get Tutor Detail
Get a specific tutor profile by ID.

**Endpoint:** `GET /api/v1/tutors/<uuid:id>/`  
**Authentication:** Required  
**Description:** Returns details of a specific tutor.

**Response:** `200 OK`
```json
{
  "id": "<uuid>",
  "user": "<user_uuid>",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+233123456789",
  "age": "30",
  "id_number": "GHA-123456789-0",
  "id_type": "National ID",
  "id_verified": false,
  "experience_years": 5,
  "qualifications": "MSc Computer Science",
  "location": "Accra, Ghana",
  "profile_picture_url": "...",
  "verified": false,
  "total_sessions": 0,
  "average_rating": 0.0,
  "total_likes": 0,
  "response_time_hours": 2,
  "completion_rate": 0.0,
  "status": "Active",
  "subjects": "Mathematics, Physics, Chemistry",
  "bio": "Experienced tutor...",
  "availability": "Monday-Friday, 9am-5pm",
  "hourly_rate": "50.00"
}
```

---

# Engagement & Metrics
### 3.1 Ratings (Use Query Params)

## View Rating
View a tutor's Rating

**Endpoint:** `GET /api/v1/tutors/ratings/?id=<uuid>`
**Authentication:** Required
**Description:** Returns the dynamic average rating for a single tutor.

## Add Rating
Add a rating to a tutor 

**Endpoint:** `POST /api/v1/tutors/ratings/add/`
**Authentication:** Required
**Description:** Submit a new rating (1-5). 
**Request Body:** ```json {"tutor": "<uuid>", "score": 5}. ```

---

### 3.2 Likes

## View Likes
View a tutor's Likes

**Endpoint:** `GET /api/v1/tutors/likes/?id=<uuid>`
**Authentication:** Required
**Description:** Returns total like count.


## Add Likes
Like a tutor

**Endpoint:** `POST /api/v1/tutors/likes/`
**Authentication:** Required
**Description:** Add a like to a profile.
**Request Body:**  ```json {"id": "<uuid>"}. ```

### 3.3 Completion Rate
View Tutors Completion Rate 

**Endpoint:** GET /api/v1/tutors/completion-rate/?id=<uuid>
**Authentication:** Required
**Description:** Add a like to a profile.
**Response:** ```json  {"completion_rate": "95%"} ```

---

### 4. Update Tutor Profile
Update an existing tutor profile.

**Endpoint:** `PUT /api/v1/tutors/<uuid:id>/update/` or `PATCH /api/v1/tutors/<uuid:id>/update/`  
**Authentication:** Required  
**Description:** Updates tutor profile fields. Use PUT for full update, PATCH for partial.
**Request Body:** (Partial update example)
```json
{
  "bio": "Updated bio text",
  "hourly_rate": "55.00"
}
```

**Response:** `200 OK` - Returns updated tutor profile

### Financials (Tutor Specific)

## 4.1 Earnings Summary
Get a tutors Earnings Summary

**Endpoint:** `GET /api/v1/tutors/earnings/summary/?id=<uuid>`
**Authentication:** Required 
**Response:** 
```json 
{
  "total_paid": 1250.00,
  "total_pending": 150.00,
  "total_transactions": 12
}
```

## 4.2 Earnings by Subject
Get a tutors Earnings By Subject

**Endpoint:** `GET /api/v1/tutors/earnings/subjects/?id=<uuid>`
**Authentication:** Required 
**Description:** Grouped breakdown of paid income per subject taught.

---

### 5. Delete Tutor Profile
Delete a tutor profile.

**Endpoint:** `DELETE /api/v1/tutors/<uuid:id>/delete/`  
**Authentication:** Required  
**Description:** Permanently deletes a tutor profile.

**Response:** `204 No Content`

---

### 6. Search Tutors
Search tutors with filters and pagination.

**Endpoint:** `GET /api/v1/tutors/search/`  
**Authentication:** Not required (public)  
**Description:** Search tutors by subjects, location, experience, and rating. Returns only Active tutors by default.

**Query Parameters:**
- `subjects` (string, optional): Partial match on subjects (e.g., "math", "mathematics")
- `location` (string, optional): Partial match on location (e.g., "accra")
- `experience_years` (integer, optional): Minimum years of experience
- `rating` (float, optional): Minimum average rating
- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Results per page (default: 20, max: 100)

**Example:**
```
GET /api/v1/tutors/search/?subjects=mathematics&location=accra&experience_years=3&rating=4.5&page=1&page_size=20
```

**Response:** `200 OK`
```json
{
  "count": 45,
  "next": "http://example.com/api/v1/tutors/search/?page=2",
  "previous": null,
  "results": [
    {
      "id": "<uuid>",
      "full_name": "John Doe",
      "subjects": "Mathematics, Physics",
      "location": "Accra, Ghana",
      "experience_years": 5,
      "average_rating": 4.8,
      "hourly_rate": "50.00",
      "verified": true,
      "status": "Active"
    },
    ...
  ]
}
```

---

### 7. Statistics Endpoints

#### 7.1 Total Tutor Sessions
Get aggregate total sessions across all tutors.

**Endpoint:** `GET /api/v1/tutors/stats/sessions/`  
**Authentication:** Not required (public)

**Query Parameters:**
- `status` (string, optional): Filter by status (Active, Inactive, Suspended)

**Example:**
```
GET /api/v1/tutors/stats/sessions/?status=Active
```

**Response:** `200 OK`
```json
{
  "total_sessions": 1250
}
```

---

#### 7.2 Average Tutor Rating
Get average rating across all tutors.

**Endpoint:** `GET /api/v1/tutors/stats/rating/`  
**Authentication:** Not required (public)

**Query Parameters:**
- `status` (string, optional): Filter by status (Active, Inactive, Suspended)

**Example:**
```
GET /api/v1/tutors/stats/rating/?status=Active
```

**Response:** `200 OK`
```json
{
  "average_rating": 4.35,
  "tutors_with_ratings": 45
}
```

**Note:** Tutors with `average_rating=0.0` are excluded from the calculation.

---

#### 7.3 Total Tutor Count
Get total number of tutors.

**Endpoint:** `GET /api/v1/tutors/stats/total-count/`  
**Authentication:** Not required (public)

**Response:** `200 OK`
```json
{
  "total_count": 120
}
```

---

## Data Models

### Tutor Profile Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `user` | UUID | Yes | Foreign key to User |
| `full_name` | String | Yes | Tutor's full name (encrypted) |
| `email` | Email | Yes | Email address (encrypted, hashed) |
| `phone_number` | String | Yes | Phone number in E.164 format (encrypted) |
| `age` | String | Yes | Age (encrypted) |
| `id_number` | String | Yes | ID number (encrypted) |
| `id_type` | Choice | Yes | Passport, Driver License, National ID, Voter ID, Certificate |
| `id_verified` | Boolean | Read-only | ID verification status |
| `experience_years` | Integer | Yes | Years of teaching experience |
| `qualifications` | String | Yes | Educational qualifications (encrypted) |
| `location` | String | Yes | Location (encrypted) |
| `subjects` | String | Yes | Comma-separated subjects (encrypted) |
| `bio` | String | Yes | Biography (encrypted) |
| `availability` | String | Yes | Availability schedule (encrypted) |
| `hourly_rate` | Decimal | Optional | Hourly rate (max 999999.99) |
| `response_time_hours` | Integer | Optional | Response time in hours |
| `status` | Choice | Yes | Active, Inactive, Suspended |
| `verified` | Boolean | Read-only | Profile verification status |
| `total_sessions` | Integer | Read-only | Total completed sessions |
| `average_rating` | Float | Read-only | Average rating (0.0-5.0) |
| `total_likes` | Integer | Read-only | Total likes received |
| `completion_rate` | Float | Read-only | Session completion rate |
| `profile_picture_key` | String | Optional | Profile picture storage key (encrypted) |

### Status Choices
- `Active` - Tutor is active and available
- `Inactive` - Tutor is temporarily inactive
- `Suspended` - Tutor account is suspended

### ID Type Choices
- `Passport`
- `Driver License`
- `National ID`
- `Voter ID`
- `Certificate`

---

## Error Responses

### 400 Bad Request
```json
{
  "field_name": ["Error message"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "detail": "A server error occurred."
}
```

---

## Notes

- Sensitive fields (full_name, email, phone_number, location, etc.) are automatically encrypted before storage
- Email addresses are also hashed for lookup purposes
- Search uses normalized slug fields for partial matching
- Phone numbers are validated and normalized to E.164 format
- Ghana card numbers are validated when id_type is "National ID"
- Welcome emails are automatically sent on tutor signup
