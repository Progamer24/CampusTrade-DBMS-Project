INSERT INTO users (id, full_name, email, role)
VALUES
  (1, 'Aarav Sharma', 'aarav.sharma@campus.edu', 'Student'),
  (2, 'Campus Admin', 'admin@campus.edu', 'Admin')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

INSERT INTO items (id, seller_id, category, price, status)
VALUES
  (1, 1, 'Books', 450.00, 'Available'),
  (2, 1, 'Electronics', 650.00, 'Available'),
  (3, 1, 'Accessories', 800.00, 'Available'),
  (4, 1, 'Electronics', 1200.00, 'Available')
ON CONFLICT (id) DO UPDATE SET
  seller_id = EXCLUDED.seller_id,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  status = EXCLUDED.status;

INSERT INTO orders (id, buyer_id, status, total_amount)
VALUES (1, 2, 'Completed', 800.00)
ON CONFLICT (id) DO UPDATE SET
  buyer_id = EXCLUDED.buyer_id,
  status = EXCLUDED.status,
  total_amount = EXCLUDED.total_amount;

INSERT INTO order_items (id, order_id, item_id, unit_price)
VALUES (1, 1, 3, 800.00)
ON CONFLICT (id) DO UPDATE SET
  order_id = EXCLUDED.order_id,
  item_id = EXCLUDED.item_id,
  unit_price = EXCLUDED.unit_price;

INSERT INTO payment_logs (id, order_id, provider, provider_reference, status, amount)
VALUES (1, 1, 'simulated', 'demo-payment-1', 'Succeeded', 800.00)
ON CONFLICT (id) DO UPDATE SET
  order_id = EXCLUDED.order_id,
  provider = EXCLUDED.provider,
  provider_reference = EXCLUDED.provider_reference,
  status = EXCLUDED.status,
  amount = EXCLUDED.amount;

SELECT setval(pg_get_serial_sequence('users', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 1), true);
SELECT setval(pg_get_serial_sequence('items', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM items), 1), true);
SELECT setval(pg_get_serial_sequence('orders', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM orders), 1), true);
SELECT setval(pg_get_serial_sequence('order_items', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM order_items), 1), true);
SELECT setval(pg_get_serial_sequence('payment_logs', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM payment_logs), 1), true);