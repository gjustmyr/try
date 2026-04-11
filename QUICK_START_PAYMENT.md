# Quick Start - Payment Testing (5 Minutes)

This is for testing only - no business required!

## Step 1: Run Database Migration (1 minute)

```bash
cd server
psql -U postgres -d ecommerce -f migrations/add-payment-fields.sql
```

You should see:

```
CREATE TYPE
CREATE TYPE
ALTER TABLE
UPDATE
CREATE INDEX
...
```

## Step 2: Get PayMongo Test Keys (2 minutes)

1. Go to https://dashboard.paymongo.com/
2. Click "Sign Up" (use any email - personal is fine)
3. Verify your email
4. Login to dashboard
5. Click "Developers" in sidebar → "API Keys"
6. Copy the **Secret key** (starts with `sk_test_`)

## Step 3: Update .env File (30 seconds)

Open `server/.env` and replace this line:

```env
PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
```

With your actual key:

```env
PAYMONGO_SECRET_KEY=sk_test_AbCdEf123456789...
```

## Step 4: Test It (1 minute)

```bash
# Make sure you're in the server directory
cd server

# Run the test script
node test-payment-setup.js
```

You should see all ✅ checkmarks!

## Step 5: Restart Server

```bash
npm run dev
```

## Done! 🎉

Your backend now supports:

- ✅ Cash on Delivery (COD) - already working
- ✅ GCash payments - ready to test
- ✅ PayMaya payments - ready to test
- ✅ Card payments - ready to test

## Test Payment with Postman/curl

1. First, place an order (existing functionality)
2. Get the order ID from response
3. Test GCash payment:

```bash
curl -X POST http://localhost:8000/api/payment/gcash \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"YOUR_ORDER_ID"}'
```

You'll get back a `checkoutUrl` - open it in browser to test!

## Test Payment Methods

### GCash Test

- Click the checkout URL
- You'll see a test page
- Click "Authorize" to simulate successful payment
- No real money involved!

### PayMaya Test

- Same as GCash
- Click "Authorize" on test page
- Completely free!

### Card Test

Use these test cards (no real cards needed):

**Success:**

- Card: `4343434343434345`
- Expiry: `12/25`
- CVC: `123`

**Failure:**

- Card: `4571736000000075`
- Expiry: `12/25`
- CVC: `123`

## What About Frontend?

The checkout page still only shows COD for now. That's fine! You can:

1. Test backend with Postman/curl (recommended for now)
2. Or add frontend UI later (see `PAYMENT_INTEGRATION_STATUS.md`)

## Troubleshooting

### "Invalid API Key"

- Check you copied the full key from PayMongo
- Make sure no extra spaces in .env
- Restart server after updating .env

### "PayMongo package not installed"

```bash
cd server
npm install paymongo
```

### Migration fails

- Check PostgreSQL is running
- Check database name is correct (ecommerce)
- Check user/password in .env

## Need Help?

- PayMongo Docs: https://developers.paymongo.com/docs
- Test Mode: No real money, unlimited testing
- Support: support@paymongo.com

## Important Notes

- ✅ Test mode is FREE forever
- ✅ No business verification needed
- ✅ No real money involved
- ✅ Unlimited test transactions
- ✅ All payment methods available
- ⚠️ Test keys only work in test mode
- ⚠️ Don't use test keys in production

Happy testing! 🚀
