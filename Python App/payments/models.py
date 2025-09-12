from django.db import models

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
