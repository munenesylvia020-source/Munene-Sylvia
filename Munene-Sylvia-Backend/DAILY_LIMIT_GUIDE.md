# Daily Spending Limit & M-Pesa Auto-Disbursement Feature

## Overview

The Daily Spending Limit feature allows students to set a fixed daily allowance that is automatically disbursed via M-Pesa at a configured time each day. The system tracks remaining balance based on daily expenses and provides a streamlined allowance management system.

## Key Features

✅ **Set Custom Daily Limit** - Students configure daily amount (KES 10-50,000)
✅ **Automatic M-Pesa Disbursement** - Daily funds sent automatically via Daraja B2C
✅ **Real-time Remaining Balance** - Dashboard shows "Remaining Today" = Daily Limit - Today's Expenses
✅ **Configurable Disbursement Time** - Choose when daily M-Pesa arrives (e.g., 6 AM daily)
✅ **Disbursement History** - View all daily sends with status (Success/Failed/Pending)
✅ **Phone Number Management** - Secure M-Pesa phone number configuration

## User Flow

### 1. Initial Setup
1. Student navigates to Dashboard
2. Clicks "Set Daily Limit" CTA
3. Enters daily amount, M-Pesa phone, and disbursement time
4. System enables automatic daily disbursements

### 2. Daily Operation
1. Each day at configured time (e.g., 6 AM), Celery task triggers
2. System checks: Is this the first disbursement today?
3. Initiates M-Pesa B2C payment to student's registered phone
4. M-Pesa notification arrives on student's phone
5. Funds added to wallet balance
6. Dashboard updates "Remaining Today" = daily_amount - today's_expenses

### 3. Expense Tracking
1. Student logs expenses throughout the day
2. Dashboard dynamically shows remaining balance
3. When "Remaining Today" reaches 0, no new expenses can be logged (optional enforcement)

### 4. Viewing History
1. Student clicks "Settings" on Daily Limit card
2. Views last 30 disbursements with dates and status
3. Can modify daily limit settings anytime

## API Endpoints

### Get Current Daily Limit
```
GET /api/v1/finance/daily-limit/
Authorization: Token <auth_token>
```
**Response:**
```json
{
  "id": 1,
  "student": 5,
  "daily_amount": "2000.00",
  "phone_number": "254712345678",
  "is_active": true,
  "disbursement_time": "06:00:00",
  "remaining_today": 1850.50,
  "last_disbursement_date": "2024-01-15"
}
```

### Set or Update Daily Limit
```
POST /api/v1/finance/daily-limit/set_limit/
Authorization: Token <auth_token>
Content-Type: application/json

{
  "daily_amount": 2000,
  "phone_number": "254712345678",
  "disbursement_time": "06:00",
  "is_active": true
}
```

### Get Today's Remaining Balance
```
GET /api/v1/finance/daily-limit/today_remaining/
Authorization: Token <auth_token>
```
**Response:**
```json
{
  "remaining": 1850.50,
  "daily_amount": 2000,
  "is_active": true,
  "last_disbursement_date": "2024-01-15",
  "next_disbursement_time": "06:00:00"
}
```

### Get Disbursement History
```
GET /api/v1/finance/daily-limit/disbursement_history/
Authorization: Token <auth_token>
```
**Response:**
```json
[
  {
    "id": 45,
    "student": 5,
    "daily_limit": 1,
    "amount": "2000.00",
    "phone_number": "254712345678",
    "status": "SUCCESS",
    "disbursement_date": "2024-01-15",
    "b2c_transaction": 123
  },
  {
    "id": 44,
    "student": 5,
    "daily_limit": 1,
    "amount": "2000.00",
    "phone_number": "254712345678",
    "status": "SUCCESS",
    "disbursement_date": "2024-01-14",
    "b2c_transaction": 122
  }
]
```

## Backend Implementation

### Models

#### DailyLimit
```python
class DailyLimit(models.Model):
    student = OneToOneField(Student)
    daily_amount = DecimalField(max_digits=10, decimal_places=2)  # KES 10-50000
    phone_number = CharField(max_length=20)  # 254XXXXXXXXX format
    is_active = BooleanField(default=False)
    disbursement_time = TimeField(default='06:00:00')  # Daily send time
    remaining_today = DecimalField(computed)  # daily_amount - today's expenses
    last_disbursement_date = DateField(null=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    
    def get_remaining_today(self):
        """Calculate remaining balance based on today's expenses."""
        today = date.today()
        today_expenses = Expense.objects.filter(
            student=self.student,
            date=today
        ).aggregate(total=Sum('amount'))['total'] or 0
        return max(0, self.daily_amount - today_expenses)
```

#### DailyDisbursement
```python
class DailyDisbursement(models.Model):
    student = ForeignKey(Student)
    daily_limit = ForeignKey(DailyLimit)
    amount = DecimalField(max_digits=10, decimal_places=2)
    phone_number = CharField(max_length=20)
    status = CharField(choices=[
        ('INITIATED', 'Initiated'),
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed')
    ])
    disbursement_date = DateField()
    b2c_transaction = ForeignKey(B2CTransaction, null=True)
    created_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('daily_limit', 'disbursement_date')
```

### Celery Tasks

