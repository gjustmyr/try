# Documentation vs. Actual System Validation

## CHAPTER 1 — System Overview

### 1.1 Definition of the System

| Doc Claim                                                        | Actual System                                                                                       | Match?     |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------- |
| Browse products, select items, complete purchases                | Yes — home, product-detail, cart, checkout pages                                                    | ✅         |
| Secure digital payment (credit cards, online banking, e-wallets) | **No** — COD only (`paymentMethod: ENUM("cod")`)                                                    | ❌         |
| Verifies payment                                                 | No payment verification — COD means payment is at delivery                                          | ❌         |
| Updates inventory records                                        | No stock decrement on order — Product model has `stock` field but `placeOrder` doesn't deduct it    | ❌         |
| Order status updates until delivery                              | Yes — full status flow: `pending → confirmed → processing → shipped → out_for_delivery → delivered` | ✅         |
| Product management, inventory tracking                           | Seller can CRUD products, but no real-time inventory tracking                                       | ⚠️ Partial |
| Customer data management                                         | Yes — User, Address, Order models                                                                   | ✅         |

**Key mismatch**: The doc describes credit cards, e-wallets, and payment gateways, but the system only supports **Cash on Delivery**.

---

### 1.2 System Inputs

| Input                                         | Actual System                                                                        | Match? |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ------ |
| Customer info (name, contact, email, address) | Yes — User + Address models                                                          | ✅     |
| Login credentials                             | Yes — email + password, JWT auth                                                     | ✅     |
| Cart data                                     | Yes — Cart model (userId, productId, quantity)                                       | ✅     |
| Shipping method selection                     | **No** — no shipping method choice; flat shipping fee                                | ❌     |
| Payment details (credit/debit, e-wallet, COD) | **Partial** — only COD exists                                                        | ⚠️     |
| Discounts and promo codes                     | **Yes** — full coupon/voucher system with percentage, fixed, and free shipping types | ✅     |
| Tax and pricing data                          | **Yes** — tax configuration system with VAT/Sales Tax/GST support                    | ✅     |
| Checkout confirmation                         | Yes — customer confirms order                                                        | ✅     |

---

### 1.3 System Outputs

| Output                          | Actual System                                                            | Match? |
| ------------------------------- | ------------------------------------------------------------------------ | ------ |
| Order confirmation              | Yes — order placed returns confirmation                                  | ✅     |
| Digital receipt / order summary | Partial — order details viewable, but no formal receipt generation       | ⚠️     |
| Payment confirmation            | **No** — COD has no payment processing                                   | ❌     |
| Order record in DB              | Yes — Order + OrderItem stored                                           | ✅     |
| Updated inventory status        | **No** — stock is not decremented                                        | ❌     |
| Delivery tracking info          | Yes — tracking number generated at hub, order tracking page exists       | ✅     |
| Email/SMS notifications         | **Partial** — OTP email for registration only; no order status email/SMS | ⚠️     |
| Transaction logs                | **No** — no dedicated audit/transaction log table                        | ❌     |

---

### 1.4 Components

| Component                                | Actual System                                                                                                                                         | Match? |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| UI (Checkout Page)                       | Yes — `checkout.component.ts`                                                                                                                         | ✅     |
| Cart Management                          | Yes — `cart.service.ts`, Cart model                                                                                                                   | ✅     |
| Pricing & Tax Calculator                 | **No** — no tax calculation; subtotal + shipping only                                                                                                 | ❌     |
| Payment Gateway Integration              | **No** — no payment gateway; COD only                                                                                                                 | ❌     |
| Order Management System                  | Yes — Order/OrderItem models, order controller                                                                                                        | ✅     |
| Inventory Management                     | **No** — basic product stock field but no inventory update on order                                                                                   | ❌     |
| Notification System                      | **Minimal** — OTP email only, no order notifications                                                                                                  | ⚠️     |
| Database                                 | Yes — PostgreSQL via Sequelize                                                                                                                        | ✅     |
| Security Layer (encryption, fraud, auth) | **Partial** — JWT auth + bcrypt passwords, but no encryption at rest, no fraud detection, no HTTPS enforcement, CORS is wide open (`app.use(cors())`) | ⚠️     |

