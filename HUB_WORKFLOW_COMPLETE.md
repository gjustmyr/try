# Complete Hub Workflow Guide

## Overview

This document describes the complete workflow for hub operations, from account creation to final delivery.

---

## Phase 1: Setup (Admin)

### 1.1 Admin Creates Hub Account

**Location:** Admin Dashboard → Delivery Hubs → Add Hub

**Steps:**

1. Login as admin
2. Click "Delivery Hubs" in sidebar
3. Click "Add Hub" button
4. Fill in hub details:
   - Hub Name (e.g., "North Hub Manila")
   - Address, City, Province
   - Latitude & Longitude (click map to pin location)
   - Phone number
   - **Email** (for hub staff login)
   - **Password** (min 6 characters)
5. Click "Create Hub & Account"
6. System creates:
   - ✅ Hub record in database
   - ✅ User account with type "hub"
   - ✅ Links hub to user account
7. Share credentials with hub staff

---

## Phase 2: Hub Staff Setup

### 2.1 Hub Staff Login

**Location:** Login Page

**Steps:**

1. Hub staff goes to login page
2. Enters email and password (provided by admin)
3. System automatically redirects to `/hub-dashboard`
4. Hub dashboard loads with their hub pre-selected

### 2.2 Hub Creates Drivers

**Location:** Hub Dashboard → Drivers → Add Driver

**Steps:**

1. Click "Drivers" in sidebar
2. Click "Add Driver" button
3. Fill in driver details:
   - **Email** (for driver login)
   - **Password** (min 6 characters)
   - Full Name
   - Phone
   - Vehicle Type (motorcycle/car/van/truck)
   - Plate Number
   - License Number
4. Click "Create Driver"
5. System creates:
   - ✅ Driver record
   - ✅ User account with type "driver"
   - ✅ Automatically assigns driver to current hub
6. Share credentials with driver

**Note:** Drivers are automatically assigned to the hub that created them.

---

## Phase 3: Parcel Operations

### 3.1 Receive Parcel from Seller (Origin Hub)

**Location:** Hub Dashboard → Receive Parcel

**Scenario:** Seller brings order to hub for shipping

**Steps:**

1. Click "Receive Parcel" in sidebar
2. Search for order by order number
3. Select the order from search results
4. Review order details
5. Click "Receive & Generate Tracking"
6. System performs:
   - ✅ Creates delivery record
   - ✅ Generates tracking number (e.g., TRK-ABC123)
   - ✅ Generates QR code for verification
   - ✅ Finds nearest destination hub to customer
   - ✅ Sets status to "received_at_hub"
   - ✅ Updates order status to "shipped"
7. Parcel now appears in "Received" tab

**Result:** Parcel is in the system and ready for dispatch

---

### 3.2 Dispatch to Destination Hub (Origin Hub)

**Location:** Hub Dashboard → Received → Dispatch to Hub

**Scenario:** Send parcel to hub nearest to customer

**Steps:**

1. Go to "Received" tab
2. Find the parcel
3. Click "Dispatch to Hub" button
4. System shows destination hub name
5. If same hub (origin = destination):
   - ✅ Automatically skips transit
   - ✅ Sets status to "at_destination_hub"
   - ✅ Ready for rider assignment
6. If different hub:
   - Select a transfer driver
   - Click "Dispatch"
   - ✅ Sets status to "in_transit"
   - ✅ Assigns transfer driver
   - ✅ Marks driver as busy
7. Parcel now appears in "In Transit" tab

**Result:** Parcel is on the way to destination hub

---

### 3.3 Receive at Destination Hub (Destination Hub)

**Location:** Hub Dashboard → In Transit → Mark Arrived

**Scenario:** Transfer driver arrives at destination hub with parcel

**Steps:**

1. Destination hub staff logs in
2. Go to "In Transit" tab
3. Find incoming parcels (where destinationHub = current hub)
4. When driver arrives, click "Mark Arrived"
5. System performs:
   - ✅ Sets status to "at_destination_hub"
   - ✅ Frees transfer driver (marks available)
   - ✅ Clears driver assignment
6. Parcel now appears in "At Destination" tab

**Result:** Parcel is at destination hub, ready for local delivery

---

### 3.4 Assign Rider for Delivery (Destination Hub)

**Location:** Hub Dashboard → At Destination → Assign Rider

**Scenario:** Assign local rider to deliver to customer

**Steps:**

1. Go to "At Destination" tab
2. Find the parcel
3. Click "Assign Rider" button
4. Select an available rider from dropdown
5. Click "Assign"
6. System performs:
   - ✅ Sets status to "out_for_delivery"
   - ✅ Assigns rider
   - ✅ Marks rider as busy
   - ✅ Calculates ETA based on distance
   - ✅ Updates order status to "out_for_delivery"
7. Parcel now appears in "Out for Delivery" tab

**Result:** Rider is delivering parcel to customer

---

### 3.5 Driver Delivers to Customer (Driver App)

**Location:** Driver Dashboard

**Steps:**

1. Driver sees assigned delivery
2. Navigates to customer address
3. Delivers parcel
4. Customer scans QR code or driver marks delivered
5. System performs:
   - ✅ Sets status to "delivered"
   - ✅ Frees rider (marks available)
   - ✅ Updates order status to "delivered"
   - ✅ Records delivery timestamp

