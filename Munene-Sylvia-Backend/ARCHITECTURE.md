# System Architecture - Premier Consolidated Capital Holdings

A comprehensive overview of the backend architecture, data flow, and integration points.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Flutter/Web Frontend                         │
│               (Firebase Auth + Real-time Updates)               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST + WebSocket
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Django REST API (DRF)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Middleware Stack                        │   │
│  │  - CORS Handler        - Auth Token Verification        │   │
│  │  - Security Headers    - Request Logging                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │  Accounts    │ │   Finance    │ │ Investments  │             │
│  │  (Auth)      │ │  (Ledger)    │ │ (Portfolio)  │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│  ┌──────────────┐                                               │
│  │    HELB      │        (4 Django Apps)                        │
│  │  (Tracking)  │                                               │
│  └──────────────┘                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────┴────┬────────────┬──────────────┐
                    ↓         ↓            ↓              ↓
            ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐
            │ PostgreSQL │ │  Cache   │ │  M-Pesa    │ │ Firebase │
            │ (Source of │ │  (Redis) │ │  Daraja    │ │(Auth+RT) │
            │   Truth)   │ │          │ │  (STK Push)│ │          │
            └────────────┘ └──────────┘ └────────────┘ └──────────┘
```

## Data Model Relationships

```
Student (auth.Student)
    ├── OneToOne: Wallet (finance.Wallet)
    │   ├── Many: Transactions (finance.Transaction)
    │   ├── Many: Expenses (finance.Expense)
    │   └── Many: BalanceSnapshots (finance.BalanceSnapshot)
    │
    ├── OneToOne: Budget (finance.Budget)
    │   └── Per-category spending limits
    │
    └── OneToOne: HELBAccount (helb.HELBAccount)
        ├── Many: Disbursements (helb.Disbursement)
        ├── One: DisbursementSchedule (helb.DisbursementSchedule)
        └── Many: DisbursementProjections (helb.DisbursementProjection)
```

## Transaction Flow Diagram

### 1. Student Registration & Setup
```
POST /api/v1/auth/students/
    ↓
Student.objects.create_user()
    ↓ (signals.py - post_save)
    ├─→ Wallet.objects.create()  (Default balance = 0)
    └─→ HELBAccount.objects.create()  (Default amount = 0)
    ↓
Response with student profile
```

### 2. HELB Disbursement Receipt (Simulated)
```
1. Admin creates Disbursement record
   - expected_date = future date
   - amount = KES 100,000
   - status = PENDING

2. When date arrives → Admin/System updates:
   - status = COMPLETED
   - disbursal_date = today
   - received_date = today
   ↓
3. Frontend detects new disbursement
4. Student views disbursement in app
```

### 3. Money Flow: Deposit → Wallet → Track Expenses
```
POST /api/v1/finance/c2b/initiate/
    ↓
Create M-Pesa Transaction (status=PENDING)
    ↓
Daraja API C2B simulation triggered
    ↓
Safaricom sends callback webhook
    ↓
POST /api/v1/finance/c2b/callback/
    ↓
@transaction.atomic:
    - Verify transaction details
    - M-Pesa Transaction.status = COMPLETED
    - Wallet.balance += amount
    - Wallet.save()
    ↓
Money now in Wallet (Available for use or withdrawal)
    ↓
Student can now:
a) Withdraw via B2C to M-Pesa
b) Track expenses against budget
c) Monitor spending by category
```

### 4. Expense Tracking & Budget Monitoring
```
POST /api/v1/finance/expenses/
{
  "description": "Lunch",
  "category": "Food",
  "amount": 500
}
    ↓
Expense created and linked to student
    ↓
GET /api/v1/finance/budget/
    ↓
Returns per-category limits:
{
  "food_limit": 8000,
  "accommodation_limit": 10000,
  "transport_limit": 3000,
  ...
}
    ↓
Frontend calculates spending vs budget for each category
    ↓
