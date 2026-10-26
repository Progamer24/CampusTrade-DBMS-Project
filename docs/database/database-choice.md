# Database Choice and Failure Recovery

CampusTrade uses a hybrid model because the two workloads have different consistency needs:

- **PostgreSQL** owns users, roles, seller ownership, inventory state, orders, order items, and simulated payments. These records need foreign keys, monetary precision, uniqueness, and transaction support.
- **MongoDB** owns flexible listing descriptions, category-specific attributes, image metadata, and reviews. Its document model allows listing metadata to evolve without adding relational columns for every category.

## Partial failure policy

PostgreSQL is the source of truth for whether an item exists, is available, or has been sold. MongoDB stores only the flexible companion document and references the PostgreSQL item using `postgresItemId`. A normal cross-database ACID transaction is not assumed.

When a future listing workflow writes both databases, it must:

1. Create or update the PostgreSQL item first.
2. Write MongoDB metadata with the resulting PostgreSQL ID and an idempotent upsert.
3. If MongoDB fails, retain the PostgreSQL item in a recoverable pending state and retry the MongoDB operation.
4. If the PostgreSQL operation fails, do not create an orphan MongoDB document; any existing document is marked for reconciliation or removed by a controlled cleanup job.
5. Reconciliation compares PostgreSQL items with MongoDB `postgresItemId` references and reports orphaned or missing metadata without deleting records automatically.

The Phase 2 scripts are intentionally separate so initialization can be rerun safely. Phase 3 and later phases will apply this policy to application requests.

## Checkout boundary

Phase 5 checkout locks the PostgreSQL item row, creates the order/order-item/payment records, and commits the authoritative sale in PostgreSQL. The completion trigger marks the item `Sold`. Only after that commit does the application update MongoDB listing status. A MongoDB failure returns a synchronization warning and leaves the PostgreSQL sale authoritative for reconciliation; it never pretends the two databases share an ACID transaction.