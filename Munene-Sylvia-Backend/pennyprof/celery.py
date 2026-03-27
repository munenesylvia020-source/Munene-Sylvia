"""
Celery Configuration for Premier Consolidated Capital Holdings

Background tasks for daily interest accrual and scheduled disbursement checks.
Requires: celery, redis
"""

import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pennyprof.settings')

app = Celery('pennyprof')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat Schedule for Periodic Tasks
app.conf.beat_schedule = {
    'process-daily-disbursements': {
        'task': 'finance.tasks.process_daily_disbursements',
        'schedule': crontab(minute=0),  # Run every hour on the hour
    },
    'verify-disbursement-status': {
        'task': 'finance.tasks.verify_daily_disbursement_status', 
        'schedule': crontab(minute='*/5'),  # Run every 5 minutes
    },
}

# Celery Configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Africa/Nairobi',
    enable_utc=False,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
)
