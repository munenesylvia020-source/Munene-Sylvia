from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from finance.models import Wallet
from helb.models import HELBAccount

Student = get_user_model()


@receiver(post_save, sender=Student)
def create_user_wallet(sender, instance, created, **kwargs):
    """Create a wallet automatically when a student is created."""
    if created:
        Wallet.objects.get_or_create(student=instance)


@receiver(post_save, sender=Student)
def create_helb_account(sender, instance, created, **kwargs):
    """Create a HELB account automatically when a student is created."""
    if created:
        HELBAccount.objects.get_or_create(
            student=instance,
            defaults={
                'total_approved_amount': 0,
                'remaining_balance': 0
            }
        )
