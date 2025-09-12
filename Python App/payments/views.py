from django.shortcuts import render, HttpResponse
import razorpay
import uuid
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Payment
from wallet.models import Wallet  # since you linked wallet
import os
from dotenv import load_dotenv

load_dotenv()

RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
)

def Hello(request):
    return JsonResponse({"message": "Hello, This is the Payment APIs Endpoint"})

@csrf_exempt
def create_order(request):
    """Create Razorpay Order"""
    if request.method == "POST":
        body = json.loads(request.body)
        amount = int(float(body.get("amount")) * 100)  # Razorpay needs paise
        currency = "INR"

        razorpay_order = razorpay_client.order.create(dict(
            amount=amount,
            currency=currency,
            payment_capture='1'
        ))

        # Save in DB as Pending
        payment = Payment.objects.create(
            wallet=Wallet.objects.get(wallet_id=body["wallet_id"]),
            ride_id=uuid.UUID(body["ride_id"]),
            rider_id=uuid.UUID(body["rider_id"]),
            driver_id=uuid.UUID(body["driver_id"]),
            amount=body["amount"],
            payment_method=body.get("payment_method", "CARD"),
            status="PENDING",
            transaction_meta_data=razorpay_order
        )

        return JsonResponse({
            "order_id": razorpay_order["id"],
            "payment_id": str(payment.payment_id),
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "status": payment.status,
            "razorpay_key_id": RAZORPAY_KEY_ID
        })

@csrf_exempt
def verify_payment(request):
    """Verify Razorpay Payment Signature"""
    if request.method == "POST":
        body = json.loads(request.body)
        try:
            params_dict = {
                'razorpay_order_id': body['razorpay_order_id'],
                'razorpay_payment_id': body['razorpay_payment_id'],
                'razorpay_signature': body['razorpay_signature']
            }
            razorpay_client.utility.verify_payment_signature(params_dict)

            # Update DB
            payment = Payment.objects.get(transaction_meta_data__id=body['razorpay_order_id'])
            payment.status = "SUCCESS"
            payment.transaction_meta_data.update(body)
            payment.save()

            return JsonResponse({"message": "Payment verified successfully", "status": "SUCCESS"})
        except Exception as e:
            return JsonResponse({"error": str(e), "status": "FAILED"}, status=400)