Dashboard shows progress bars and warnings
```

## App-by-App Architecture

### accounts/ - Authentication & Profile Management

**Key Files:**
- `models.py`: Student (custom user model with Firebase UID)
- `views.py`: StudentViewSet (register, profile, phone update)
- `serializers.py`: Registration & detail serializers
- `signals.py`: Auto-create Wallet & HELBAccount on user creation
- `admin.py`: Admin interface for student management

**Database Tables:**
```sql
accounts_student
  ├─ id (PK)
  ├─ username (unique)
  ├─ email (unique)
  ├─ firebase_uid (unique, nullable)
  ├─ registration_number (unique, nullable)
  ├─ phone_number (nullable)
  ├─ institution_name
  ├─ date_of_onboarding (auto_now_add)
  └─ is_active_student (bool)
```

**API Endpoints:**
```
POST   /api/v1/auth/students/               → Register
GET    /api/v1/auth/students/{id}/          → Get student
GET    /api/v1/auth/students/me/            → Current user profile
PUT    /api/v1/auth/students/{id}/          → Update profile
POST   /api/v1/auth/students/update_phone/  → Update M-Pesa number
```

### finance/ - Financial Ledger & Wallet

**Key Files:**
- `models.py`: Wallet, Transaction, BalanceSnapshot
- `views.py`: WalletViewSet, TransactionViewSet, deposit initiation
- `serializers.py`: Wallet, Transaction, and deposit serializers
- `admin.py`: Ledger admin interface

**Database Tables:**
```sql
finance_wallet
  ├─ id (PK)
  ├─ student_id (FK, unique)
  ├─ balance (decimal)
  ├─ currency (default='KES')
  └─ created_at, updated_at

finance_transaction
  ├─ id (PK)
  ├─ student_id (FK)
  ├─ wallet_id (FK)
  ├─ transaction_type (DEPOSIT|WITHDRAWAL|ALLOCATION|INTEREST|REALLOCATION)
  ├─ amount (decimal)
  ├─ status (PENDING|COMPLETED|FAILED)
  ├─ mpesa_reference (unique, nullable)
  ├─ description
  └─ created_at, updated_at

finance_balancesnapshot
  ├─ id (PK)
  ├─ wallet_id (FK)
  ├─ balance (decimal)
  ├─ snapshot_date (auto_now_add)
  └─ notes
```

**Transaction Atomicity Pattern:**
```python
with transaction.atomic():
    wallet.balance += amount
    wallet.save()
    Transaction.objects.create(
        student=student,
        wallet=wallet,
        transaction_type='DEPOSIT',
        amount=amount,
        status='COMPLETED'
    )
    # If any operation fails, entire block rolls back
```

**API Endpoints:**
```
GET    /api/v1/finance/wallets/my_wallet/              → Wallet balance
GET    /api/v1/finance/transactions/                   → Transaction history
POST   /api/v1/finance/transactions/initiate_deposit/  → Start deposit
POST   /api/v1/finance/transactions/webhook_callback/  → M-Pesa callback
GET    /api/v1/finance/balance-snapshots/              → Balance history
```

### investments/ - Portfolio & Interest Accrual

**Key Files:**
- `models.py`: AllocationPlan, InvestmentPosition, InterestAccrualLog
- `views.py`: Position allocation, portfolio growth, interest tracking
- `serializers.py`: Portfolio, allocation, and accrual serializers
- `admin.py`: Portfolio admin interface

**Database Tables:**
```sql
investments_allocationplan
  ├─ id (PK)
  ├─ student_id (FK)
  ├─ total_amount (decimal)
  ├─ tuition_amount (50% breakdown)
  ├─ upkeep_amount (30% breakdown)
  ├─ investment_amount (20% breakdown)
  ├─ status (ACTIVE|COMPLETED|ARCHIVED)
  └─ created_at, updated_at

