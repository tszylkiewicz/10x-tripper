# REST API Plan - Tripper

## 1. Resources

The API is organized around three main resources that map directly to database tables:

1. **User Preferences** (`user_preferences` table) - Templates for trip planning preferences
2. **Trip Plans** (`trip_plans` table) - User's accepted/saved trip plans
3. **Plan Generations** (`plan_generations` table) - Analytics data for AI generation tracking (read-only)

## 2. Endpoints

### 2.1 User Preferences

#### GET /api/preferences

Retrieve all preference templates for the authenticated user.

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "people_count": 2,
      "budget_type": "medium",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token

---

#### POST /api/preferences

Create a new preference template.

**Request Body:**
```json
{
  "name": "string",
  "people_count": 2,
  "budget_type": "medium"
}
```

**Validation Rules:**
- `name`: Required, max 256 characters, must be unique per user
- `people_count`: Optional, integer, positive value
- `budget_type`: Optional, string (e.g., "low", "medium", "high")

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "people_count": 2,
    "budget_type": "medium",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error (e.g., missing name, duplicate name)
- `401 Unauthorized` - Missing or invalid authentication token

---

#### GET /api/preferences/:id

Retrieve a specific preference template.

**URL Parameters:**
- `id` (required, uuid) - Preference template ID

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "people_count": 2,
    "budget_type": "medium",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Preference not found or doesn't belong to user

---

#### PUT /api/preferences/:id

Update an existing preference template.

**URL Parameters:**
- `id` (required, uuid) - Preference template ID

**Request Body:**
```json
{
  "name": "string",
  "people_count": 3,
  "budget_type": "high"
}
```

**Validation Rules:**
- Same as POST /api/preferences

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "people_count": 3,
    "budget_type": "high",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T12:45:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Preference not found or doesn't belong to user

---

#### DELETE /api/preferences/:id

Delete a preference template.

**URL Parameters:**
- `id` (required, uuid) - Preference template ID

**Response (204 No Content)**

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Preference not found or doesn't belong to user

---

### 2.2 Trip Plans

#### GET /api/trip-plans

Retrieve all accepted/saved trip plans for the authenticated user.

**Query Parameters:**
- `include_deleted` (optional, boolean, default: false) - Include soft-deleted plans
- `sort_by` (optional, string, default: "created_at") - Sort field (created_at, start_date, updated_at)
- `sort_order` (optional, string, default: "desc") - Sort order (asc, desc)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "destination": "Paris, France",
      "start_date": "2025-06-15",
      "end_date": "2025-06-22",
      "people_count": 2,
      "budget_type": "medium",
      "plan_details": {
        "days": [
          {
            "day": 1,
            "date": "2025-06-15",
            "activities": [
              {
                "time": "10:00",
                "title": "Visit Eiffel Tower",
                "description": "...",
                "location": "Champ de Mars, Paris"
              }
            ]
          }
        ],
        "accommodation": {
          "name": "Hotel Paris",
          "address": "...",
          "check_in": "2025-06-15",
          "check_out": "2025-06-22"
        }
      },
      "source": "ai",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token

---

#### POST /api/trip-plans/generate

Generate a new trip plan using AI. This endpoint does NOT save the plan to the database - it only generates and returns it. The user must explicitly accept the plan using POST /api/trip-plans to save it.

**Request Body:**
```json
{
  "destination": "Paris, France",
  "start_date": "2025-06-15",
  "end_date": "2025-06-22",
  "people_count": 2,
  "budget_type": "medium",
  "preferences": {
    "transport": "public",
    "todo": "Visit museums, try local cuisine",
    "avoid": "Crowded tourist traps"
  }
}
```

**Validation Rules:**
- `destination`: Required, non-empty string
- `start_date`: Required, valid ISO date (YYYY-MM-DD), not in the past
- `end_date`: Required, valid ISO date (YYYY-MM-DD), must be >= start_date
- `people_count`: Required, positive integer (>= 1)
- `budget_type`: Required, non-empty string
- `preferences`: Optional, object with user's notes for AI generation (transport, todo, avoid, etc.)

