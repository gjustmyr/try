# Tax Calculation - Philippines Implementation

## How Tax Works in the Philippines

In the Philippines, retail prices are **VAT-INCLUSIVE** - the tax is already included in the displayed price. Customers see the final price without a separate tax line item.

### Standard VAT Rate

- **12%** is the standard VAT rate in the Philippines

## Implementation in MultiShop

### Customer View (VAT-Inclusive)

Customers see prices with tax already included. No separate tax line is shown.

### Formula

```
Subtotal = Sum of (Product Price × Quantity) [VAT already included]
Tax Amount = Subtotal - (Subtotal / (1 + Tax Rate / 100)) [extracted for reporting]
Discount = Based on coupon type
Final Shipping = Shipping Fee - Shipping Discount
Total = Subtotal - Discount + Final Shipping
```

### Example Calculation (Customer View)

```
Subtotal:        ₱1,000.00  (includes ₱107.14 VAT)
Discount (10%):  ₱  100.00
Shipping:        ₱   50.00
─────────────────────────────
Total:           ₱  950.00
```

### Tax Breakdown (Seller/Admin View Only)

```
Subtotal:        ₱1,000.00
  └─ Net Amount: ₱  892.86
  └─ VAT (12%):  ₱  107.14  ← Extracted for reporting
Discount:        ₱  100.00
Shipping:        ₱   50.00
─────────────────────────────
Total:           ₱  950.00
```

### VAT Extraction Formula

To extract VAT from a VAT-inclusive price:

```
VAT Amount = Price - (Price / 1.12)

Example with ₱1,000:
VAT = 1000 - (1000 / 1.12)
VAT = 1000 - 892.86
VAT = ₱107.14
```

## Code Implementation

### Backend (server/controllers/order.controller.js)

```javascript
// Extract tax from VAT-inclusive subtotal
const taxRate = taxConfig ? parseFloat(taxConfig.rate) : 0;
const taxAmount = taxRate > 0 ? subtotal - subtotal / (1 + taxRate / 100) : 0;

// Calculate final total (subtotal already includes tax)
const total = subtotal - discountAmount + finalShippingFee;
```

### Frontend (client/src/app/pages/checkout.component.ts)

```typescript
get taxAmount(): number {
  if (!this.taxConfig || !this.taxConfig.rate) return 0;
  // Extract tax from subtotal (VAT-inclusive)
  return this.subtotal - (this.subtotal / (1 + this.taxConfig.rate / 100));
}

get total(): number {
  // Subtotal already includes tax
  return this.subtotal - this.discountAmount + this.finalShippingFee;
}
```

### Display in Checkout (Customer View)

```html
<div class="summary-row">
  <span>Subtotal</span>
  <span>₱{{ subtotal | number: '1.2-2' }}</span>
</div>

<!-- Tax line is HIDDEN from customers -->

<div class="summary-row">
  <span>Shipping Fee</span>
  <span>₱{{ finalShippingFee | number: '1.2-2' }}</span>
</div>

<div class="summary-row total">
  <span>Total</span>
  <span>₱{{ total | number: '1.2-2' }}</span>
</div>
```

## Admin Configuration

Admins can configure tax settings in the Admin Dashboard:

- Tax Type: VAT, Sales Tax, GST
- Tax Rate: Percentage (e.g., 12 for 12%)
- Region: Optional (for region-specific rates)
- Active/Inactive status

## Key Points

1. ✅ Tax is **included in** the subtotal (VAT-inclusive pricing)
2. ✅ Tax is **extracted** from subtotal for accounting purposes
3. ✅ Customers **do not see** a separate tax line
4. ✅ Sellers and admins can see tax breakdown in reports
5. ✅ Follows Philippine retail standards (Shopee, Lazada, SM, etc.)
6. ✅ Formula: `VAT = Price - (Price / 1.12)` for 12% VAT

## Why VAT-Inclusive?

In the Philippines:

- Retail prices must include VAT by law
- Customers expect to pay the displayed price
- Tax is transparent to the consumer
- Businesses extract VAT for BIR reporting
- This matches how Shopee, Lazada, and physical stores operate

## Database Storage

The Order model stores:

- `subtotal`: Sum of product prices (VAT-inclusive)
- `taxAmount`: Extracted VAT amount (for reporting)
- `taxRate`: Tax rate used (for record keeping)
- `discountAmount`: Total discount applied
- `shippingFee`: Final shipping fee (after shipping discount)
- `shippingDiscount`: Shipping discount from coupon
- `total`: Final amount to be paid

This ensures complete transparency and audit trail for all transactions while keeping the customer experience simple and familiar.
