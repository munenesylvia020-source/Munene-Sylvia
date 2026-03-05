from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction as db_transaction
from .models import Wallet, Transaction, BalanceSnapshot
from .serializers import (
    WalletSerializer, TransactionSerializer, BalanceSnapshotSerializer,
    DepositInitiateSerializer
)


class WalletViewSet(viewsets.ModelViewSet):
    """
    ViewSet for wallet management and balance tracking.
    
    Students maintain a single wallet that holds available funds
    from HELB disbursements. Funds can be allocated to investments
    or withdrawn back to M-Pesa.
    
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
    - Deposits via M-Pesa STK Push
    - Allocations to investments (50/30/20 split)
    - Withdrawals back to M-Pesa
    - Interest earned from investments
    
    ## Endpoints:
    
    - `GET /transactions/` - Transaction history
    - `GET /transactions/{id}/` - Get transaction details
    - `POST /transactions/initiate_deposit/` - Start M-Pesa STK Push
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
        
        # TODO: Integrate M-Pesa Daraja API here
        # For now, create a pending transaction
        with db_transaction.atomic():
            trans = Transaction.objects.create(
                student=request.user,
                wallet=request.user.wallet,
                transaction_type='DEPOSIT',
                amount=amount,
                status='PENDING',
                description=f"STK Push initiated for {phone_number}"
            )
        
        return Response({
            'message': 'STK Push initiated. Check your phone for the M-Pesa prompt.',
            'transaction_id': trans.id,
            'amount': amount,
            'phone_number': phone_number
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

