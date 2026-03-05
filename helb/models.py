from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

Student = get_user_model()


class HELBAccount(models.Model):
    """Track student's HELB account details and disbursement schedule."""
    
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='helb_account')
    
    # HELB Account Info
    helb_reference_number = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="HELB unique account reference"
    )
    total_approved_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Total approved HELB loan amount"
    )
    
    course_duration_years = models.PositiveIntegerField(
        default=4,
        help_text="Expected course duration in years"
    )
    
    # Tracking
    total_disbursed = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    remaining_balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    account_created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'HELB Account'
        verbose_name_plural = 'HELB Accounts'
    
    def __str__(self):
        return f"{self.student.username} - HELB {self.helb_reference_number}"
    
    def calculate_next_disbursement(self):
        """Estimate next HELB disbursement date."""
        last_disbursement = self.disbursements.filter(
            status='COMPLETED'
        ).order_by('-disbursal_date').first()
        
        if not last_disbursement:
            # First disbursement typically at course start
            return self.account_created_at + timedelta(days=30)
        
        # Usually every semester (6 months)
        return last_disbursement.disbursal_date + timedelta(days=180)


class Disbursement(models.Model):
    """Individual HELB disbursement entries."""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    helb_account = models.ForeignKey(
        HELBAccount,
        on_delete=models.CASCADE,
        related_name='disbursements'
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='helb_disbursements'
    )
    
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Timeline
    expected_date = models.DateField(help_text="Expected disbursement date")
    disbursal_date = models.DateField(
        null=True,
        blank=True,
        help_text="Actual disbursement date"
    )
    received_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date received in M-Pesa"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Disbursement'
        verbose_name_plural = 'Disbursements'
        ordering = ['-expected_date']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['expected_date']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - KES {self.amount} ({self.status})"
    
    @property
    def is_overdue(self):
        """Check if disbursement is overdue."""
        if self.status == 'COMPLETED':
            return False
        return timezone.now().date() > self.expected_date


class DisbursementSchedule(models.Model):
    """Projected disbursement schedule for the entire course."""
    
    helb_account = models.OneToOneField(
        HELBAccount,
        on_delete=models.CASCADE,
        related_name='disbursement_schedule'
    )
    
    # Expected disbursement frequency
    disbursement_frequency = models.CharField(
        max_length=20,
        choices=[
            ('SEMESTER', 'Per Semester'),
            ('QUARTERLY', 'Per Quarter'),
            ('MONTHLY', 'Monthly'),
            ('ANNUAL', 'Annual'),
        ],
        default='SEMESTER'
    )
    
    # Payment schedule
    schedule_json = models.JSONField(
        default=dict,
        help_text="Projected schedule: {year: {semester: amount, ...}, ...}"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Disbursement Schedule'
        verbose_name_plural = 'Disbursement Schedules'
    
    def __str__(self):
        return f"Schedule for {self.helb_account.student.username}"


class DisbursementProjection(models.Model):
    """Historical projections used for forecasting."""
    
    helb_account = models.ForeignKey(
        HELBAccount,
        on_delete=models.CASCADE,
        related_name='projections'
    )
    
    projected_date = models.DateField(help_text="When this projection was made")
    next_disbursement_date = models.DateField(help_text="Projected next disbursement")
    projected_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    confidence_level = models.CharField(
        max_length=20,
        choices=[
            ('HIGH', 'High (95%+)'),
            ('MEDIUM', 'Medium (70-95%)'),
            ('LOW', 'Low (<70%)'),
        ],
        default='MEDIUM'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Disbursement Projection'
        verbose_name_plural = 'Disbursement Projections'
        ordering = ['-projected_date']
    
    def __str__(self):
        return f"{self.helb_account.student.username} - Next: {self.next_disbursement_date}"
