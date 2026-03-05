from rest_framework import serializers
from .models import Wallet, Transaction, BalanceSnapshot


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
