# System Updates: Coupon Stacking & Admin Permissions

## 1. Admin Permissions - READ-ONLY for Orders & Drivers

### Changes Made

**Backend** (`server/routes/admin.routes.js`):

- Admin can now only VIEW orders and drivers (no Create/Update/Delete)
- Hub users retain full CRUD access for drivers
- Admin routes updated:
  - `GET /api/admin/drivers` - Admin & Hub can view
  - `POST /api/admin/drivers` - Only Hub can create
  - `PUT /api/admin/drivers/:driverId` - Only Hub can update
  - `DELETE /api/admin/drivers/:driverId` - Only Hub can delete
  - `GET /api/admin/deliveries` - Admin can view (read-only)
  - `GET /api/admin/orders/search` - Admin can search (read-only)

### Permission Matrix

| Resource   | Admin | Hub  | Seller     | Customer   | Driver       |
| ---------- | ----- | ---- | ---------- | ---------- | ------------ |
| Orders     | Read  | -    | Read (own) | Read (own) | -            |
| Drivers    | Read  | CRUD | -          | -          | -            |
| Deliveries | Read  | CRUD | -          | -          | Update (own) |
| Hubs       | CRUD  | -    | -          | -          | -            |
| Sellers    | CRUD  | -    | -          | -          | -            |
| Coupons    | CRUD  | -    | -          | Validate   | -            |
| Tax Config | CRUD  | -    | -          | -          | -            |

---

## 2. Coupon Stacking - 1 FSV + 1 Product Discount

### Stacking Rules

Customers can now apply **up to 2 coupons simultaneously**:

1. **1 Free Shipping Voucher (FSV)** - `discountType: 'free_shipping'`
2. **1 Product Discount** - `discountType: 'percentage'` OR `'fixed'`

### Backend Implementation

**File**: `server/controllers/order.controller.js`

```javascript
// Support both single code (string) or multiple codes (array)
const couponCodes = Array.isArray(couponCode) ? couponCode : [couponCode];

// Separate coupons by type
let freeShippingCoupon = null;
let productDiscountCoupon = null;

// Validate and categorize each coupon
// Apply free shipping coupon
// Apply product discount coupon
// Store both in validatedCoupons array
```

**Key Changes**:

- `couponCode` parameter now accepts string OR array
- Validates each coupon independently
- Enforces stacking limits (max 1 per type)
- Stores multiple coupon codes in Order: `couponCode: 'CODE1, CODE2'`
- Records usage for all applied coupons in `CouponUsage` table

### Frontend Implementation

**File**: `client/src/app/pages/checkout.component.ts`

**State Management**:

```typescript
appliedCoupons: any[] = []; // Changed from single to array
```

**Stacking Validation**:

```typescript
applyCoupon() {
  // Check if already at limit
  const hasShipping = this.appliedCoupons.some(c => c.coupon.discountType === 'free_shipping');
  const hasDiscount = this.appliedCoupons.some(c => c.coupon.discountType === 'percentage' || c.coupon.discountType === 'fixed');

  // Prevent duplicate types
  if (couponType === 'free_shipping' && hasShipping) {
    this.couponError = 'You can only use one free shipping voucher';
    return;
  }

  // Add to array if valid
  this.appliedCoupons.push(data.data);
}
```

**Discount Calculation**:

```typescript
get discountAmount(): number {
  const discountCoupon = this.appliedCoupons.find(
    c => c.coupon.discountType === 'percentage' || c.coupon.discountType === 'fixed'
  );
  return discountCoupon?.discountAmount || 0;
}

get shippingDiscount(): number {
  const shippingCoupon = this.appliedCoupons.find(
    c => c.coupon.discountType === 'free_shipping'
  );
  return shippingCoupon?.shippingDiscount || 0;
}
```

**Order Submission**:

```typescript
placeOrder() {
  const couponCodes = this.appliedCoupons.map(c => c.coupon.code);

  this.orderService.placeOrder({
    addressId: this.selectedAddressId,
    cartItemIds,
    couponCode: couponCodes.length > 0 ? couponCodes : undefined,
  })
}
```

### UI/UX Changes

**Coupon Display**:

- Shows all applied coupons in a list
- Each coupon has its own badge with icon:
  - 🔢 Percentage discount
  - 💵 Fixed amount discount
  - 🚚 Free shipping
- Individual remove button for each coupon
- Counter: "2 coupon(s) applied"

**Input Behavior**:

- Coupon input hidden when 2 coupons are applied
- "or enter code" divider hidden when at limit
- Clear error messages for stacking violations

**Voucher Modal**:

- Prevents selecting duplicate types
- Shows alert if trying to add second FSV or second discount

---

## 3. Example Scenarios

### Scenario 1: FSV + Percentage Discount

```
Subtotal:        ₱1,000.00
Discount (10%):  ₱  100.00  ← From SAVE10 coupon
Shipping:        ₱    0.00  ← From FREESHIP coupon (was ₱50)
─────────────────────────────
Total:           ₱  900.00

Applied Coupons: SAVE10, FREESHIP
```

### Scenario 2: FSV + Fixed Discount

```
Subtotal:        ₱1,500.00
Discount:        ₱  200.00  ← From FLAT200 coupon
Shipping:        ₱    0.00  ← From FREESHIP coupon (was ₱50)
─────────────────────────────
Total:           ₱1,300.00

Applied Coupons: FLAT200, FREESHIP
```

### Scenario 3: Only Product Discount

```
Subtotal:        ₱800.00
Discount (15%):  ₱120.00  ← From MEGA15 coupon
Shipping:        ₱ 50.00
─────────────────────────────
Total:           ₱730.00

Applied Coupons: MEGA15
```

---

## 4. Database Schema

### Order Model

```javascript
{
  couponCode: STRING,  // Stores: "CODE1, CODE2" for multiple coupons
  discountAmount: DECIMAL,  // Total product discount
  shippingDiscount: DECIMAL,  // Shipping discount amount
  // ... other fields
}
```

### CouponUsage Model

```javascript
{
  couponId: INTEGER,
  userId: INTEGER,
  orderId: INTEGER,
  discountAmount: DECIMAL,  // Amount saved from this specific coupon
  // ... timestamps
}
```

---

## 5. API Changes

### POST /api/orders

**Request Body**:

```json
{
  "addressId": "123",
  "cartItemIds": ["1", "2", "3"],
  "couponCode": ["SAVE10", "FREESHIP"], // Now accepts array
  "notes": "Optional notes"
}
```

**Backward Compatible**: Still accepts single string for `couponCode`

---

## 6. Testing Checklist

- [ ] Admin can view but not edit/delete drivers
- [ ] Hub can fully manage drivers
- [ ] Customer can apply 1 FSV + 1 discount coupon
- [ ] Customer cannot apply 2 FSV coupons
- [ ] Customer cannot apply 2 discount coupons
- [ ] Both coupons are recorded in order
- [ ] Both coupons increment usage count
- [ ] Coupon usage limits are respected for each coupon
- [ ] Order total correctly reflects both discounts
- [ ] UI shows all applied coupons with correct icons
- [ ] Removing one coupon keeps the other applied

---

## 7. Benefits

### For Customers

- More savings by combining vouchers
- Flexibility in choosing discounts
- Clear visual feedback on applied coupons
- Matches expectations from Shopee/Lazada

### For Business

- Increased conversion rates
- Better promotional flexibility
- Controlled stacking (max 2 coupons)
- Complete audit trail for all coupon usage

### For Admins

- Read-only access prevents accidental changes
- Hub managers handle their own drivers
- Clear separation of responsibilities
- Better security and accountability
