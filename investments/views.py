from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction as db_transaction
from django.utils import timezone
from decimal import Decimal
from .models import AllocationPlan, InvestmentPosition, InterestAccrualLog
from .serializers import (
    AllocationPlanSerializer, InvestmentPositionSerializer,
    InterestAccrualLogSerializer, PortfolioGrowthSerializer,
    AllocateFromDisbursementSerializer
)


class AllocationPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for allocation plan history.
    
    Shows historical 50/30/20 budget allocations for each HELB disbursement.
    Tracks how funds were split between tuition, upkeep, and investments.
    
    ## Endpoints:
    
    - `GET /allocations/` - All allocations for user
    - `GET /allocations/{id}/` - Get specific allocation
    """
    
    serializer_class = AllocationPlanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return allocation plans for current user."""
        return AllocationPlan.objects.filter(student=self.request.user)


class InvestmentPositionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for investment positions and portfolio management.
    
    Manages student holdings in Money Market Funds (MMFs) or
    Premier Consolidated Holdings. Tracks principal, current value,
    accumulated interest, and daily interest accrual.
    
    ## Endpoints:
    
    - `GET /positions/` - All active investment positions
    - `GET /positions/{id}/` - Get position details
    - `POST /positions/allocate/` - Create new investment from disbursement
    - `GET /positions/portfolio_growth/` - Portfolio summary
    - `GET /positions/daily_accruals/` - Daily interest forecast
    """
    
    serializer_class = InvestmentPositionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return positions for current user."""
        return InvestmentPosition.objects.filter(
            student=self.request.user,
            status='ACTIVE'
        )
    
    @action(detail=False, methods=['post'])
    def allocate(self, request):
        """
        Allocate a new disbursement using 50/30/20 rule.
        
        Splits HELB disbursement into:
        - 50% (Tuition): Fixed educational costs
        - 30% (Upkeep): Variable living costs (rent, food, utilities)
        - 20% (Investment): Capital for micro-investing
        
        Request body:
        ```json
        {
            "total_amount": 500000.00,
            "fund_type": "MMF",
            "fund_name": "Old Mutual Money Market Fund"
        }
        ```
        
        Returns created allocation plan and investment position.
        """
        serializer = AllocateFromDisbursementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        total_amount = serializer.validated_data['total_amount']
        fund_type = serializer.validated_data.get('fund_type', 'MMF')
        fund_name = serializer.validated_data.get('fund_name', 'Default MMF')
        
        with db_transaction.atomic():
            # Create allocation plan
            allocation = AllocationPlan.create_allocation(request.user, total_amount)
            
            # Create investment position for the 20% investment amount
            position = InvestmentPosition.objects.create(
                student=request.user,
                allocation=allocation,
                fund_type=fund_type,
                fund_name=fund_name,
                principal_amount=allocation.investment_amount,
                current_value=allocation.investment_amount
            )
            
            # TODO: Transfer tuition (50%) and upkeep (30%) to respective accounts
            # For now, they remain in the allocation as marked
        
        return Response({
            'message': 'Allocation created using 50/30/20 rule',
            'allocation': AllocationPlanSerializer(allocation).data,
            'investment_position': InvestmentPositionSerializer(position).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def portfolio_growth(self, request):
        """
        Get portfolio growth summary.
        
        Returns total invested, current value, gains, percentage gains,
        number of positions, and last update timestamp.
        
        Example response:
        ```json
        {
            "total_invested": 100000.00,
            "total_current_value": 102500.50,
            "total_gained": 2500.50,
            "total_gained_percentage": 2.50,
            "positions_count": 3,
            "last_updated": "2024-03-05T20:00:00Z"
        }
        ```
        """
        positions = self.get_queryset()
        
        total_invested = sum(p.principal_amount for p in positions)
        total_value = sum(p.current_value for p in positions)
        total_gained = total_value - total_invested
        
        if total_invested > 0:
            total_gained_pct = (total_gained / total_invested) * 100
        else:
            total_gained_pct = Decimal('0')
        
        data = {
            'total_invested': total_invested,
            'total_current_value': total_value,
            'total_gained': total_gained,
            'total_gained_percentage': total_gained_pct,
            'positions_count': positions.count(),
            'last_updated': timezone.now()
        }
        
        serializer = PortfolioGrowthSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def daily_accruals(self, request):
        """
        Get daily interest accrual forecast.
        
        Estimates daily and total interest earnings based on current
        annual yields (Annual Effective Yield - AEY).
        
        Example response:
        ```json
        {
            "positions": [
                {
                    "fund_name": "Old Mutual MMF",
                    "daily_interest": 50.00,
                    "annual_yield": 5.5,
                    "current_value": 100000.00
                }
            ],
            "total_daily_interest": 50.00
        }
        ```
        """
        positions = self.get_queryset()
        
        data = {
            'positions': [
                {
                    'fund_name': p.fund_name,
                    'daily_interest': p.calculate_daily_interest(),
                    'annual_yield': p.annual_yield_percentage,
                    'current_value': p.current_value
                }
                for p in positions
            ],
            'total_daily_interest': sum(p.calculate_daily_interest() for p in positions)
        }
        
        return Response(data)


class InterestAccrualLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for interest accrual history and audit trail.
    
    Complete history of all daily interest calculations and accruals.
    Tracks value before, interest accrued, and value after for each accrual.
    
    ## Endpoints:
    
    - `GET /accrual-logs/` - All accrual logs for user
    - `GET /accrual-logs/{id}/` - Get specific accrual entry
    """
    
    serializer_class = InterestAccrualLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return accrual logs for current user's positions."""
        return InterestAccrualLog.objects.filter(
            position__student=self.request.user
        )

