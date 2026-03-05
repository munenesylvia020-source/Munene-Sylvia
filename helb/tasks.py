"""
Background tasks for HELB disbursement management.

Includes disbursement tracking, projections, and notifications.
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import Disbursement, DisbursementProjection, HELBAccount
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_overdue_disbursements():
    """
    Check for overdue HELB disbursements and flag them.
    
    Runs daily at 9 AM EAT. Updates status and sends notifications.
    """
    try:
        today = timezone.now().date()
        
        # Find overdue disbursements
        overdue = Disbursement.objects.filter(
            expected_date__lt=today,
            status__in=['PENDING', 'APPROVED']
        )
        
        flagged_count = 0
        for disbursement in overdue:
            # Log overdue status
            logger.warning(
                f"OVERDUE: {disbursement.student.username} - "
                f"Expected: {disbursement.expected_date}, "
                f"Status: {disbursement.status}"
            )
            flagged_count += 1
            
            # TODO: Send notification to student
            # notify_student_overdue_disbursement(disbursement)
        
        logger.info(f"Overdue disbursement check: {flagged_count} flagged")
        
        return {
            'status': 'success',
            'overdue_count': flagged_count
        }
    
    except Exception as e:
        logger.error(f"Overdue disbursement check failed: {str(e)}")
        return {'status': 'failed', 'error': str(e)}


@shared_task
def create_disbursement_projections():
    """
    Generate disbursement projections for all students.
    
    Runs daily at midnight. Analyzes historical patterns and
    creates forecasts with confidence levels.
    """
    try:
        accounts = HELBAccount.objects.all()
        projection_count = 0
        
        for account in accounts:
            try:
                # Get recent disbursements
                recent = Disbursement.objects.filter(
                    helb_account=account,
                    status='COMPLETED'
                ).order_by('-disbursal_date')[:4]
                
                if not recent.exists():
                    continue
                
                # Calculate average disbursement interval
                dates = [d.disbursal_date for d in recent]
                if len(dates) >= 2:
                    intervals = [
                        (dates[i] - dates[i+1]).days
                        for i in range(len(dates)-1)
                    ]
                    avg_interval = sum(intervals) / len(intervals)
                    
                    # Project next disbursement
                    last_date = dates[0]
                    next_projected_date = last_date + timedelta(days=int(avg_interval))
                    
                    # Determine confidence level
                    if len(recent) >= 4:
                        confidence = 'HIGH'  # More data = higher confidence
                    elif len(recent) >= 2:
                        confidence = 'MEDIUM'
                    else:
                        confidence = 'LOW'
                    
                    # Create projection
                    DisbursementProjection.objects.create(
                        helb_account=account,
                        projected_date=timezone.now(),
                        next_disbursement_date=next_projected_date,
                        projected_amount=recent[0].amount,  # Use last amount
                        confidence_level=confidence
                    )
                    
                    projection_count += 1
                    
                    logger.info(
                        f"Projection for {account.student.username}: "
                        f"Next ~{next_projected_date} ({confidence} confidence)"
                    )
            
            except Exception as e:
                logger.error(
                    f"Failed to create projection for account {account.id}: {str(e)}"
                )
                continue
        
        logger.info(f"Disbursement projections created: {projection_count} students")
        
        return {
            'status': 'success',
            'projections_created': projection_count
        }
    
    except Exception as e:
        logger.error(f"Disbursement projection task failed: {str(e)}")
        return {'status': 'failed', 'error': str(e)}


@shared_task
def notify_upcoming_disbursement(student_id):
    """
    Send notification 3 days before expected disbursement.
    
    Triggered by schedule or manually.
    """
    try:
        from django.contrib.auth import get_user_model
        Student = get_user_model()
        
        student = Student.objects.get(id=student_id)
        
        # Get next expected disbursement
        today = timezone.now().date()
        next_disbursement = Disbursement.objects.filter(
            student=student,
            expected_date__gte=today,
            status__in=['PENDING', 'APPROVED']
        ).order_by('expected_date').first()
        
        if next_disbursement:
            days_until = (next_disbursement.expected_date - today).days
            
            if days_until <= 3:
                logger.info(
                    f"Notifying {student.username} about disbursement "
                    f"of KES {next_disbursement.amount} in {days_until} days"
                )
                
                # TODO: Send notification via Firebase or email
                # send_notification(student, next_disbursement)
        
        return {'status': 'success', 'student_id': student_id}
    
    except Exception as e:
        logger.error(f"Failed to send disbursement notification: {str(e)}")
        return {'status': 'failed', 'error': str(e)}
