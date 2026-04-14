from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'
    
    def ready(self):
        import accounts.signals
        
        # Initialize Firebase Admin
        import os
        import firebase_admin
        from firebase_admin import credentials
        from django.conf import settings
        
        cred_path = os.path.join(settings.BASE_DIR, 'firebase-key.json')
        if os.path.exists(cred_path) and not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
