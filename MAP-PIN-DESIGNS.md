# Custom Map Pin Designs

## Overview

The tracking map now features custom pin designs that make it easy to identify different locations and vehicle types at a glance.

## Pin Types

### 1. Hub Markers 🏢

#### Origin Hub (Blue)

```
Color: #6366f1 (Indigo Blue)
Icon: 🏢 (Office Building)
Size: 36x36px
Purpose: Shows where the parcel journey started
```

#### Destination Hub (Purple)

```
Color: #8b5cf6 (Purple)
Icon: 🏢 (Office Building)
Size: 36x36px
Purpose: Shows the hub where parcel is being delivered
```

**Visual Design:**

- Circular background with building emoji
- White border (3px)
- Drop shadow for depth
- Triangular pointer at bottom

### 2. Customer Address Marker 🏠

```
Color: #ef4444 (Red)
Icon: 🏠 (House)
Size: 36x36px
Purpose: Shows customer's delivery address
```

**Visual Design:**

- Circular background with house emoji
- White border (3px)
- Drop shadow for depth
- Triangular pointer at bottom
- Stands out clearly as final destination

### 3. Driver/Vehicle Markers (Dynamic)

The driver marker changes based on vehicle type:

#### Truck/Van 🚚

```
Color: #3b82f6 (Blue)
Icon: 🚚 (Delivery Truck)
Size: 40x40px
Vehicle Types: "truck", "van"
Purpose: Hub-to-hub transfers, large deliveries
```

#### Motorcycle 🏍️

```
Color: #10b981 (Green)
Icon: 🏍️ (Motorcycle)
Size: 40x40px
Vehicle Types: "motorcycle", "motor", "bike"
Purpose: Fast last-mile delivery
```

#### Bicycle 🚲

```
Color: #8b5cf6 (Purple)
Icon: 🚲 (Bicycle)
Size: 40x40px
Vehicle Types: "bicycle"
Purpose: Eco-friendly short-distance delivery
```

#### Default Car 🚗

```
Color: #ff6b35 (Orange)
Icon: 🚗 (Car)
Size: 40x40px
Vehicle Types: Any other or unspecified
Purpose: Standard delivery vehicle
```

**Visual Design:**

- Larger than location markers (40x40px)
- Animated pulse effect (scales 1.0 → 1.1 → 1.0)
- White border (3px)
- Strong drop shadow
- Triangular pointer at bottom
- Updates position every 15 seconds

## Visual Hierarchy

### Size Comparison

```
Driver Marker:    40x40px (Largest - most important)
Hub Markers:      36x36px (Medium)
Customer Marker:  36x36px (Medium)
```

### Color Coding

```
🚚 Blue Truck     → Heavy cargo, hub-to-hub
🏍️ Green Bike     → Fast delivery, agile
🚲 Purple Bicycle → Eco-friendly, local
🚗 Orange Car     → Standard delivery
🏢 Blue Hub       → Origin point
🏢 Purple Hub     → Destination hub
🏠 Red House      → Customer address
```

## Animation Effects

### Driver Marker Pulse

```css
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
```

- Duration: 2 seconds
- Infinite loop
- Draws attention to moving vehicle
- Indicates active delivery

### Marker Shadows

- All markers have drop shadows
- Creates depth and 3D effect
- Makes markers stand out from map
- Improves visibility

## Implementation Details

### Vehicle Type Detection

```typescript
if (type.includes("truck") || type.includes("van")) {
  vehicleIcon = "🚚";
  vehicleColor = "#3b82f6";
} else if (type.includes("motorcycle") || type.includes("motor")) {
  vehicleIcon = "🏍️";
  vehicleColor = "#10b981";
} else if (type.includes("bicycle")) {
  vehicleIcon = "🚲";
  vehicleColor = "#8b5cf6";
} else {
  vehicleIcon = "🚗";
  vehicleColor = "#ff6b35";
}
```

