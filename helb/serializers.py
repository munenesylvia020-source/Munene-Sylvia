from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone
from .models import HELBAccount, Disbursement, DisbursementSchedule, DisbursementProjection


class HELBAccountSerializer(serializers.ModelSerializer):
    """Serializer for HELB account information."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = HELBAccount
        fields = [
            'id', 'student_name', 'helb_reference_number', 'total_approved_amount',
            'course_duration_years', 'total_disbursed', 'remaining_balance',
            'account_created_at'
        ]
        read_only_fields = ['id', 'account_created_at', 'total_disbursed', 'remaining_balance']


class DisbursementSerializer(serializers.ModelSerializer):
    """Serializer for individual disbursement entries."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Disbursement
        fields = [
            'id', 'student_name', 'amount', 'expected_date', 'disbursal_date',
            'received_date', 'status', 'is_overdue', 'days_remaining', 'notes'
        ]
        read_only_fields = ['id', 'is_overdue']
    
    def get_days_remaining(self, obj):
        """Calculate days until expected disbursement."""
        if obj.status == 'COMPLETED':
            return 0
        days = (obj.expected_date - timezone.now().date()).days
        return max(0, days)


class DisbursementScheduleSerializer(serializers.ModelSerializer):
    """Serializer for disbursement schedule projections."""
    
    class Meta:
        model = DisbursementSchedule
        fields = ['id', 'disbursement_frequency', 'schedule_json', 'created_at']
        read_only_fields = ['id', 'created_at']


class DisbursementProjectionSerializer(serializers.ModelSerializer):
    """Serializer for disbursement projections."""
    
    days_until_next = serializers.SerializerMethodField()
    
    class Meta:
        model = DisbursementProjection
        fields = [
            'id', 'projected_date', 'next_disbursement_date', 'projected_amount',
            'confidence_level', 'days_until_next'
        ]
        read_only_fields = fields
    
    def get_days_until_next(self, obj):
        """Days until projected disbursement."""
        days = (obj.next_disbursement_date - timezone.now().date()).days
        return max(0, days)


class ProjectionsResponseSerializer(serializers.Serializer):
    """Serializer for projections endpoint response."""
    
    next_expected_date = serializers.DateField()
    next_expected_amount = serializers.DecimalField(max_digits=15, decimal_places=2, allow_null=True)
    days_remaining = serializers.IntegerField()
    confidence_level = serializers.CharField()
    recent_disbursements = DisbursementSerializer(many=True)
    upcoming_disbursements = DisbursementSerializer(many=True)
