# Authentication and Authorization

CampusTrade uses bcrypt password hashes in PostgreSQL and opaque random session tokens. Only a SHA-256 token hash is stored in the `sessions` table; the raw token is sent only in the HTTP-only `campustrade_session` cookie. The cookie uses `SameSite=Lax`, `Secure` in production, `Path=/`, and a 30-day expiry.

## Roles

- `Student`: the only role available through public registration.
- `Admin`: a controlled role assigned by a trusted database operator or a future protected administration workflow. The registration request cannot select or override this role.

For local development, an operator may assign an already-verified account through a protected database session, after confirming the account owner and email out of band:

```sql
UPDATE users
SET role = 'Admin', updated_at = CURRENT_TIMESTAMP
WHERE lower(email) = lower('verified-admin@campus.edu');
```

This statement must never be exposed as a public route or executed with credentials committed to the repository.

## Server enforcement

`/dashboard` requires a valid session. `/admin` requires a valid session whose database role is `Admin`; a Student is redirected to `/dashboard`. API handlers return `401` for missing sessions and `403` for authenticated users without the required role.

Logout deletes the server-side session row and clears the cookie. Passwords and session tokens are never returned in API responses. Login failures use one generic message for unknown emails and incorrect passwords.