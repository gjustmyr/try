# Hub Account Setup Guide

## Overview

Hub accounts allow delivery hub staff to manage parcel operations independently from the admin panel. Each hub has its own login credentials and can only access their hub's data.

## How to Create a Hub Account

### Step 1: Run Database Migration

First, update your database to support hub user types:

```bash
# Connect to your PostgreSQL database
psql -U your_username -d your_database_name

# Run the migration
\i server/migrations/add-hub-user-type.sql
```

Or manually run:

```sql
ALTER TYPE "enum_users_user_type" ADD VALUE IF NOT EXISTS 'hub';
ALTER TABLE delivery_hubs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_hubs_user_id ON delivery_hubs(user_id);
```

### Step 2: Admin Creates Hub Account

1. **Login as Admin**
   - Go to the login page
   - Login with admin credentials

2. **Navigate to Hubs Section**
   - Click "Delivery Hubs" in the admin sidebar

3. **Click "Add Hub" Button**
   - Fill in hub details:
     - Hub Name (e.g., "North Hub")
     - Address, City, Province
     - Latitude & Longitude (click on map to set)
     - Phone number
4. **Set Hub Account Credentials** (NEW!)
   - Email: The email hub staff will use to login
   - Password: Must be at least 6 characters
5. **Click "Create Hub & Account"**
   - A success message will show the login credentials
   - Save these credentials to share with hub staff

### Step 3: Hub Staff Login

1. **Go to Login Page**
   - Hub staff uses the email and password created by admin

2. **Automatic Redirect**
   - After login, hub users are automatically redirected to `/hub-dashboard`
   - They can only see and manage their own hub's parcels

## Hub Dashboard Features

Hub staff can:

- ✅ **Receive Parcels from Sellers** - Search and receive orders, generate tracking numbers
- ✅ **View All Parcels** - See all parcels at their hub
- ✅ **Dispatch to Destination Hub** - Send parcels to other hubs with transfer drivers
- ✅ **Mark Arrivals** - Confirm when parcels arrive from other hubs
- ✅ **Assign Riders** - Assign local riders for last-mile delivery

Hub staff CANNOT:

- ❌ Access admin dashboard
- ❌ See other hubs' data
- ❌ Manage sellers, drivers, or system settings

## Differences from Admin Hub Access

| Feature          | Admin              | Hub User            |
| ---------------- | ------------------ | ------------------- |
| Hub Selection    | Can select any hub | Only sees their hub |
| Create/Edit Hubs | ✅ Yes             | ❌ No               |
| Manage Drivers   | ✅ Yes             | ❌ No               |
| Receive Parcels  | ✅ Yes             | ✅ Yes              |
| Dispatch Parcels | ✅ Yes             | ✅ Yes              |
| Assign Riders    | ✅ Yes             | ✅ Yes              |

## Example Workflow

1. **Admin creates "North Hub"**
   - Email: `northhub@example.com`
   - Password: `secure123`

2. **Hub staff receives credentials**
   - Logs in at `/login`
   - Redirected to `/hub-dashboard`

3. **Hub operations**
   - Seller drops off order at North Hub
   - Hub staff searches for order and clicks "Receive Parcel"
   - System generates tracking number and QR code
   - Hub staff dispatches to destination hub
   - Destination hub receives and assigns rider
   - Rider delivers to customer

## Security Notes

- Hub accounts are auto-verified (no email verification needed)
- Passwords are hashed using bcrypt
- Hub users can only access their assigned hub's data
- Each hub can only have one user account (1:1 relationship)

## Troubleshooting

**Issue: Can't create hub - "Email already in use"**

- Solution: Use a unique email for each hub

**Issue: Hub user sees "No hub selected"**

- Solution: Ensure the hub was created with userId properly linked
- Check database: `SELECT * FROM delivery_hubs WHERE user_id IS NOT NULL;`

**Issue: Hub user redirected to home page**

- Solution: Check that user_type is 'hub' in database
- Verify hubGuard is working in routes

## API Endpoints Used

- `POST /api/admin/hubs` - Create hub with account (admin only)
- `POST /api/auth/login` - Hub staff login
- `GET /api/hub/:hubId/parcels` - Get hub parcels
- `POST /api/hub/:hubId/receive-order` - Receive parcel from seller
- `PUT /api/hub/parcels/:deliveryId/dispatch` - Dispatch to hub
- `PUT /api/hub/parcels/:deliveryId/arrive` - Mark arrival
- `PUT /api/hub/parcels/:deliveryId/assign-rider` - Assign rider
