# Fix QR Codes Guide

## Problem

Existing QR codes were generated with `orderId` but the driver app expects `deliveryId`, causing "Invalid QR code format" errors.

## Solution

We've fixed the code generation and provided multiple ways to fix existing QR codes.

---

## Option 1: Automatic API Endpoint (Recommended)

### For Individual Parcels

Hub staff can regenerate QR codes through the API:

```bash
POST /api/hub/parcels/:deliveryId/regenerate-qr
```

**Example using curl:**

```bash
curl -X POST \
  http://localhost:8000/api/hub/parcels/DELIVERY_ID_HERE/regenerate-qr \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Response:**

```json
{
  "success": true,
  "message": "QR code regenerated successfully",
  "data": {
    "id": "delivery-id",
    "trackingNumber": "TRK-XYZ123",
    "qrCode": "data:image/png;base64,..."
  }
}
```

### Add Button to Hub Dashboard (Optional)

You can add a "Regenerate QR" button in the parcel card:

```typescript
// In hub-dashboard.component.ts
regenerateQR(parcel: any) {
  const token = localStorage.getItem('token');
  fetch(`http://localhost:8000/api/hub/parcels/${parcel.id}/regenerate-qr`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(res => {
    if (res.success) {
      parcel.qrCode = res.data.qrCode;
      alert('QR code regenerated successfully!');
    }
  });
}
```

---

## Option 2: Node.js Migration Script

Run the automated migration script:

```bash
cd server
node migrations/fix-qr-codes.js
```

**What it does:**

- Finds all deliveries with QR codes
- Checks if they have the old format (orderId)
- Regenerates QR codes with correct format (deliveryId)
- Shows progress and summary

**Output:**

```
Starting QR code migration...
Found 15 deliveries with QR codes
Updating QR code for delivery abc-123 (tracking: TRK-XYZ789)
✓ Updated delivery abc-123
...

=== Migration Complete ===
Total deliveries: 15
Updated: 12
Skipped: 3
Errors: 0
```

---

## Option 3: SQL Script (Quick Fix)

Clear existing QR codes so they can be regenerated:

```sql
-- Clear QR codes for active deliveries only
UPDATE deliveries
SET qr_code = NULL
WHERE qr_code IS NOT NULL
  AND status IN ('received_at_hub', 'in_transit', 'at_destination_hub', 'out_for_delivery');
```

**After running this:**

- QR codes will be NULL
- Hub staff can view parcel details
- System will show "QR code not yet generated"
- Use the regenerate API endpoint to create new QR codes

---

## Option 4: Manual Regeneration

For testing or individual parcels:

1. **Find the delivery ID** from database:

   ```sql
   SELECT id, tracking_number, order_id
   FROM deliveries
   WHERE tracking_number = 'TRK-XYZ789';
   ```

2. **Call regenerate endpoint** using Postman or curl

3. **Verify** the new QR code works with driver app

---

## Verification

### Check QR Code Format

**Old format (broken):**

```json
{
  "orderId": "d5c4c5cb-2d5b-4ec3-a372-b32a7b1c329d",
  "trackingNumber": "TRK-MNTQBPS85T7",
  "secret": "43c1a1ccc216ab21873f4d14420463d2"
}
```

**New format (correct):**

```json
{
  "deliveryId": "abc-123-def-456",
  "trackingNumber": "TRK-MNTQBPS85T7",
  "secret": "43c1a1ccc216ab21873f4d14420463d2"
}
```

### Test with Driver App

1. Driver scans QR code
2. Should see delivery details (not "Invalid QR code format")
3. Can mark as delivered

---

## Prevention

### For New Parcels

✅ Already fixed! New parcels will automatically get correct QR format.

The code now:

1. Creates delivery record first
2. Generates QR code with `deliveryId`
3. Updates delivery with QR code

### Code Changes Made

**server/controllers/hub.controller.js:**

```javascript
// OLD (broken)
const qrData = JSON.stringify({
  orderId: order.id, // ❌ Wrong
  trackingNumber,
  secret: qrSecret,
});

// NEW (fixed)
const qrData = JSON.stringify({
  deliveryId: delivery.id, // ✅ Correct
  trackingNumber,
  secret: qrSecret,
});
```

---

## Troubleshooting

### Issue: "QR code not yet generated"

**Solution:** Use regenerate endpoint or create new delivery

### Issue: "Invalid QR code format" still appears

**Solution:**

1. Check QR code content (decode it)
2. Verify it has `deliveryId` not `orderId`
3. Regenerate if needed

### Issue: Migration script fails

**Solution:**

1. Check database connection
2. Ensure QRCode package is installed: `npm install qrcode`
3. Check server logs for errors

### Issue: Can't find delivery ID

**Solution:**

```sql
-- Find by tracking number
SELECT id FROM deliveries WHERE tracking_number = 'TRK-XYZ789';

-- Find by order number
SELECT d.id, d.tracking_number
FROM deliveries d
JOIN orders o ON d.order_id = o.id
WHERE o.order_number = 'MS-ABC123';
```

---

## Summary

✅ **Fixed:** New parcels get correct QR format
✅ **Added:** API endpoint to regenerate QR codes
✅ **Created:** Migration script for bulk updates
✅ **Provided:** SQL script for quick fixes

**Recommended approach:**

1. Run the Node.js migration script once: `node migrations/fix-qr-codes.js`
2. For future issues, use the regenerate API endpoint
3. All new parcels will work correctly

---

## Quick Commands

```bash
# Run migration script
cd server && node migrations/fix-qr-codes.js

# Or clear QR codes via SQL
psql -d your_database -f server/migrations/fix-qr-codes.sql

# Or regenerate single QR via API
curl -X POST http://localhost:8000/api/hub/parcels/DELIVERY_ID/regenerate-qr \
  -H "Authorization: Bearer TOKEN"
```
