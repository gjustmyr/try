-- Migration: Fix QR Codes for Existing Deliveries
-- This will clear existing QR codes so they can be regenerated

-- Option 1: Clear all QR codes (they will need to be regenerated manually)
-- UPDATE deliveries SET qr_code = NULL WHERE qr_code IS NOT NULL;

-- Option 2: Clear QR codes only for deliveries that haven't been delivered yet
UPDATE deliveries 
SET qr_code = NULL 
WHERE qr_code IS NOT NULL 
  AND status IN ('received_at_hub', 'in_transit', 'at_destination_hub', 'out_for_delivery');

-- After running this, hub staff can regenerate QR codes by:
-- 1. Going to the parcel details
-- 2. Clicking "View QR Code" (if available)
-- Or the system will regenerate them automatically when needed

SELECT 
  COUNT(*) as total_cleared,
  status
FROM deliveries 
WHERE qr_code IS NULL
GROUP BY status;
