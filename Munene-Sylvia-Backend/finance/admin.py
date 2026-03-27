from django.contrib import admin
from .models import Wallet, Transaction, BalanceSnapshot


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['student', 'balance', 'currency', 'updated_at']
    list_filter = ['currency', 'created_at']
    search_fields = ['student__username', 'student__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['student', 'transaction_type', 'amount', 'status', 'created_at']
    list_filter = ['transaction_type', 'status', 'created_at']
    search_fields = ['student__username', 'mpesa_reference']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BalanceSnapshot)
class BalanceSnapshotAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'balance', 'snapshot_date']
    list_filter = ['snapshot_date']
    search_fields = ['wallet__student__username']
    readonly_fields = ['snapshot_date']
