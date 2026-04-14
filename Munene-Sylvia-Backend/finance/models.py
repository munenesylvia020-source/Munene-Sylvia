from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, DecimalValidator
from decimal import Decimal
from django.db import transaction

Student = get_user_model()


class Wallet(models.Model):
    """Student wallet for holding available funds."""
    
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Available balance in wallet"
    )
    currency = models.CharField(max_length=3, default='KES')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Wallet'
        verbose_name_plural = 'Wallets'
    
    def __str__(self):
        return f"{self.student.username}'s Wallet - KES {self.balance}"


class Transaction(models.Model):
    """Atomic ledger entries for all money movements."""
    
    TRANSACTION_TYPES = [
        ('DEPOSIT', 'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('EXPENSE', 'Expense'),
    ]
    
    STATUSES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='transactions')
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    status = models.CharField(max_length=20, choices=STATUSES, default='PENDING')
    description = models.TextField(blank=True, null=True)
    mpesa_reference = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        unique=True,
        help_text="M-Pesa transaction reference"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', '-created_at']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.transaction_type} - KES {self.amount} - {self.status}"
    
    @staticmethod
    @transaction.atomic
    def create_deposit(student, amount, mpesa_ref=None):
        """Create a deposit transaction atomically."""
        wallet = student.wallet
        
        trans = Transaction.objects.create(
            student=student,
            wallet=wallet,
            transaction_type='DEPOSIT',
            amount=amount,
            status='COMPLETED',
            mpesa_reference=mpesa_ref,
            description=f"M-Pesa deposit"
        )
        
        wallet.balance += amount
        wallet.save()
        
        return trans


class BalanceSnapshot(models.Model):
    """Historical snapshot of wallet balance for reconciliation."""
    
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='balance_snapshots')
    balance = models.DecimalField(max_digits=15, decimal_places=2)
    snapshot_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Balance Snapshot'
        verbose_name_plural = 'Balance Snapshots'
        ordering = ['-snapshot_date']
    
    def __str__(self):
        return f"{self.wallet.student.username} - KES {self.balance} @ {self.snapshot_date}"


class Expense(models.Model):
    """Expense record for student budgeting."""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='General')
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    date = models.DateField(auto_now_add=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Expense'
        verbose_name_plural = 'Expenses'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.student.username} - {self.category} - KES {self.amount}"


class Budget(models.Model):
    """Student's monthly budget limits for expense tracking."""
    
    CATEGORIES = [
        ('Accommodation', 'Accommodation'),
        ('Food', 'Food'),
        ('Transport', 'Transport'),
        ('Entertainment', 'Entertainment'),
        ('Healthcare', 'Healthcare'),
        ('Education', 'Education'),
        ('Utilities', 'Utilities'),
        ('Other', 'Other'),
    ]
    
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='budget')
    
    # Per-category limits
    accommodation_limit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=10000,
        help_text="Monthly accommodation limit"
    )
    food_limit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=8000,
        help_text="Monthly food limit"
    )
    transport_limit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=3000,
        help_text="Monthly transport limit"
    )
    entertainment_limit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=2000,
        help_text="Monthly entertainment limit"
    )
    healthcare_limit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=2000,
        help_text="Monthly healthcare limit"
    )
    education_limit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=5000,
        help_text="Monthly education limit"
    )
    utilities_limit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=2000,
        help_text="Monthly utilities limit"
    )
    other_limit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=3000,
        help_text="Monthly other limit"
    )
    
    category_due_dates = models.JSONField(
        default=dict,
        blank=True,
        help_text="Expected disbursement dates per category, e.g. {'Rent': '2026-05-01'}"
    )
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Budget'
        verbose_name_plural = 'Budgets'

    def __str__(self):
        return f"{self.student.username} Budget"
    
    def get_category_limit(self, category):
        """Get the limit for a specific category"""
        field_name = f"{category.lower()}_limit"
        return getattr(self, field_name, 0)


class MpesaTransaction(models.Model):
    """M-Pesa C2B deposit transactions."""
    
    STATUSES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='mpesa_transactions')
    phone_number = models.CharField(max_length=20, help_text="Phone number that sent money")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('1'))])
    mpesa_code = models.CharField(
        max_length=50,
        unique=True,
        help_text="M-Pesa transaction code (e.g., LILNDLC42)"
    )
    phone_number_initiator = models.CharField(max_length=20, help_text="Initiating phone number")
    status = models.CharField(max_length=20, choices=STATUSES, default='PENDING')
    transaction_id = models.CharField(
        max_length=100,
        unique=True,
        help_text="Daraja C2B transaction ID from M-Pesa"
    )
    reference = models.CharField(max_length=100, help_text="Reference/description")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'M-Pesa Transaction'
        verbose_name_plural = 'M-Pesa Transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['student', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.mpesa_code} - KES {self.amount} - {self.status}"


