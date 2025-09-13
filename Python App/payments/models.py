from django.db import models
from decimal import Decimal, ROUND_DOWN
import uuid

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('CARD', 'Card'),
        ('UPI', 'UPI'),
        ('CASH', 'Cash'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    payment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    wallet = models.ForeignKey(
        "wallet.Wallet",  
        on_delete=models.CASCADE,
        related_name="payments"
    )

    ride_id = models.UUIDField(editable=False)
    rider_id = models.UUIDField(editable=False)
    driver_id = models.UUIDField(editable=False)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=False)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    transaction_meta_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment({self.payment_id}) - {self.amount} ({self.status})"


    def process_wallet_update(self):
        """
        Update wallet balances and pending deductions after payment success.
        Decimal-safe calculations for paise/decimal amounts.
        """
        from decimal import Decimal, ROUND_DOWN

        wallet = self.wallet

        # Ensure amount is Decimal
        amount = Decimal(self.amount).quantize(Decimal("0.01"), rounding=ROUND_DOWN)

        # Admin fee: 5% of amount
        admin_fee = (amount * Decimal("0.05")).quantize(Decimal("0.01"), rounding=ROUND_DOWN)

        # Net amount after admin fee
        net_amount = amount - admin_fee

        # Add full amount to total_balance
        wallet.total_balance += amount

        if self.payment_method != 'CASH':
            wallet.actual_balance += net_amount
        else:
            # For cash, deduct admin fee from actual_balance if possible
            if wallet.actual_balance >= admin_fee:
                wallet.actual_balance -= admin_fee
                # send admin_fee to admin
            else:
                # Not enough balance, add to pending deduction
                wallet.a_deduct += admin_fee

        # Save wallet changes
        wallet.save()

        # Apply any pending deductions if possible
        wallet.apply_pending_deduction()