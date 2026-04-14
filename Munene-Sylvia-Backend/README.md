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

Follow these steps to get the backend running on your local machine. We use MySQL as our primary database and a virtual environment for dependencies.

### 1. Set Up Virtual Environment & Dependencies

First, create and activate a Python virtual environment, then install the required packages.

```bash
# Create a virtual environment (if you don't have one)
python -m venv .venv

# Activate the virtual environment
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Windows Command Prompt:
.\.venv\Scripts\activate.bat
# On macOS/Linux:
source .venv/bin/activate

# Install all project dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

The project uses `.env` files for configuration.
1. Copy the `.env.example` file and rename it to `.env`.
2. Add your local MySQL database credentials to the `.env` file!

```env
# Database Configuration
DB_ENGINE=django.db.backends.mysql
DB_NAME=pennyprof
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
```

### 3. Set Up MySQL Database

Ensure you have MySQL Server running locally.

```bash
# Log into MySQL and create the database
mysql -u root -p
CREATE DATABASE pennyprof CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

### 4. Create Migrations & Database Tables

Once the database is created, run Django migrations to build the tables:

```bash
# Make sure your virtual environment is activated!
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Admin)

Create an admin account so you can log into the Django Admin Dashboard.

```bash
python manage.py createsuperuser
```

---

## How to Run the Project

Running the project on a day-to-day basis is very simple once the initial setup is complete.

### 1. Start the Django Server

Always ensure your virtual environment is activated before running the server.

```bash
# Activate virtual environment (if not already active)
.\.venv\Scripts\Activate.ps1

# Start the development server
python manage.py runserver
```

You can now access:
- **API Base URL**: `http://localhost:8000/api/v1/`
- **Swagger Documentation**: `http://localhost:8000/api/docs/`
- **Admin Panel**: `http://localhost:8000/admin/`

### 2. Running Background Tasks (Optional)

If you are working on the Daily Interest Accrual or automated disbursing features, you need Celery.

```bash
# 1. Start Redis server (make sure you have Redis installed)
redis-server

# 2. Open a new terminal, activate venv, and start Celery worker
celery -A pennyprof worker -l info

# 3. Open another terminal, activate venv, and start Celery beat scheduler
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
