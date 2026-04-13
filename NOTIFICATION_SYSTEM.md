# Notification System

## Overview

A comprehensive notification system that alerts users about order status changes in real-time.

## Features

### Backend

- **Notification Model**: Stores all user notifications with order references
- **Notification Service**: Utility functions to create and send notifications
- **Automatic Notifications**: Triggered on all order status changes
- **REST API**: Full CRUD operations for notifications

### Frontend

- **Notification Bell**: Real-time notification indicator in navbar
- **Unread Count Badge**: Shows number of unread notifications
- **Dropdown Panel**: View recent notifications without leaving the page
- **Auto-refresh**: Polls for new notifications every 30 seconds
- **Mark as Read**: Individual or bulk mark as read
- **Clear Read**: Remove all read notifications

## Notification Types

### Order Status Notifications

- `order_placed` - Order successfully placed
- `order_confirmed` - Order confirmed by seller
- `order_processing` - Order is being processed
- `order_shipped` - Order has been shipped
- `order_delivered` - Order delivered to customer
- `order_cancelled` - Order cancelled
- `order_failed` - Order failed

### Delivery Status Notifications

- `delivery_assigned` - Driver assigned to delivery
- `delivery_picked_up` - Order picked up by driver
- `delivery_in_transit` - Order in transit
- `delivery_out_for_delivery` - Out for final delivery
- `delivery_at_hub` - Order arrived at hub

### Payment Notifications

- `payment_success` - Payment successful
- `payment_failed` - Payment failed
- `refund_processed` - Refund processed

## API Endpoints

### Get Notifications

```
GET /api/notifications
Query params: limit, offset, unreadOnly
```

### Get Unread Count

```
GET /api/notifications/unread-count
```

### Mark as Read

```
PUT /api/notifications/:id/read
```

### Mark All as Read

```
PUT /api/notifications/read-all
```

### Delete Notification

```
DELETE /api/notifications/:id
```

### Delete All Read

```
DELETE /api/notifications/read/all
```

## Database Migration

Run the migration to create the notifications table:

```bash
cd server
node migrations/20260413000001-create-notifications.js
```

Or if using Sequelize CLI:

```bash
npx sequelize-cli db:migrate
```

## Usage

### Backend - Sending Notifications

```javascript
const { sendOrderNotification } = require("../utils/notification");

// Send notification when order status changes
await sendOrderNotification(
  userId, // User ID
  orderId, // Order ID
  "order_shipped", // Notification type
  orderNumber, // Order number
  {
    // Additional data (optional)
    trackingNumber: "TRK-123",
    hubName: "Central Hub",
  },
);
```

### Frontend - Using Notification Service

```typescript
import { NotificationService } from './services/notification.service';

constructor(private notificationService: NotificationService) {}

// Get notifications
this.notificationService.getNotifications(20, 0, false).subscribe(res => {
  console.log(res.data);
});

// Get unread count
this.notificationService.getUnreadCount().subscribe(res => {
  console.log(res.data.count);
});

// Mark as read
this.notificationService.markAsRead(notificationId).subscribe();

// Access reactive signals
const unreadCount = this.notificationService.unreadCount();
const notifications = this.notificationService.notifications();
```

## Notification Bell Component

The notification bell is automatically included in the navbar for authenticated users. It shows:

- Bell icon with unread count badge
- Dropdown with recent notifications
- Click notification to mark as read and navigate to orders
- Mark all as read button
- Clear read notifications button

## Automatic Triggers

Notifications are automatically sent when:

1. Order is placed
2. Order status is updated (confirmed, processing, shipped, delivered, cancelled)
3. Delivery is assigned to a driver
4. Delivery status changes (picked up, in transit, out for delivery, at hub)
5. Payment status changes

## Customization

### Adding New Notification Types

1. Add type to `notification.model.js` validation
2. Add template to `notification.js` utility
3. Add icon mapping in `notification-bell.component.ts`
4. Trigger notification in appropriate controller

### Styling

Notification bell styles can be customized in `notification-bell.component.ts` styles section.

## Testing

1. Place an order
2. Update order status as seller
3. Assign delivery as admin
4. Update delivery status as driver
5. Check notification bell for updates

## Notes

- Notifications are user-specific and secure
- Old notifications can be manually cleared
- System automatically marks notifications as read when clicked
- Polling interval can be adjusted in `notification.service.ts`
