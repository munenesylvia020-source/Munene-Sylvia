# Implementation Checklist

Complete guide for implementing the remaining features. Follow the priority order.

## Priority 1: Core Finance (Week 1)

### M-Pesa Daraja API Integration
**Status:** Not Started
**File:** `finance/views.py` - `TransactionViewSet.initiate_deposit()`

**Steps:**
1. [ ] Install `requests` library (already in requirements.txt)
2. [ ] Create `finance/mpesa_integration.py` module with:
   - [ ] `get_daraja_access_token()` - OAuth2 token fetch
   - [ ] `initiate_stk_push(phone_number, amount, reference)` - STK Push
   - [ ] `verify_safaricom_signature(data, signature)` - Callback validation
3. [ ] Update `finance/views.py`:
   ```python
   @action(detail=False, methods=['post'])
   def initiate_deposit(self, request):
       # ... validation ...
       # IMPLEMENT: Call mpesa_integration.initiate_stk_push()
       # Return callback URL status
   ```
4. [ ] Implement webhook callback handler:
   ```python
   @action(detail=False, methods=['post'], permission_classes=[AllowAny])
   def webhook_callback(self, request):
       # Receive M-Pesa callback
       # Verify signature
       # Update transaction status
       # Update wallet balance (atomic)
   ```
5. [ ] Test in Safaricom sandbox environment
6. [ ] Update `.env.example` with M-Pesa credentials

**Resources:**
- Safaricom Daraja API Docs: https://developer.safaricom.co.ke/documentation
- Implementation Example: https://github.com/safaricom-daraja/python-daraja

**Estimated Time:** 4-6 hours

---

## Priority 2: Background Tasks (Week 1)

### Celery Setup
**Status:** Not Started
**Files:** `pennyprof/celery.py`, `investments/tasks.py`, `helb/tasks.py`

**Steps:**
1. [ ] Install Redis: `pip install redis`
2. [ ] Start Redis server locally
3. [ ] Install Celery: `pip install celery` (already in requirements.txt)
4. [ ] Update `pennyprof/__init__.py`:
   ```python
   from .celery import app as celery_app
   __all__ = ('celery_app',)
   ```
5. [ ] Start Celery worker:
   ```bash
   celery -A pennyprof worker -l info
   ```
6. [ ] Start Celery beat scheduler:
   ```bash
   celery -A pennyprof beat -l info
   ```
7. [ ] Test background tasks:
   ```python
   from investments.tasks import accrue_daily_interest
   accrue_daily_interest.delay()  # Test async execution
   ```

**Daily Tasks to Implement:**
- [ ] `investments.tasks.accrue_daily_interest` - Daily interest accrual (8 PM)
- [ ] `helb.tasks.check_overdue_disbursements` - Check overdue (9 AM)
- [ ] `helb.tasks.create_disbursement_projections` - Projections (Midnight)

**Estimated Time:** 3-4 hours

---

## Priority 3: Firebase Authentication (Week 2)

### JWT Bridge Configuration
**Status:** Not Started
**Files:** `accounts/views.py`, new middleware file

**Steps:**
1. [ ] Install Firebase Admin SDK:
   ```bash
   pip install firebase-admin
   ```
2. [ ] Download Firebase service account JSON from Google Cloud Console
3. [ ] Store in `pennyprof/firebase-key.json`
4. [ ] Create `accounts/firebase_auth.py`:
   ```python
   import firebase_admin
   from firebase_admin import credentials, auth
   
   cred = credentials.Certificate('pennyprof/firebase-key.json')
   firebase_admin.initialize_app(cred)
   
   def verify_firebase_token(token):
       return auth.verify_id_token(token)
   ```
5. [ ] Create custom DRF authentication class:
   ```python
   class FirebaseAuthentication(TokenAuthentication):
       def authenticate_credentials(self, key):
           # Verify Firebase JWT instead of Django token
   ```
6. [ ] Update `pennyprof/settings.py`:
   ```python
   AUTHENTICATION_CLASSES = [
       'accounts.firebase_auth.FirebaseAuthentication',
   ]
   ```
7. [ ] Update `accounts/views.py`:
   ```python
   @action(detail=False, methods=['get'])
   def sync_firebase_user(self, request):
       # Synchronize Firebase user with Django Student model
   ```

**Firebase Rules to Set:**
```json
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

**Estimated Time:** 5-6 hours

---

## Priority 4: Real-Time Features (Week 2)

### Firebase Firestore Real-Time Sync
**Status:** Not Started
**Files:** New `sync/` app

**Concept:**
```
Django (Source of Truth)
    ↓
    → Create Transaction
    ↓
    → Signal: post_save
    ↓
    → Sync to Firestore
    ↓
    → Firebase notifies mobile app
    ↓
