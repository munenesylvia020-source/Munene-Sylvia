"""
Background tasks for investment portfolio management.

Includes daily interest accrual and portfolio calculations.
"""

from celery import shared_task
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from .models import InvestmentPosition, InterestAccrualLog
import logging

logger = logging.getLogger(__name__)


@shared_task
def accrue_daily_interest():
    """
    Calculate and accrue daily interest for all active investment positions.
    
    Runs daily at 8 PM EAT.
    Uses compound interest formula with annual yield.
    """
    try:
        positions = InvestmentPosition.objects.filter(status='ACTIVE')
        accrual_count = 0
        total_interest = Decimal('0')
        
        for position in positions:
            with transaction.atomic():
                try:
                    # Calculate daily interest
                    daily_interest = position.calculate_daily_interest()
                    
                    if daily_interest > 0:
                        # Log before accrual
                        value_before = position.current_value
                        
                        # Accrue interest
                        position.accumulated_interest += daily_interest
                        position.current_value += daily_interest
                        position.last_interest_accrual = timezone.now()
                        position.save()
                        
                        # Create audit log
                        InterestAccrualLog.objects.create(
                            position=position,
                            interest_accrued=daily_interest,
                            value_before=value_before,
                            value_after=position.current_value
                        )
                        
                        accrual_count += 1
                        total_interest += daily_interest
                        
                        logger.info(
                            f"Accrued {daily_interest} interest for {position.student.username} "
                            f"on {position.fund_name}"
                        )
                
                except Exception as e:
                    logger.error(
                        f"Failed to accrue interest for position {position.id}: {str(e)}"
                    )
                    continue
        
        logger.info(
            f"Daily interest accrual completed: {accrual_count} positions, "
            f"Total: KES {total_interest:.2f}"
        )
        
        return {
            'status': 'success',
            'positions_updated': accrual_count,
            'total_interest_accrued': str(total_interest)
        }
    
    except Exception as e:
        logger.error(f"Daily interest accrual task failed: {str(e)}")
        return {'status': 'failed', 'error': str(e)}


@shared_task
def send_portfolio_update(student_id):
    """
    Send portfolio update notification to student.
    
    Triggered after significant portfolio changes.
    Integrates with Firebase real-time sync.
    """
    try:
        from django.contrib.auth import get_user_model
        Student = get_user_model()
        
        student = Student.objects.get(id=student_id)
        positions = InvestmentPosition.objects.filter(
            student=student,
            status='ACTIVE'
        )
        
        total_invested = sum(p.principal_amount for p in positions)
        total_value = sum(p.current_value for p in positions)
        total_gained = total_value - total_invested
        
        # TODO: Send notification via Firebase or email
        logger.info(
            f"Portfolio update for {student.username}: "
            f"KES {total_value:.2f} (Gain: KES {total_gained:.2f})"
        )
        
        return {'status': 'success', 'student_id': student_id}
    
    except Exception as e:
        logger.error(f"Failed to send portfolio update: {str(e)}")
        return {'status': 'failed', 'error': str(e)}
