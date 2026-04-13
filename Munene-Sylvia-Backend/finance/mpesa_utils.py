"""
M-Pesa Daraja API Integration Utilities
Handles C2B (deposits) and B2C (disbursements) transactions
"""

import requests
import json
import base64
from datetime import datetime
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class DarajaClient:
    """M-Pesa Daraja API Client for sandbox environment"""
    
    # Sandbox URL will change it later for production if 
    BASE_URL = "https://sandbox.safaricom.co.ke"
    AUTH_URL = f"{BASE_URL}/oauth/v1/generate?grant_type=client_credentials"
    C2B_URL = f"{BASE_URL}/mpesa/c2b/v1/registerurl"
    B2C_URL = f"{BASE_URL}/mpesa/b2c/v1/paymentrequest"
    C2B_SIMULATE_URL = f"{BASE_URL}/mpesa/c2b/v1/simulate"
    STK_PUSH_URL = f"{BASE_URL}/mpesa/stkpush/v1/processrequest"
    
    def __init__(self):
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.business_shortcode = settings.MPESA_BUSINESS_SHORTCODE
        self.passkey = settings.MPESA_PASSKEY
        self.callback_url = settings.MPESA_CALLBACK_URL
        self.access_token = None
        self.token_expiry = None
    
    def get_access_token(self):
        """Get OAuth access token from Daraja"""
        try:
            auth = (self.consumer_key, self.consumer_secret)
            response = requests.get(self.AUTH_URL, auth=auth, timeout=10)
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data.get('access_token')
                logger.info("M-Pesa access token generated successfully")
                return self.access_token
            else:
                logger.error(f"Failed to get access token: {response.text}")
                raise Exception(f"Token generation failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error getting M-Pesa access token: {str(e)}")
            raise
    
    def register_c2b_urls(self):
        """Register C2B callback URLs with Safaricom"""
        try:
            if not self.access_token:
                self.get_access_token()
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'ShortCode': self.business_shortcode,
                'ResponseType': 'Completed',
                'ConfirmationURL': f"{self.callback_url}/c2b/callback/",
                'ValidationURL': f"{self.callback_url}/c2b/validate/"
            }
            
            response = requests.post(
                self.C2B_URL,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            logger.info(f"C2B URL registration response: {response.text}")
            return response.json()
            
        except Exception as e:
            logger.error(f"Error registering C2B URLs: {str(e)}")
            raise
    
    def initiate_b2c_payment(self, phone_number, amount, purpose_code='BusinessPayment', remarks=''):
        """
        Initiate B2C payment (disbursement to customer)
        
        Args:
            phone_number: Recipient phone number (e.g., 254712345678)
            amount: Amount to disburse in KES
            purpose_code: Purpose of the payment
            remarks: Additional remarks
        
        Returns:
            Response from Daraja API
        """
        try:
            if not self.access_token:
                self.get_access_token()
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'OriginatorConversationID': f"{int(datetime.now().timestamp())}_{phone_number}",
                'InitiatorName': settings.MPESA_INITIATOR_NAME,
                'InitiatorPassword': settings.MPESA_INITIATOR_PASSWORD,
                'CommandID': purpose_code,
                'Amount': int(amount),
                'PartyA': self.business_shortcode,
                'PartyB': phone_number,
                'Remarks': remarks,
                'QueueTimeOutURL': f"{self.callback_url}/b2c/timeout/",
                'ResultURL': f"{self.callback_url}/b2c/callback/"
            }
            
            response = requests.post(
                self.B2C_URL,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            logger.info(f"B2C payment initiated: {response.text}")
            return response.json()
            
        except Exception as e:
            logger.error(f"Error initiating B2C payment: {str(e)}")
            raise
    
    def simulate_c2b_transaction(self, phone_number, amount, reference=''):
        """
        Simulate C2B transaction for testing (sandbox only)
        
        Args:
            phone_number: Sending phone number (e.g., 254712345678)
            amount: Amount to send
            reference: Reference/description
        
        Returns:
            Response from Daraja API
        """
        try:
            if not self.access_token:
                self.get_access_token()
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'ShortCode': self.business_shortcode,
                'CommandID': 'CustomerPayBillOnline',
                'Amount': int(amount),
                'Msisdn': phone_number,
                'BillRefNumber': reference or 'PennyProf'
            }
            
            response = requests.post(
                self.C2B_SIMULATE_URL,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            logger.info(f"C2B simulation response: {response.text}")
            return response.json()
            
        except Exception as e:
            logger.error(f"Error simulating C2B: {str(e)}")
            raise
    
    def generate_lipa_na_mpesa_online_token(self):
        """Generate STK Push token for M-Pesa Online integration"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password_string = f"{self.business_shortcode}{self.passkey}{timestamp}"
            password = base64.b64encode(password_string.encode()).decode()
            
            # Debug logging
            logger.info(f"STK Push token generation:")
            logger.info(f"  Business Shortcode: {self.business_shortcode}")
            logger.info(f"  Passkey Length: {len(self.passkey)} chars")
            logger.info(f"  Passkey (first 10): {self.passkey[:10] if self.passkey else 'EMPTY'}")
            logger.info(f"  Timestamp: {timestamp}")
            logger.info(f"  Generated Password: {password}")
            
            if not self.access_token:
                self.get_access_token()
            
            return {
                'timestamp': timestamp,
                'password': password
            }
            
        except Exception as e:
            logger.error(f"Error generating STK Push token: {str(e)}")
            raise
    
    def initiate_stk_push(self, phone_number, amount, account_reference='', transaction_desc=''):
        """
        Initiate actual STK Push prompt on M-Pesa phone
        
        Args:
            phone_number: Customer phone number (e.g., 254712345678)
            amount: Amount to charge (KES)
            account_reference: Account reference (optional)
            transaction_desc: Transaction description (optional)
        
        Returns:
            Response from Daraja API
        """
        try:
            if not self.access_token:
                self.get_access_token()
            
            # Generate STK token
            token_data = self.generate_lipa_na_mpesa_online_token()
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'BusinessShortCode': self.business_shortcode,
                'Password': token_data['password'],
                'Timestamp': token_data['timestamp'],
                'TransactionType': 'CustomerPayBillOnline',
                'Amount': int(amount),
                'PartyA': phone_number,
                'PartyB': self.business_shortcode,
                'PhoneNumber': phone_number,
                'CallBackURL': f"{self.callback_url}/c2b/confirm/",
                'AccountReference': account_reference or 'PennyProf',
                'TransactionDesc': transaction_desc or 'Payment to PennyProf'
            }
            
            response = requests.post(
                self.STK_PUSH_URL,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            logger.info(f"STK Push response: {response.text}")
            return response.json()
            
        except Exception as e:
            logger.error(f"Error initiating STK Push: {str(e)}")
            raise


class MpesaTransactionHandler:
    """Handler for M-Pesa transaction processing"""
    
    @staticmethod
    def process_c2b_confirmation(data):
        """
        Process C2B confirmation from M-Pesa
        
        Callback data structure:
        {
            'TransactionType': 'Pay Bill Online',
            'TransID': 'LILNDLC42',
            'TransTime': '20231025123456',
            'TransAmount': 1000,
            'BusinessShortCode': '600371',
            'BillRefNumber': 'student_id',
            'InvoiceNumber': '',
            'OrgAccountBalance': '49249.00',
            'ThirdPartyTransID': '',
            'MSISDN': '254712345678',
            'FirstName': 'John',
            'MiddleName': '',
            'LastName': 'Doe'
        }
        """
        from .models import MpesaTransaction, Transaction
        from django.contrib.auth import get_user_model
        from django.db import transaction as db_transaction
        
        Student = get_user_model()
        
        try:
            # Extract data
            mpesa_code = data.get('TransID')
            phone_number = data.get('MSISDN')
            amount = Decimal(str(data.get('TransAmount', 0)))
            bill_ref = data.get('BillRefNumber', '')
            
            # Find student by phone number or bill reference
            student = None
            if bill_ref:
                # BillRefNumber may be the student ID (from C2B simulation payload), or a prefixed key e.g. student_123.
                if bill_ref.isnumeric():
                    try:
                        student = Student.objects.get(id=int(bill_ref))
                    except Student.DoesNotExist:
                        student = None
                elif bill_ref.startswith('student_'):
                    try:
                        candidate_id = int(bill_ref.split('student_')[-1])
                        student = Student.objects.filter(id=candidate_id).first()
                    except ValueError:
                        student = None
                # If you are using a custom reference like invoice123, this can be mapped via a pending Transaction value.
                if not student:
                    from .models import Transaction
                    pending_tx = Transaction.objects.filter(status='PENDING', student__phone_number=phone_number)
                    student = pending_tx.first().student if pending_tx.exists() else None

            if not student:
                student = Student.objects.filter(phone_number=phone_number).first()
            
            if not student:
                logger.warning(f"No student found for transaction {mpesa_code} (MSISDN={phone_number}, BillRefNumber={bill_ref})")
                return False
            
            # Create or update M-Pesa transaction
            with db_transaction.atomic():
                mpesa_trans, created = MpesaTransaction.objects.get_or_create(
                    mpesa_code=mpesa_code,
                    defaults={
                        'student': student,
                        'phone_number': phone_number,
                        'amount': amount,
                        'transaction_id': data.get('TransID'),
                        'reference': bill_ref,
                        'phone_number_initiator': phone_number,
                        'status': 'COMPLETED'
                    }
                )
                
                if created:
                    # Create wallet deposit transaction
                    Transaction.create_deposit(
                        student=student,
                        amount=amount,
                        mpesa_ref=mpesa_code
                    )
                    logger.info(f"Deposit processed for {student.username}: KES {amount}")
                    return True
                else:
                    logger.warning(f"Duplicate transaction: {mpesa_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error processing C2B confirmation: {str(e)}")
            return False
    
    @staticmethod
    def process_b2c_callback(data):
        """
        Process B2C callback from M-Pesa
        
        Callback data structure:
        {
            'Result': {
                'ResultType': 0,
                'ResultCode': 0,
                'ResultDesc': 'The service request has been accepted successfuly',
                'OriginatorConversationID': '...',
                'ConversationID': '...',
                'TransactionID': 'LIUTF20HDC94',
                'ResultParameters': {
                    'ResultParameter': [
                        {
                            'Key': 'TransactionAmount',
                            'Value': 1000
                        },
                        ...
                    ]
                }
            }
        }
        """
        from .models import B2CTransaction
        from django.utils import timezone as dj_timezone
        
        try:
            result = data.get('Result', {})
            result_code = result.get('ResultCode')
            conversation_id = result.get('ConversationID')
            originator_conversation_id = result.get('OriginatorConversationID')
            
            # Find B2C transaction
            b2c_trans = B2CTransaction.objects.filter(
                originator_conversation_id=originator_conversation_id
            ).first()
            
            if not b2c_trans:
                logger.warning(f"No B2C transaction found for {originator_conversation_id}")
                return False
            
            # Update status based on result code
            if result_code == 0:
                b2c_trans.status = 'SUCCESS'
                b2c_trans.completed_at = dj_timezone.now()
                # Update wallet transaction to completed
                Transaction.objects.filter(
                    student=b2c_trans.student,
                    transaction_type='WITHDRAWAL',
                    amount=b2c_trans.amount,
                    status='PENDING'
                ).update(status='COMPLETED')
            else:
                b2c_trans.status = 'FAILED'
                # Refund wallet balance
                wallet = b2c_trans.student.wallet
                wallet.balance += b2c_trans.amount
                wallet.save()
                # Update wallet transaction to failed
                Transaction.objects.filter(
                    student=b2c_trans.student,
                    transaction_type='WITHDRAWAL',
                    amount=b2c_trans.amount,
                    status='PENDING'
                ).update(status='FAILED')
            
            b2c_trans.result_code = str(result_code)
            b2c_trans.result_description = result.get('ResultDesc')
            b2c_trans.transaction_id = result.get('TransactionID')
            b2c_trans.save()
            
            logger.info(f"B2C callback processed: {b2c_trans.id}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing B2C callback: {str(e)}")
            return False


def validate_phone_number(phone_number):
    """Validate and format phone number to 254XXXXXXXXX format"""
    # Remove any non-digit characters
    digits_only = ''.join(filter(str.isdigit, phone_number))
    
    # Handle different formats
    if digits_only.startswith('254'):
        return digits_only
    elif digits_only.startswith('07') or digits_only.startswith('01'):
        return '254' + digits_only[1:]
    elif len(digits_only) == 9:
        return '254' + digits_only
    else:
        raise ValueError(f"Invalid phone number format: {phone_number}")


def format_amount(amount):
    """Format amount to integer (M-Pesa uses integers)"""
    return int(amount)


# Import at end to avoid circular imports
from decimal import Decimal
