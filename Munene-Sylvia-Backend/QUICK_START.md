# Quick Start Guide

Get the Premier Consolidated Capital Holdings backend running in 5 minutes.

## Prerequisites
- Python 3.9+
- pip

## Step 1: Install Dependencies

```bash
cd c:where youve saved the doc
pip install -r requirements.txt
```

## Step 2: Initialize Database

```bash
python manage.py makemigrations
python manage.py migrate
```

## Step 3: Create Superuser (Admin Account)

```bash
python manage.py createsuperuser
```
Follow the prompts to create an admin account.

Example:
```
Username: admin
Email: admin@example.com
Password: [your-password]
```

## Step 4: Run Development Server

```bash
python manage.py runserver
```

You'll see:
```
Starting development server at http://127.0.0.1:8000/
```

## Step 5: Access API Documentation

### Swagger UI (Interactive - Recommended)
Open browser: `http://localhost:8000/api/docs/`
- Try out endpoints directly
- Interactive request builder
- Live response viewer

### Alternative: ReDoc
Open browser: `http://localhost:8000/api/redoc/`
- Alternative clean interface
- Better for reading specifications

### Raw OpenAPI Schema
URL: `http://localhost:8000/api/schema/`

## Step 6: Test the API

### Access Django Admin
Open browser: `http://localhost:8000/admin/`
- Login with your superuser credentials
- Create a student user manually or via API

### Register a Student via Swagger UI

1. Go to `http://localhost:8000/api/docs/`
2. Find "students" section
3. Click "POST /api/v1/auth/students/"
4. Click "Try it out"
5. Fill in the JSON:
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
6. Click "Execute"

Response:
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

### Get Student Token (for authenticated requests)

Using Django admin or terminal:
```bash
# Create token via Django shell
python manage.py shell
>>> from rest_framework.authtoken.models import Token
>>> from django.contrib.auth import get_user_model
>>> Student = get_user_model()
>>> student = Student.objects.get(username='john_doe')
>>> token = Token.objects.create(user=student)
>>> print(token.key)
```

### Authenticate in Swagger UI

1. In Swagger UI, click "Authorize" button (top right)
2. In the dialog, enter: `Token YOUR_TOKEN_HERE`
3. Click "Authorize"
4. Click "Close"
5. Now all protected endpoints will automatically include your token

### Check Wallet

In Swagger UI:
1. Find "wallets" section
2. Click "GET /api/v1/finance/wallets/my_wallet/"
3. Click "Try it out"
4. Click "Execute"
5. See wallet balance response

### Create HELB Disbursements (for testing)

```bash
python manage.py create_sample_disbursements --student-id 1
```

This creates 4 sample disbursements for testing.

### View Upcoming Disbursements

In Swagger UI:
1. Find "disbursements" section
2. Click "GET /api/v1/helb/disbursements/upcoming/"
3. Click "Try it out"
4. Click "Execute"
5. See upcoming disbursements

### Allocate Disbursement (50/30/20 split)

In Swagger UI:
1. Find "positions" section
2. Click "POST /api/v1/invest/positions/allocate/"
3. Click "Try it out"
4. Fill in:
```json
{
  "total_amount": "500000.00",
  "fund_type": "MMF",
  "fund_name": "Old Mutual Money Market Fund"
}
```
5. Click "Execute"

Response shows:
- AllocationPlan with 50/30/20 breakdown
- InvestmentPosition created with 20% (100,000 KES)

### Check Portfolio Growth

In Swagger UI:
1. Find "positions" section
2. Click "GET /api/v1/invest/positions/portfolio_growth/"
3. Click "Try it out"
4. Click "Execute"
5. See portfolio summary

### View Daily Interest Forecast

In Swagger UI:
1. Find "positions" section
2. Click "GET /api/v1/invest/positions/daily_accruals/"
3. Click "Try it out"
4. Click "Execute"
5. See daily interest estimates

## Admin Panel Features

### Access Admin
URL: `http://localhost:8000/admin/`

### What You Can Do
1. **Students**: Create, edit, view all student accounts and Firebase UID mappings
2. **Wallets**: Monitor wallet balances and transaction history
3. **Transactions**: View complete ledger of all money movements
4. **HELB Accounts**: Manage HELB loan setup and tracking
5. **Disbursements**: Track and update individual HELB transfers
6. **Investment Positions**: Monitor student portfolio holdings
7. **Interest Accruals**: Audit trail of daily interest calculations

## Project Structure Quick Reference

```
accounts/      → Student auth, profiles
finance/       → Wallets, transactions, M-Pesa integration
investments/   → Portfolio, 50/30/20 allocation, interest accrual
helb/          → Disbursement tracking & projections
```

## Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/auth/students/` | Register new student |
| GET | `/api/v1/auth/students/me/` | Get current profile |
| GET | `/api/v1/finance/wallets/my_wallet/` | Check wallet balance |
| POST | `/api/v1/finance/transactions/initiate_deposit/` | Start M-Pesa deposit |
| POST | `/api/v1/invest/positions/allocate/` | Allocate HELB disbursement |
| GET | `/api/v1/invest/positions/portfolio_growth/` | Portfolio summary |
| GET | `/api/v1/helb/accounts/my_account/` | HELB account info |
| GET | `/api/v1/helb/disbursements/upcoming/` | Next expected payments |
| GET | `/api/v1/helb/projections/` | Disbursement forecast |

## Common Issues

### Port Already in Use
```bash
python manage.py runserver 8001
```

### Database Issues
```bash
python manage.py migrate --run-syncdb
```

### Missing Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Authentication Error in Swagger
1. Make sure you got the token correctly
2. Format should be: `Token abc123def456`
3. Check token exists in database:
```bash
python manage.py shell
>>> from rest_framework.authtoken.models import Token
>>> Token.objects.all()
```

## Using Swagger Effectively

### 1. Explore Endpoints
- All endpoints documented with descriptions
- See required vs optional parameters
- View example requests and responses

### 2. Try Out Requests
- Click "Try it out" button
- Fill in required fields
- Click "Execute"
- See live response

### 3. Test Status Codes
- 200/201 = Success
- 400 = Bad request (invalid data)
- 401 = Not authenticated
- 403 = Not authorized
- 404 = Not found
- 500 = Server error

### 4. Check Error Messages
- Always read error response carefully
- Shows exactly what's wrong
- Helps debug quickly

## Next Steps

1. **Understand the System**
   - Read [README.md](README.md) for overview
   - Check [ARCHITECTURE.md](ARCHITECTURE.md) for design

2. **Implement M-Pesa**
   - See [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)
   - Priority 1: M-Pesa integration

3. **Set Up Celery**
   - Background tasks
   - Daily interest accrual
   - Priority 2

4. **Configure Firebase**
   - JWT authentication
   - Real-time sync
   - Priority 3

## Full Documentation

- **README.md** - Complete project documentation
- **ARCHITECTURE.md** - System design & data flow
- **IMPLEMENTATION_CHECKLIST.md** - Step-by-step roadmap
- **SWAGGER_DOCUMENTATION.md** - Detailed API reference
- **FILE_MANIFEST.md** - Complete file listing

## Support & Documentation

- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- Django Docs: https://docs.djangoproject.com/en/6.0/
- DRF Docs: https://www.django-rest-framework.org/

