from django.contrib import admin
from .models import HELBAccount, Disbursement, DisbursementSchedule, DisbursementProjection


@admin.register(HELBAccount)
class HELBAccountAdmin(admin.ModelAdmin):
    list_display = ['student', 'helb_reference_number', 'total_approved_amount',
                    'total_disbursed', 'remaining_balance']
    list_filter = ['account_created_at', 'course_duration_years']
    search_fields = ['student__username', 'helb_reference_number']
    readonly_fields = ['account_created_at', 'updated_at']


@admin.register(Disbursement)
class DisbursementAdmin(admin.ModelAdmin):
    list_display = ['student', 'amount', 'expected_date', 'disbursal_date', 'status']
    list_filter = ['status', 'expected_date', 'created_at']
    search_fields = ['student__username']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Account Info', {'fields': ('helb_account', 'student')}),
        ('Amounts', {'fields': ('amount',)}),
        ('Timeline', {'fields': ('expected_date', 'disbursal_date', 'received_date')}),
        ('Status', {'fields': ('status', 'notes')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


@admin.register(DisbursementSchedule)
class DisbursementScheduleAdmin(admin.ModelAdmin):
    list_display = ['helb_account', 'disbursement_frequency', 'created_at']
    list_filter = ['disbursement_frequency', 'created_at']
    search_fields = ['helb_account__student__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DisbursementProjection)
class DisbursementProjectionAdmin(admin.ModelAdmin):
    list_display = ['helb_account', 'next_disbursement_date', 'confidence_level', 'created_at']
    list_filter = ['confidence_level', 'created_at']
    search_fields = ['helb_account__student__username']
    readonly_fields = ['created_at']
