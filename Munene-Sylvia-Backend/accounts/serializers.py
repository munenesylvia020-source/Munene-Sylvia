from rest_framework import serializers
from django.contrib.auth import get_user_model

Student = get_user_model()


class StudentRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for student registration via Firebase Auth."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = Student
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'password', 'firebase_uid', 'registration_number',
            'phone_number', 'institution_name'
        ]
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        username = validated_data.pop('username', None)

        # If the client does not provide username, use email local part or fallback
        if not username:
            email = validated_data.get('email', '')
            username = email.split('@')[0] if '@' in email else email
            username = username or Student.objects.make_random_password(length=12)

        # create_user handles password hashing correctly.
        student = Student.objects.create_user(username=username, password=password, **validated_data)
        return student


class StudentDetailSerializer(serializers.ModelSerializer):
    """Serializer for student profile details."""
    
    class Meta:
        model = Student
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'firebase_uid', 'registration_number', 'phone_number',
            'institution_name', 'date_of_onboarding', 'is_active_student'
        ]
        read_only_fields = ['id', 'date_of_onboarding']
