from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from helb.models import Disbursement, DisbursementSchedule
import json

Student = get_user_model()


class Command(BaseCommand):
    help = 'Create sample HELB disbursements for testing'
    
    def add_arguments(self, parser):
        parser.add_argument('--student-id', type=int, help='Student ID to create disbursements for')
        parser.add_argument('--clear', action='store_true', help='Clear existing disbursements first')
    
    def handle(self, *args, **options):
        student_id = options.get('student_id')
        clear = options.get('clear')
        
        if not student_id:
            self.stdout.write(self.style.ERROR('Please provide --student-id'))
            return
        
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Student with ID {student_id} not found'))
            return
        
        helb_account = student.helb_account
        
        if clear:
            Disbursement.objects.filter(student=student).delete()
            self.stdout.write(self.style.WARNING('Cleared existing disbursements'))
        
        # Create sample disbursement schedule
        today = timezone.now().date()
        disbursements = [
            {
                'amount': Decimal('100000.00'),
                'expected_date': today + timedelta(days=30),
                'status': 'PENDING'
            },
            {
                'amount': Decimal('100000.00'),
                'expected_date': today + timedelta(days=210),  # 6 months later
                'status': 'PENDING'
            },
            {
                'amount': Decimal('100000.00'),
                'expected_date': today + timedelta(days=390),  # 12 months later
                'status': 'PENDING'
            },
            {
                'amount': Decimal('100000.00'),
                'expected_date': today + timedelta(days=570),  # 18 months later
                'status': 'PENDING'
            },
        ]
        
        created_count = 0
        for disb_data in disbursements:
            disb = Disbursement.objects.create(
                helb_account=helb_account,
                student=student,
                amount=disb_data['amount'],
                expected_date=disb_data['expected_date'],
                status=disb_data['status'],
                notes='Sample disbursement created by management command'
            )
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(f'Created: KES {disb.amount} on {disb.expected_date}')
            )
        
        # Create disbursement schedule
        schedule_json = {
            'year_1': {'semester_1': 100000, 'semester_2': 100000},
            'year_2': {'semester_1': 100000, 'semester_2': 100000},
        }
        
        DisbursementSchedule.objects.get_or_create(
            helb_account=helb_account,
            defaults={
                'disbursement_frequency': 'SEMESTER',
                'schedule_json': schedule_json
            }
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully created {created_count} disbursements for {student.username}')
        )
