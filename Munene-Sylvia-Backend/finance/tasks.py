from celery import shared_task
from django.utils import timezone
from decimal import Decimal
from datetime import date
import logging

from .models import DailyLimit, DailyDisbursement, B2CTransaction, Wallet
from .mpesa_utils import DarajaClient
from accounts.models import Student

logger = logging.getLogger(__name__)


@shared_task
def process_daily_disbursements():
    """
    Scheduled task to disburse daily allowance to active students at their set time.
    
    This task:
    1. Finds all active daily limits
    2. Checks if it's time for disbursement (based on disbursement_time)
    3. Initiates M-Pesa B2C payment for the daily amount
    4. Records the disbursement
    5. Handles failures and retries
    
    Should be scheduled to run every hour via Beat schedule.
    """
    logger.info("Starting daily disbursement processing")
    
    try:
        current_time = timezone.now()
        today = date.today()
        
        # Get all active daily limits that haven't been disbursed today
        active_limits = DailyLimit.objects.filter(
            is_active=True,
            last_disbursement_date__lt=today  # Not disbursed today
        )
        
        logger.info(f"Found {active_limits.count()} active daily limits to process")
        
        for daily_limit in active_limits:
            try:
                # Check if it's time for disbursement
                if current_time.time() < daily_limit.disbursement_time:
                    # Not yet time for disbursement
                    continue
                
                # Additional check: if last disbursement was today, skip
                if daily_limit.last_disbursement_date == today:
                    continue
                
                # Initiate B2C payment
                disbursement = initiate_daily_disbursement(daily_limit)
                
                if disbursement:
                    logger.info(
                        f"Disbursement initiated for student {daily_limit.student.id}: "
                        f"KES {daily_limit.daily_amount} to {daily_limit.phone_number}"
                    )
                
            except Exception as e:
                logger.error(
                    f"Error processing daily limit {daily_limit.id}: {str(e)}",
                    exc_info=True
                )
                continue
        
        logger.info("Daily disbursement processing completed")
        
    except Exception as e:
        logger.error(f"Fatal error in daily disbursement task: {str(e)}", exc_info=True)


def initiate_daily_disbursement(daily_limit):
    """
    Initiate M-Pesa B2C payment for daily limit.
    
    Args:
        daily_limit: DailyLimit instance
    
    Returns:
        DailyDisbursement instance if successful, None otherwise
    """
    try:
        # Validate phone number format
        if not daily_limit.phone_number or len(daily_limit.phone_number) < 12:
            logger.error(f"Invalid phone number for daily limit {daily_limit.id}")
            return None
        
        # Initialize Daraja client
        daraja_client = DarajaClient()
        
        # Initiate B2C payment
        b2c_response = daraja_client.initiate_b2c_payment(
            phone_number=daily_limit.phone_number,
            amount=daily_limit.daily_amount,
            purpose_code='SalaryPayment',  # Closest match for student allowance
            remarks='Daily allowance from Penny Professor'
        )
        
        if not b2c_response:
            logger.error(f"Failed to initiate B2C payment for daily_limit {daily_limit.id}")
            return None
        
        # Extract response data
        conversation_id = b2c_response.get('ConversationID')
        originator_conversation_id = b2c_response.get('OriginatorConversationID')
        response_code = b2c_response.get('ResponseCode')
        response_description = b2c_response.get('ResponseDescription', '')
        
        # Create B2CTransaction record
        b2c_transaction = B2CTransaction.objects.create(
            student=daily_limit.student,
            phone_number=daily_limit.phone_number,
            amount=daily_limit.daily_amount,
            purpose_code='SalaryPayment',
            status='INITIATED',
            conversation_id=conversation_id,
            originator_conversation_id=originator_conversation_id,
            mpesa_response={
                'ResponseCode': response_code,
                'ResponseDescription': response_description
            }
        )
        
        # Create DailyDisbursement record
        disbursement = DailyDisbursement.objects.create(
            student=daily_limit.student,
            daily_limit=daily_limit,
            amount=daily_limit.daily_amount,
            phone_number=daily_limit.phone_number,
            status='INITIATED' if response_code == '0' else 'FAILED',
            disbursement_date=date.today(),
            b2c_transaction=b2c_transaction
        )
        
        # Update last_disbursement_date
        daily_limit.last_disbursement_date = date.today()
        daily_limit.save(update_fields=['last_disbursement_date'])
        
        logger.info(
            f"Daily disbursement created for student {daily_limit.student.id}: "
            f"Response code {response_code}"
        )
        
        return disbursement
        
    except Exception as e:
        logger.error(f"Error initiating daily disbursement: {str(e)}", exc_info=True)
        return None


@shared_task
def verify_daily_disbursement_status():
    """
    Scheduled task to verify status of pending daily disbursements.
    
    Checks M-Pesa API for status of INITIATED disbursements and updates records.
    Should run periodically (e.g., every 5 minutes) to catch delayed confirmations.
    """
    logger.info("Starting daily disbursement status verification")
    
    try:
        # Get pending disbursements from last 24 hours
        from datetime import timedelta
        
        pending_disbursements = DailyDisbursement.objects.filter(
            status='INITIATED',
            disbursement_date__gte=date.today() - timedelta(days=1)
        )
        
        logger.info(f"Verifying {pending_disbursements.count()} pending disbursements")
        
        daraja_client = DarajaClient()
        
        for disbursement in pending_disbursements:
            try:
                # Check B2CTransaction status via Daraja
                if disbursement.b2c_transaction:
                    # Query M-Pesa for transaction status
                    # This would require implementing a status check method in DarajaClient
                    # For now, we rely on webhook callbacks
                    pass
                    
            except Exception as e:
                logger.error(f"Error verifying disbursement {disbursement.id}: {str(e)}")
                continue
        
        logger.info("Daily disbursement status verification completed")
        
    except Exception as e:
        logger.error(f"Fatal error in verification task: {str(e)}", exc_info=True)
