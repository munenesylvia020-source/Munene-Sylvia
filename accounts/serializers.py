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
            'username': {'required': True},
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        student = Student.objects.create_user(**validated_data)
        student.set_password(password)
        student.save()
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
