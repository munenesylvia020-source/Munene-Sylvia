from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AllocationPlanViewSet, InvestmentPositionViewSet, InterestAccrualLogViewSet

router = DefaultRouter()
router.register(r'allocations', AllocationPlanViewSet, basename='allocation')
router.register(r'positions', InvestmentPositionViewSet, basename='position')
router.register(r'investments', InvestmentPositionViewSet, basename='investment')
router.register(r'accrual-logs', InterestAccrualLogViewSet, basename='accrual-log')

urlpatterns = [
    path('', include(router.urls)),
]
