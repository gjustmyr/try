-- Add payment fields to orders table
-- Run this migration to add PayMongo payment integration fields

-- Add payment_method enum type if not exists
DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('cod', 'online', 'gcash', 'paymaya', 'card');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add payment_status enum type if not exists
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add payment fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cod',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_source_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Update existing orders to have default payment values
UPDATE orders 
SET payment_method = 'cod', 
    payment_status = 'pending'
WHERE payment_method IS NULL;

-- Create index for faster payment lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_source ON orders(payment_source_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

COMMENT ON COLUMN orders.payment_method IS 'Payment method: cod, online, gcash, paymaya, card';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, paid, failed, refunded';
COMMENT ON COLUMN orders.payment_intent_id IS 'PayMongo payment intent ID';
COMMENT ON COLUMN orders.payment_source_id IS 'PayMongo source ID (for GCash/PayMaya)';
COMMENT ON COLUMN orders.paid_at IS 'Timestamp when payment was completed';
