import os
from rest_framework import authentication
from rest_framework import exceptions
from django.conf import settings
from django.contrib.auth import get_user_model
import firebase_admin
from firebase_admin import credentials, auth

# Initialize Firebase Admin App
cred_path = os.path.join(settings.BASE_DIR, 'firebase-key.json')

if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    # Check if app is already initialized
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

Student = get_user_model()


class FirebaseAuthentication(authentication.BaseAuthentication):
    """
    Custom Authentication backend mapping Firebase JWT to Django User.
    """
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header:
            return None
            
        try:
            # Bearer <token> or Token <token>
            parts = auth_header.split()
            if len(parts) != 2:
                return None
                
            token = parts[1]
            
            # Verify Firebase Token
            decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
            uid = decoded_token.get('uid')
            
            if not uid:
                raise exceptions.AuthenticationFailed('Invalid Firebase UID')
                
            # Find the user by firebase_uid or email
            email = decoded_token.get('email')
            
            try:
                user = Student.objects.get(firebase_uid=uid)
            except Student.DoesNotExist:
                # If they were registered manually before Firebase integration, map them via email
                if email:
                    user = Student.objects.filter(email=email).first()
                    if user:
                        user.firebase_uid = uid
                        user.save(update_fields=['firebase_uid'])
                    else:
                        return None
                else:
                    return None
                    
            if not user.is_active:
                raise exceptions.AuthenticationFailed('User inactive or deleted.')
                
            return (user, None)
            
        except auth.InvalidIdTokenError:
            raise exceptions.AuthenticationFailed('Invalid Firebase Identity Token')
        except auth.ExpiredIdTokenError:
            raise exceptions.AuthenticationFailed('Firebase Token has expired')
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Firebase Authentication Failed: {str(e)}')
