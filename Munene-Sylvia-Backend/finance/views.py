from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction as db_transaction
from .models import Wallet, Transaction, BalanceSnapshot, Expense, Budget, DailyLimit, DailyDisbursement, FundSource
from .serializers import (
    WalletSerializer, TransactionSerializer, BalanceSnapshotSerializer,
    DepositInitiateSerializer, ExpenseSerializer, BudgetSerializer,
    DailyLimitSerializer, DailyDisbursementSerializer, SetDailyLimitSerializer,
    FundSourceSerializer
)
import logging

logger = logging.getLogger(__name__)



class WalletViewSet(viewsets.ModelViewSet):
    """
    ViewSet for wallet management and balance tracking.
    
    Students maintain a single wallet that holds available funds
    from HELB disbursements. Funds can be withdrawn back to M-Pesa.
    
    ## Endpoints:
    
    - `GET /wallets/` - List all wallets (admin only)
    - `GET /wallets/{id}/` - Get wallet details
    - `GET /wallets/my_wallet/` - Get current student's wallet
    """
    
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only the current user's wallet."""
        return Wallet.objects.filter(student=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_wallet(self, request):
        """
        Get current user's wallet.
        
        Returns wallet balance, currency (KES), and timestamps.
        """
        try:
            wallet = request.user.wallet
            serializer = WalletSerializer(wallet)
            return Response(serializer.data)
        except Wallet.DoesNotExist:
            return Response(
                {'error': 'Wallet not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for transaction history and ledger entries.
    
    Complete audit trail of all money movements including:
    - Deposits via M-Pesa
    - Expenses tracked
    - Withdrawals back to M-Pesa
    
    ## Endpoints:
    
    - `GET /transactions/` - Transaction history
    - `GET /transactions/{id}/` - Get transaction details
    - `POST /transactions/initiate_deposit/` - Start M-Pesa deposit
    - `POST /transactions/webhook_callback/` - M-Pesa callback handler
    """
    
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only the current user's transactions."""
        return Transaction.objects.filter(student=self.request.user)
    
    @action(detail=False, methods=['post'])
    def initiate_deposit(self, request):
        """
        Initiate M-Pesa STK Push for deposit.
        
        Triggers M-Pesa PIN prompt on student's phone.
        Requires phone_number in profile or request body.
        
        Request body:
        ```json
        {
            "amount": 50000.00,
            "phone_number": "254712345678"  // optional if in profile
        }
        ```
        
        Returns transaction ID and status.
        """
        serializer = DepositInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        amount = serializer.validated_data['amount']
        phone_number = serializer.validated_data.get('phone_number') or request.user.phone_number
        
        if not phone_number:
            return Response(
                {'error': 'Phone number is required. Update your profile first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Normalize phone number to international format if needed
        if phone_number.startswith('0'):
            phone_number = f"254{phone_number[1:]}"
        elif not phone_number.startswith('254'):
            phone_number = f"254{phone_number}"

        # Create transaction first
        with db_transaction.atomic():
            trans = Transaction.objects.create(
                student=request.user,
                wallet=request.user.wallet,
                transaction_type='DEPOSIT',
                amount=amount,
                status='PENDING',
                description=f"STK Push initiated for {phone_number}"
            )
        
        # Call M-Pesa Daraja API to trigger STK Push
        try:
            from .mpesa_utils import DarajaClient
            client = DarajaClient()
            
            # Initiate real STK Push
            result = client.initiate_stk_push(
                phone_number=phone_number,
                amount=int(amount),
                account_reference=f"TRANS{trans.id}",
                transaction_desc=f"PennyProf Deposit - Ref {trans.id}"
            )
            
            logger.info(f"STK Push initiated: {result}")
            
            return Response({
                'message': 'STK Push initiated. Check your phone for the M-Pesa prompt.',
                'transaction_id': trans.id,
                'amount': amount,
                'phone_number': phone_number,
                'daraja_response': result
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"M-Pesa STK Push error: {str(e)}")
            # Transaction is still created but STK may not have been sent
            return Response({
                'message': 'STK Push request submitted but may not have been received.',
                'transaction_id': trans.id,
                'amount': amount,
                'phone_number': phone_number,
                'error': str(e)
            }, status=status.HTTP_201_CREATED)

    
    @action(detail=False, methods=['post'])
    def webhook_callback(self, request):
        """
        Handle M-Pesa webhook callbacks.
        
        Receives transaction results from Safaricom Daraja API.
        Validates digital signatures and updates wallet balance.
        
        TODO: Implement M-Pesa webhook verification and processing
        """
        return Response({'message': 'Callback received'}, status=status.HTTP_200_OK)


class BalanceSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for balance history snapshots.
    
    Historical snapshots for reconciliation and auditing.
    Tracks wallet balance at specific points in time.
    
    ## Endpoints:
    
    - `GET /balance-snapshots/` - All snapshots for user
    - `GET /balance-snapshots/{id}/` - Get specific snapshot
    """
    
    serializer_class = BalanceSnapshotSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return snapshots for current user's wallet."""
        return BalanceSnapshot.objects.filter(wallet__student=self.request.user)


class ExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet for expense tracking/public budgeting."""

    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(student=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


from rest_framework.views import APIView


class BudgetAPIView(APIView):
    """API for getting and updating user budget."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        budget, _ = Budget.objects.get_or_create(student=request.user)
        serializer = BudgetSerializer(budget)
        return Response(serializer.data)

    def put(self, request):
        budget, _ = Budget.objects.get_or_create(student=request.user)
        serializer = BudgetSerializer(budget, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(student=request.user)
        return Response(serializer.data)

    def post(self, request):
        return self.put(request)


class DailyLimitViewSet(viewsets.ViewSet):
    """ViewSet for managing daily spending limits and M-Pesa disbursements."""

    permission_classes = [IsAuthenticated]
    serializer_class = DailyLimitSerializer

    def get_daily_limit(self, user):
        """Helper to get daily limit object or None."""
        return DailyLimit.objects.filter(student=user).first()

    def list(self, request):
        """Get current daily limit for the user."""
        daily_limit = self.get_daily_limit(request.user)

        if not daily_limit:
            return Response({
                'daily_amount': 0,
                'phone_number': '',
                'is_active': False,
                'disbursement_time': '06:00:00',
                'remaining_today': 0,
                'last_disbursement_date': None,
            }, status=status.HTTP_200_OK)

        serializer = DailyLimitSerializer(daily_limit)
        return Response(serializer.data)

    @action(detail=False, methods=['post', 'put'])
    def set_limit(self, request):
        """Set or update daily spending limit."""
        serializer = SetDailyLimitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        defaults = {
            'daily_amount': serializer.validated_data['daily_amount'],
            'phone_number': serializer.validated_data['phone_number'],
            'is_active': serializer.validated_data.get('is_active', True),
            'disbursement_time': serializer.validated_data.get('disbursement_time', '06:00:00'),
        }

        daily_limit, created = DailyLimit.objects.update_or_create(
            student=request.user,
            defaults=defaults
        )

        # If creating fresh, ensure remaining_today starts equal to daily_amount
        if created:
            daily_limit.remaining_today = defaults['daily_amount']
            daily_limit.save(update_fields=['remaining_today'])

        return Response(DailyLimitSerializer(daily_limit).data)

    @action(detail=False, methods=['get'])
    def today_remaining(self, request):
        """Get remaining daily limit for today."""
        daily_limit = DailyLimit.objects.filter(student=request.user).first()
        if not daily_limit:
            return Response({
                'remaining': 0,
                'daily_amount': 0,
                'is_active': False,
                'message': 'No daily limit set'
            })

        return Response({
            'remaining': float(daily_limit.get_remaining_today()),
            'daily_amount': float(daily_limit.daily_amount),
            'is_active': daily_limit.is_active,
            'last_disbursement_date': daily_limit.last_disbursement_date,
            'next_disbursement_time': daily_limit.disbursement_time.isoformat()
        })

    @action(detail=False, methods=['get'])
    def disbursement_history(self, request):
        """Get history of daily disbursements."""
        daily_limit = DailyLimit.objects.filter(student=request.user).first()
        if not daily_limit:
            return Response([])

        disbursements = DailyDisbursement.objects.filter(
            daily_limit=daily_limit
        ).order_by('-disbursement_date')[:30]  # Last 30 disbursements

        serializer = DailyDisbursementSerializer(disbursements, many=True)
        return Response(serializer.data)


class FundSourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing student fund sources (HELB, Salary, Scholarship, etc).
    
    Allows students to register and track multiple income sources.
    Each source is independent and can be marked active/inactive.
    
    ## Endpoints:
    
    - `GET /fund-sources/` - List all fund sources
    - `POST /fund-sources/` - Create new fund source
    - `GET /fund-sources/{id}/` - Get fund source details
    - `PUT /fund-sources/{id}/` - Update fund source
    - `DELETE /fund-sources/{id}/` - Delete fund source
    - `GET /fund-sources/total_income/` - Calculate total income from all sources
    - `POST /fund-sources/complete_onboarding/` - Mark onboarding as complete
    """
    
    serializer_class = FundSourceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only the current user's fund sources."""
        return FundSource.objects.filter(student=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create fund source for current user."""
        serializer.save(student=self.request.user)
    
    @action(detail=False, methods=['get'])
    def total_income(self, request):
        """Calculate total income from all active fund sources."""
        fund_sources = self.get_queryset().filter(is_active=True)
        total = sum(float(source.amount) for source in fund_sources)
        
        source_breakdown = [
            {
                'source_type': source.get_source_type_display(),
                'amount': float(source.amount),
                'frequency': source.get_frequency_display()
            }
            for source in fund_sources
        ]
        
        return Response({
            'total_income': total,
            'source_count': fund_sources.count(),
            'sources': source_breakdown
        })
    
    @action(detail=False, methods=['post'])
    def complete_onboarding(self, request):
        """Mark user as having completed initial onboarding setup."""
        user = request.user
        user.has_completed_onboarding = True
        user.save(update_fields=['has_completed_onboarding'])
        
        return Response({
            'message': 'Onboarding completed successfully',
            'has_completed_onboarding': True
        })