**Result:** Parcel successfully delivered!

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN                                                        │
│ • Creates Hub Account (email + password)                    │
│ • Shares credentials with hub staff                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ HUB STAFF (Origin Hub)                                       │
│ • Logs in with credentials                                   │
│ • Creates drivers (email + password for each)               │
│ • Receives parcel from seller                               │
│   → Generates tracking number & QR code                     │
│   → Status: "received_at_hub"                               │
│ • Dispatches to destination hub                             │
│   → Assigns transfer driver                                 │
│   → Status: "in_transit"                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TRANSFER DRIVER                                              │
│ • Transports parcel between hubs                            │
│ • Delivers to destination hub                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ HUB STAFF (Destination Hub)                                  │
│ • Sees incoming parcel in "In Transit"                      │
│ • Marks parcel as arrived                                   │
│   → Frees transfer driver                                   │
│   → Status: "at_destination_hub"                            │
│ • Assigns local rider                                       │
│   → Status: "out_for_delivery"                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ LOCAL RIDER                                                  │
│ • Picks up from destination hub                             │
│ • Delivers to customer                                      │
│ • Marks as delivered                                        │
│   → Status: "delivered"                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Status Flow

```
Order Created (by customer)
    ↓
processing (seller prepares)
    ↓
received_at_hub (hub receives from seller)
    ↓
in_transit (moving to destination hub)
    ↓
at_destination_hub (arrived at destination)
    ↓
out_for_delivery (rider delivering)
    ↓
delivered (customer received)
```

---

## Hub Dashboard Tabs

| Tab                  | Purpose                     | Actions Available                   |
| -------------------- | --------------------------- | ----------------------------------- |
| **All Parcels**      | View all parcels at hub     | View details, QR codes              |
| **Receive Parcel**   | Accept from sellers         | Search orders, generate tracking    |
| **Received**         | Parcels ready to dispatch   | Dispatch to destination hub         |
| **In Transit**       | Parcels moving between hubs | Mark arrived (destination hub only) |
| **At Destination**   | Ready for local delivery    | Assign rider                        |
| **Out for Delivery** | With rider                  | View status                         |
| **Drivers**          | Manage hub drivers          | Add, edit, activate/deactivate      |

---

## Key Features

### Hub Isolation

- ✅ Hub users only see their hub's data
- ✅ Cannot access other hubs
- ✅ Cannot access admin functions
- ✅ Drivers created by hub are auto-assigned to that hub

### Automatic Hub Selection

- ✅ System finds nearest hub to customer address
- ✅ Sets as destination hub automatically
- ✅ If same hub, skips transit phase

### Driver Management

- ✅ Hub can create unlimited drivers
- ✅ Each driver gets login credentials
- ✅ Drivers auto-assigned to creating hub
- ✅ Hub can activate/deactivate drivers

### Tracking & QR Codes

- ✅ Unique tracking number per parcel
- ✅ QR code for verification
- ✅ Real-time status updates
- ✅ Customer can track via tracking number

---

## Permissions Summary

| Action          | Admin | Hub Staff | Driver |
| --------------- | ----- | --------- | ------ |
| Create hubs     | ✅    | ❌        | ❌     |
| Create drivers  | ✅    | ✅        | ❌     |
| Receive parcels | ✅    | ✅        | ❌     |
| Dispatch to hub | ✅    | ✅        | ❌     |
| Mark arrived    | ✅    | ✅        | ❌     |
| Assign rider    | ✅    | ✅        | ❌     |
| Deliver parcel  | ❌    | ❌        | ✅     |
| View all hubs   | ✅    | ❌        | ❌     |
| Manage sellers  | ✅    | ❌        | ❌     |

---

## Example Scenario

**Scenario:** Customer in Quezon City orders from seller in Manila

1. **Admin** creates "Manila Hub" and "Quezon Hub" with accounts
2. **Manila Hub Staff** logs in, creates 2 drivers
3. **Seller** brings order to Manila Hub
4. **Manila Hub Staff** receives parcel
   - System generates tracking: TRK-XYZ789
   - System sets destination: Quezon Hub (nearest to customer)
5. **Manila Hub Staff** dispatches to Quezon Hub
   - Assigns transfer driver
6. **Transfer Driver** delivers to Quezon Hub
7. **Quezon Hub Staff** marks parcel as arrived
8. **Quezon Hub Staff** assigns local rider
9. **Local Rider** delivers to customer in Quezon City
10. **Customer** receives parcel ✅

---

## Troubleshooting

**Hub staff can't create drivers**

- Check hub account has correct permissions
- Verify hub is properly linked to user account

**Parcel not showing in destination hub**

- Check destinationHubId is set correctly
- Verify hub staff is logged into correct hub

**Driver not available for assignment**

- Check driver isAvailable = true
- Check driver isActive = true
- Verify driver is assigned to correct hub

**Can't dispatch parcel**

- Ensure status is "received_at_hub"
- Check transfer driver is available
- Verify destination hub exists

---

## Database Requirements

Before using this system, run:

```sql
-- Add hub user type
ALTER TYPE "enum_users_user_type" ADD VALUE IF NOT EXISTS 'hub';

-- Link hubs to users
ALTER TABLE delivery_hubs
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_delivery_hubs_user_id
ON delivery_hubs(user_id);
```

---

## Summary

✅ **Admin** creates hub accounts
✅ **Hub staff** manages their hub independently  
✅ **Hub staff** creates and manages drivers
✅ **Hub staff** receives parcels from sellers
✅ **Hub staff** dispatches to destination hubs
✅ **Destination hub** receives and assigns riders
✅ **Riders** deliver to customers

This creates a complete, decentralized delivery network where each hub operates independently while coordinating with other hubs for inter-hub transfers.