investments_investmentposition
  ├─ id (PK)
  ├─ student_id (FK)
  ├─ allocation_id (FK, nullable)
  ├─ fund_type (MMF|CONSOLIDATED)
  ├─ fund_name
  ├─ principal_amount (decimal)
  ├─ current_value (decimal with interest)
  ├─ accumulated_interest (decimal)
  ├─ annual_yield_percentage (decimal)
  ├─ status (ACTIVE|LIQUIDATED|MATURED)
  ├─ investment_date (auto_now_add)
  ├─ last_interest_accrual (auto_now_add)
  └─ updated_at

investments_interestaccruallog
  ├─ id (PK)
  ├─ position_id (FK)
  ├─ interest_accrued (decimal 4 places)
  ├─ value_before (decimal)
  ├─ value_after (decimal)
  └─ accrual_date (auto_now_add)
```

**50/30/20 Allocation Logic:**
```python
@staticmethod
def create_allocation(student, total_amount):
    tuition = total_amount * Decimal('0.50')      # 50%
    upkeep = total_amount * Decimal('0.30')       # 30%
    investment = total_amount * Decimal('0.20')   # 20%
    return AllocationPlan.objects.create(
        student=student,
        total_amount=total_amount,
        tuition_amount=tuition,
        upkeep_amount=upkeep,
        investment_amount=investment
    )
```

**Daily Interest Calculation:**
```python
def calculate_daily_interest(self):
    daily_rate = self.annual_yield_percentage / 365 / 100
    daily_interest = self.current_value * daily_rate
    return daily_interest
```

**API Endpoints:**
```
POST   /api/v1/invest/positions/allocate/         → Create 50/30/20 split
GET    /api/v1/invest/positions/portfolio_growth/ → Portfolio summary
GET    /api/v1/invest/positions/daily_accruals/   → Daily interest forecast
GET    /api/v1/invest/allocations/                → Allocation history
GET    /api/v1/invest/accrual-logs/               → Interest audit trail
```

### helb/ - HELB Tracking & Projections

**Key Files:**
- `models.py`: HELBAccount, Disbursement, DisbursementSchedule, DisbursementProjection
- `views.py`: Account, disbursement, and projection endpoints
- `serializers.py`: Account, disbursement, and projection serializers
- `admin.py`: HELB admin interface
- `management/commands/create_sample_disbursements.py`: Test data generator

**Database Tables:**
```sql
helb_helbaccount
  ├─ id (PK)
  ├─ student_id (FK, unique)
  ├─ helb_reference_number (unique, nullable)
  ├─ total_approved_amount (decimal)
  ├─ course_duration_years (integer)
  ├─ total_disbursed (decimal)
  ├─ remaining_balance (decimal)
  ├─ account_created_at (auto_now_add)
  └─ updated_at

helb_disbursement
  ├─ id (PK)
  ├─ helb_account_id (FK)
  ├─ student_id (FK)
  ├─ amount (decimal)
  ├─ expected_date (date)
  ├─ disbursal_date (date, nullable)
  ├─ received_date (date, nullable)
  ├─ status (PENDING|APPROVED|COMPLETED|FAILED|CANCELLED)
  ├─ notes
  └─ created_at, updated_at

helb_disbursementschedule
  ├─ id (PK)
  ├─ helb_account_id (FK, unique)
  ├─ disbursement_frequency (SEMESTER|QUARTERLY|MONTHLY|ANNUAL)
  ├─ schedule_json (JSON projected schedule)
  ├─ created_at
  └─ updated_at

helb_disbursementprojection
  ├─ id (PK)
  ├─ helb_account_id (FK)
  ├─ projected_date (date when projection was made)
  ├─ next_disbursement_date (date projected)
  ├─ projected_amount (decimal, nullable)
  ├─ confidence_level (HIGH|MEDIUM|LOW)
  └─ created_at
```

**Disbursement Timeline:**
```
Expected Disbursement
    → expected_date = June 30, 2024
    → status = PENDING

Disbursement Approved
    → status = APPROVED (optional state)

Disbursement Sent
    → disbursal_date = June 30, 2024
    → status = COMPLETED

Money Arrives in M-Pesa
    → received_date = June 30, 2024
    → Can now be deposited into app wallet
