from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WalletViewSet, TransactionViewSet, BalanceSnapshotViewSet,
    ExpenseViewSet, BudgetAPIView, DailyLimitViewSet, FundSourceViewSet
)
from .mpesa_views import (
    C2BCallbackView, C2BValidationView, B2CCallbackView, B2CTimeoutView,
    InitiateC2BView, InitiateB2CView, MpesaTransactionViewSet,
    B2CTransactionViewSet, check_payment_status
)

router = DefaultRouter()
router.register(r'wallets', WalletViewSet, basename='wallet')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'balance-snapshots', BalanceSnapshotViewSet, basename='balance-snapshot')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'mpesa-transactions', MpesaTransactionViewSet, basename='mpesa-transaction')
router.register(r'b2c-transactions', B2CTransactionViewSet, basename='b2c-transaction')
router.register(r'daily-limit', DailyLimitViewSet, basename='daily-limit')
router.register(r'fund-sources', FundSourceViewSet, basename='fund-source')

urlpatterns = [
    path('', include(router.urls)),
    path('budget/', BudgetAPIView.as_view(), name='budget'),
    
    # M-Pesa C2B endpoints
    path('c2b/callback/', C2BCallbackView.as_view(), name='c2b-callback'),
    path('c2b/confirm/', C2BCallbackView.as_view(), name='c2b-confirm'),
    path('c2b/validate/', C2BValidationView.as_view(), name='c2b-validate'),
    path('c2b/initiate/', InitiateC2BView.as_view(), name='c2b-initiate'),
    
    # M-Pesa B2C endpoints
    path('b2c/initiate/', InitiateB2CView.as_view(), name='b2c-initiate'),
    path('b2c/callback/', B2CCallbackView.as_view(), name='b2c-callback'),
    path('b2c/timeout/', B2CTimeoutView.as_view(), name='b2c-timeout'),
    
    # Payment status
    path('payment-status/', check_payment_status, name='payment-status'),
]
