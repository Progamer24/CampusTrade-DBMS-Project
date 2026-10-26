# CampusTrade API contract

**Status: IMPLEMENTED for authentication in Phase 3.** Listing, order and
moderation routes remain proposed until their phases are implemented.

## Authentication

### `POST /api/auth/register`

Request fields:

| Field | Type | Notes |
| --- | --- | --- |
| `fullName` | string | Required |
| `email` | string | Required; normalized to lowercase |
| `studentId` | string or omitted | Accepted by the UI but not persisted in Phase 3 |
| `password` | string | Required; send only over HTTPS and hash on the server |

Response: `201` with a public student profile and an opaque session cookie. The
password is bcrypt-hashed in PostgreSQL and is never returned. Registration
always creates `Student`; role input is ignored. Duplicate email returns `409`.
Validation errors return `400`.

### `POST /api/auth/login`

Request fields: `email` and `password`. Response: public user profile and an
opaque session cookie. Invalid credentials return the same generic `401`
message whether the email exists or not.

### `POST /api/auth/logout` and `GET /api/auth/me`

Logout deletes the hashed session token and clears the HTTP-only cookie. It
requires a same-origin request and returns `204`. The session cookie is
`campustrade_session`, `HttpOnly`, `SameSite=Lax`, `Secure` in production,
`Path=/`, and lasts 30 days. `/api/auth/me` returns the public authenticated
profile or `401`.

### `GET /api/admin/ping`

Authentication and authorization probe used by tests. It returns `401` without
a session, `403` for Students, and `200` for Campus Admin users. Public
registration cannot assign the Admin role. Admin elevation is a controlled
database-operator action documented in `docs/authentication.md`.

## Listings

### `GET /api/listings`

Proposed optional query fields: `q`, `category`, `sort`, `page`, and `limit`.
Proposed listing fields: `id`, `title`, `description`, `category`, `price`,
`condition`, `imageUrl`, `seller` (public profile fields only), `status`, and
timestamps. Only approved, active listings should be public.

### `GET /api/listings/{listingId}`

Return one public listing and its allowed seller summary, or a not-found
response. The sample numeric IDs in the frontend are not database identifiers.

### `POST /api/listings`

Authenticated student only. Proposed fields: `title`, `description`,
`category`, `price`, `condition`, and optional image upload. Agree upload
limits, moderation defaults, price precision, and validation rules before use.
The backend should assign the owner, initial status, ID, and timestamps.

## Student dashboard

### `GET /api/students/me/dashboard`

Authenticated student only. Proposed response sections: profile summary, the
student's listings with statuses, pending requests/orders, completed
transactions, and recent activity. Define request/order and transaction
lifecycles before returning these counts.

## Moderation

### `GET /api/admin/moderation/listings`

Admin authorization required. Proposed filters include moderation status,
category, and pagination. Return listing summaries plus moderation metadata
and report counts. Admin authorization and analytics are backend
responsibilities; no such controls are implemented in this frontend.

### `PATCH /api/admin/moderation/listings/{listingId}`

Admin authorization required. Proposed request fields: `action` (`approve`,
`reject`, or `flag`) and an optional `reason`. The backend owner must define
allowed state transitions, audit history, notification behavior, and error
responses.

## Integration checklist

- Agree endpoint paths, response/error envelopes, field validation, and status
  transitions with the backend owner before wiring requests.
- Authenticate and authorize on the server; never trust frontend roles or
  moderation controls.
- Validate all input server-side, protect state-changing requests, and avoid
  returning private student identifiers or credential data.
- Replace the local sample data and preview-only form notices only after the
  contract is approved and the API is implemented.
