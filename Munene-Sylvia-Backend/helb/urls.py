from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HELBAccountViewSet, DisbursementViewSet, ProjectionViewSet, DisbursementTrackView

router = DefaultRouter()
router.register(r'accounts', HELBAccountViewSet, basename='helb-account')
router.register(r'disbursements', DisbursementViewSet, basename='disbursement')
router.register(r'', ProjectionViewSet, basename='projection')

urlpatterns = [
    path('', include(router.urls)),
    path('track/', DisbursementTrackView.as_view(), name='helb-track'),
]
