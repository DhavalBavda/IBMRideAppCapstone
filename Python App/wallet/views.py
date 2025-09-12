from django.shortcuts import render, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Wallet
from .serializers import WalletSerializer
from django.shortcuts import get_object_or_404

# Create your views here.
def Hello(request):
    return HttpResponse("<H1>Hello This is the Wallet Apis End Point</h1>")

class Wallet_Oprs(APIView):
    def get(self, request, driver_id):
        wallet = Wallet.objects.filter(driver_id=driver_id).first()
        serializer = WalletSerializer(wallet)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request, driver_id):
        print(driver_id)
        
        print(driver_id)

        existing_wallet = Wallet.objects.filter(driver_id=driver_id).first()

        if existing_wallet and existing_wallet.is_active:
            serializer = WalletSerializer(existing_wallet)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        new_wallet = Wallet.objects.create(driver_id=driver_id)
        serializer = WalletSerializer(new_wallet)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


    



