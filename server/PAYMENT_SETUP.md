# PayMongo Payment Integration Setup Guide

This guide will help you set up PayMongo payment integration for online payments (GCash, PayMaya, Cards).

## 1. Create PayMongo Account (FREE - No Business Required)

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Sign up with your personal email (no business verification needed for testing)
3. Verify your email address
4. You'll automatically get access to test mode (sandbox)
5. **No business documents or verification required for test mode!**

## 2. Get API Keys (Available Immediately After Signup)

1. Login to PayMongo Dashboard
2. Go to **Developers** → **API Keys**
3. Your test keys are already generated - no waiting!
4. Copy your **Test Secret Key** (starts with `sk_test_`)
5. Copy your **Test Public Key** (starts with `pk_test_`) - optional for now

**Note:** Test keys work immediately, no approval needed!

## 3. Configure Environment Variables

Update `server/.env` file:

```env
PAYMONGO_SECRET_KEY=sk_test_your_actual_secret_key_here
CLIENT_URL=http://localhost:4200
```

## 4. Run Database Migration

Run the SQL migration to add payment fields:

```bash
cd server
psql -U postgres -d ecommerce -f migrations/add-payment-fields.sql
```

Or use your database client to execute the SQL file.

## 5. Install Dependencies

The PayMongo package should already be installed. If not:

```bash
cd server
npm install paymongo
```

## 6. Test the Integration

### Test Payment Methods

PayMongo provides test credentials for sandbox testing:

#### GCash Test

- Use the GCash payment option
- You'll be redirected to a test page
- Click "Authorize" to simulate successful payment

#### PayMaya Test

- Use the PayMaya payment option
- You'll be redirected to a test page
- Click "Authorize" to simulate successful payment

#### Card Test

Use these test card numbers:

**Successful Payment:**

- Card: `4343434343434345`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)

**Failed Payment:**

- Card: `4571736000000075`
- Expiry: Any future date
- CVC: Any 3 digits

### Test Webhooks Locally

To test webhooks on localhost, use ngrok:

1. Install ngrok: https://ngrok.com/download
2. Run your server: `npm run dev`
3. In another terminal: `ngrok http 8000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Go to PayMongo Dashboard → Developers → Webhooks
6. Add webhook URL: `https://abc123.ngrok.io/api/payment/webhook`
7. Select events: `payment.paid`, `payment.failed`, `source.chargeable`

## 7. API Endpoints

### Create Payment Intent (for cards)

```
POST /api/payment/intent
Authorization: Bearer <token>
Body: { "orderId": "uuid" }
```

### Create GCash Payment

```
POST /api/payment/gcash
Authorization: Bearer <token>
Body: { "orderId": "uuid" }
```

### Create PayMaya Payment

```
POST /api/payment/paymaya
Authorization: Bearer <token>
Body: { "orderId": "uuid" }
```

### Check Payment Status

```
GET /api/payment/status/:orderId
Authorization: Bearer <token>
```

## 8. Payment Flow

### COD (Cash on Delivery)

1. Customer places order
2. Order status: `pending`
3. Payment status: `pending`
4. Payment method: `cod`
5. Driver collects cash on delivery

### Online Payment (GCash/PayMaya)

1. Customer places order
2. Customer selects GCash or PayMaya
3. System creates payment source
4. Customer redirected to GCash/PayMaya
5. Customer authorizes payment
6. Webhook receives `source.chargeable` event
7. System captures payment automatically
8. Order status changes to `confirmed`
9. Payment status changes to `paid`

### Card Payment

1. Customer places order
2. Customer enters card details
3. System creates payment intent
4. Customer completes 3D Secure if required
5. Payment processed
6. Webhook receives `payment.paid` event
7. Order status changes to `confirmed`
8. Payment status changes to `paid`

## 9. Frontend Integration

Update the checkout component to:

1. Show payment method selection (COD, GCash, PayMaya, Card)
2. For online payments, call the appropriate API endpoint
3. Redirect user to payment page (GCash/PayMaya)
4. Handle payment success/failure callbacks
5. Show payment status to user

## 10. Production Deployment (Only When You Have a Real Business)

**For now, just use test mode!** When you eventually have a real business and want to accept real payments:

1. Complete PayMongo business verification (requires business documents)
2. Get production API keys from dashboard
3. Update `.env` with production keys:
   ```env
   PAYMONGO_SECRET_KEY=sk_live_your_production_key
   CLIENT_URL=https://yourdomain.com
   ```
4. Configure production webhook URL
5. Test thoroughly before going live

**But for testing/learning, test mode is perfect and completely free!**

## 11. Security Notes

- Never expose secret keys in frontend code
- Always validate webhook signatures in production
- Use HTTPS for all payment endpoints
- Store payment data securely
- Follow PCI compliance guidelines for card data

## 12. Support

- PayMongo Documentation: https://developers.paymongo.com/docs
- PayMongo Support: support@paymongo.com
- Test Mode: No real money is charged in test mode

## 13. Common Issues

### "Invalid API Key"

- Check that you're using the correct secret key
- Ensure no extra spaces in the .env file
- Restart the server after updating .env

### "Webhook not receiving events"

- Check ngrok is running for local testing
- Verify webhook URL in PayMongo dashboard
- Check server logs for webhook errors

### "Payment not updating order"

- Check webhook is configured correctly
- Verify orderId is in payment metadata
- Check server logs for errors

## 14. Testing Checklist

- [ ] Environment variables configured
- [ ] Database migration completed
- [ ] Server starts without errors
- [ ] Can create GCash payment
- [ ] Can create PayMaya payment
- [ ] Can create card payment
- [ ] Webhook receives events
- [ ] Order status updates after payment
- [ ] Payment status shows correctly
- [ ] Customer can view payment status
