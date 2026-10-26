ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_key VARCHAR(120);

CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_key_unique
  ON orders (checkout_key)
  WHERE checkout_key IS NOT NULL;

CREATE OR REPLACE FUNCTION mark_items_sold_after_completed_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'Completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE items
    SET status = 'Sold', updated_at = CURRENT_TIMESTAMP
    WHERE id IN (SELECT item_id FROM order_items WHERE order_id = NEW.id)
      AND status IN ('Available', 'Reserved');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_mark_items_sold ON orders;
CREATE TRIGGER orders_mark_items_sold
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION mark_items_sold_after_completed_order();

CREATE OR REPLACE VIEW order_summary AS
SELECT
  o.id AS order_id,
  o.buyer_id,
  u.full_name AS buyer_name,
  o.status,
  o.total_amount,
  COUNT(oi.id)::INTEGER AS item_count,
  o.created_at
FROM orders o
JOIN users u ON u.id = o.buyer_id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.buyer_id, u.full_name, o.status, o.total_amount, o.created_at;

CREATE OR REPLACE VIEW seller_inventory_summary AS
SELECT
  i.seller_id,
  u.full_name AS seller_name,
  i.status,
  COUNT(*)::INTEGER AS item_count,
  COALESCE(SUM(i.price), 0)::NUMERIC(12, 2) AS inventory_value,
  COALESCE((SELECT SUM(oi.unit_price) FROM order_items oi JOIN orders o2 ON o2.id = oi.order_id WHERE oi.item_id IN (SELECT i2.id FROM items i2 WHERE i2.seller_id = i.seller_id) AND o2.status = 'Completed'), 0)::NUMERIC(12, 2) AS completed_sales
FROM items i
JOIN users u ON u.id = i.seller_id
GROUP BY i.seller_id, u.full_name, i.status;

CREATE INDEX IF NOT EXISTS items_available_category_price_idx
  ON items (category, price)
  WHERE status = 'Available';