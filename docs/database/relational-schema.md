# Relational Schema

PostgreSQL is authoritative for identity, inventory ownership and sale status, orders, order items, and simulated payment records. Monetary values use `NUMERIC(12, 2)` so calculations do not use floating-point values.

## Tables

- `users`: student/admin identity and role. Password storage is nullable in this phase because authentication is not implemented yet.
- `items`: seller-owned inventory, price, category, and authoritative availability state.
- `orders`: buyer order lifecycle and total amount.
- `order_items`: immutable purchase price for each item and a unique `item_id` constraint that prevents an item from being sold twice.
- `payment_logs`: simulated payment provider/status and amount for an order.
- `sessions`: hashed opaque session tokens with expiry and user ownership.
- `schema_migrations`: applied migration names used by the repeatable migration runner.

`orders.checkout_key` is a unique optional idempotency key for checkout retries. `order_summary` and `seller_inventory_summary` are reporting views. The `orders_mark_items_sold` trigger changes inventory to `Sold` only when an order becomes `Completed`.

Primary and foreign keys, `NOT NULL`, `CHECK`, `UNIQUE`, and indexes are defined in `database/postgres/migrations/001_initial_schema.sql`.
Authentication/session, checkout, trigger, view, and supporting index definitions are in `002_auth_sessions.sql` and `003_marketplace_features.sql`.

## Ownership and cross-database reference

Every MongoDB listing stores `postgresItemId`, the corresponding PostgreSQL `items.id`. MongoDB does not own price, seller ownership, availability, order status, or payment status. The reference is indexed uniquely so one PostgreSQL item has at most one metadata document.

The databases do not share an ACID transaction. Phase 2 therefore keeps setup and seed operations separate and documents the required recovery boundary for later application workflows: PostgreSQL inventory writes are authoritative; MongoDB metadata writes must be retried or compensated by a reconciliation job when a partial operation occurs.