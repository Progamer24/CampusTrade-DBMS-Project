# Relational Schema

PostgreSQL is authoritative for identity, inventory ownership and sale status, orders, order items, and simulated payment records. Monetary values use `NUMERIC(12, 2)` so calculations do not use floating-point values.

## Tables

- `users`: student/admin identity and role. Password storage is nullable in this phase because authentication is not implemented yet.
- `items`: seller-owned inventory, price, category, and authoritative availability state.
- `orders`: buyer order lifecycle and total amount.
- `order_items`: immutable purchase price for each item and a unique `item_id` constraint that prevents an item from being sold twice.
- `payment_logs`: simulated payment provider/status and amount for an order.
- `schema_migrations`: applied migration names used by the repeatable migration runner.

Primary and foreign keys, `NOT NULL`, `CHECK`, `UNIQUE`, and indexes are defined in `database/postgres/migrations/001_initial_schema.sql`.

## Ownership and cross-database reference

Every MongoDB listing stores `postgresItemId`, the corresponding PostgreSQL `items.id`. MongoDB does not own price, seller ownership, availability, order status, or payment status. The reference is indexed uniquely so one PostgreSQL item has at most one metadata document.

The databases do not share an ACID transaction. Phase 2 therefore keeps setup and seed operations separate and documents the required recovery boundary for later application workflows: PostgreSQL inventory writes are authoritative; MongoDB metadata writes must be retried or compensated by a reconciliation job when a partial operation occurs.