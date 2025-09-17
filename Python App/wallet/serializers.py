from rest_framework import serializers
from .models import Wallet,Withdraw

# Wallet Serializer 
class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = '__all__'


# Withdraw Serializer 
class WithdrawSerializer(serializers.ModelSerializer):
    class Meta:
        model=Withdraw
        fields='__all__'

        