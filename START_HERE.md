# 🚀 START HERE - Payment Integration for Testing

## What You Need to Know

✅ **No business required** - This is for testing/learning  
✅ **Completely FREE** - PayMongo test mode is free forever  
✅ **No real money** - All transactions are simulated  
✅ **Takes 5 minutes** - Simple setup

## What's Already Done

Your backend is 100% ready! I've already:

- ✅ Created payment service (GCash, PayMaya, Cards)
- ✅ Created payment API endpoints
- ✅ Updated database schema
- ✅ Registered routes in server
- ✅ Installed PayMongo package

## What You Need to Do (3 Steps)

### 1️⃣ Run Database Migration

```bash
cd server
psql -U postgres -d ecommerce -f migrations/add-payment-fields.sql
```

This adds payment fields to your orders table.

### 2️⃣ Get PayMongo Test Key

1. Go to https://dashboard.paymongo.com/
2. Sign up with any email (personal is fine)
3. Verify email and login
4. Go to: Developers → API Keys
5. Copy the **Secret key** (starts with `sk_test_`)

### 3️⃣ Add Key to .env

Open `server/.env` and update this line:

```env
PAYMONGO_SECRET_KEY=sk_test_your_actual_key_here
```

Paste your real key from step 2.

## Test It Works

```bash
cd server
node test-payment-setup.js
```

Should show all ✅ checkmarks!

Then restart your server:

```bash
npm run dev
```

## Done! 🎉

Your backend now supports online payments!

## How to Test

### Option 1: Use Postman/curl (Easiest)

1. Place an order through your app (COD works as before)
2. Get the order ID
3. Test payment:

```bash
curl -X POST http://localhost:8000/api/payment/gcash \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID_HERE"}'
```

4. Open the returned `checkoutUrl` in browser
5. Click "Authorize" to simulate payment
6. Check your order - status should change to "confirmed"!

### Option 2: Add Frontend UI (Later)

The checkout page still shows COD only. You can add payment buttons later.  
See `PAYMENT_INTEGRATION_STATUS.md` for frontend code.

## Test Payment Methods

All these work in test mode:

**GCash** - Click authorize on test page  
**PayMaya** - Click authorize on test page  
**Cards** - Use test card: `4343434343434345`, exp: `12/25`, cvc: `123`

## Files to Read

- `QUICK_START_PAYMENT.md` - Detailed 5-minute guide
- `server/PAYMENT_SETUP.md` - Complete documentation
- `PAYMENT_INTEGRATION_STATUS.md` - What's done, what's pending

## Questions?

- PayMongo test mode is FREE and needs NO business
- All test transactions are fake - no real money
- You can test unlimited times
- Test keys start with `sk_test_`
- Production keys need business verification (later)

**For now, just test with sandbox mode!** 🎮