Mobile sees update instantly
```

**Implementation:**
1. [ ] Create `sync/models.py` with sync tracking
2. [ ] Create `sync/signals.py`:
   ```python
   @receiver(post_save, sender=Transaction)
   def sync_transaction_to_firestore(sender, instance, created, **kwargs):
       if created:
           firestore.collection('user_transactions').document(instance.id).set({
               'student_id': instance.student.id,
               'amount': instance.amount,
               'type': instance.transaction_type,
               'created_at': instance.created_at
           })
   ```
3. [ ] Test Firestore real-time listeners
4. [ ] Update frontend to listen for changes

**Estimated Time:** 4-5 hours

---

## Priority 5: Email Notifications (Week 3)

### Email Integration
**Status:** Not Started
**Files:** New `notifications/` app

**Implementation:**
1. [ ] Configure email backend in settings.py:
   ```python
   EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
   EMAIL_HOST = 'smtp.gmail.com'
   EMAIL_PORT = 587
   EMAIL_USE_TLS = True
   EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
   EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
   ```
2. [ ] Create `notifications/email.py`:
   ```python
   def send_deposit_confirmation(student, transaction):
       send_mail(
           f'Deposit Confirmed - KES {transaction.amount}',
           f'Your deposit has been received...',
           'noreply@pennyprof.com',
           [student.email]
       )
   ```
3. [ ] Add signal handlers:
   ```python
   @receiver(post_save, sender=Transaction)
   def email_on_transaction(sender, instance, created, **kwargs):
       if created and instance.status == 'COMPLETED':
           send_deposit_confirmation(instance.student, instance)
   ```

**Estimated Time:** 2-3 hours

---

## Priority 6: Admin Dashboard Enhancements (Week 3)

### Dashboard & Monitoring
**Status:** Not Started
**Files:** `admin.py` files + new dashboard app

**Features:**
1. [ ] Add custom admin dashboard showing:
   - Total users registered
   - Daily deposits received
   - Total invested amount
   - Average portfolio growth
2. [ ] Create admin actions for:
   - Manual transaction creation
   - Bulk disbursement creation
   - Interest accrual testing
3. [ ] Add export functionality:
   - Export transaction history
   - Export student portfolios
4. [ ] Create monitoring views:
   - Failed transactions
   - Overdue disbursements
   - Pending webhooks

**Estimated Time:** 3-4 hours

---

## Priority 7: Testing (Ongoing)

### Unit & Integration Tests
**Status:** Not Started
**Files:** `tests/` directory in each app

**Test Coverage:**
1. [ ] `accounts/tests.py`:
   ```python
   class StudentRegistrationTest(TestCase):
       def test_student_creation_auto_creates_wallet(self):
       def test_student_creation_auto_creates_helb_account(self):
       def test_student_phone_update(self):
   ```
2. [ ] `finance/tests.py`:
   ```python
   class WalletTransactionTest(TestCase):
       def test_atomic_deposit_transaction(self):
       def test_wallet_balance_update(self):
       def test_transaction_ledger_accuracy(self):
   ```
3. [ ] `investments/tests.py`:
   ```python
   class PortfolioTest(TestCase):
       def test_50_30_20_allocation(self):
       def test_daily_interest_accrual(self):
       def test_portfolio_nav_calculation(self):
   ```
4. [ ] `helb/tests.py`:
   ```python
   class DisbursementTest(TestCase):
       def test_disbursement_tracking(self):
       def test_overdue_detection(self):
       def test_projection_accuracy(self):
   ```

**Run Tests:**
```bash
python manage.py test
```

**Estimated Time:** 6-8 hours

---

## Priority 8: Documentation (Ongoing)

### API Documentation
**Status:** Not Started

**Steps:**
1. [ ] Install DRF Swagger:
   ```bash
   pip install drf-spectacular
   ```
2. [ ] Add to INSTALLED_APPS:
   ```python
   'drf_spectacular',
   ```
3. [ ] Update urls.py:
   ```python
   from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
   
   urlpatterns = [
       path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
       path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema')),
   ]
   ```
4. [ ] Access at `http://localhost:8000/api/docs/`
5. [ ] Document each endpoint with docstrings

**Estimated Time:** 2-3 hours

---

## Priority 9: DevOps & Deployment (Week 4)

### Docker Containerization
**Status:** Not Started

**Files to Create:**
1. [ ] `Dockerfile`
2. [ ] `docker-compose.yml`
3. [ ] `.dockerignore`

