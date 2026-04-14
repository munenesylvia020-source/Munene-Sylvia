from rest_framework import serializers
from .models import Wallet, Transaction, BalanceSnapshot, Expense, Budget, MpesaTransaction, B2CTransaction, DailyLimit, DailyDisbursement, FundSource


class WalletSerializer(serializers.ModelSerializer):
    """Serializer for wallet information."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = Wallet
        fields = ['id', 'student_name', 'balance', 'currency', 'created_at', 'updated_at']
        read_only_fields = ['id', 'balance', 'created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transaction ledger entries."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'student_name', 'transaction_type', 'amount', 'status',
            'description', 'mpesa_reference', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'student_name', 'created_at', 'updated_at']


class BalanceSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for historical balance snapshots."""
    
    class Meta:
        model = BalanceSnapshot
        fields = ['id', 'balance', 'snapshot_date', 'notes']
        read_only_fields = ['id', 'snapshot_date']


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for budgeting expenses."""

    class Meta:
        model = Expense
        fields = ['id', 'description', 'category', 'amount', 'date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'date', 'created_at', 'updated_at']


class BudgetSerializer(serializers.ModelSerializer):
    """Serializer for student budget limits.
    
    Provides per-category spending limits for tracking expenses.
    """

    class Meta:
        model = Budget
        fields = [
            'id', 'accommodation_limit', 'food_limit', 'transport_limit',
            'entertainment_limit', 'healthcare_limit', 'education_limit',
            'utilities_limit', 'other_limit', 'category_due_dates', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class DepositInitiateSerializer(serializers.Serializer):
    """Serializer for initiating M-Pesa STK Push deposit."""
    
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    phone_number = serializers.CharField(max_length=20, required=False)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        if value > 500000:
            raise serializers.ValidationError("Amount cannot exceed KES 500,000")
        return value


class MpesaTransactionSerializer(serializers.ModelSerializer):
    """Serializer for M-Pesa C2B deposit transactions."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = MpesaTransaction
        fields = [
            'id', 'student_name', 'phone_number', 'amount', 'mpesa_code',
            'status', 'reference', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'student_name', 'created_at', 'completed_at']


class B2CTransactionSerializer(serializers.ModelSerializer):
    """Serializer for M-Pesa B2C disbursement transactions."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = B2CTransaction
        fields = [
            'id', 'student_name', 'phone_number', 'amount', 'purpose',
            'status', 'response_code', 'result_code', 'transaction_id',
            'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'student_name', 'created_at', 'completed_at']


class InitiateC2BSerializer(serializers.Serializer):
    """Serializer for initiating C2B payment."""
    
    phone_number = serializers.CharField(max_length=20)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=1)
    reference = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate_phone_number(self, value):
        from .mpesa_utils import validate_phone_number
        try:
            validate_phone_number(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_amount(self, value):
        if value > 500000:
            raise serializers.ValidationError("Amount cannot exceed KES 500,000")
        return value


class InitiateB2CSerializer(serializers.Serializer):
    """Serializer for initiating B2C payment (withdrawal)."""
    
    phone_number = serializers.CharField(max_length=20)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=1)
    purpose = serializers.ChoiceField(
        choices=['SalaryPayment', 'BusinessPayment', 'PromotionalPayment'],
        default='BusinessPayment'
    )
    
    def validate_phone_number(self, value):
        from .mpesa_utils import validate_phone_number
        try:
            validate_phone_number(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate_amount(self, value):
        if value > 500000:
            raise serializers.ValidationError("Amount cannot exceed KES 500,000")
        return value


class DailyLimitSerializer(serializers.ModelSerializer):
    """Serializer for daily spending limit with auto-disbursement."""
    
    remaining_today = serializers.SerializerMethodField()
    
    class Meta:
        model = DailyLimit
        fields = [
            'id', 'daily_amount', 'phone_number', 'is_active', 'disbursement_time',
            'remaining_today', 'last_disbursement_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'remaining_today', 'last_disbursement_date', 'created_at', 'updated_at']
    
    def get_remaining_today(self, obj):
        """Calculate remaining amount for today."""
        return str(obj.get_remaining_today())


class DailyDisbursementSerializer(serializers.ModelSerializer):
    """Serializer for daily M-Pesa disbursement records."""
    
    class Meta:
        model = DailyDisbursement
        fields = [
            'id', 'amount', 'phone_number', 'status', 'disbursement_date',
            'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'disbursement_date', 'created_at', 'completed_at']


class SetDailyLimitSerializer(serializers.Serializer):
    """Serializer for setting/updating daily limit."""
    
    daily_amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=10)
    phone_number = serializers.CharField(max_length=20)
    disbursement_time = serializers.TimeField(required=False)
    is_active = serializers.BooleanField(required=False, default=True)
    
    def validate_phone_number(self, value):
        from .mpesa_utils import validate_phone_number
        try:
            validate_phone_number(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        return value

    def validate_daily_amount(self, value):
        if value < 10:
            raise serializers.ValidationError("Daily limit must be at least KES 10")
        if value > 50000:
            raise serializers.ValidationError("Daily limit cannot exceed KES 50,000")
        return value

    def validate_disbursement_time(self, value):
        from datetime import time as dt_time, datetime

        if not isinstance(value, dt_time):
            raise serializers.ValidationError("Invalid time format")

        # everyday scheduled time must be provided as a valid time
        now = datetime.now().time()
        # If user sets the time for today and it's already passed, it's probably okay
        # as the next disbursement should happen tomorrow. So no hard reject. 
        # But we disallow time outside 00:00-23:59 which TimeField already handles.
        if value == dt_time(0, 0):
            raise serializers.ValidationError("Disbursement time cannot be midnight")

        return value


class FundSourceSerializer(serializers.ModelSerializer):
    """Serializer for student fund sources (HELB, Salary, Scholarship, etc)."""
    
    source_type_display = serializers.CharField(source='get_source_type_display', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    
    class Meta:
        model = FundSource
        fields = [
            'id', 'source_type', 'source_type_display', 'amount', 'frequency',
            'frequency_display', 'description', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
