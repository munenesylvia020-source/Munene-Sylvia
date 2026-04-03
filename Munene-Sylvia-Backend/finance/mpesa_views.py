"""
M-Pesa Payment Views for C2B and B2C Integration
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse
import json
import time
import logging
from decimal import Decimal

from .models import MpesaTransaction, B2CTransaction, Transaction, Wallet
from .serializers import MpesaTransactionSerializer, B2CTransactionSerializer
from .mpesa_utils import DarajaClient, MpesaTransactionHandler, validate_phone_number, format_amount

logger = logging.getLogger(__name__)


class C2BCallbackView(APIView):
    """Handle M-Pesa C2B callbacks"""
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def post(self, request):
        """Process C2B confirmation callback"""
        try:
            data = request.data
            logger.info(f"Received C2B callback: {data}")
            
            result_code = data.get('ResultCode')
            
            # Check for cancellation (user cancelled STK push)
            if result_code and result_code != 0:
                # Handle cancellation/failure
                from .models import Transaction
                
                # Try to find pending transaction by phone or reference
                phone_number = data.get('MSISDN')
                bill_ref = data.get('BillRefNumber')
                
                if phone_number or bill_ref:
                    pending_tx = Transaction.objects.filter(
                        status='PENDING',
                        transaction_type='DEPOSIT'
                    )
                    
                    if bill_ref:
                        pending_tx = pending_tx.filter(id=bill_ref)
                    else:
                        pending_tx = pending_tx.filter(
                            student__phone_number=phone_number
                        )
                    
                    pending_tx.update(status='FAILED')
                    logger.warning(f"STK cancelled/failed: {data.get('ResultDesc', 'Unknown')}")
                
                return Response({
                    'ResultCode': 0,
                    'ResultDesc': 'Cancellation acknowledged'
                })
            
            # Process the transaction (success case)
            success = MpesaTransactionHandler.process_c2b_confirmation(data)
            
            if success:
                return Response({
                    'ResultCode': 0,
                    'ResultDesc': 'Accepted'
                })
            else:
                # Keep M-Pesa happy even if the student lookup fails in sandbox.
                # Logging is still done in process_c2b_confirmation for issue triage.
                return Response({
                    'ResultCode': 0,
                    'ResultDesc': 'Accepted (no matching user)'
                })
                
        except Exception as e:
            logger.error(f"Error in C2B callback: {str(e)}")
            return Response({
                'ResultCode': 1,
                'ResultDesc': 'Error processing request'
            }, status=status.HTTP_400_BAD_REQUEST)


class C2BValidationView(APIView):
    """Handle M-Pesa C2B validation"""
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def post(self, request):
        """Validate C2B transaction before processing"""
        try:
            data = request.data
            logger.info(f"Received C2B validation: {data}")
            
            # Always accept for now (in production, add additional validation)
            return Response({
                'ResultCode': 0,
                'ResultDesc': 'Validation passed'
            })
            
        except Exception as e:
            logger.error(f"Error in C2B validation: {str(e)}")
            return Response({
                'ResultCode': 0,
                'ResultDesc': 'Validation passed'
            })


class B2CCallbackView(APIView):
    """Handle M-Pesa B2C callbacks"""
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def post(self, request):
        """Process B2C result callback"""
        try:
            data = request.data
            logger.info(f"Received B2C callback: {data}")
            
            # Process the transaction
            success = MpesaTransactionHandler.process_b2c_callback(data)
            
            return Response({'ResultCode': 0})
                
        except Exception as e:
            logger.error(f"Error in B2C callback: {str(e)}")
            return Response({'ResultCode': 1}, status=status.HTTP_400_BAD_REQUEST)


class B2CTimeoutView(APIView):
    """Handle M-Pesa B2C timeout"""
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def post(self, request):
        """Process B2C timeout"""
        try:
            data = request.data
            logger.warning(f"B2C timeout: {data}")
            
            return Response({'ResultCode': 0})
                
        except Exception as e:
            logger.error(f"Error in B2C timeout: {str(e)}")
            return Response({'ResultCode': 1}, status=status.HTTP_400_BAD_REQUEST)


class InitiateC2BView(APIView):
    """Initiate C2B payment (deposit via M-Pesa)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Initiate C2B payment request
        
        Request body:
        {
            'phone_number': '254712345678',
            'amount': 1000,
            'reference': 'deposit' (optional)
        }
        """
        try:
            phone_number = request.data.get('phone_number')
            amount = request.data.get('amount')
            
            if not phone_number or not amount:
                return Response(
                    {'error': 'phone_number and amount are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate and format phone number
            try:
                validated_phone = validate_phone_number(phone_number)
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate amount
            try:
                amount = Decimal(str(amount))
                if amount < 1:
                    raise ValueError("Amount must be at least KES 1")
            except (ValueError, TypeError) as e:
                return Response(
                    {'error': f'Invalid amount: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Store phone number in student profile if not present
            if not request.user.phone_number:
                request.user.phone_number = validated_phone
                request.user.save()
            
            # Initialize Daraja client
            client = DarajaClient()
            
            # --- LOCAL DEVELOPMENT MOCK MODE ---
            if not client.consumer_key:
                logger.warning("Entering MOCK MODE (Deposit). Auto-completing.")
                # Create Mock Transaction
                from .models import Transaction
                Transaction.create_deposit(
                    student=request.user,
                    amount=amount,
                    mpesa_ref=f"MOCK_C2B_{int(amount)}_{int(time.time()*1000)}"
                )
                return Response({
                    'status': 'success',
                    'message': 'MOCK MODE: STK Push completed instantly!',
                    'response': {'ResponseCode': '0'},
                    'phone_number': validated_phone,
                    'amount': str(amount)
                })
            # -----------------------------------
            
            # Simulate C2B transaction for sandbox
            try:
                response = client.simulate_c2b_transaction(
                    phone_number=validated_phone,
                    amount=format_amount(amount),
                    reference=f"student_{request.user.id}"
                )
                
                return Response({
                    'status': 'success',
                    'message': 'Payment request initiated',
                    'response': response,
                    'phone_number': validated_phone,
                    'amount': str(amount)
                })
                
            except Exception as e:
                logger.error(f"Error simulating C2B: {str(e)}")
                return Response(
                    {'error': f'Failed to initiate payment: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Exception as e:
            logger.error(f"Error in InitiateC2B: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InitiateB2CView(APIView):
    """Initiate B2C disbursement (withdraw to M-Pesa)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Initiate B2C payment (disbursement)
        
        Request body:
        {
            'phone_number': '254712345678',
            'amount': 1000,
            'purpose': 'BusinessPayment' (optional)
        }
        """
        try:
            phone_number = request.data.get('phone_number')
            amount = request.data.get('amount')
            purpose = request.data.get('purpose', 'BusinessPayment')
            
            if not phone_number or not amount:
                return Response(
                    {'error': 'phone_number and amount are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate and format phone number
            try:
                validated_phone = validate_phone_number(phone_number)
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate amount
            try:
                amount = Decimal(str(amount))
                if amount < 1:
                    raise ValueError("Amount must be at least KES 1")
            except (ValueError, TypeError) as e:
                return Response(
                    {'error': f'Invalid amount: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check wallet balance
            student_wallet = request.user.wallet
            if student_wallet.balance < amount:
                return Response(
                    {'error': f'Insufficient balance. Available: KES {student_wallet.balance}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Initialize Daraja client
            client = DarajaClient()
            
            try:
                # --- LOCAL DEVELOPMENT MOCK MODE ---
                if not client.consumer_key:
                    logger.warning("Entering MOCK MODE for B2C Withdrawal. Auto-completing.")
                    student_wallet.balance -= amount
                    student_wallet.save()
                    
                    b2c_trans = B2CTransaction.objects.create(
                        student=request.user, phone_number=validated_phone, amount=amount,
                        purpose=purpose, originator_conversation_id=f"MOCK_B2C_{int(amount)}_{int(time.time()*1000)}",
                        response_code="0", response_description="Mock Success", status='SUCCESS'
                    )
                    
                    Transaction.objects.create(
                        student=request.user, wallet=student_wallet, transaction_type='WITHDRAWAL',
                        amount=amount, status='COMPLETED', description=f"MOCK B2C Withdrawal to {validated_phone}"
                    )
                    
                    return Response({
                        'status': 'success', 'message': 'MOCK MODE: Withdrawal completed instantly!',
                        'b2c_id': b2c_trans.id, 'phone_number': validated_phone, 'amount': str(amount),
                        'remaining_balance': str(student_wallet.balance)
                    }, status=status.HTTP_201_CREATED)
                # -----------------------------------

                # Initiate B2C payment
                response = client.initiate_b2c_payment(
                    phone_number=validated_phone,
                    amount=format_amount(amount),
                    purpose_code=purpose,
                    remarks=f"Withdrawal by {request.user.get_full_name()}"
                )
                
                # Create B2C transaction record
                b2c_trans = B2CTransaction.objects.create(
                    student=request.user,
                    phone_number=validated_phone,
                    amount=amount,
                    purpose=purpose,
                    originator_conversation_id=response.get('OriginatorConversationID'),
                    response_code=response.get('ResponseCode'),
                    response_description=response.get('ResponseDescription'),
                    status='PENDING'
                )
                
                # Deduct from wallet (will be reversed if fails)
                student_wallet.balance -= amount
                student_wallet.save()
                
                # Create withdrawal transaction
                Transaction.objects.create(
                    student=request.user,
                    wallet=student_wallet,
                    transaction_type='WITHDRAWAL',
                    amount=amount,
                    status='PENDING',
                    description=f"B2C Withdrawal to {validated_phone}"
                )
                
                return Response({
                    'status': 'success',
                    'message': 'Withdrawal initiated',
                    'b2c_id': b2c_trans.id,
                    'phone_number': validated_phone,
                    'amount': str(amount),
                    'remaining_balance': str(student_wallet.balance)
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Error initiating B2C: {str(e)}")
                return Response(
                    {'error': f'Failed to initiate withdrawal: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Exception as e:
            logger.error(f"Error in InitiateB2C: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MpesaTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """View M-Pesa C2B transaction history"""
    serializer_class = MpesaTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return transactions for current student only"""
        return MpesaTransaction.objects.filter(student=self.request.user)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent M-Pesa transactions"""
        transactions = self.get_queryset()[:10]
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)


class B2CTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """View B2C transaction history"""
    serializer_class = B2CTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return transactions for current student only"""
        return B2CTransaction.objects.filter(student=self.request.user)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent B2C transactions"""
        transactions = self.get_queryset()[:10]
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_payment_status(request):
    """Check status of a payment transaction"""
    try:
        transaction_id = request.data.get('transaction_id')
        transaction_type = request.data.get('type', 'c2b')  # c2b or b2c
        
        if not transaction_id:
            return Response(
                {'error': 'transaction_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if transaction_type == 'c2b':
            trans = MpesaTransaction.objects.filter(
                id=transaction_id,
                student=request.user
            ).first()
        else:
            trans = B2CTransaction.objects.filter(
                id=transaction_id,
                student=request.user
            ).first()
        
        if not trans:
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = MpesaTransactionSerializer(trans) if transaction_type == 'c2b' else B2CTransactionSerializer(trans)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
