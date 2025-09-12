from rest_framework import serializers
from .models import Wallet,Withdraw

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = '__all__'



class WithdrawSerializer(serializers.ModelSerializer):
    class Meta:
        model=Withdraw
        fields='__all__'

        