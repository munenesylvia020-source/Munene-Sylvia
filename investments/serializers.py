from rest_framework import serializers
from .models import AllocationPlan, InvestmentPosition, InterestAccrualLog


class AllocationPlanSerializer(serializers.ModelSerializer):
    """Serializer for 50/30/20 allocation plans."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = AllocationPlan
        fields = [
            'id', 'student_name', 'total_amount', 'tuition_amount',
            'upkeep_amount', 'investment_amount', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class InvestmentPositionSerializer(serializers.ModelSerializer):
    """Serializer for investment positions and portfolio holdings."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    gain_loss = serializers.SerializerMethodField()
    gain_loss_percentage = serializers.SerializerMethodField()
    daily_interest = serializers.SerializerMethodField()
    
    class Meta:
        model = InvestmentPosition
        fields = [
            'id', 'student_name', 'fund_type', 'fund_name', 'principal_amount',
            'current_value', 'accumulated_interest', 'annual_yield_percentage',
            'gain_loss', 'gain_loss_percentage', 'daily_interest',
            'status', 'investment_date', 'last_interest_accrual'
        ]
        read_only_fields = [
            'id', 'current_value', 'accumulated_interest',
            'last_interest_accrual', 'investment_date'
        ]
    
    def get_gain_loss(self, obj):
        """Calculate absolute gain/loss."""
        return obj.current_value - obj.principal_amount
    
    def get_gain_loss_percentage(self, obj):
        """Calculate percentage gain/loss."""
        if obj.principal_amount == 0:
            return 0
        return ((obj.current_value - obj.principal_amount) / obj.principal_amount) * 100
    
    def get_daily_interest(self, obj):
        """Get estimated daily interest."""
        return obj.calculate_daily_interest()


class InterestAccrualLogSerializer(serializers.ModelSerializer):
    """Serializer for interest accrual audit logs."""
    
    fund_name = serializers.CharField(source='position.fund_name', read_only=True)
    
    class Meta:
        model = InterestAccrualLog
        fields = [
            'id', 'fund_name', 'interest_accrued', 'value_before',
            'value_after', 'accrual_date'
        ]
        read_only_fields = fields


class PortfolioGrowthSerializer(serializers.Serializer):
    """Serializer for portfolio growth summary."""
    
    total_invested = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_current_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_gained = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_gained_percentage = serializers.DecimalField(max_digits=6, decimal_places=2)
    positions_count = serializers.IntegerField()
    last_updated = serializers.DateTimeField()


class AllocateFromDisbursementSerializer(serializers.Serializer):
    """Serializer for allocating a new HELB disbursement."""
    
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=0.01)
    fund_name = serializers.CharField(max_length=255, required=False)
    fund_type = serializers.ChoiceField(
        choices=[('MMF', 'Money Market Fund'), ('CONSOLIDATED', 'Premier Consolidated Holdings')],
        default='MMF'
    )
