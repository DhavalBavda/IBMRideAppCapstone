from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render
import razorpay
import os
from dotenv import load_dotenv
from .models import Payment
from wallet.models import Wallet
from .serializers import CreateOrderSerializer, VerifyPaymentSerializer
import uuid
from django.utils import timezone
from rest_framework.generics import ListAPIView
from .serializers import PaymentSerializer


load_dotenv()

RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class CreateOrderView(APIView):
    permission_classes = []  # Allow any
    authentication_classes = []  # No authentication required

    def post(self, request):
        try:
            serializer = CreateOrderSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            wallet = Wallet.objects.get(wallet_id=data['wallet_id'])
            amount_in_paise = int(float(data['amount']) * 100)

            razorpay_order = razorpay_client.order.create({
                'amount': amount_in_paise,
                'currency': 'INR',
                'payment_capture': '1'
            })

            payment = Payment.objects.create(
                wallet=wallet,
                ride_id=data['ride_id'],
                rider_id=data['rider_id'],
                driver_id=data['driver_id'],
                amount=data['amount'],
                payment_method=data['payment_method'],
                status='PENDING',
                transaction_meta_data=razorpay_order
            )            

            return Response({
                "ride_id": str(payment.ride_id),
                "order_id": razorpay_order['id'],
                "payment_id": str(payment.payment_id),
                "amount": razorpay_order['amount'],
                "currency": razorpay_order['currency'],
                "status": payment.status,
                "razorpay_key_id": RAZORPAY_KEY_ID
            })

        except Wallet.DoesNotExist:
            return Response({"error": "Wallet not found"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class VerifyPaymentView(APIView):
    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            # Fetch exact Payment using payment_id
            ride_id = request.data.get("ride_id")
            payment_id = request.data.get("payment_id")
            if not payment_id:
                return Response({"error": "Payment ID missing"}, status=status.HTTP_400_BAD_REQUEST)
            if not ride_id:
                return Response({"error": "Ride_id missing"})
            
            # Verify signature
            params_dict = {
                'razorpay_order_id': data['razorpay_order_id'],
                'razorpay_payment_id': data['razorpay_payment_id'],
                'razorpay_signature': data['razorpay_signature']
            }
            razorpay_client.utility.verify_payment_signature(params_dict)

    
            payment = Payment.objects.get(payment_id=payment_id)
            payment.status = 'SUCCESS'
            payment.transaction_meta_data.update(data)
            payment.save()

            # Update wallet balances
            payment.process_wallet_update()

            return Response({"message": "Payment verified successfully", "status": "SUCCESS", "ride_id":ride_id})

        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e), "status": "FAILED"}, status=status.HTTP_400_BAD_REQUEST)

class CheckoutPageView(APIView):
    def get(self, request):
        return render(request, 'payments/checkout.html')

class CompletedPaymentsView(ListAPIView):
    serializer_class = PaymentSerializer
    
    def get_queryset(self):
        queryset = Payment.objects.filter(status='SUCCESS')
        wallet_id = self.kwargs.get('wallet_id', None)
        if wallet_id:
            queryset = queryset.filter(wallet_id=wallet_id)
        return queryset