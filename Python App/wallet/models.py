from django.db import models
import uuid

# Wallet Model
class Wallet(models.Model):
    wallet_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    driver_id = models.UUIDField(editable=False, null=False)
    total_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=False)
    actual_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=False)
    a_deduct = models.DecimalField(max_digits=12, decimal_places=2, default=0,null=False)
    is_active = models.BooleanField(default=True, null=False)
    created_at = models.DateTimeField(auto_now_add=True, null=False)
    updated_at = models.DateTimeField(auto_now=True, null=False)

    def __str__(self):
        return f"Wallet({self.wallet_id}) - Driver: {self.driver_id} - Balance: {self.total_balance}"
    
    def apply_pending_deduction(self):
        if self.a_deduct > 0 and self.actual_balance >= self.a_deduct:
            self.actual_balance -= self.a_deduct
            # send self.a_deduct to admin
            self.a_deduct = 0
            self.save()

# Withdrwaable Model
class Withdraw(models.Model):
    WITHDRAW_STATUS_CHOICES = [
        ('REQUESTED', 'Requested'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    withdraw_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="withdrawals", editable=False)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=False)
    account_holder_name = models.CharField(max_length=100)
    bank_name = models.CharField(max_length=100)
    ifsc_code = models.CharField(max_length=50)
    account_number = models.CharField(max_length=20)
    contact_info = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, choices=WITHDRAW_STATUS_CHOICES, default='REQUESTED')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Withdraw({self.withdraw_id}) - {self.amount} ({self.status})"
