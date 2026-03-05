from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import StudentRegistrationSerializer, StudentDetailSerializer

Student = get_user_model()


class StudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for student account management and authentication.
    
    Provides endpoints for student registration, profile retrieval,
    and account management. Supports Firebase UID mapping for
    cross-database authentication.
    
    ## Endpoints:
    
    - `POST /students/` - Register new student
    - `GET /students/` - List all students (admin only)
    - `GET /students/{id}/` - Retrieve student profile
    - `PUT /students/{id}/` - Update student profile (admin or self)
    - `GET /students/me/` - Get current authenticated student
    - `POST /students/update_phone/` - Update M-Pesa phone number
    """
    
    queryset = Student.objects.all()
    serializer_class = StudentDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Use registration serializer for create action."""
        if self.action == 'create':
            return StudentRegistrationSerializer
        return StudentDetailSerializer
    
    def get_permissions(self):
        """Allow unauthenticated users to register."""
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get current authenticated student's profile.
        
        Returns the profile of the student making the request.
        Includes registration number, phone, institution, and onboarding date.
        """
        serializer = StudentDetailSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def update_phone(self, request):
        """
        Update student's M-Pesa phone number.
        
        Required for deposit initiation via STK Push.
        Format: 254712345678 (Kenyan phone number with country code).
        """
        student = request.user
        phone_number = request.data.get('phone_number')
        
        if not phone_number:
            return Response(
                {'error': 'phone_number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        student.phone_number = phone_number
        student.save()
        
        return Response(
            {'message': 'Phone number updated successfully'},
            status=status.HTTP_200_OK
        )
    
    def perform_create(self, serializer):
        """Override to prevent non-admin creation of other students."""
        serializer.save()

