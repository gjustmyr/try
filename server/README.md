# MultiShop Marketplace - Backend

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

- Database credentials (PostgreSQL)
- Cloudinary credentials
- Email service credentials
- JWT secret

### 3. Setup PostgreSQL Database

```sql
CREATE DATABASE multishop_db;
```

### 4. Setup Cloudinary

1. Sign up at https://cloudinary.com
2. Get your Cloud Name, API Key, and API Secret
3. Add them to `.env` file

### 5. Setup Email Service

For Gmail:

1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `.env`

### 6. Run the Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Seller Registration

- **POST** `/api/sellers/register`
  - Body: multipart/form-data
  - Fields: shopName, fullName, email, phone, businessType, businessRegNumber, businessAddress, password
  - Files: governmentId, businessLicense, proofOfAddress (optional), taxCertificate (optional)

### Email Verification

- **GET** `/api/sellers/verify-email/:token`

### Resend Verification

- **POST** `/api/sellers/resend-verification`
  - Body: { email }

### Get Seller Status

- **GET** `/api/sellers/status?email=seller@example.com`

## Database Schema

### Sellers Table

- id (UUID)
- shopName
- fullName
- email (unique)
- phone
- businessType (individual/company)
- businessRegNumber
- businessAddress
- password (hashed)
- governmentIdUrl, governmentIdPublicId
- businessLicenseUrl, businessLicensePublicId
- proofOfAddressUrl, proofOfAddressPublicId (optional)
- taxCertificateUrl, taxCertificatePublicId (optional)
- emailVerified (boolean)
- emailVerificationToken
- emailVerificationExpires
- approvalStatus (pending/approved/rejected)
- approvedAt
- rejectionReason
- isActive
- timestamps (createdAt, updatedAt)

## File Upload Flow

1. Files uploaded via multer to temp directory
2. Files uploaded to Cloudinary
3. Cloudinary URLs saved to database
4. Temp files deleted

## Email Verification Flow

1. User registers
2. Verification email sent with token
3. User clicks link
4. Email verified
5. Application pending admin approval
