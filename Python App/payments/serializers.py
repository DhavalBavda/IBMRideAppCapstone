from rest_framework import serializers
from .models import Payment
from wallet.models import Wallet


# create a Order SErializer 
class CreateOrderSerializer(serializers.Serializer):
    wallet_id = serializers.UUIDField()
    ride_id = serializers.UUIDField()
    rider_id = serializers.UUIDField()
    driver_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHOD_CHOICES, default='CARD')

    def validate_wallet_id(self, value):
        if not Wallet.objects.filter(wallet_id=value).exists():
            raise serializers.ValidationError("Wallet not found")
        return value

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value


# Varify Payment Serializer 
class VerifyPaymentSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField(min_length=10)
    razorpay_payment_id = serializers.CharField(min_length=10)
    razorpay_signature = serializers.CharField(min_length=10)



# Payment Serializer 
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['payment_id', 'wallet', 'ride_id', 'rider_id', 'driver_id', 'amount', 'payment_method', 'status', 'created_at']