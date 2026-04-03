from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import HELBAccount, Disbursement, DisbursementSchedule, DisbursementProjection
from .serializers import (
    HELBAccountSerializer, DisbursementSerializer, DisbursementScheduleSerializer,
    DisbursementProjectionSerializer, ProjectionsResponseSerializer
)
from investments.models import AllocationPlan, InvestmentPosition
from django.db import transaction


class HELBAccountViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for HELB account details.
    
    Displays student's Higher Education Loans Board (HELB) loan
    information including approved amount, total disbursed, and
    remaining balance.
    
    ## Endpoints:
    
    - `GET /accounts/` - All accounts (admin only)
    - `GET /accounts/{id}/` - Get account details
    - `GET /accounts/my_account/` - Get current student's account
    """
    
    serializer_class = HELBAccountSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only the current user's HELB account."""
        return HELBAccount.objects.filter(student=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_account(self, request):
        """
        Get current user's HELB account.
        
        Returns HELB account reference number, approved amount,
        total disbursed, and remaining balance.
        """
        try:
            account = request.user.helb_account
            serializer = HELBAccountSerializer(account)
            return Response(serializer.data)
        except HELBAccount.DoesNotExist:
            return Response(
                {'error': 'HELB account not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class DisbursementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for disbursement tracking.
    
    Complete history of HELB disbursements with dates, amounts,
    and status. Includes overdue tracking and upcoming predictions.
    
    ## Endpoints:
    
    - `GET /disbursements/` - All disbursements
    - `GET /disbursements/{id}/` - Get disbursement details
    - `GET /disbursements/upcoming/` - Next 5 expected disbursements
    - `GET /disbursements/overdue/` - Overdue disbursements
    """
    
    serializer_class = DisbursementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return disbursements for current user."""
        return Disbursement.objects.filter(student=self.request.user)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming disbursements.
        
        Returns the next 5 expected HELB disbursements sorted by date.
        Shows days until each disbursement is expected.
        
        Returns array of disbursement objects with:
        - amount
        - expected_date
        - days_remaining
        - status
        """
        today = timezone.now().date()
        disbursements = self.get_queryset().filter(
            expected_date__gte=today
        ).order_by('expected_date')[:5]
        
        serializer = DisbursementSerializer(disbursements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """
        Get overdue disbursements.
        
        Returns disbursements that were expected in the past
        but still show PENDING or APPROVED status.
        
        Helps identify potential issues with HELB processing.
        """
        today = timezone.now().date()
        disbursements = self.get_queryset().filter(
            expected_date__lt=today,
            status__in=['PENDING', 'APPROVED']
        ).order_by('expected_date')
        
        serializer = DisbursementSerializer(disbursements, many=True)
        return Response(serializer.data)


class ProjectionViewSet(viewsets.ViewSet):
    """
    ViewSet for disbursement projections and forecasting.
    
    Analyzes historical disbursement patterns and generates
    predictions for future disbursements with confidence levels.
    
    ## Endpoints:
    
    - `GET /projections/` - Get disbursement forecast
    """
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='projections')
    def get_projections(self, request):
        """
        Get disbursement projections.
        
        Returns next expected disbursement date, projected amount,
        days remaining, confidence level, and recent/upcoming disbursements.
        
        Confidence levels:
        - HIGH (95%+): Based on 4+ historical disbursements
        - MEDIUM (70-95%): Based on 2-3 historical disbursements
        - LOW (<70%): Based on <2 historical disbursements
        
        Example response:
        ```json
        {
            "next_expected_date": "2024-04-15",
            "next_expected_amount": 100000.00,
            "days_remaining": 41,
            "confidence_level": "HIGH",
            "recent_disbursements": [...],
            "upcoming_disbursements": [...]
        }
        ```
        """
        try:
            helb_account = request.user.helb_account
        except HELBAccount.DoesNotExist:
            return Response(
                {'error': 'HELB account not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the next expected disbursement
        next_disbursement = helb_account.disbursements.filter(
            status__in=['PENDING', 'APPROVED']
        ).order_by('expected_date').first()
        
        if next_disbursement:
            next_expected_date = next_disbursement.expected_date
            next_expected_amount = next_disbursement.amount
            days_remaining = (next_expected_date - timezone.now().date()).days
        else:
            next_expected_date = helb_account.calculate_next_disbursement().date()
            next_expected_amount = None
            days_remaining = (next_expected_date - timezone.now().date()).days
        
        # Get latest projection confidence
        latest_projection = helb_account.projections.order_by('-projected_date').first()
        confidence_level = latest_projection.confidence_level if latest_projection else 'MEDIUM'
        
        # Get recent and upcoming disbursements
        today = timezone.now().date()
        recent = Disbursement.objects.filter(
            student=request.user,
            disbursal_date__isnull=False,
            disbursal_date__gte=today - timedelta(days=180)
        ).order_by('-disbursal_date')[:5]
        
        upcoming = Disbursement.objects.filter(
            student=request.user,
            expected_date__gt=today
        ).order_by('expected_date')[:5]
        
        data = {
            'next_expected_date': next_expected_date,
            'next_expected_amount': next_expected_amount,
            'days_remaining': max(0, days_remaining),
            'confidence_level': confidence_level,
            'recent_disbursements': recent,
            'upcoming_disbursements': upcoming
        }
        
        serializer = ProjectionsResponseSerializer(data)
        return Response(serializer.data)


class DisbursementTrackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        if amount is None:
            return Response({'error': 'amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount = Decimal(amount)
            if amount <= 0:
                raise ValueError
        except Exception:
            return Response({'error': 'amount must be a positive number'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            helb_account, _ = HELBAccount.objects.get_or_create(student=request.user, defaults={
                'total_approved_amount': amount * 4,
                'remaining_balance': amount * 4,
                'helb_reference_number': f'HELB-{request.user.id}-{timezone.now().strftime("%Y%m%d%H%M%S")}'
            })

            disbursement = Disbursement.objects.create(
                helb_account=helb_account,
                student=request.user,
                amount=amount,
                expected_date=timezone.now().date(),
                status='COMPLETED',
                disbursal_date=timezone.now().date(),
                received_date=timezone.now().date(),
                notes='Tracked HELB disbursement amount from frontend'
            )

            # Immediately trigger the 50/30/20 Budgeting Rule
            allocation = AllocationPlan.create_allocation(request.user, amount)

            # Hard-route the 20% into an Investment MMF Position instantly
            InvestmentPosition.objects.create(
                student=request.user,
                allocation=allocation,
                fund_type='MMF',
                fund_name='Safaricom Wealth MMF (Auto-Invest)',
                principal_amount=allocation.investment_amount,
                current_value=allocation.investment_amount
            )

            helb_account.total_disbursed += amount
            helb_account.remaining_balance = max(Decimal('0.00'), helb_account.total_approved_amount - helb_account.total_disbursed)
            helb_account.save()

        return Response({
            'message': 'HELB amount tracked successfully! 50/30/20 Budget Active.',
            'disbursement_id': disbursement.id,
            'total_disbursed': str(helb_account.total_disbursed),
            'remaining_balance': str(helb_account.remaining_balance)
        }, status=status.HTTP_201_CREATED)