**Response (200 OK):**
```json
{
  "data": {
    "generation_id": "uuid",
    "destination": "Paris, France",
    "start_date": "2025-06-15",
    "end_date": "2025-06-22",
    "people_count": 2,
    "budget_type": "medium",
    "plan_details": {
      "days": [
        {
          "day": 1,
          "date": "2025-06-15",
          "activities": [
            {
              "time": "10:00",
              "title": "Visit Eiffel Tower",
              "description": "Start your Paris adventure at the iconic Eiffel Tower...",
              "location": "Champ de Mars, 5 Avenue Anatole France, 75007 Paris",
              "estimated_cost": 26,
              "duration": "2-3 hours"
            }
          ]
        }
      ],
      "accommodation": {
        "name": "Hotel Central Paris",
        "address": "15 Rue de la Paix, 75002 Paris",
        "check_in": "2025-06-15",
        "check_out": "2025-06-22",
        "estimated_cost": 150
      }
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error (e.g., end_date before start_date, missing required fields)
- `401 Unauthorized` - Missing or invalid authentication token
- `408 Request Timeout` - AI generation exceeded 180 second timeout
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - AI generation failed (error details in response body)

**Notes:**
- Generation timeout is set to 180 seconds per PRD requirement
- Failed generations are logged to `plan_generation_error_logs` table
- Successful generations are logged to `plan_generations` table
- The returned `generation_id` should be included when accepting the plan to link the trip plan to its source generation
- User can regenerate unlimited times (per PRD US-006)
- The generated plan is NOT saved to `trip_plans` table - user must call POST /api/trip-plans to save it

---

#### POST /api/trip-plans

Accept and save a generated trip plan to the database. This can be called with the plan exactly as generated by AI (source="ai") or with user modifications (source="ai-edited").

**Request Body:**
```json
{
  "generation_id": "uuid",
  "destination": "Paris, France",
  "start_date": "2025-06-15",
  "end_date": "2025-06-22",
  "people_count": 2,
  "budget_type": "medium",
  "plan_details": {
    "days": [
      {
        "day": 1,
        "date": "2025-06-15",
        "activities": [...]
      }
    ],
    "accommodation": {...}
  },
  "source": "ai"
}
```

**Validation Rules:**
- `generation_id`: Optional, uuid linking to the generation that created this plan (for analytics)
- `destination`: Required, non-empty string
- `start_date`: Required, valid ISO date (YYYY-MM-DD)
- `end_date`: Required, valid ISO date (YYYY-MM-DD), must be >= start_date
- `people_count`: Required, positive integer (>= 1)
- `budget_type`: Required, non-empty string
- `plan_details`: Required, non-empty valid JSON object containing the trip plan
- `source`: Required, must be either "ai" (if unmodified from generation) or "ai-edited" (if user edited before accepting)

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "destination": "Paris, France",
    "start_date": "2025-06-15",
    "end_date": "2025-06-22",
    "people_count": 2,
    "budget_type": "medium",
    "plan_details": {...},
    "source": "ai",
    "created_at": "2025-01-15T10:45:00Z",
    "updated_at": "2025-01-15T10:45:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error (e.g., empty plan_details, invalid source value, end_date before start_date)
- `401 Unauthorized` - Missing or invalid authentication token

**Notes:**
- This is the "accept" action that saves the plan to the database
- If `generation_id` is provided, it's stored in the `trip_plans.generation_id` field to link the plan to its source generation
- The `source` field is critical for analytics:
  - Use "ai" if the plan is exactly as generated (no user modifications)
  - Use "ai-edited" if the user edited the plan before accepting
- Per PRD metric: "Odsetek zaakceptowanych planów w pełni wygenerowanych przez AI ≥ 60%"

---

#### GET /api/trip-plans/:id

Retrieve a specific saved trip plan.

**URL Parameters:**
- `id` (required, uuid) - Trip plan ID

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "destination": "Paris, France",
    "start_date": "2025-06-15",
    "end_date": "2025-06-22",
    "people_count": 2,
    "budget_type": "medium",
    "plan_details": {
      "days": [...],
      "accommodation": {...}
    },
    "source": "ai-edited",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T14:20:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Trip plan not found or doesn't belong to user

---

#### PATCH /api/trip-plans/:id

Update a saved trip plan (manual edits). Automatically changes source to "ai-edited" if it was "ai".

**URL Parameters:**
- `id` (required, uuid) - Trip plan ID

**Request Body:**
```json
{
  "destination": "Paris, France",
  "start_date": "2025-06-15",
  "end_date": "2025-06-23",
  "people_count": 3,
  "budget_type": "high",
  "plan_details": {
    "days": [
      {
        "day": 1,
        "date": "2025-06-15",
        "activities": [...]
      }
    ],
    "accommodation": {...}
  }
}
```

**Validation Rules:**
- All fields are optional
- If provided, same validation as POST /api/trip-plans
- `plan_details`: Must be valid JSON structure

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "destination": "Paris, France",
    "start_date": "2025-06-15",
    "end_date": "2025-06-23",
    "people_count": 3,
    "budget_type": "high",
    "plan_details": {...},
    "source": "ai-edited",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T15:45:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Trip plan not found or doesn't belong to user

**Notes:**
- Any edit to `plan_details` automatically changes `source` from "ai" to "ai-edited"
- Editing other fields (destination, dates, etc.) does not change source

---

#### DELETE /api/trip-plans/:id

Soft delete a saved trip plan (sets deleted_at and deleted_by).

**URL Parameters:**
- `id` (required, uuid) - Trip plan ID

**Response (204 No Content)**

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Trip plan not found or doesn't belong to user

---

### 2.3 Analytics (Optional/Future)

#### GET /api/analytics/generations

Retrieve generation statistics for analytics purposes.

**Query Parameters:**
- `start_date` (optional, date) - Filter generations from this date
- `end_date` (optional, date) - Filter generations until this date

**Response (200 OK):**
```json
{
  "data": {
    "total_generations": 150,
    "successful_generations": 142,
    "failed_generations": 8,
    "average_duration_ms": 12500,
    "ai_acceptance_rate": 0.65,
    "breakdown_by_source": {
      "ai": 92,
      "ai-edited": 50
    },
    "breakdown_by_model": {
      "gpt-4": 80,
      "claude-3": 62
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User doesn't have analytics access (future: admin only)

---

## 3. Authentication and Authorization

### 3.1 Authentication Method

The API uses **Supabase Authentication** with JWT Bearer tokens:

1. **Registration/Login**: Handled by Supabase Auth endpoints:
   - `POST /auth/v1/signup` - User registration
   - `POST /auth/v1/token?grant_type=password` - User login
   - `POST /auth/v1/token?grant_type=refresh_token` - Token refresh
   - `POST /auth/v1/logout` - User logout

2. **Token Usage**: All API requests must include the JWT token:
   ```
   Authorization: Bearer <jwt_token>
   ```

3. **Token Validation**:
   - Middleware validates token on every request
   - Invalid/expired tokens return `401 Unauthorized`
   - Supabase automatically extracts `user_id` from token via `auth.uid()`

### 3.2 Authorization

Authorization is implemented using **PostgreSQL Row Level Security (RLS)**:

1. **User Preferences**:
   ```sql
   CREATE POLICY up_owner ON user_preferences
     USING (user_id = auth.uid());
   ```
   - Users can only access their own preference templates

2. **Trip Plans**:
   ```sql
   CREATE POLICY tp_owner ON trip_plans
     USING (user_id = auth.uid());
   ```
   - Users can only access their own trip plans
   - Soft-deleted plans are included only when `deleted_at IS NOT NULL`

3. **Plan Generations**:
   ```sql
   CREATE POLICY pg_owner ON plan_generations
     USING (user_id = auth.uid());
   ```
   - Users can only view their own generation logs

4. **Error Logs**:
   - No RLS policies for `plan_generation_error_logs`
   - Accessible only via service role (backend only)
   - Not exposed through public API endpoints

### 3.3 Security Considerations

1. **Rate Limiting**:
   - Generation endpoint: Max 10 requests per minute per user
   - All other endpoints: Max 100 requests per minute per user
   - Exceeded limits return `429 Too Many Requests`

2. **Input Validation**:
   - All user input is validated server-side
   - SQL injection prevented by parameterized queries
   - XSS prevention through output encoding

3. **CORS**:
   - Configured for frontend domain only
   - No wildcard `*` origins in production

4. **HTTPS**:
   - All API communication over HTTPS in production
   - HTTP Strict Transport Security (HSTS) enabled

---

## 4. Validation and Business Logic

### 4.1 User Preferences Validation

**Field Constraints:**
- `name`: Required, max 256 characters, unique per user
- `people_count`: Optional, positive integer (>= 1)
- `budget_type`: Optional, string (recommended values: "low", "medium", "high")

**Business Rules:**
- A user cannot have two preference templates with the same name
- Deleting a preference template does not affect existing trip plans that used it

### 4.2 Trip Plans Validation

**Field Constraints:**
- `destination`: Required, non-empty string
- `start_date`: Required, valid ISO date (YYYY-MM-DD), cannot be in the past (for generation)
- `end_date`: Required, valid ISO date (YYYY-MM-DD), must be >= start_date
- `people_count`: Required, positive integer (>= 1)
- `budget_type`: Required, non-empty string
- `plan_details`: Required for POST /api/trip-plans, non-empty valid JSON structure
- `source`: Required for POST /api/trip-plans, must be either "ai" or "ai-edited"

**Business Rules:**

1. **Plan Generation** (POST /api/trip-plans/generate):
   - User provides trip parameters (destination, dates, people_count, budget_type, preferences)
   - AI generates complete plan with `plan_details`
   - Generation timeout: 180 seconds (per PRD requirement)
   - Successful generation:
     - Returns generated plan with `generation_id`
     - Creates record in `plan_generations` table
     - Does NOT save plan to `trip_plans` table
   - Failed generation:
     - Creates record in `plan_generation_error_logs` table
     - Returns error details to user
     - User can retry unlimited times (per PRD US-006)
   - The generated plan exists only in memory/frontend - user must explicitly accept it to save

2. **Plan Acceptance** (POST /api/trip-plans):
   - User accepts generated plan (with or without frontend edits)
   - Client must provide:
     - All trip data (destination, dates, people_count, budget_type)
     - Complete `plan_details` object
     - `source`: "ai" if unmodified, "ai-edited" if user edited before accepting
     - Optional `generation_id` to link plan to its source generation
   - Backend saves plan to `trip_plans` table
   - If `generation_id` provided, it's stored in `trip_plans.generation_id` field for analytics
   - This distinction is critical for analytics metric: "Odsetek zaakceptowanych planów w pełni wygenerowanych przez AI ≥ 60%"

3. **Plan Editing** (PATCH /api/trip-plans/:id):
   - User can edit saved plans after acceptance
   - Any PATCH to `plan_details` automatically changes `source` from "ai" to "ai-edited"
   - Editing other fields (destination, dates, etc.) does not change source
   - Backend automatically manages source field transitions

4. **Plan Deletion** (DELETE /api/trip-plans/:id):
   - Soft delete: sets `deleted_at = now()` and `deleted_by = auth.uid()`
   - Deleted plans are excluded from default queries unless `include_deleted=true`
   - Hard deletion can be implemented later for data cleanup (90+ days)

**Workflow Summary:**
```
1. User fills form → POST /api/trip-plans/generate
2. AI generates plan → Returns plan + generation_id (NOT saved to DB)
3. User reviews plan (can edit in frontend)
4. User clicks "Accept" → POST /api/trip-plans with source="ai" or "ai-edited"
5. Plan saved to trip_plans table
6. User can later edit → PATCH /api/trip-plans/:id (source changes to "ai-edited")
```

### 4.3 Plan Details Structure

The `plan_details` JSONB field has the following recommended structure:

```json
{
  "days": [
    {
      "day": 1,
      "date": "2025-06-15",
      "activities": [
        {
          "time": "10:00",
          "title": "string",
          "description": "string",
          "location": "string",
          "estimated_cost": 26,
          "duration": "2-3 hours",
          "category": "sightseeing"
        }
      ]
    }
  ],
  "accommodation": {
    "name": "string",
    "address": "string",
    "check_in": "2025-06-15",
    "check_out": "2025-06-22",
    "estimated_cost": 150,
    "booking_url": "string"
  },
  "notes": "string",
  "total_estimated_cost": 500,
  "accepted_at": "2025-01-15T16:00:00Z"
}
```

**Validation**:
- The structure is flexible (JSONB allows schema evolution)
- Frontend and AI must agree on this structure
- Backend validates it's valid JSON but doesn't enforce strict schema in MVP
- Future: JSON Schema validation can be added

### 4.4 Generation Logging

**Successful Generation** (plan_generations table):
- `user_id`: From auth.uid()
- `model`: AI model identifier (e.g., "gpt-4", "claude-3-sonnet")
- `source_text_hash`: SHA-256 hash of the prompt sent to AI
- `source_text_length`: Character count of the prompt
- `duration_ms`: Generation time in milliseconds
- `created_at`: Timestamp of generation

**Failed Generation** (plan_generation_error_logs table):
- `user_id`: From auth.uid()
- `model`: AI model identifier
- `source_text_hash`: SHA-256 hash of the prompt
- `source_text_length`: Character count of the prompt
- `duration_ms`: Time until error occurred
- `error_message`: Raw error message from AI service
- `error_code`: Categorized error code (e.g., "timeout", "invalid_response", "api_error")
- `created_at`: Timestamp of error

**Analytics Usage**:
- Calculate AI acceptance rate: (count of trip_plans with source="ai") / (count of all trip_plans)
- Track generation-to-acceptance rate: (count of trip_plans with generation_id NOT NULL) / (count of all plan_generations)
- Track generation performance: average duration_ms, error rate by model
- Identify problematic prompts: group errors by source_text_hash
- Identify unused generations: plan_generations WHERE id NOT IN (SELECT generation_id FROM trip_plans WHERE generation_id IS NOT NULL) AND created_at < (now() - interval '7 days')

---

## 5. Error Handling

### 5.1 Standard Error Response Format

All errors return a consistent JSON structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific_field",
      "reason": "Additional context"
    }
  }
}
```

### 5.2 HTTP Status Codes

- `200 OK` - Successful GET, PATCH, PUT, or POST (non-creation)
- `201 Created` - Successful POST (creation)
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error, malformed request
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Authenticated but not authorized (future use)
- `404 Not Found` - Resource not found or doesn't belong to user
- `408 Request Timeout` - AI generation timeout (> 180 seconds)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error, AI generation failure
- `503 Service Unavailable` - Service temporarily unavailable

### 5.3 Common Error Codes

**Authentication Errors:**
- `AUTH_TOKEN_MISSING` - No Authorization header provided
- `AUTH_TOKEN_INVALID` - Token is malformed or expired
- `AUTH_TOKEN_EXPIRED` - Token has expired, use refresh token

**Validation Errors:**
- `VALIDATION_REQUIRED_FIELD` - Required field is missing
- `VALIDATION_INVALID_FORMAT` - Field format is invalid (e.g., date)
- `VALIDATION_CONSTRAINT_VIOLATION` - Database constraint violated (e.g., unique name)
- `VALIDATION_INVALID_DATE_RANGE` - end_date is before start_date

**Resource Errors:**
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist or doesn't belong to user
- `RESOURCE_ALREADY_EXISTS` - Resource with same unique constraint already exists

**Generation Errors:**
- `GENERATION_TIMEOUT` - AI generation exceeded 180 second timeout
- `GENERATION_FAILED` - AI generation failed (see error_message for details)
- `GENERATION_INVALID_INPUT` - Plan is missing required fields for generation
- `GENERATION_QUOTA_EXCEEDED` - User has exceeded generation quota (future)

**Rate Limiting:**
- `RATE_LIMIT_EXCEEDED` - Too many requests, retry after X seconds

---

## 6. Additional Considerations

### 6.1 Performance Optimization

1. **Data Volume**:
   - No pagination needed for MVP (expected < 10 preferences, < 20 plans per user)
   - Future: Add pagination if user data grows beyond expectations
   - Sorting options available (created_at, start_date, updated_at)

2. **Indexing**:
   - Database indexes already defined in schema (user_id, created_at)
   - Consider GIN index on plan_details JSONB for complex queries (future)
   - Unique index on (user_id, name) for preferences

3. **Caching**:
   - User preferences can be cached (low mutation rate)
   - Trip plans should not be cached (frequently updated)
   - Generated plans exist only in frontend state until accepted
   - Consider CDN caching for static AI responses (future)

4. **Field Selection** (future enhancement):
   - Allow clients to specify fields to return: `?fields=id,destination,start_date`
   - Reduces payload size for mobile clients

### 6.2 Mobile-First Considerations

Per PRD requirement: "Mobile-first: pełna funkcjonalność na ekranach < 400 px"

1. **Minimal Payloads**:
   - Return only necessary fields by default
   - Small data volumes (< 10 preferences, < 20 plans) ensure fast loading
   - Compress responses (gzip/brotli)
   - Generated plans live in frontend state until accepted (no unnecessary DB reads)

2. **Offline Support** (future):
   - Consider implementing offline-first architecture
   - Use service workers for caching
   - Cache generated plans locally until user accepts or discards
   - Sync changes when connection restored

### 6.3 Monitoring and Observability

1. **Metrics to Track**:
   - API response times (p50, p95, p99)
   - Generation success/failure rates
   - AI acceptance rate (source="ai" vs "ai-edited")
   - Active users, plans created, plans accepted

2. **Logging**:
   - All API requests (anonymized)
   - All errors with stack traces
   - All AI generations with metadata

3. **Alerting**:
   - Generation error rate > 10%
   - API response time p95 > 1s
   - API error rate > 5%

### 6.4 Future Enhancements

Features explicitly excluded from MVP but worth planning for:

1. **External Integrations**:
   - Booking.com API for real accommodation availability
   - Google Places API for location details
   - Weather API for trip dates

2. **Versioning**:
   - Plan versioning (track changes over time)
   - Ability to rollback to previous version

3. **Sharing**:
   - Share plans with other users (read-only or collaborative)
   - Public plan URLs

4. **Advanced Analytics**:
   - Multimedia support (photos, maps)
   - Plan ratings and feedback
   - Personalized recommendations based on past trips

5. **Real-time Updates**:
   - WebSocket support for live AI generation progress
   - Collaborative editing with other users
