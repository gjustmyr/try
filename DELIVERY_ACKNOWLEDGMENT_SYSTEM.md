# Delivery Acknowledgment System

## Overview

Customers must acknowledge they received their delivery. If they don't acknowledge within 7 days, the system automatically confirms the delivery.

---

## How It Works

### 1. Driver Delivers Parcel

- Driver scans QR code
- System marks delivery as `delivered`
- Sets `deliveredAt` timestamp
- Driver is freed up for next delivery

### 2. Customer Acknowledgment (Within 7 Days)

- Customer receives notification
- Customer clicks "Confirm Delivery" button
- System sets `customerAcknowledgedAt` timestamp
- Delivery is fully confirmed

### 3. Auto-Confirmation (After 7 Days)

- If customer doesn't acknowledge within 7 days
- Automated job runs daily
- System sets `autoConfirmedAt` timestamp
- Delivery is automatically confirmed

---

## Database Changes

### New Fields in `deliveries` Table

```sql
customer_acknowledged_at TIMESTAMP  -- When customer confirmed receipt
auto_confirmed_at TIMESTAMP         -- When system auto-confirmed after 7 days
```

### Migration

Run this SQL to add the fields:

```bash
psql -d your_database -f server/migrations/add-delivery-acknowledgment.sql
```

Or manually:

```sql
ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS customer_acknowledged_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS auto_confirmed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_deliveries_delivered_at
ON deliveries(delivered_at)
WHERE delivered_at IS NOT NULL
  AND customer_acknowledged_at IS NULL
  AND auto_confirmed_at IS NULL;
```

---

## API Endpoints

### 1. Customer Acknowledges Delivery

```http
POST /api/orders/:orderId/acknowledge
Authorization: Bearer <customer_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Thank you for confirming delivery!",
  "data": {
    "orderId": "abc-123",
    "acknowledgedAt": "2026-04-11T10:30:00Z"
  }
}
```

**Errors:**

- 404: Order not found
- 400: Delivery not marked as delivered yet
- 400: Already acknowledged

### 2. Auto-Confirm Deliveries (Admin/System)

```http
POST /api/orders/auto-confirm
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Auto-confirmed 5 deliveries",
  "data": {
    "total": 5,
    "confirmed": 5
  }
}
```

---

## Automated Job

### Manual Run

```bash
cd server
node jobs/auto-confirm-deliveries.js
```

**Output:**

```
Starting auto-confirm deliveries job...
Current time: 2026-04-11T10:00:00.000Z
Looking for deliveries delivered before: 2026-04-04T10:00:00.000Z
Found 3 deliveries to auto-confirm
Auto-confirming delivery abc-123 (tracking: TRK-XYZ789, delivered: 2026-04-03T...)
✓ Confirmed delivery abc-123
...

=== Auto-Confirm Complete ===
Total found: 3
Confirmed: 3
Errors: 0
```

### Set Up Cron Job (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * cd /path/to/server && node jobs/auto-confirm-deliveries.js >> logs/auto-confirm.log 2>&1
```

### Set Up Task Scheduler (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Auto-Confirm Deliveries"
4. Trigger: Daily at 2:00 AM
5. Action: Start a program
   - Program: `node`
   - Arguments: `jobs/auto-confirm-deliveries.js`
   - Start in: `C:\path\to\server`

### Using node-cron (In-App)

Add to `server/server.js`:

```javascript
const cron = require("node-cron");