```

**API Endpoints:**
```
GET    /api/v1/helb/accounts/my_account/           → HELB account info
GET    /api/v1/helb/disbursements/                 → All disbursements
GET    /api/v1/helb/disbursements/upcoming/        → Next 5 disbursements
GET    /api/v1/helb/disbursements/overdue/         → Overdue disbursements
GET    /api/v1/helb/projections/                   → Disbursement forecast
```

## Authentication & Authorization

### Current Implementation (Token-Based)
```
POST /api/v1/auth/students/
    ↓
Returns token via DRF TokenAuthentication
    ↓
Header: Authorization: Token abc123def456
    ↓
@permission_classes([IsAuthenticated])
    ↓
request.user = authenticated Student
```

### Future: Firebase JWT Integration
```
1. Student logs in via Firebase Auth (Flutter)
2. Firebase returns JWT token
3. Frontend sends: Authorization: Bearer firebase_jwt
4. Django middleware verifies JWT via firebase_admin
5. Extracts firebase_uid and maps to Student
6. Cross-database sync between Firebase & Django
```

## Security Considerations

### Database Transaction Safety
All money movements wrapped in `@transaction.atomic()`:
- Prevents race conditions
- Ensures ledger consistency
- Rollbacks if any operation fails

### Data Isolation
- Students can only access their own finances
- `get_queryset()` filters by `student=request.user`
- Admin panel has audit trails for all operations

### M-Pesa Callback Verification (TODO)
```python
def verify_safaricom_signature(callback_data, signature):
    # Validate HMAC-SHA-256 signature from Safaricom
    # Prevents spoofed transactions
```

### Firebase UID Mapping
- `Student.firebase_uid` bridges Firebase Auth & Django DB
- Enables cross-database authentication
- Allows real-time sync via Firebase

## Deployment Checklist

### Pre-Production
- [ ] Change `DEBUG = False` in settings.py
- [ ] Generate strong `SECRET_KEY`
- [ ] Set up PostgreSQL (not SQLite)
- [ ] Configure environment variables (.env file)
- [ ] Set `ALLOWED_HOSTS` to actual domain
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for frontend domain
- [ ] Set up Redis for caching
- [ ] Configure Celery for background tasks
- [ ] Implement M-Pesa Daraja API integration
- [ ] Set up Firebase authentication
- [ ] Configure email backend for notifications
- [ ] Set up monitoring & logging
- [ ] Run security checks: `python manage.py check --deploy`

## Performance Optimization

### Database Indexes
Already configured on:
- `Transaction`: (student, created_at)
- `Transaction`: (status, created_at)
- `InvestmentPosition`: (student, status)
- `InvestmentPosition`: (status, last_interest_accrual)
- `Disbursement`: (student, status)
- `Disbursement`: (expected_date)

### Caching Strategy (TODO)
```python
# Cache wallet balance for 5 minutes
cache.set(f'wallet_{student_id}', amount, 300)

# Cache portfolio calculations for 1 minute
cache.set(f'portfolio_{student_id}', data, 60)
```

### Pagination
Default: 20 items per page (configurable in settings.py)

## Monitoring & Observability

### Logging
Configured basic console logging. TODO:
- [ ] Structured logging (JSON)
- [ ] Log aggregation (ELK stack)
- [ ] Application monitoring (New Relic, DataDog)

### Metrics to Track
- Transaction success rate
- API response times
- Failed webhook callbacks
- Daily interest accrual accuracy
- Wallet balance consistency

## Troubleshooting Common Issues

### Foreign Key Integrity Errors
Ensure signals are correctly configured in apps.py ready() method.

### Duplicate Wallet/HELB Account Creation
Check that signals are only triggered once per student creation.

### Interest Accrual Not Running
Ensure Celery is configured and scheduler is running.

### M-Pesa Callback 404
Verify webhook endpoint is publicly accessible and DNS is correct.

---

**Last Updated:** 2024
**Lead Architect:** Backend Development Team
