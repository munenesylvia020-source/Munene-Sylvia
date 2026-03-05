# Swagger API Documentation

Complete interactive API documentation for Premier Consolidated Capital Holdings backend.

## Team

This backend is being built collaboratively. App ownership:

- **You (developer)** – investments app
- **Joanne** – accounts
- **Cyrus** – finance
- **Hannington** – helb

The Swagger UI reflects endpoints grouped by these applications.



## Access Documentation

Once the server is running:

1. **Swagger UI (Interactive)**
   - URL: `http://localhost:8000/api/docs/`
   - Best for testing and exploring endpoints
   - Try out requests directly from browser

2. **ReDoc (Alternative View)**
   - URL: `http://localhost:8000/api/redoc/`
   - Alternative documentation view
   - Better for reading specifications

3. **OpenAPI Schema (Raw)**
   - URL: `http://localhost:8000/api/schema/`
   - Returns JSON schema
   - Use with external tools

## Setup

The documentation is automatically generated from:
- ViewSet docstrings
- Serializer field definitions
- Request/response examples
- Error codes

No manual documentation needed!

## Authentication in Swagger

### Getting a Token

1. Register a student:
   ```bash
   POST /api/v1/auth/students/
   {
       "username": "john_doe",
       "email": "john@example.com",
       "first_name": "John",
       "last_name": "Doe",
       "password": "password123",
       "registration_number": "REG001",
       "phone_number": "254712345678",
       "institution_name": "University of Nairobi"
   }
   ```

2. Get token via Django admin or use the basic auth endpoint

3. In Swagger UI:
   - Click "Authorize" button (top right)
   - Enter: `Token YOUR_TOKEN_HERE`
   - Click "Authorize"
   - Now all protected endpoints will include this token

### Test Endpoints in Swagger

1. Navigate to desired endpoint
2. Click "Try it out"
3. Fill in parameters
4. Click "Execute"
5. See response below

## API Endpoints Documentation

### Authentication (`/api/v1/auth/`)

#### Register Student
```
POST /api/v1/auth/students/
```
Create new student account with Firebase UID mapping.

**Request:**
```json
{
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "password": "secure_password123",
    "registration_number": "REG202401001",
    "phone_number": "254712345678",
    "institution_name": "University of Nairobi"
}
```

**Response (201):**
```json
{
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "registration_number": "REG202401001",
    "phone_number": "254712345678",
    "institution_name": "University of Nairobi"
}
```

#### Get Current Profile
```
GET /api/v1/auth/students/me/
```
Returns authenticated student's profile.

**Response (200):**
```json
{
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "firebase_uid": "abc123xyz",
    "registration_number": "REG202401001",
    "phone_number": "254712345678",
    "institution_name": "University of Nairobi",
    "date_of_onboarding": "2024-03-05T10:30:00Z",
    "is_active_student": true
}
```

#### Update Phone Number
```
POST /api/v1/auth/students/update_phone/
```
Update M-Pesa phone number for deposits.

**Request:**
```json
{
    "phone_number": "254701234567"
}
```

**Response (200):**
```json
{
    "message": "Phone number updated successfully"
}
```

---

### Finance (`/api/v1/finance/`)

#### Get Wallet Balance
```
GET /api/v1/finance/wallets/my_wallet/
```
Get current available balance.

**Response (200):**
```json
{
    "id": 1,
    "student_name": "John Doe",
    "balance": "50000.00",
    "currency": "KES",
    "created_at": "2024-03-05T10:30:00Z",
    "updated_at": "2024-03-05T15:45:00Z"
}
```

#### Transaction History
```
GET /api/v1/finance/transactions/
```
Get all transactions with pagination (default 20 per page).

**Query Parameters:**
- `page` - Page number (default: 1)
- `search` - Search by type or description
- `ordering` - Sort by field (use `-` for descending)

**Response (200):**
```json
{
    "count": 5,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "student_name": "John Doe",
            "transaction_type": "DEPOSIT",
            "amount": "50000.00",
            "status": "COMPLETED",
            "description": "STK Push initiated for 254712345678",
            "mpesa_reference": "MPX123456",
            "created_at": "2024-03-05T12:00:00Z",
            "updated_at": "2024-03-05T12:05:00Z"
        }
    ]
}
```

#### Initiate Deposit
```
POST /api/v1/finance/transactions/initiate_deposit/
```
Start M-Pesa STK Push for wallet deposit.

**Request:**
```json
{
    "amount": "50000.00",
    "phone_number": "254712345678"
}
```

**Response (201):**
```json
{
    "message": "STK Push initiated. Check your phone for the M-Pesa prompt.",
    "transaction_id": 1,
    "amount": "50000.00",
    "phone_number": "254712345678"
}
```

#### Balance History
```
GET /api/v1/finance/balance-snapshots/
```
Historical balance snapshots for reconciliation.

---

### Investments (`/api/v1/invest/`)

#### Allocate Disbursement (50/30/20)
```
POST /api/v1/invest/positions/allocate/
```
Create new investment using 50/30/20 allocation.

**Request:**
```json
{
    "total_amount": "500000.00",
    "fund_type": "MMF",
    "fund_name": "Old Mutual Money Market Fund"
}
```

**Response (201):**
```json
{
    "message": "Allocation created using 50/30/20 rule",
    "allocation": {
        "id": 1,
        "student_name": "John Doe",
        "total_amount": "500000.00",
        "tuition_amount": "250000.00",
        "upkeep_amount": "150000.00",
        "investment_amount": "100000.00",
        "status": "ACTIVE",
        "created_at": "2024-03-05T14:00:00Z"
    },
    "investment_position": {
        "id": 1,
        "student_name": "John Doe",
        "fund_type": "MMF",
        "fund_name": "Old Mutual Money Market Fund",
        "principal_amount": "100000.00",
        "current_value": "100000.00",
        "accumulated_interest": "0.00",
        "annual_yield_percentage": "5.0",
        "gain_loss": "0.00",
        "gain_loss_percentage": 0.0,
        "daily_interest": "13.70",
        "status": "ACTIVE",
        "investment_date": "2024-03-05T14:00:00Z",
        "last_interest_accrual": "2024-03-05T14:00:00Z"
    }
}
```

