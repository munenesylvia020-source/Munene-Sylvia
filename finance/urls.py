from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WalletViewSet, TransactionViewSet, BalanceSnapshotViewSet

router = DefaultRouter()
router.register(r'wallets', WalletViewSet, basename='wallet')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'balance-snapshots', BalanceSnapshotViewSet, basename='balance-snapshot')

urlpatterns = [
    path('', include(router.urls)),
]