**Sample Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "pennyprof.wsgi:application", "--bind", "0.0.0.0:8000"]
```

**Deploy to:**
- [ ] Heroku
- [ ] Railway
- [ ] AWS ECS
- [ ] DigitalOcean App Platform

**Estimated Time:** 4-6 hours

---

## Priority 8: Daily Spending Limit & Auto-Disbursement (COMPLETED)

### Daily Limit Feature Implementation
**Status:** ✅ COMPLETED
**Files:** 
- `finance/models.py` - DailyLimit, DailyDisbursement models
- `finance/serializers.py` - DailyLimitSerializer, SetDailyLimitSerializer, DailyDisbursementSerializer
- `finance/views.py` - DailyLimitViewSet with endpoints
- `finance/tasks.py` - Celery tasks for daily disbursement
- `finance/urls.py` - Routes for daily-limit endpoints
- `pennyprof/celery.py` - Beat schedule for daily tasks
- Frontend: `src/pages/DailyLimitSettings.jsx`, `src/styles/dailyLimit.css`

**Implementation Details:**

1. ✅ **Backend Models:**
   - `DailyLimit` - Stores daily spending cap, phone number, disbursement time, remaining balance calculation
   - `DailyDisbursement` - Tracks each daily M-Pesa send with status

2. ✅ **API Endpoints:**
   - `GET /api/v1/finance/daily-limit/` - Get current daily limit
   - `POST/PUT /api/v1/finance/daily-limit/set_limit/` - Set or update daily limit
   - `GET /api/v1/finance/daily-limit/today_remaining/` - Get remaining balance for today
   - `GET /api/v1/finance/daily-limit/disbursement_history/` - View past disbursements

3. ✅ **Celery Tasks:**
   - `process_daily_disbursements` - Scheduled hourly, initiates M-Pesa B2C payments
   - `verify_daily_disbursement_status` - Runs every 5min to check payment status

4. ✅ **Frontend Components:**
   - `DailyLimitSettings` page - Full UI for configuring limit, phone, time
   - Dashboard integration - Shows remaining balance and setup CTA
   - History view - Display past disbursements with status

5. ✅ **Database Migrations:**
   - Models created with proper indexes and constraints
   - Unique constraint: One DailyLimit per student
   - Automatic daily reset of remaining balance based on expenses

**How It Works:**
1. Student sets daily limit (e.g., 2000 KES) and M-Pesa phone number
2. At configured time each day (default 6 AM), Celery task triggers
3. System checks if it's time and hasn't already disbursed today
4. M-Pesa B2C payment initiated to student's phone for the daily amount
5. DailyDisbursement record created with payment status
6. Dashboard shows "Remaining Today" = daily_amount - today's_expenses
7. Student can see disbursement history with success/failure status

**Integration with Existing Features:**
- Works with Wallet and Transaction system
- Respects M-Pesa sandbox/production settings
- Validates phone number format (254XXXXXXXXX)
- Daily amount limited to KES 10-50,000 (configurable)
- Uses existing DarajaClient for M-Pesa integration

**Next Steps for Deployment:**
1. Apply migrations: `python manage.py migrate`
2. Start Celery worker: `celery -A pennyprof worker -l info`
3. Start Celery beat: `celery -A pennyprof beat -l info`
4. Test in sandbox with test phone number
5. Configure timezone in settings (currently Africa/Nairobi)
6. Set up Redis for Celery result backend

---

## Optional: Advanced Features

### SMS Notifications (Optional)
- Integrate with Twilio or Africa's Talking API
- Send transaction confirmations via SMS
- Alert on overdue disbursements

### Analytics & Reporting (Optional)
- Student spending patterns
- Portfolio performance dashboard
- Cohort analysis

### Mobile App Backend Features (Optional)
- Fingerprint/Face ID integration
- Offline transaction queue
- Push notifications

---

## Timeline Summary

| Week | Focus | Priority |
|------|-------|----------|
| Week 1 | M-Pesa + Celery | P1, P2 |
| Week 2 | Firebase + Real-time | P3, P4 |
| Week 3 | Notifications + Admin | P5, P6 |
| Week 4 | Daily Limit Feature | P8 ✅ |
| Week 5+ | Optional features | Extended |

---

## Deployment Readiness Checklist

Before going to production:
- [ ] All tests passing (>80% coverage)
- [ ] M-Pesa integration tested in production environment
- [ ] Firebase UID mapping working
- [ ] Celery tasks running reliably
- [ ] Database backed up daily
- [ ] Monitoring & alerting set up
- [ ] Error tracking (Sentry) configured
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Django security checks passing (`manage.py check --deploy`)
- [ ] Code reviewed by 2+ team members
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

---

**Questions?** Refer to [ARCHITECTURE.md](ARCHITECTURE.md) for system design details or [QUICK_START.md](QUICK_START.md) for setup instructions.