// Run auto-confirm job daily at 2 AM
cron.schedule("0 2 * * *", async () => {
  console.log("Running auto-confirm deliveries job...");
  try {
    const response = await fetch(
      "http://localhost:8000/api/orders/auto-confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
        },
      },
    );
    const result = await response.json();
    console.log("Auto-confirm result:", result);
  } catch (error) {
    console.error("Auto-confirm job failed:", error);
  }
});
```

Install node-cron:

```bash
npm install node-cron
```

---

## Frontend Implementation

### Customer Order Tracking Page

Add "Confirm Delivery" button:

```typescript
// In order-tracking.component.ts
acknowledgeDelivery(orderId: string) {
  const token = localStorage.getItem('token');
  fetch(`http://localhost:8000/api/orders/${orderId}/acknowledge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(res => {
    if (res.success) {
      alert('Thank you for confirming delivery!');
      this.loadOrderDetails(); // Refresh
    } else {
      alert(res.message);
    }
  });
}
```

```html
<!-- In order-tracking.component.html -->
<div
  *ngIf="order.status === 'delivered' && !delivery.customerAcknowledgedAt && !delivery.autoConfirmedAt"
>
  <button class="confirm-btn" (click)="acknowledgeDelivery(order.id)">
    <i class="pi pi-check"></i> Confirm I Received This
  </button>
  <p class="note">
    Please confirm you received your order. If not confirmed within 7 days, it
    will be automatically confirmed.
  </p>
</div>

<div *ngIf="delivery.customerAcknowledgedAt">
  <div class="confirmed-badge">
    <i class="pi pi-check-circle"></i>
    Confirmed by you on {{ delivery.customerAcknowledgedAt | date }}
  </div>
</div>

<div *ngIf="delivery.autoConfirmedAt">
  <div class="auto-confirmed-badge">
    <i class="pi pi-clock"></i>
    Auto-confirmed on {{ delivery.autoConfirmedAt | date }}
  </div>
</div>
```

---

## Delivery States

| State                                  | Description                            | Customer Action | Auto-Confirm |
| -------------------------------------- | -------------------------------------- | --------------- | ------------ |
| `delivered` + no acknowledgment        | Driver delivered, waiting for customer | Can confirm     | After 7 days |
| `delivered` + `customerAcknowledgedAt` | Customer confirmed receipt             | Done ✓          | Not needed   |
| `delivered` + `autoConfirmedAt`        | System auto-confirmed after 7 days     | Too late        | Done ✓       |

---

## Queries

### Find Deliveries Needing Acknowledgment

```sql
SELECT
  d.id,
  d.tracking_number,
  d.delivered_at,
  o.order_number,
  u.full_name as customer_name,
  EXTRACT(DAY FROM (NOW() - d.delivered_at)) as days_since_delivery
FROM deliveries d
JOIN orders o ON d.order_id = o.id
JOIN users u ON o.user_id = u.id
WHERE d.status = 'delivered'
  AND d.customer_acknowledged_at IS NULL
  AND d.auto_confirmed_at IS NULL
ORDER BY d.delivered_at ASC;
```

### Find Deliveries Ready for Auto-Confirm

```sql
SELECT
  d.id,
  d.tracking_number,
  d.delivered_at,
  EXTRACT(DAY FROM (NOW() - d.delivered_at)) as days_since_delivery
FROM deliveries d
WHERE d.status = 'delivered'
  AND d.delivered_at <= NOW() - INTERVAL '7 days'
  AND d.customer_acknowledged_at IS NULL
  AND d.auto_confirmed_at IS NULL;
```

### Statistics

```sql
SELECT
  COUNT(*) FILTER (WHERE customer_acknowledged_at IS NOT NULL) as customer_confirmed,
  COUNT(*) FILTER (WHERE auto_confirmed_at IS NOT NULL) as auto_confirmed,
  COUNT(*) FILTER (WHERE customer_acknowledged_at IS NULL AND auto_confirmed_at IS NULL) as pending,
  COUNT(*) as total_delivered
FROM deliveries
WHERE status = 'delivered';
```

---

## Benefits

1. **Customer Verification**
   - Customers confirm they received the order
   - Reduces disputes about delivery

2. **Automatic Fallback**
   - System doesn't wait forever
   - Auto-confirms after 7 days
   - Keeps orders moving

3. **Audit Trail**
   - Track who confirmed (customer vs system)
   - Know exactly when confirmation happened
   - Useful for disputes

4. **Driver Protection**
   - Driver marks delivered immediately
   - Not responsible for customer acknowledgment
   - Can move to next delivery

---

## Testing

### Test Customer Acknowledgment

```bash
# 1. Create and deliver an order
# 2. Get order ID
# 3. Acknowledge as customer

curl -X POST http://localhost:8000/api/orders/ORDER_ID/acknowledge \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

### Test Auto-Confirmation

```bash
# 1. Manually set delivered_at to 8 days ago
UPDATE deliveries
SET delivered_at = NOW() - INTERVAL '8 days'
WHERE id = 'DELIVERY_ID';

# 2. Run auto-confirm job
node jobs/auto-confirm-deliveries.js

# 3. Check auto_confirmed_at is set
SELECT auto_confirmed_at FROM deliveries WHERE id = 'DELIVERY_ID';
```

---

## Notifications (Optional Enhancement)

### Email Reminder (Day 5)

Send email to customer:

- "Please confirm you received your order"
- "Auto-confirms in 2 days"
- Include "Confirm Delivery" button/link

### SMS Reminder (Day 6)

Send SMS:

- "Your order will be auto-confirmed tomorrow"
- "Confirm now: [link]"

---

## Summary

✅ **Driver delivers** → Sets `deliveredAt`
✅ **Customer confirms** → Sets `customerAcknowledgedAt`
✅ **7 days pass** → System sets `autoConfirmedAt`
✅ **Automated job** → Runs daily to auto-confirm
✅ **Audit trail** → Know who confirmed and when

This system ensures deliveries are properly confirmed while not requiring indefinite customer action.
