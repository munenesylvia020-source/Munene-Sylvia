from django.contrib import admin
from .models import AllocationPlan, InvestmentPosition, InterestAccrualLog


@admin.register(AllocationPlan)
class AllocationPlanAdmin(admin.ModelAdmin):
    list_display = ['student', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['student__username']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Student Info', {'fields': ('student',)}),
        ('Total Disbursement', {'fields': ('total_amount',)}),
        ('50/30/20 Breakdown', {'fields': ('tuition_amount', 'upkeep_amount', 'investment_amount')}),
        ('Status', {'fields': ('status',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


@admin.register(InvestmentPosition)
class InvestmentPositionAdmin(admin.ModelAdmin):
    list_display = ['student', 'fund_name', 'principal_amount', 'current_value', 'status']
    list_filter = ['fund_type', 'status', 'investment_date']
    search_fields = ['student__username', 'fund_name']
    readonly_fields = ['investment_date', 'last_interest_accrual', 'updated_at']
    
    fieldsets = (
        ('Student Info', {'fields': ('student', 'allocation')}),
        ('Fund Details', {'fields': ('fund_type', 'fund_name', 'annual_yield_percentage')}),
        ('Holdings', {'fields': ('principal_amount', 'current_value', 'accumulated_interest')}),
        ('Status', {'fields': ('status',)}),
        ('Timestamps', {'fields': ('investment_date', 'last_interest_accrual', 'updated_at'), 'classes': ('collapse',)}),
    )


@admin.register(InterestAccrualLog)
class InterestAccrualLogAdmin(admin.ModelAdmin):
    list_display = ['position', 'interest_accrued', 'value_before', 'value_after', 'accrual_date']
    list_filter = ['accrual_date']
    search_fields = ['position__student__username', 'position__fund_name']
    readonly_fields = ['accrual_date']
