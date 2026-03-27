# M-Pesa Daraja Integration Guide (Sandbox)

## Overview

This guide provides setup and integration instructions for M-Pesa Daraja C2B and B2C payments in sandbox mode.

## Architecture

### C2B (Customer to Business) - Deposits
- **Purpose**: Allow students to send money to their wallet
- **Flow**: Student sends money via M-Pesa → Safaricom → Daraja webhook → System credit wallet
- **Status Tracking**: Real-time via M-Pesa callbacks

### B2C (Business to Customer) - Disbursements  
- **Purpose**: Disburse funds from wallet to student's phone
- **Flow**: Student initiates withdrawal → Daraja API call → Safaricom → Money sent to phone
- **Status Tracking**: Polling via transaction IDs

## Prerequisites

1. **Safaricom Developer Account**: https://developer.safaricom.co.ke
2. **M-Pesa Sandbox Credentials**
3. **Public URL** (for callbacks): Use ngrok for local development

## Setup Instructions

### 1. Get Daraja Credentials from Sandbox

1. Go to https://developer.safaricom.co.ke
2. Sign up/Log in to your account
3. Navigate to **Dashboard** → **My Apps**
4. Create a new app:
   - Name: "PennyProf"
   - Select API type: **Lipa Na M-Pesa Online Checkout**
5. You'll get:
   - **Consumer Key**
   - **Consumer Secret**
   - **Business Short Code** (usually 174379 for sandbox)
   - **Passkey** (for STK Push - not needed for C2B/B2C)

### 2. Get B2C Initiator Credentials

1. In Daraja Dashboard → **Test Credentials**
2. Section: **B2B SSL Simulation**
3. Get **Initiator Name** and **Initiator Password**
   - Initiator Name: Usually `testapi`
   - Initiator Password: Generated for your app

### 3. Set Environment Variables

Create a `.env` file in the backend root:

```bash
# M-Pesa Daraja Credentials
MPESA_CONSUMER_KEY=your-consumer-key-from-daraja
MPESA_CONSUMER_SECRET=your-consumer-secret-from-daraja
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=your-passkey

# B2C Credentials
MPESA_INITIATOR_NAME=testapi
MPESA_INITIATOR_PASSWORD=your-b2c-initiator-password

# Callback URL (use ngrok in development)
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/finance

# Environment
MPESA_ENVIRONMENT=sandbox
```

### 4. Setup ngrok for Local Development (If needed for callbacks)

```bash
# Download ngrok from https://ngrok.com/download
ngrok http 8000

# You'll get a URL like: https://abc123.ngrok.io
# Use this in MPESA_CALLBACK_URL
```

### 5. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Test the Integration

#### Test C2B (Deposit) - Using Sandbox Simulation

```bash
# Start your backend server
python manage.py runserver

# Test endpoint - this simulates an M-Pesa C2B transaction
curl -X POST http://localhost:8000/api/v1/finance/c2b/initiate/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "254712345678",
    "amount": 1000,
    "reference": "deposit"
  }'
```

Expected Response:
```json
{
  "status": "success",
  "message": "Payment request initiated",
  "response": {
    "ResponseCode": "0",
    "ResponseDescription": "Request processed successfully"
  },
  "amount": "1000"
}
```

Monitor the logs to see simulated transaction processing:
- Simulated M-Pesa API call
- Webhook callback processing
- Wallet credit update

#### Test B2C (Withdrawal)

```bash
curl -X POST http://localhost:8000/api/v1/finance/b2c/initiate/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "254712345678",
    "amount": 500,
    "purpose": "BusinessPayment"
  }'
```

Expected Response:
```json
{
  "status": "success",
  "message": "Withdrawal initiated",
  "b2c_id": 1,
  "amount": "500",
  "remaining_balance": "4500"
}
```

## API Endpoints

### C2B (Deposits)

**Initiate C2B Payment**
```
POST /api/v1/finance/c2b/initiate/
Authorization: Token {token}
Content-Type: application/json

{
  "phone_number": "254712345678",  // Required
  "amount": 1000,                   // Required (KES)
  "reference": "deposit"            // Optional
}
```

**C2B Validation Callback** (Daraja → Your Server)
```
POST /api/v1/finance/c2b/validate/

Safaricom validates transaction, your server confirms
```

**C2B Confirmation Callback** (Daraja → Your Server)  
```
POST /api/v1/finance/c2b/callback/

Safaricom sends confirmed transaction details
System credits wallet automatically
```

### B2C (Withdrawals)

**Initiate B2C Payment**
```
POST /api/v1/finance/b2c/initiate/
Authorization: Token {token}
Content-Type: application/json

{
  "phone_number": "254712345678",      // Required
  "amount": 500,                        // Required (KES)
  "purpose": "BusinessPayment"          // Optional
}
```

**B2C Result Callback** (Daraja → Your Server)
```
POST /api/v1/finance/b2c/callback/

Result details:
- ResultCode: 0 = Success, other = Failed
- TransactionID: Unique B2C transaction ID
```

**B2C Timeout Callback** (Daraja → Your Server)
```
POST /api/v1/finance/b2c/timeout/

Called if payment times out
```

### Transaction History