#### process_daily_disbursements (Hourly)
- Runs: Every hour on the hour
- Checks all active daily limits
- Verifies it's time for disbursement (compares current time with disbursement_time)
- Checks if already disbursed today
- Initiates M-Pesa B2C payment via DarajaClient
- Creates DailyDisbursement record
- Updates last_disbursement_date

#### verify_daily_disbursement_status (Every 5 mins)
- Checks pending disbursements from last 24 hours
- Queries M-Pesa for status updates
- Updates DailyDisbursement status based on webhook confirmations
- Handles failed disbursements (logs for retry tomorrow)

## Frontend Implementation

### Components

#### DailyLimitSettings Page
- Location: `src/pages/DailyLimitSettings.jsx`
- Features:
  - Display current daily limit card with remaining balance
  - Form to set/update daily amount, phone, time
  - Input validation (amount 10-50k, phone format 254XXXXXXXXX)
  - Success/error messages
  - History table with last 10 disbursements
  - Toggle to enable/disable auto-disbursement

#### Dashboard Integration
- Shows "Remaining Today" card when limit is active
- Displays "Set Daily Limit" CTA when not configured
- Updates remaining balance in real-time
- Navigation to settings page

### API Service Methods
```javascript
finance.getDailyLimit()            // Get current limit
finance.setDailyLimit(data)        // Set/update limit
finance.getTodayRemaining()        // Get remaining balance
finance.getDisbursementHistory()   // Get past disbursements
```

## Configuration

### Django Settings (settings.py)
```python
# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'process-daily-disbursements': {
        'task': 'finance.tasks.process_daily_disbursements',
        'schedule': crontab(minute=0),  # Every hour on the hour
    },
    'verify-disbursement-status': {
        'task': 'finance.tasks.verify_daily_disbursement_status',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
}

# Timezone (should match M-Pesa regional settings)
CELERY_TIMEZONE = 'Africa/Nairobi'  # East African Time
```

### Environment Variables
```bash
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
MPESA_CONSUMER_KEY=<your_key>
MPESA_CONSUMER_SECRET=<your_secret>
MPESA_BUSINESS_SHORTCODE=600371
MPESA_PASSKEY=<your_passkey>
```

## Running the Feature

### 1. Start Redis
```bash
redis-server
# or with Docker
docker run -d -p 6379:6379 redis:latest
```

### 2. Apply Migrations
```bash
python manage.py migrate
```

### 3. Start Celery Worker
```bash
celery -A pennyprof worker -l info
```

### 4. Start Celery Beat (in separate terminal)
```bash
celery -A pennyprof beat -l info
# For production, use:
celery -A pennyprof worker --beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### 5. Test Endpoints
```bash
# Get daily limit
curl -H "Authorization: Token <TOKEN>" http://localhost:8000/api/v1/finance/daily-limit/

# Set daily limit
curl -X POST -H "Authorization: Token <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"daily_amount": 2000, "phone_number": "254712345678"}' \
  http://localhost:8000/api/v1/finance/daily-limit/set_limit/
```

## Security Considerations

✅ **Phone Number Validation** - Enforced 254XXXXXXXXX format
✅ **Amount Limits** - KES 10-50,000 daily cap prevents abuse
✅ **Authentication** - All endpoints require valid token
✅ **Unique Constraint** - One daily limit per student
✅ **Idempotency** - Daily disbursement can't happen twice per day
✅ **M-Pesa Integration** - Uses secure Daraja API with credentials in environment

## Troubleshooting

### Daily disbursement not triggering
1. Check Celery worker: `celery -A pennyprof inspect active`
2. Verify beat schedule: `celery -A pennyprof inspect scheduled`
3. Check Redis connection: `redis-cli ping`
4. Verify task logs: `celery -A pennyprof worker -l debug`

### Remaining balance not updating
1. Check that expenses are created with today's date
2. Verify DailyLimit.get_remaining_today() calculation
3. Check timezone setting (should be Africa/Nairobi for EAT)

### M-Pesa payment failed
1. Verify phone format: `254712345678` (no spaces/dashes)
2. Check Daraja credentials in environment variables
3. Ensure sandbox mode is enabled for testing
4. Check B2CTransaction status in admin panel

## Testing

### Unit Tests
```python
from django.test import TestCase
from finance.models import DailyLimit, DailyDisbursement
from accounts.models import Student

class DailyLimitTests(TestCase):
    def setUp(self):
        self.student = Student.objects.create_user(
            email='student@test.com',
            password='testpass123'
        )
        
    def test_daily_limit_creation(self):
        limit = DailyLimit.objects.create(
            student=self.student,
            daily_amount=2000,
            phone_number='254712345678'
        )
        self.assertEqual(limit.daily_amount, 2000)
        
    def test_remaining_calculation(self):
        # Create limit and expense
        # Verify get_remaining_today() returns correct value
        pass
```

## Future Enhancements

- [ ] Integrate with SMS gateway for disbursement notifications
- [ ] Support multiple disbursement frequencies (weekly, bi-weekly)
- [ ] Setup withdrawal limits tied to daily limit
- [ ] Student can request manual disbursement
- [ ] Admin dashboard to monitor disbursement status
- [ ] Retry logic for failed disbursements
- [ ] Analytics on spending patterns vs daily limit
