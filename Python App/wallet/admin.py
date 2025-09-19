from django.contrib import admin
from .models import Wallet

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    # Fields you want visible in the list page
    list_display = ("wallet_id", "driver_id", "total_balance", "is_active", "created_at", "updated_at")

    # Optional: make some fields clickable links
    list_display_links = ("wallet_id", "driver_id")

    # Optional: filters on the right side
    list_filter = ("is_active", "created_at")

    # Optional: search bar on top
    search_fields = ("wallet_id", "driver_id")