#### Portfolio Growth Summary
```
GET /api/v1/invest/positions/portfolio_growth/
```
Get total portfolio value, gains, and performance.

**Response (200):**
```json
{
    "total_invested": "300000.00",
    "total_current_value": "305000.00",
    "total_gained": "5000.00",
    "total_gained_percentage": "1.67",
    "positions_count": 3,
    "last_updated": "2024-03-05T20:00:00Z"
}
```

#### Daily Interest Forecast
```
GET /api/v1/invest/positions/daily_accruals/
```
Get daily interest accrual estimates.

**Response (200):**
```json
{
    "positions": [
        {
            "fund_name": "Old Mutual Money Market Fund",
            "daily_interest": "13.70",
            "annual_yield": "5.0",
            "current_value": "100000.00"
        }
    ],
    "total_daily_interest": "13.70"
}
```

#### Allocation History
```
GET /api/v1/invest/allocations/
```
Get all 50/30/20 allocations.

#### Interest Accrual Logs
```
GET /api/v1/invest/accrual-logs/
```
Complete audit trail of all interest accruals.

---

### HELB (`/api/v1/helb/`)

#### Get HELB Account
```
GET /api/v1/helb/accounts/my_account/
```
Get HELB loan account details.

**Response (200):**
```json
{
    "id": 1,
    "student_name": "John Doe",
    "helb_reference_number": "HELB123456",
    "total_approved_amount": "500000.00",
    "course_duration_years": 4,
    "total_disbursed": "100000.00",
    "remaining_balance": "400000.00",
    "account_created_at": "2024-03-05T10:30:00Z"
}
```

#### All Disbursements
```
GET /api/v1/helb/disbursements/
```
Get all HELB disbursements with pagination.

**Response (200):**
```json
{
    "count": 4,
    "results": [
        {
            "id": 1,
            "student_name": "John Doe",
            "amount": "100000.00",
            "expected_date": "2024-06-30",
            "disbursal_date": "2024-06-30",
            "received_date": "2024-06-30",
            "status": "COMPLETED",
            "is_overdue": false,
            "days_remaining": 0,
            "notes": ""
        }
    ]
}
```

#### Upcoming Disbursements
```
GET /api/v1/helb/disbursements/upcoming/
```
Get next 5 expected disbursements.

**Response (200):**
```json
[
    {
        "id": 2,
        "student_name": "John Doe",
        "amount": "100000.00",
        "expected_date": "2024-12-30",
        "disbursal_date": null,
        "received_date": null,
        "status": "PENDING",
        "is_overdue": false,
        "days_remaining": 301,
        "notes": ""
    }
]
```

#### Overdue Disbursements
```
GET /api/v1/helb/disbursements/overdue/
```
Get overdue disbursements that haven't been processed.

#### Disbursement Projections
```
GET /api/v1/helb/projections/
```
Get next expected disbursement with confidence level.

**Response (200):**
```json
{
    "next_expected_date": "2024-12-30",
    "next_expected_amount": "100000.00",
    "days_remaining": 301,
    "confidence_level": "HIGH",
    "recent_disbursements": [...],
    "upcoming_disbursements": [...]
}
```

## Error Response Examples

### 400 Bad Request
```json
{
    "amount": [
        "Ensure this value is greater than or equal to 0.01."
    ]
}
```

### 401 Unauthorized
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
    "detail": "Not found."
}
```

### 500 Server Error
```json
{
    "detail": "Internal server error."
}
```

## Testing Best Practices

### 1. Test Registration First
- Register a student
- Wallet & HELB account auto-created
- Save the user ID

### 2. Update Phone Number
- Phone required for M-Pesa deposits
- Use format: 254712345678

### 3. Create Sample Disbursements
```bash
python manage.py create_sample_disbursements --student-id 1
```

### 4. Test Investment Allocation
- Allocate disbursement (50/30/20 split)
- Watch portfolio growth
- Check daily accruals

### 5. Monitor Trajectories
- Check transaction history
- View balance snapshots
- Track interest accrual logs

## Rate Limiting (Future)

Currently unlimited. In production:
- 100 requests/hour for anonymous
- 1000 requests/hour for authenticated

## API Versioning

Current version: `v1`

Future upgrades available at:
- `/api/v2/` (planned)
- `/api/v3/` (planned)

Backward compatibility maintained.

## Troubleshooting

### Token Not Working
1. Check token format: `Token abc123xyz`
2. Verify not expired (if JWT implemented)
3. Regenerate token if needed

### Endpoint Returns 404
1. Check endpoint is documented in Swagger
2. Verify correct URL path
3. Check HTTP method (GET, POST, etc.)

### Authentication Required But Not Working
1. Click "Authorize" in Swagger UI
2. Enter token in format: `Token your_token`
3. Reload the page

### CORS Errors
1. Check CORS_ALLOWED_ORIGINS in settings.py
2. Update for your frontend domain
3. Restart Django server

## Support

For API issues:
1. Check Swagger documentation
2. Review error messages carefully
3. Check implementation examples
4. Refer to [QUICK_START.md](QUICK_START.md)
5. Check [ARCHITECTURE.md](ARCHITECTURE.md)

---

**Documentation Auto-Generated with drf-spectacular**
**Last Updated:** March 2024
