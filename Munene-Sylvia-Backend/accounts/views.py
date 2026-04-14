from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth import login as django_login, logout as django_logout
from .serializers import StudentRegistrationSerializer, StudentDetailSerializer

Student = get_user_model()


import firebase_admin
from firebase_admin import auth as firebase_auth

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        firebase_token = request.data.get('firebase_token')
        
        if not firebase_token:
            return Response({'error': 'Firebase token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_token = firebase_auth.verify_id_token(firebase_token, clock_skew_seconds=60)
            uid = decoded_token.get('uid')
            email = decoded_token.get('email')
            
            student = Student.objects.filter(firebase_uid=uid).first()
            if not student and email:
                student = Student.objects.filter(email__iexact=email).first()
                if student:
                    student.firebase_uid = uid
                    student.save(update_fields=['firebase_uid'])
            
            if not student:
                return Response({'error': 'User not found in system. Please register first.'}, status=status.HTTP_404_NOT_FOUND)
                
            token, _ = Token.objects.get_or_create(user=student)
            
            user_data = StudentDetailSerializer(student).data
            user_data['has_completed_onboarding'] = student.has_completed_onboarding
            
            return Response({'token': token.key, 'user': user_data})
            
        except Exception as e:
            return Response({'error': f'Invalid Firebase token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        firebase_token = request.data.get('firebase_token')
        
        if not firebase_token:
            return Response({'error': 'Firebase token is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            decoded_token = firebase_auth.verify_id_token(firebase_token, clock_skew_seconds=60)
            uid = decoded_token.get('uid')
            
            # Use serializer to validate incoming extra fields (username, first_name etc)
            serializer = StudentRegistrationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Save student and inject firebase_uid
            student = serializer.save(firebase_uid=uid)
            token, _ = Token.objects.get_or_create(user=student)
            
            return Response({'token': token.key, 'user': StudentDetailSerializer(student).data}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': f'Registration failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(StudentDetailSerializer(request.user).data)


class TokenRefreshView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        request.user.auth_token.delete()
        token = Token.objects.create(user=user)
        return Response({'token': token.key})


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

