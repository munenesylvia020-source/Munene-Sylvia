from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator


class Student(AbstractUser):
    """Custom User model for students with Firebase UID mapping."""
    
    firebase_uid = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text="Firebase unique identifier for cross-database auth"
    )
    registration_number = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="University registration/admission number"
    )
    phone_number = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="M-Pesa phone number (254XXXXXXXXX format)"
    )
    institution_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Name of university/college"
    )
    date_of_onboarding = models.DateTimeField(auto_now_add=True)
    is_active_student = models.BooleanField(
        default=True,
        help_text="Whether student is currently active"
    )
    has_completed_onboarding = models.BooleanField(
        default=False,
        help_text="Whether user has completed initial onboarding setup"
    )
    
    class Meta:
        verbose_name = 'Student'
        verbose_name_plural = 'Students'
        ordering = ['-date_of_onboarding']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.registration_number})"
