# Hub-to-Hub Real-Time Tracking System

## Overview

Complete implementation of real-time parcel tracking for hub-to-hub transfers with driver assignment, dynamic route updates, and ETA recalculation.

## Key Features Implemented

### 1. Driver Assignment for Hub-to-Hub Transfers

- **Endpoint**: `PUT /api/hub/parcels/:deliveryId/dispatch`
- **Required**: `driverId` in request body
- Hub admin must assign a transfer driver when dispatching parcels
- Driver availability is checked before assignment
- Driver is marked as unavailable during transit

### 2. Real-Time Location Updates

- **Endpoint**: `PUT /api/driver/location`
- **Parameters**: `{ latitude, longitude }`
- Driver's location is updated continuously during transit
- Delivery record stores current location for real-time tracking
- Updates happen automatically every 15 seconds on frontend

### 3. Dynamic ETA Recalculation

- **Automatic**: Triggered on every location update
- Calculates remaining distance using Haversine formula
- Adjusts ETA based on:
  - Remaining distance to destination
  - Average speed (40 km/h for hub-to-hub, 30 km/h for last-mile)
  - Base handling time (10-15 minutes)
- Updates both delivery and order records

### 4. Dynamic Route Updates

- **Frontend**: Uses OSRM (OpenStreetMap Routing Machine)
- Route is fetched and displayed on map in real-time
- Similar to Waze/Google Maps navigation
- Shows actual road routes, not straight lines
- Updates as driver moves along the route

### 5. Driver Status Updates

- **Endpoint**: `PUT /api/driver/deliveries/:deliveryId/status`
- Driver can update status during transit
- Valid transitions for hub-to-hub:
  - `in_transit` → `arrived_at_destination_hub` (driver reports arrival)
  - `in_transit` → `failed` (delivery failed)

### 6. Hub Arrival Reporting

- **Endpoint**: `PUT /api/driver/deliveries/:deliveryId/report-arrival`
- Driver reports arrival at destination hub
- Status changes to `pending_hub_confirmation`
- Driver remains assigned until hub confirms

### 7. Destination Hub Confirmation

- **Endpoint**: `PUT /api/hub/parcels/:deliveryId/arrive`
- **Required**: `hubId` in request body
- Only destination hub can confirm parcel arrival
- Verifies the hub is the actual destination
- Frees the transfer driver upon confirmation
- Status changes to `at_destination_hub`

## Delivery Status Flow

### Hub-to-Hub Transfer Flow

```
received_at_hub
    ↓ (Hub assigns transfer driver)
in_transit
    ↓ (Driver reports arrival)
pending_hub_confirmation
    ↓ (Destination hub confirms)
at_destination_hub
    ↓ (Hub assigns last-mile rider)
out_for_delivery
    ↓ (Rider delivers)
delivered
```

## API Endpoints

### Hub Operations

- `GET /api/hub/:hubId/drivers` - Get available drivers for assignment
- `PUT /api/hub/parcels/:deliveryId/dispatch` - Dispatch with driver assignment
- `PUT /api/hub/parcels/:deliveryId/arrive` - Confirm parcel arrival (destination hub only)

### Driver Operations

- `PUT /api/driver/location` - Update current location (triggers ETA recalculation)
- `PUT /api/driver/deliveries/:deliveryId/status` - Update delivery status
- `PUT /api/driver/deliveries/:deliveryId/report-arrival` - Report arrival at hub

## Real-Time Tracking Features

### Location Tracking

- Driver location updated every 15 seconds
- Current position shown on map with animated marker
- Route line drawn from current position to destination
- Distance and ETA displayed in real-time overlay

### ETA Calculation Formula

```javascript
// Hub-to-hub transfer
avgSpeed = 40 km/h (highway speed)
baseHandling = 10 minutes
travelTime = (remainingDistance / avgSpeed) * 60 minutes
totalETA = baseHandling + travelTime

// Last-mile delivery
avgSpeed = 30 km/h (city streets)
baseHandling = 15 minutes (finding customer, handover)
travelTime = (remainingDistance / avgSpeed) * 60 minutes
totalETA = baseHandling + travelTime
```

### Route Display

- Uses OSRM API for real road routes
- Fetches route: `https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}`
- Displays route as polyline on map
- Shows route distance and estimated time
- Updates dynamically as driver moves

## Security & Authorization

### Driver Permissions

- Can only update their own assigned deliveries
- Can report arrival but cannot confirm it
- Must be authenticated with driver role

### Hub Permissions

- Can assign drivers to deliveries
- Only destination hub can confirm arrival
- Verification prevents unauthorized confirmations

## Frontend Integration

### Order Tracking Page

- Displays real-time map with driver location
- Shows route from current position to destination
- Updates every 15 seconds automatically
- Displays:
  - Current route label (Hub to Hub Transfer / Last-Mile Delivery)
  - Remaining distance
  - Dynamic ETA
  - Driver information
  - Origin and destination markers

### Driver Dashboard

- Button to report arrival at destination hub
- Real-time location sharing toggle
- Current delivery status display
- Navigation to destination

### Hub Dashboard

- List of parcels pending confirmation
- Button to confirm parcel arrival
- Driver assignment dropdown
- Real-time parcel status updates

## Database Changes

### Delivery Model

- Added status: `pending_hub_confirmation`
- Stores `currentLatitude` and `currentLongitude` for real-time tracking
- Stores `estimatedDelivery` for dynamic ETA
- Stores `distanceKm` for remaining distance

## Testing Checklist

- [ ] Hub can assign driver to hub-to-hub transfer
- [ ] Driver receives assignment notification
- [ ] Driver location updates every 15 seconds
- [ ] ETA recalculates on each location update
- [ ] Route displays correctly on map
- [ ] Driver can report arrival at destination hub
- [ ] Only destination hub can confirm arrival
- [ ] Driver is freed after hub confirmation
- [ ] Real-time tracking visible to customer
- [ ] Map shows correct route and markers

## Benefits

1. **Real-Time Visibility**: Customers can see exactly where their parcel is
2. **Accurate ETAs**: Dynamic recalculation provides realistic delivery times
3. **Accountability**: Clear chain of custody with driver and hub confirmations
4. **Efficiency**: Drivers can be reassigned quickly after hub confirmation
5. **Transparency**: All stakeholders see the same real-time information
6. **Navigation**: Drivers get turn-by-turn route guidance
7. **Monitoring**: Hubs can track all in-transit parcels in real-time

## Future Enhancements

- Push notifications when driver is nearby
- Geofencing for automatic arrival detection
- Route optimization for multiple deliveries
- Traffic-aware ETA adjustments
- Driver performance analytics
- Delivery time predictions using ML
