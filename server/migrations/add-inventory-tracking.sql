-- Add inventory tracking system
-- Run this migration to enable real-time inventory tracking

-- Create inventory log type enum
DO $$ BEGIN
    CREATE TYPE inventory_log_type AS ENUM ('sale', 'restock', 'adjustment', 'return', 'damaged', 'initial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create inventory_logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reason VARCHAR(255),
    notes TEXT,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_seller ON inventory_logs(seller_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_type ON inventory_logs(type);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created ON inventory_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_order ON inventory_logs(order_id);

-- Add low stock threshold column to products (optional)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

-- Create a view for low stock products
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.quantity,
    p.low_stock_threshold,
    p.seller_id,
    s.shop_name,
    p.price,
    p.status
FROM products p
JOIN sellers s ON p.seller_id = s.id
WHERE p.quantity <= p.low_stock_threshold
  AND p.quantity > 0
  AND p.status = 'active'
ORDER BY p.quantity ASC;

-- Create a view for out of stock products
CREATE OR REPLACE VIEW out_of_stock_products AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.seller_id,
    s.shop_name,
    p.price,
    p.status,
    p.updated_at as last_updated
FROM products p
JOIN sellers s ON p.seller_id = s.id
WHERE p.quantity = 0
  AND p.status = 'active'
ORDER BY p.updated_at DESC;

-- Create function to automatically log initial inventory
CREATE OR REPLACE FUNCTION log_initial_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if this is a new product with quantity > 0
    IF TG_OP = 'INSERT' AND NEW.quantity > 0 THEN
        INSERT INTO inventory_logs (
            product_id,
            seller_id,
            type,
            quantity_before,
            quantity_change,
            quantity_after,
            reason
        ) VALUES (
            NEW.id,
            NEW.seller_id,
            'initial',
            0,
            NEW.quantity,
            NEW.quantity,
            'Initial stock'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for initial inventory logging
DROP TRIGGER IF EXISTS trigger_log_initial_inventory ON products;
CREATE TRIGGER trigger_log_initial_inventory
    AFTER INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION log_initial_inventory();

-- Add comments for documentation
COMMENT ON TABLE inventory_logs IS 'Tracks all inventory movements for products';
COMMENT ON COLUMN inventory_logs.type IS 'Type of inventory movement: sale, restock, adjustment, return, damaged, initial';
COMMENT ON COLUMN inventory_logs.quantity_before IS 'Quantity before the change';
COMMENT ON COLUMN inventory_logs.quantity_change IS 'Change in quantity (positive for increase, negative for decrease)';
COMMENT ON COLUMN inventory_logs.quantity_after IS 'Quantity after the change';
COMMENT ON COLUMN inventory_logs.reason IS 'Short reason for the change';
COMMENT ON COLUMN inventory_logs.notes IS 'Additional notes or details';
COMMENT ON COLUMN inventory_logs.order_id IS 'Related order ID if change was due to sale/return';
COMMENT ON COLUMN inventory_logs.performed_by IS 'User who performed the action';

-- Sample query to get inventory summary for a seller
-- SELECT 
--     COUNT(*) as total_products,
--     SUM(quantity) as total_units,
--     COUNT(CASE WHEN quantity <= low_stock_threshold AND quantity > 0 THEN 1 END) as low_stock_count,
--     COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_count
-- FROM products
-- WHERE seller_id = 'YOUR_SELLER_ID' AND status = 'active';

COMMENT ON VIEW low_stock_products IS 'Products with quantity at or below their low stock threshold';
COMMENT ON VIEW out_of_stock_products IS 'Products that are currently out of stock';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON low_stock_products TO your_app_user;
-- GRANT SELECT ON out_of_stock_products TO your_app_user;

SELECT 'Inventory tracking system installed successfully!' as message;