**Get M-Pesa Transactions** (C2B)
```
GET /api/v1/finance/mpesa-transactions/
Authorization: Token {token}

Returns list of C2B deposits for authenticated user
```

**Get B2C Transactions** (Withdrawals)
```
GET /api/v1/finance/b2c-transactions/
Authorization: Token {token}

Returns list of B2C withdrawals for authenticated user
```

**Check Payment Status**
```
POST /api/v1/finance/payment-status/
Authorization: Token {token}
Content-Type: application/json

{
  "transaction_id": "1",
  "type": "c2b"  // or "b2c"
}
```

## Frontend Integration

### Using the Deposit Component

```jsx
import DepositModal from './components/DepositModal';
import { finance } from './services/api';
import { useState } from 'react';

function Dashboard() {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0 });

  const handleDepositSuccess = (data) => {
    console.log('Deposit initiated:', data);
    // Refresh wallet balance
    loadWallet();
  };

  const loadWallet = async () => {
    const walletData = await finance.getWallet();
    setWallet(walletData[0] || { balance: 0 });
  };

  return (
    <>
      <button onClick={() => setIsDepositOpen(true)}>
        Send Money to Wallet
      </button>
      
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSuccess={handleDepositSuccess}
        studentInfo={{ phone_number: '254712345678' }}
      />
    </>
  );
}
```

### Using the Withdrawal Component

```jsx
import WithdrawalModal from './components/WithdrawalModal';

function Dashboard() {
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);

  const handleWithdrawalSuccess = (data) => {
    console.log('Withdrawal initiated:', data);
    // Refresh transactions
    loadTransactions();
  };

  return (
    <>
      <button onClick={() => setIsWithdrawalOpen(true)}>
        Withdraw to M-Pesa
      </button>
      
      <WithdrawalModal
        isOpen={isWithdrawalOpen}
        onClose={() => setIsWithdrawalOpen(false)}
        onSuccess={handleWithdrawalSuccess}
        walletBalance={1000}
        studentInfo={{ phone_number: '254712345678' }}
      />
    </>
  );
}
```

## Testing Scenarios

### Sandbox Test Phone Numbers

Safaricom provides test credentials. Common formats:
- Test phone: `254708374149`
- Alternative: `254710123456`

Check your Daraja dashboard for sandbox test credentials.

### Transaction Flow Testing

1. **Successful Deposit**
   - Initiate C2B with test phone
   - Check wallet increased in DB
   - Verify MpesaTransaction marked as COMPLETED

2. **Failed Deposit**
   - Invalid phone format should return 400
   - Check error message in response

3. **Successful Withdrawal**
   - Check B2CTransaction created
   - Verify wallet decreased
   - Monitor B2C callback for completion status

## Production Checklist

Before moving to production:

- [ ] Switch `MPESA_ENVIRONMENT` to `production`
- [ ] Update credentials to production Daraja credentials
- [ ] Update `MPESA_CALLBACK_URL` to production domain
- [ ] Enable HTTPS (required for callbacks)
- [ ] Set `DEBUG = False` in Django
- [ ] Configure proper database (PostgreSQL recommended)
- [ ] Set up proper logging
- [ ] Implement rate limiting on payment endpoints
- [ ] Add payment verification on backend
- [ ] Test with small amounts first
- [ ] Monitor transaction logs for issues

## Troubleshooting

### Issue: "Connection refused" on token request

**Solution**: Check Daraja credentials are correct and Safaricom servers are reachable

### Issue: Callback not reaching server

**Solution**: 
- Ensure webhook URLs are HTTPS and publicly accessible
- Update MPESA_CALLBACK_URL in settings
- Use ngrok for local testing
- Check firewall/network settings

### Issue: Transaction marked as pending indefinitely

**Solution**:
- Check B2C callback endpoint is receiving requests
- Verify URL encoding and JSON format
- Check server logs for parsing errors

### Issue: "Invalid phone number" error

**Solution**:
- Phone must be in format: `254XXXXXXXXX`
- Remove leading 0 if present
- Ensure 12 digits total

## Code Structure

```
finance/
├── models.py              # MpesaTransaction, B2CTransaction
├── serializers.py         # M-Pesa serializers
├── views.py              # Standard finance views
├── mpesa_views.py        # M-Pesa specific views
├── mpesa_utils.py        # DarajaClient, handlers
├── urls.py               # URL routing
└── migrations/           # Database migrations

frontend/
└── src/
    ├── components/
    │   ├── DepositModal.jsx
    │   └── WithdrawalModal.jsx
    ├── services/
    │   └── api.js          # M-Pesa API functions
    └── styles/
        ├── deposit.css
        └── withdrawal.css
```

## Support

For issues or questions:
1. Check Daraja documentation: https://developer.safaricom.co.ke/docs
2. Review transaction logs in Django admin
3. Monitor M-Pesa transaction history in Daraja dashboard
4. Check server logs for detailed error messages

## References

- Daraja API Documentation: https://developer.safaricom.co.ke/apis
- C2B API: https://developer.safaricom.co.ke/docs/mpesa-c2b-api
- B2C API: https://developer.safaricom.co.ke/docs/mpesa-b2c-api
- OAuth: https://developer.safaricom.co.ke/docs/oauth
