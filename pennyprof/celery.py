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
    'accrue-daily-interest': {
        'task': 'investments.tasks.accrue_daily_interest',
        'schedule': crontab(hour=20, minute=0),  # 8 PM daily
    },
    'check-overdue-disbursements': {
        'task': 'helb.tasks.check_overdue_disbursements',
        'schedule': crontab(hour=9, minute=0),  # 9 AM daily
    },
    'create-disbursement-projections': {
        'task': 'helb.tasks.create_disbursement_projections',
        'schedule': crontab(hour=0, minute=0),  # Midnight daily
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
