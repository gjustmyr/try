# Debug Hub Search Issue

## Problem

Order shows as "processing" but hub search returns "No processing orders found"

## Order Details from Screenshot

- Order Number: `MS-MNTQ32IPA8BM`
- Status: `Processing`
- Total: ₱246,246.00
- Customer: Justmyr Dimasacat Gutierrez

## Debugging Steps

### 1. Check Server Console

When you search for the order, check your server console (where you ran `npm start`). You should see:

```
Searching for orders with query: MS-MNTQ32IPA8BM
Found X processing orders
Y orders available (without existing delivery)
```

### 2. Check Database Directly

Run these SQL queries in your PostgreSQL database:

```sql
-- Check if order exists and its status
SELECT id, order_number, status, created_at
FROM orders
WHERE order_number LIKE '%MS-MNTQ32IPA8BM%';

-- Check if there's already a delivery for this order
SELECT d.id, d.order_id, d.status, d.tracking_number
FROM deliveries d
JOIN orders o ON d.order_id = o.id
WHERE o.order_number = 'MS-MNTQ32IPA8BM';

-- Check all processing orders
SELECT order_number, status, created_at
FROM orders
WHERE status = 'processing'
ORDER BY created_at DESC
LIMIT 10;
```

### 3. Common Issues & Solutions

#### Issue 1: Order already has a delivery

**Symptom:** Order found but filtered out
**Solution:** Check if delivery already exists for this order

```sql
SELECT * FROM deliveries WHERE order_id = (
  SELECT id FROM orders WHERE order_number = 'MS-MNTQ32IPA8BM'
);
```

If delivery exists, delete it to retry:

```sql
DELETE FROM deliveries WHERE order_id = (
  SELECT id FROM orders WHERE order_number = 'MS-MNTQ32IPA8BM'
);
```

#### Issue 2: Order status is not "processing"

**Symptom:** No orders found
**Check current status:**

```sql
SELECT status FROM orders WHERE order_number = 'MS-MNTQ32IPA8BM';
```

**Fix if needed:**

```sql
UPDATE orders
SET status = 'processing'
WHERE order_number = 'MS-MNTQ32IPA8BM';
```

#### Issue 3: Case sensitivity issue

**Symptom:** Search not matching
**Solution:** Already using `iLike` which is case-insensitive, but verify:

```sql
-- Test case-insensitive search
SELECT order_number
FROM orders
WHERE order_number ILIKE '%mntq32ipa8bm%';
```

#### Issue 4: Order doesn't have required associations

**Symptom:** Order found but error loading
**Check associations:**

```sql
-- Check if order has user
SELECT o.order_number, o.user_id, u.full_name
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE o.order_number = 'MS-MNTQ32IPA8BM';

-- Check if order has address
SELECT o.order_number, o.address_id, a.street_address
FROM orders o
LEFT JOIN addresses a ON o.address_id = a.id
WHERE o.order_number = 'MS-MNTQ32IPA8BM';

-- Check if order has items
SELECT o.order_number, oi.id as item_id, oi.seller_id
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_number = 'MS-MNTQ32IPA8BM';
```

### 4. Quick Fix Script

If you need to reset this order for testing:

```sql
-- Reset order to processing and remove any delivery
BEGIN;

-- Remove existing delivery if any
DELETE FROM deliveries
WHERE order_id = (SELECT id FROM orders WHERE order_number = 'MS-MNTQ32IPA8BM');

-- Set order back to processing
UPDATE orders
SET status = 'processing',
    tracking_number = NULL,
    estimated_delivery = NULL
WHERE order_number = 'MS-MNTQ32IPA8BM';

COMMIT;
```

### 5. Test the Search Endpoint Directly

Use curl or Postman to test:

```bash
# Get your auth token from localStorage
# Then test the endpoint

curl -X GET \
  'http://localhost:8000/api/hub/orders/search?q=MS-MNTQ32IPA8BM' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

Expected response:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "orderNumber": "MS-MNTQ32IPA8BM",
      "status": "processing",
      "total": "246246.00",
      "user": { ... },
      "address": { ... },
      "items": [ ... ]
    }
  ]
}
```

### 6. Check Frontend Console

Open browser DevTools (F12) → Console tab
Look for any errors when searching

### 7. Network Tab Check

Open browser DevTools (F12) → Network tab

1. Search for the order
2. Look for request to `/api/hub/orders/search`
3. Check:
   - Request URL (should include `?q=MS-MNTQ32IPA8BM`)
   - Response status (should be 200)
   - Response body (should show the order or empty array)

## Most Likely Causes

Based on the code, the most likely issues are:

1. **Order already has a delivery** - The search filters out orders that already have a delivery record
2. **Order status changed** - Order might have been moved from "processing" to another status
3. **Database connection issue** - Check if server is connected to the correct database

## Next Steps

1. Check server console logs when searching
2. Run the SQL queries above to verify order status
3. If order has a delivery, delete it and try again
4. If order status is not "processing", update it
5. Restart the server and try again

## Contact Points

If issue persists, provide:

- Server console output when searching
- Results of SQL queries above
- Browser console errors (if any)
- Network tab response for the search request