class B2CTransaction(models.Model):
    """M-Pesa B2C disbursement transactions."""
    
    STATUSES = [
        ('INITIATED', 'Initiated'),
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]
    
    PURPOSE_CODES = [
        ('SalaryPayment', 'Salary Payment'),
        ('BusinessPayment', 'Business Payment'),
        ('PromotionalPayment', 'Promotional Payment'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='b2c_transactions')
    phone_number = models.CharField(max_length=20, help_text="Recipient phone number")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('1'))])
    purpose = models.CharField(max_length=50, choices=PURPOSE_CODES, default='BusinessPayment')
    status = models.CharField(max_length=20, choices=STATUSES, default='INITIATED')
    
    # Daraja response fields
    conversation_id = models.CharField(max_length=100, null=True, blank=True, unique=True)
    originator_conversation_id = models.CharField(max_length=100, null=True, blank=True, unique=True)
    response_code = models.CharField(max_length=10, null=True, blank=True)
    response_description = models.TextField(null=True, blank=True)
    
    # Callback fields
    result_code = models.CharField(max_length=10, null=True, blank=True)
    result_description = models.TextField(null=True, blank=True)
    transaction_id = models.CharField(max_length=100, null=True, blank=True, unique=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'B2C Transaction'
        verbose_name_plural = 'B2C Transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['student', '-created_at']),
        ]
    
    def __str__(self):
        return f"B2C: {self.phone_number} - KES {self.amount} - {self.status}"


class DailyLimit(models.Model):
    """Daily spending limit for a student with auto-disbursement."""
    
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='daily_limit')
    daily_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('10'))],
        help_text="Daily budget limit to send to phone"
    )
    phone_number = models.CharField(
        max_length=20,
        help_text="Phone number to send daily limit (254XXXXXXXXX format)"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Enable/disable automatic daily disbursement"
    )
    disbursement_time = models.TimeField(
        default='06:00:00',
        help_text="Time to send daily amount (HH:MM:SS format, in EAT)"
    )
    remaining_today = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Remaining amount for today"
    )
    last_disbursement_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date of last daily disbursement"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Daily Limit'
        verbose_name_plural = 'Daily Limits'
    
    def __str__(self):
        return f"{self.student.username} - Daily: KES {self.daily_amount}"
    
    def get_remaining_today(self):
        """Calculate remaining amount for today based on expenses."""
        from django.utils import timezone
        today = timezone.now().date()
        
        # Get today's expenses
        today_expenses = Expense.objects.filter(
            student=self.student,
            date=today
        ).aggregate(total=models.Sum('amount'))
        
        total_spent = today_expenses['total'] or Decimal('0')
        return max(Decimal('0'), self.daily_amount - total_spent)


class DailyDisbursement(models.Model):
    """Record of daily M-Pesa disbursements."""
    
    STATUSES = [
        ('INITIATED', 'Initiated'),
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='daily_disbursements')
    daily_limit = models.ForeignKey(DailyLimit, on_delete=models.CASCADE, related_name='disbursements')
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Amount sent")
    phone_number = models.CharField(max_length=20, help_text="Recipient phone number")
    status = models.CharField(max_length=20, choices=STATUSES, default='INITIATED')
    disbursement_date = models.DateField(auto_now_add=True, help_text="Date of disbursement")
    
    # B2C transaction tracking
    b2c_transaction = models.ForeignKey(
        B2CTransaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='daily_disbursement'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Daily Disbursement'
        verbose_name_plural = 'Daily Disbursements'
        ordering = ['-disbursement_date']
        indexes = [
            models.Index(fields=['student', '-disbursement_date']),
            models.Index(fields=['status', '-disbursement_date']),
        ]
        unique_together = ('student', 'disbursement_date')
    
    def __str__(self):
        return f"{self.student.username} - {self.disbursement_date} - KES {self.amount} - {self.status}"


class FundSource(models.Model):
    """Track different income sources for students (HELB, Salary, Scholarship, Parents, etc)."""
    
    SOURCE_TYPES = [
        ('HELB', 'HELB Loan'),
        ('SALARY', 'Salary/Employment'),
        ('SCHOLARSHIP', 'Scholarship'),
        ('PARENTS', 'Parents/Family'),
        ('SAVINGS', 'Personal Savings'),
        ('PART_TIME', 'Part-time Work'),
        ('OTHER', 'Other'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fund_sources')
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES)
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Amount received from this source"
    )
    frequency = models.CharField(
        max_length=20,
        default='ONE_TIME',
        choices=[
            ('ONE_TIME', 'One-time'),
            ('WEEKLY', 'Weekly'),
            ('MONTHLY', 'Monthly'),
            ('SEMESTER', 'Per Semester'),
            ('ANNUAL', 'Annual'),
        ],
        help_text="How often the student receives this income"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Additional details about this income source"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this source is currently active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Fund Source'
        verbose_name_plural = 'Fund Sources'
        ordering = ['-created_at']
        unique_together = ('student', 'source_type')
    
    def __str__(self):
        return f"{self.student.username} - {self.get_source_type_display()} - KES {self.amount}"
