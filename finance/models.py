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
        ('ALLOCATION', 'Allocation to Investment'),
        ('INTEREST', 'Interest Earned'),
        ('REALLOCATION', 'Reallocation'),
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