---

### 1.5 Stakeholders

| Stakeholder                 | Actual System                                                                           | Match? |
| --------------------------- | --------------------------------------------------------------------------------------- | ------ |
| Customers                   | Yes — `customer` user type                                                              | ✅     |
| E-commerce Business Owner   | Implicit — admin role                                                                   | ✅     |
| Warehouse/Fulfillment Staff | **No** — this role doesn't exist. Hub staff is closest, but no warehouse picking system | ⚠️     |
| Payment Service Providers   | **No** — no payment integration                                                         | ❌     |
| IT/Development Team         | External (not modeled)                                                                  | N/A    |
| Customer Service Team       | **No** — no support ticket or chat system                                               | ❌     |
| Regulatory Bodies           | Not modeled                                                                             | N/A    |

---

## CHAPTER 2 — System Constraints

| Constraint                    | Matches System?    | Notes                                                                                                                                                                                               |
| ----------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inaccurate Real-Time ETA      | ⚠️ Partially valid | ETA is calculated with a simple formula (`distance / 30 km/h + 0.5h`); no traffic or weather data. However, the doc frames this as a Shopee/Foodpanda-like system, not the actual hub-based system. |
| Inaccurate Address Validation | ✅ Valid           | Address uses manual input + optional Nominatim geocoding; no automated validation or verification                                                                                                   |
| Delivery Scheduling Issues    | ✅ Valid           | No delivery date/time slot selection exists                                                                                                                                                         |

---

## CHAPTER 3 — Proposed Solutions

| Solution                         | Matches Actual System? | Notes                                                                                                                             |
| -------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Real-time rider tracking via GPS | ✅                     | Delivery model has `currentLatitude`/`currentLongitude`, Driver model has live coordinates, order-tracking page uses Leaflet maps |
| Live map view for customer       | ✅                     | `order-tracking.component.ts` shows Leaflet map with driver pin + route                                                           |
| ETA prediction                   | ⚠️ Basic               | Simple distance/speed formula, not ML-based                                                                                       |
| Proximity notifications          | ❌                     | No push notifications or SMS when rider is near                                                                                   |
| QR code delivery confirmation    | ✅                     | QR generated at hub, driver scans to confirm delivery (**not mentioned in doc**)                                                  |
| Hub-based logistics              | ✅                     | Full hub system exists (**not described in doc at all**)                                                                          |

---

## Summary: Does the Documentation Fit the System?

**No — there are significant gaps in both directions.**

### Things the doc claims that DON'T exist in the system:

1. Multiple payment methods (credit cards, e-wallets) — **only COD**
2. ~~Tax calculation~~ — **✅ IMPLEMENTED** (Tax configuration system with VAT/Sales Tax/GST)
3. ~~Promo codes / discounts~~ — **✅ IMPLEMENTED** (Full coupon/voucher system with 3 discount types)
4. Payment gateway integration — **none**
5. Inventory stock updates on order — **none**
6. Email/SMS order notifications — **only OTP**
7. Transaction/audit logs — **none**
8. Fraud detection, data encryption at rest — **none**
9. Delivery scheduling — **none**

### Things the system HAS that the doc DOESN'T mention:

1. Hub-based delivery logistics (origin hub → destination hub → rider → customer)
2. QR code generation and scanning for delivery confirmation
3. Multi-role system (customer, seller, admin, driver)
4. Seller registration and approval workflow
5. Review/rating system
6. Admin dashboard with hub, driver, seller management
7. Leaflet map integration for location picking and tracking
8. Haversine distance calculations

---

## Recommendation

The documentation reads like a **generic e-commerce system description** (referencing Shopee/Foodpanda) rather than a description of **this specific MultiShop system**. To align them:

- Remove references to payment gateways, tax, promos, and multiple payment methods
- Add the hub-based logistics flow as a core component
- Describe the actual roles (customer, seller, admin, driver)
- Update the system diagrams to reflect the real **hub → hub → rider → address** flow
- Describe QR code verification as part of the delivery confirmation process
