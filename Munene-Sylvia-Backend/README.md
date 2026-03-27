# Premier Consolidated Capital Holdings - Backend Architecture

A comprehensive Django backend for managing HELB disbursements and enabling efficient money management for Kenyan university students.

## Project Structure

```
pennyprof/
├── accounts/              # User authentication & student profiles
├── finance/               # Ledger system, wallets, M-Pesa integration, expenses
├── helb/                  # HELB disbursement tracking & projections
├── pennyprof/             # Project settings & URLs
├── manage.py              # Django management script
└── requirements.txt       # Python dependencies
```

## App Overview

### 1. **accounts** - User Management
- Custom `Student` user model with Firebase UID mapping
- Profile management (registration, phone number, institution)
- Student registration endpoint: `POST /api/v1/auth/students/`
- Profile endpoint: `GET /api/v1/auth/students/me/`

### 2. **finance** - Financial Management
- `Wallet` model: Maintains student balance
- `Transaction` model: Atomic ledger entries for all money movements
- `Expense` model: Track spending by category
- `Budget` model: Per-category spending limits
- `BalanceSnapshot` model: Historical balance records for reconciliation
- **M-Pesa Integration**:
  - C2B deposits (send money to wallet)
  - B2C withdrawals (withdraw to M-Pesa)
  - Real-time transaction callbacks
- Endpoints:
  - `GET /api/v1/finance/wallets/my_wallet/` - Get wallet balance
  - `GET /api/v1/finance/transactions/` - Transaction history
  - `POST /api/v1/finance/c2b/initiate/` - Initiate M-Pesa deposit
  - `POST /api/v1/finance/b2c/initiate/` - Initiate M-Pesa withdrawal
  - `GET /api/v1/finance/expenses/` - Expense history
  - `POST /api/v1/finance/expenses/` - Add new expense
  - `GET /api/v1/finance/budget/` - Budget limits

### 3. **helb** - Disbursement Management
- `HELBAccount` model: Student's HELB loan account
- `Disbursement` model: Individual disbursement entries
- `DisbursementSchedule` model: Projected payment calendar
- `DisbursementProjection` model: Forecasting & confidence levels
- Endpoints:
  - `GET /api/v1/helb/accounts/my_account/` - HELB account details
  - `GET /api/v1/helb/disbursements/upcoming/` - Next expected payments
  - `GET /api/v1/helb/projections/` - Disbursement forecast

## Team

This project is being developed collaboratively. Current assignments are:

- **Artello** – investments app and interest/portfolio logic M-Pesa integration
- **Joanne** – accounts app (user registration, authentication, profiles)
- **Cyrus** – finance app (wallets, transactions, )
- **Hannington** – helb app (disbursement tracking and projection)

Changes above map to the four Django apps in the repository.

## Key Features

### Atomic Transactions
Every money movement is wrapped in database transactions to prevent data corruption:
```python
with transaction.atomic():
    wallet.balance += amount
    wallet.save()
    Transaction.objects.create(...)
```

### Daily Interest Accrual
Background task calculates interest based on Annual Effective Yield:
```python
daily_rate = annual_yield_percentage / 365 / 100
daily_interest = current_value * daily_rate
```

### 50/30/20 Allocation
Automatically splits HELB disbursements:
- 50% (Tuition/Fixed): Automatically earmarked for institution
- 30% (Upkeep/Variable): Allocated for rent, food, utilities
- 20% (Capital/Investment): Moved to Investment Portal

## Setup & Installation

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Create Migrations & Database
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Create Superuser (Admin)
```bash
python manage.py createsuperuser
```

### 4. Run Development Server
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/v1/`

## How to Run the Project

### Quick Start (After Initial Setup)
```bash
# Activate virtual environment (if using venv)
# On Windows PowerShell:
pennyprof\.venv\Scripts\Activate.ps1

# Or on Command Prompt:
# \.venv\Scripts\activate.bat

# Start the Django development server
python manage.py runserver

