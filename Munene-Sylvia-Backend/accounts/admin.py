from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model

Student = get_user_model()


@admin.register(Student)
class StudentAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Student Info', {
            'fields': ('firebase_uid', 'registration_number', 'phone_number',
                      'institution_name', 'is_active_student')
        }),
    )
    list_display = ['username', 'email', 'registration_number', 'phone_number',
                    'institution_name', 'is_active_student']
    list_filter = ['is_active_student', 'date_of_onboarding', 'institution_name']
    search_fields = ['username', 'email', 'registration_number', 'phone_number']
