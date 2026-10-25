# Proposed CampusTrade API contract

**Status: PROPOSED — for backend-owner review only.** These routes and fields
are suggestions, not an agreed contract. The frontend currently makes no API
requests; the pages use local preview data and do not persist changes.

## Authentication

### `POST /api/auth/register`

Proposed request fields:

| Field | Type | Notes |
| --- | --- | --- |
| `fullName` | string | Required |
| `studentEmail` | string | Required; validation/domain rules need agreement |
| `studentId` | string or omitted | Optional; confirm whether collecting this is necessary |
| `password` | string | Required; send only over HTTPS and hash on the server |

Proposed response: authenticated student profile or a validation error. The
backend owner should choose a secure session mechanism; an HttpOnly, Secure,
SameSite cookie is preferable to exposing long-lived tokens to browser code.

### `POST /api/auth/login`

Proposed request fields: `studentEmail` and `password`. Proposed response:
authenticated student profile or a generic authentication error. Do not reveal
whether an email is registered.

### `POST /api/auth/logout` and `GET /api/auth/me`

Optional session lifecycle routes. Define cookie/session behavior and response
shape before connecting the UI.

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
