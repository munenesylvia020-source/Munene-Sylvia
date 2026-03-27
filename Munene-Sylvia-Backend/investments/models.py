from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from django.utils import timezone

Student = get_user_model()


class AllocationPlan(models.Model):
    """The 50/30/20 budget allocation for a student's HELB disbursement."""
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('ARCHIVED', 'Archived'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='allocation_plans')
    
    # Original amounts from HELB disbursement
    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # 50/30/20 allocation breakdown
    tuition_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="50% - Fixed costs (tuition)"
    )
    upkeep_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="30% - Variable costs (rent, food, utilities)"
    )
    investment_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="20% - Capital to invest"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Allocation Plan'
        verbose_name_plural = 'Allocation Plans'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.username} - KES {self.total_amount} allocation"
    
    @staticmethod
    def create_allocation(student, total_amount):
        """Create a new 50/30/20 allocation."""
        tuition = total_amount * Decimal('0.50')
        upkeep = total_amount * Decimal('0.30')
        investment = total_amount * Decimal('0.20')
        
        return AllocationPlan.objects.create(
            student=student,
            total_amount=total_amount,
            tuition_amount=tuition,
            upkeep_amount=upkeep,
            investment_amount=investment
        )


class InvestmentPosition(models.Model):
    """Student's holdings in an investment fund (MMF or consolidated holdings)."""
    
    FUND_TYPES = [
        ('MMF', 'Money Market Fund'),
        ('CONSOLIDATED', 'Premier Consolidated Holdings (Simulated)'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('LIQUIDATED', 'Liquidated'),
        ('MATURED', 'Matured'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='investment_positions')
    allocation = models.ForeignKey(
        AllocationPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='positions'
    )
    
    fund_type = models.CharField(max_length=20, choices=FUND_TYPES, default='MMF')
    fund_name = models.CharField(max_length=255, help_text="Name of the fund")
    
    principal_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    current_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="Current NAV including accrued interest"
    )
    
    annual_yield_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=3,
        default=Decimal('5.0'),
        validators=[MinValueValidator(Decimal('0.001')), MaxValueValidator(Decimal('100'))],
        help_text="Annual Effective Yield (%)"
    )
    
    accumulated_interest = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    investment_date = models.DateTimeField(auto_now_add=True)
    last_interest_accrual = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Investment Position'
        verbose_name_plural = 'Investment Positions'
        ordering = ['-investment_date']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['status', 'last_interest_accrual']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - {self.fund_name} (KES {self.current_value})"
    
    def calculate_daily_interest(self):
        """Calculate daily interest accrual."""
        daily_rate = self.annual_yield_percentage / Decimal('365') / Decimal('100')
        daily_interest = self.current_value * daily_rate
        return daily_interest
    
    def accrue_interest(self):
        """Add accumulated daily interest to position."""
        daily_interest = self.calculate_daily_interest()
        self.accumulated_interest += daily_interest
        self.current_value += daily_interest
        self.last_interest_accrual = timezone.now()
        self.save()


class InterestAccrualLog(models.Model):
    """Audit log for all interest accrual calculations."""
    
    position = models.ForeignKey(
        InvestmentPosition,
        on_delete=models.CASCADE,
        related_name='interest_accrual_logs'
    )
    
    interest_accrued = models.DecimalField(
        max_digits=15,
        decimal_places=4
    )
    value_before = models.DecimalField(max_digits=15, decimal_places=2)
    value_after = models.DecimalField(max_digits=15, decimal_places=2)
    accrual_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Interest Accrual Log'
        verbose_name_plural = 'Interest Accrual Logs'
        ordering = ['-accrual_date']
        indexes = [
            models.Index(fields=['position', 'accrual_date']),
        ]
    
    def __str__(self):
        return f"{self.position.fund_name} - KES {self.interest_accrued}"