### Marker Structure

```html
<div
  style="position: relative; display: flex; flex-direction: column; align-items: center;"
>
  <!-- Circular icon container -->
  <div style="background: color; border-radius: 50%; border: 3px solid white;">
    emoji
  </div>
  <!-- Triangular pointer -->
  <div
    style="border-left: transparent; border-right: transparent; border-top: color;"
  ></div>
</div>
```

## User Experience Benefits

### 1. Quick Identification

- Users instantly recognize vehicle type
- No need to read labels
- Color coding provides context

### 2. Visual Clarity

- Different sizes show importance
- Driver marker is largest (most dynamic)
- Location markers are consistent

### 3. Professional Appearance

- Modern emoji icons
- Smooth animations
- Consistent design language

### 4. Accessibility

- High contrast colors
- Clear visual hierarchy
- Recognizable symbols

## Map Legend (Auto-Generated)

The map automatically shows relevant markers:

### Hub-to-Hub Transfer

```
🏢 Origin Hub (Blue)
🚚 Transfer Driver (Blue/Green/Purple/Orange)
🏢 Destination Hub (Purple)
```

### Last-Mile Delivery

```
🏢 Hub (Purple)
🏍️ Delivery Rider (Green/Purple/Orange)
🏠 Your Address (Red)
```

## Examples by Scenario

### Scenario 1: Truck Delivery (Hub-to-Hub)

```
Map Display:
🏢 Manila Hub (Blue)
    ↓
🚚 Truck Driver (Blue, animated)
    ↓
🏢 Batangas Hub (Purple)

Route: Blue line from truck to destination
```

### Scenario 2: Motorcycle Delivery (Last-Mile)

```
Map Display:
🏢 Local Hub (Purple)
    ↓
🏍️ Motorcycle Rider (Green, animated)
    ↓
🏠 Customer Home (Red)

Route: Orange line from bike to home
```

### Scenario 3: Bicycle Delivery (Eco)

```
Map Display:
🏢 Nearby Hub (Purple)
    ↓
🚲 Bicycle Courier (Purple, animated)
    ↓
🏠 Customer Home (Red)

Route: Orange line from bike to home
```

## Mobile Responsiveness

All markers scale appropriately on mobile:

- Touch-friendly size (minimum 40x40px)
- Clear visibility on small screens
- Popup information on tap
- Smooth animations

## Future Enhancements

### Potential Additions

1. **Direction Arrow**: Show which way vehicle is heading
2. **Speed Indicator**: Color intensity based on speed
3. **Battery Level**: For electric vehicles
4. **Traffic Status**: Change color based on traffic
5. **Weather Icons**: Show weather conditions
6. **Custom Photos**: Driver profile pictures
7. **3D Markers**: Elevated pins for better visibility
8. **Clustering**: Group nearby markers when zoomed out

### Advanced Features

1. **Trail Effect**: Show path driver has taken
2. **Predicted Path**: Show expected route ahead
3. **Waypoint Markers**: Show intermediate stops
4. **Time Markers**: Show when driver passed locations
5. **Geofence Circles**: Show delivery zones

## Technical Notes

### Emoji Support

- Uses Unicode emojis (universal support)
- Fallback to text if emojis not supported
- Consistent across all platforms

### Performance

- Lightweight SVG-based markers
- Minimal DOM elements
- Efficient re-rendering
- Smooth animations

### Browser Compatibility

- Works on all modern browsers
- Graceful degradation on older browsers
- Mobile-optimized

## Summary

The custom pin design system provides:

- ✅ Clear visual identification of locations
- ✅ Vehicle type recognition at a glance
- ✅ Professional, modern appearance
- ✅ Animated driver marker for attention
- ✅ Color-coded for quick understanding
- ✅ Consistent design language
- ✅ Mobile-friendly sizes
- ✅ Accessible and intuitive

This creates a polished, easy-to-understand tracking experience that customers will appreciate!
