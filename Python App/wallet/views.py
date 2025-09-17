from django.shortcuts import render, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Wallet,Withdraw
from .serializers import WalletSerializer,WithdrawSerializer
from django.shortcuts import get_object_or_404
from django.db import transaction
 
from decimal import Decimal
 


# all the apis with single view
class Wallet_Oprs(APIView):
    def get(self, request, driver_id=None):
        if driver_id:  # If a driver_id is provided, return that wallet
            wallet = Wallet.objects.filter(driver_id=driver_id).first()
            if not wallet:
                return Response({"detail": "Wallet not found"}, status=status.HTTP_404_NOT_FOUND)
            serializer = WalletSerializer(wallet)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Otherwise, return all wallets
        wallets = Wallet.objects.all()
        serializer = WalletSerializer(wallets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, driver_id):
        existing_wallet = Wallet.objects.filter(driver_id=driver_id).first()

        if existing_wallet and existing_wallet.is_active:
            serializer = WalletSerializer(existing_wallet)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        new_wallet = Wallet.objects.create(driver_id=driver_id)
        serializer = WalletSerializer(new_wallet)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def patch(self, request, driver_id):
        existing_wallet = Wallet.objects.filter(driver_id=driver_id).first()
        if not existing_wallet:
            return Response({"detail": "Wallet not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if existing_wallet.is_active:
            existing_wallet.is_active = False
            existing_wallet.save()  
            return Response({"detail": "Wallet deactivated successfully"}, status=status.HTTP_200_OK)
        
        return Response({"detail": "Wallet is already deactivated"}, status=status.HTTP_400_BAD_REQUEST)


class Withdraw_Oprs(APIView):
    # Get all withdrawals for a driver's wallet
    def get(self, request, driver_id=None):
        if driver_id==None:
            
            withdrawals = Withdraw.objects.filter(status="REQUESTED")
            serializer = WithdrawSerializer(withdrawals, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)


        wallet = get_object_or_404(Wallet, driver_id=driver_id)
        withdrawals = Withdraw.objects.filter(wallet=wallet)
        serializer = WithdrawSerializer(withdrawals, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # Create a new withdrawal request
    def post(self, request, driver_id):
        wallet = Wallet.objects.filter(driver_id=driver_id).first()
        if not wallet:
            return Response({'details': 'Wallet Not Found'}, status=status.HTTP_404_NOT_FOUND)

        # Safely convert amount to float (or Decimal)
        try:
            amount = float(request.data.get('amount', 0))
        except (TypeError, ValueError):
            return Response({"details": "Invalid amount provided"}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({"details": "Amount must be greater than zero"}, status=status.HTTP_400_BAD_REQUEST)

        if amount > wallet.actual_balance:
            return Response(
                {"details": f"Enter a lesser amount. You have only {wallet.actual_balance} in your account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if there is already a pending withdrawal request
        if Withdraw.objects.filter(wallet=wallet, status="REQUESTED").exists():
            return Response(
                {"details": "Wait for the completion or rejection of the request you already made."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create withdrawal
        withdrawal = Withdraw.objects.create(
            wallet=wallet,
            amount=amount,
            account_holder_name=request.data.get('account_holder_name'),
            bank_name=request.data.get('bank_name'),
            ifsc_code=request.data.get('ifsc_code'),
            account_number=request.data.get('account_number'),
            contact_info=request.data.get('contact_info')
        )

        serializer = WithdrawSerializer(withdrawal)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # Update Withdraw Request 
    def patch(self, request, withdraw_id):
        withdrawal = get_object_or_404(Withdraw, withdraw_id=withdraw_id)
        new_status = request.data.get('status')

        if not new_status:
            return Response({'details': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)

        withdrawal.status = new_status.strip()
        withdrawal.save()

        wallet = withdrawal.wallet
        withdrawal_amount = Decimal(withdrawal.amount)
        if wallet.actual_balance >= withdrawal_amount:
            wallet.actual_balance -= withdrawal_amount
            print(wallet.actual_balance)
            wallet.save()
        else:

            return Response(
                     {"details": "Insufficient wallet balance to complete withdrawal"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        serializer = WithdrawSerializer(withdrawal)
        return Response({
            "withdrawal": serializer.data,
            "wallet_balance": str(wallet.actual_balance)
        }, status=status.HTTP_200_OK)



# Admin Bonus view 
class Admin_Bonus(APIView):
    def post(self, request, wallet_id=None):
        try:
            amount = request.data.get("amount")
            if not amount:
                return Response({"error": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Convert amount to Decimal
            amount = Decimal(amount)

            if wallet_id:
                wallet = Wallet.objects.filter(wallet_id=wallet_id,is_active=True).first()
                if not wallet:
                    return Response({"error": "Wallet not found"}, status=status.HTTP_404_NOT_FOUND)

                # Deduct adjustment if any
                if wallet.a_deduct > 0:
                    wallet.actual_balance = amount - wallet.a_deduct if wallet.a_deduct < amount else Decimal(0)
                    wallet.a_deduct = wallet.a_deduct - amount if wallet.a_deduct > amount else Decimal(0)

                # Add bonus amount
                wallet.actual_balance += amount
                wallet.total_balance += amount
                wallet.save()
            
            else:
                # Bulk update for all active wallets
                wallets = Wallet.objects.filter(is_active=True)
                for wallet in wallets:
                    if wallet.a_deduct > 0:
                        wallet.actual_balance = amount - wallet.a_deduct if wallet.a_deduct < amount else Decimal(0)
                        wallet.a_deduct = Decimal(0)
                    wallet.actual_balance += amount
                    wallet.total_balance += amount
                    wallet.save()

            return Response({"message": "Bonus added successfully"}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