# Access the application:
# - API: http://localhost:8000/api/v1/
# - Swagger Documentation: http://localhost:8000/api/docs/
# - Admin Panel: http://localhost:8000/admin/
```

### Running with Virtual Environment
```bash
# If you have execution policy issues on Windows:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then activate venv and run:\.venv\Scripts\Activate.ps1
python manage.py runserver
```

### Running Background Tasks (Optional)
```bash
# Start Redis server (required for Celery)
redis-server

# In a new terminal, start Celery worker:
celery -A pennyprof worker -l info

# In another terminal, start Celery beat scheduler:
celery -A pennyprof beat -l info
```

## API Endpoints

### Authentication & Users
```
POST   /api/v1/auth/students/              - Register student
GET    /api/v1/auth/students/me/           - Get current profile
POST   /api/v1/auth/students/update_phone/ - Update phone number
```

### Finance & Wallet
```
GET    /api/v1/finance/wallets/my_wallet/              - Get wallet
GET    /api/v1/finance/transactions/                   - Transaction history
POST   /api/v1/finance/transactions/initiate_deposit/  - Deposit via M-Pesa
```

### Investments & Portfolio
```
POST   /api/v1/invest/positions/allocate/         - Allocate disbursement
GET    /api/v1/invest/positions/portfolio_growth/ - Portfolio summary
GET    /api/v1/invest/positions/daily_accruals/   - Daily interest forecast
GET    /api/v1/invest/allocations/                - Allocation history
```

### HELB & Disbursements
```
GET    /api/v1/helb/accounts/my_account/       - HELB account info
GET    /api/v1/helb/disbursements/              - Disbursement history
GET    /api/v1/helb/disbursements/upcoming/     - Upcoming disbursements
GET    /api/v1/helb/disbursements/overdue/      - Overdue disbursements
GET    /api/v1/helb/projections/                - Disbursement projections
```

## TODO - Next Implementations

### M-Pesa Integration (finance/views.py)
- [ ] Implement Daraja API STK Push
- [ ] Add webhook listener for C2B callbacks
- [ ] Digital signature verification (Safaricom)

### Firebase Auth Bridge (accounts/views.py)
- [ ] JWT verification middleware
- [ ] Student A data isolation from Student B

### Interest Accrual Service
- [ ] Celery background task for daily accrual
- [ ] Cron scheduler for automatic execution

### Portfolio Growth Charts
- [ ] Historical NAV tracking
- [ ] Performance vs benchmark comparison

## Database Models Overview

### Transaction Flow
```
Student Registration 
  ↓ (signals)
  Creates Wallet + HELBAccount
  ↓
HELB Disbursement
  ↓
Create Deposit Transaction
  ↓
Update Wallet Balance
  ↓
Create AllocationPlan (50/30/20)
  ↓
Create InvestmentPosition (20%)
  ↓
Daily Interest Accrual
  ↓
InterestAccrualLog (audit)
```

## Security Considerations

1. **Custom User Model**: All auth flows use `accounts.Student` as the auth user
2. **Firebase UID Mapping**: Bridge between Firebase Auth & Django DB
3. **Transaction Atomicity**: All money movements are wrapped in `@transaction.atomic()`
4. **Wallet Isolation**: Each student can only access their own wallet/transactions
5. **Signature Verification**: M-Pesa callbacks must validate Safaricom signatures
6. **DRF Permissions**: All endpoints require `IsAuthenticated` permission

## Admin Panel

Django admin at `/admin/` provides:
- Student profile management
- Manual transaction entry (for reconciliation)
- HELB account setup & monitoring
- Interest accrual inspection
- Balance snapshot audits

## Configuration

Key settings in `pennyprof/settings.py`:
- **Custom User Model**: `AUTH_USER_MODEL = 'accounts.Student'`
- **DRF Authentication**: Token-based (can be upgraded to JWT)
- **CORS**: Configured for localhost (update for production)
- **Database**: SQLite (upgrade to PostgreSQL for production)

---

**by yours truly artello the awesome**
