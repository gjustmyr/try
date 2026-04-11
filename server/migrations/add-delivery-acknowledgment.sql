-- Add customer acknowledgment fields to deliveries table

ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS customer_acknowledged_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS auto_confirmed_at TIMESTAMP;

-- Create index for finding deliveries that need auto-confirmation
CREATE INDEX IF NOT EXISTS idx_deliveries_delivered_at 
ON deliveries(delivered_at) 
WHERE delivered_at IS NOT NULL AND customer_acknowledged_at IS NULL AND auto_confirmed_at IS NULL;

-- Comment
COMMENT ON COLUMN deliveries.customer_acknowledged_at IS 'When customer confirmed they received the delivery';
COMMENT ON COLUMN deliveries.auto_confirmed_at IS 'When system auto-confirmed delivery after 7 days';
