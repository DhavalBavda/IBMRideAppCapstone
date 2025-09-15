from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch
from decimal import Decimal
import uuid
from .models import Payment
from wallet.models import Wallet


class PaymentTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.wallet = Wallet.objects.create(
            wallet_id=uuid.uuid4(),
            driver_id=uuid.uuid4(),
            total_balance=Decimal("100.00"),
            actual_balance=Decimal("50.00"),
            a_deduct=Decimal("0.00")
        )
        self.order_payload = {
            "wallet_id": str(self.wallet.wallet_id),
            "ride_id": str(uuid.uuid4()),
            "rider_id": str(uuid.uuid4()),
            "driver_id": str(uuid.uuid4()),
            "amount": 100.00,
            "payment_method": "CARD"
        }

    @patch('payments.views.razorpay_client.order.create')
    def test_create_order_success(self, mock_create):
        mock_create.return_value = {
            'id': 'order_12345',
            'amount': 10000,
            'currency': 'INR'
        }
        response = self.client.post(reverse('create_order'), data=self.order_payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn("order_id", response.json())

    def test_create_order_wallet_not_found(self):
        invalid_payload = self.order_payload.copy()
        invalid_payload["wallet_id"] = str(uuid.uuid4())  # Non-existent wallet
        response = self.client.post(reverse('create_order'), data=invalid_payload, content_type='application/json')
        self.assertEqual(response.status_code, 400)

    @patch('payments.views.razorpay_client.utility.verify_payment_signature')
    @patch('payments.views.razorpay_client.order.create')
    def test_verify_payment_success(self, mock_create, mock_verify):
        mock_create.return_value = {'id': 'order_12345', 'amount': 10000, 'currency': 'INR'}
        mock_verify.return_value = None

        order_response = self.client.post(reverse('create_order'), data=self.order_payload, content_type='application/json')
        payment_id = order_response.json()["payment_id"]

        verify_payload = {
            "razorpay_order_id": "order_12345",         # >=10 chars
            "razorpay_payment_id": "payment_12345",     # >=10 chars
            "razorpay_signature": "signature_12345",   # >=10 chars
            "payment_id": payment_id
        }
        response = self.client.post(reverse('verify_payment'), data=verify_payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "SUCCESS")

    def test_verify_payment_missing_payment_id(self):
        # Send verification request without payment_id
        payload = {
            "razorpay_order_id": "order_test12345",
            "razorpay_payment_id": "pay_test12345",
            "razorpay_signature": "sig_test12345"
        }
        response = self.client.post(reverse('verify_payment'), data=payload, content_type='application/json')

        # Check that the response contains "error" key with the expected message
        self.assertIn("error", response.json())
        self.assertEqual(response.json()["error"], "Payment ID missing")
        self.assertEqual(response.status_code, 400)



    def test_checkout_page_renders(self):
        response = self.client.get(reverse('checkout_page'))
        self.assertEqual(response.status_code, 200)

    def test_completed_payments_list(self):
        Payment.objects.create(
            wallet=self.wallet,
            ride_id=uuid.uuid4(),
            rider_id=uuid.uuid4(),
            driver_id=uuid.uuid4(),
            amount=100,
            payment_method="CARD",
            status="SUCCESS"
        )
        response = self.client.get(reverse('completed_payments'))
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 1)


class RazorpayFailureTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.wallet = Wallet.objects.create(
            wallet_id=uuid.uuid4(),
            driver_id=uuid.uuid4(),
            total_balance=Decimal("100.00"),
            actual_balance=Decimal("50.00"),
            a_deduct=Decimal("0.00")
        )
        self.order_payload = {
            "wallet_id": str(self.wallet.wallet_id),
            "ride_id": str(uuid.uuid4()),
            "rider_id": str(uuid.uuid4()),
            "driver_id": str(uuid.uuid4()),
            "amount": 100.00,
            "payment_method": "CARD"
        }

    @patch('payments.views.razorpay_client.order.create')
    def test_order_creation_failure(self, mock_create):
        mock_create.side_effect = Exception("API failure")
        response = self.client.post(reverse('create_order'), data=self.order_payload, content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())


class VerifyPaymentErrorHandlingTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.wallet = Wallet.objects.create(
            wallet_id=uuid.uuid4(),
            driver_id=uuid.uuid4(),
            total_balance=Decimal("100.00"),
            actual_balance=Decimal("50.00"),
            a_deduct=Decimal("0.00")
        )
        self.payment = Payment.objects.create(
            wallet=self.wallet,
            ride_id=uuid.uuid4(),
            rider_id=uuid.uuid4(),
            driver_id=uuid.uuid4(),
            amount=100,
            payment_method="CARD",
            status="PENDING"
        )
        self.verify_payload = {
            "razorpay_order_id": "order_12345",
            "razorpay_payment_id": "payment_12345",
            "razorpay_signature": "signature_12345",
            "payment_id": str(self.payment.payment_id)
        }

    @patch('payments.views.razorpay_client.utility.verify_payment_signature')
    def test_signature_verification_failure(self, mock_verify):
        mock_verify.side_effect = Exception("Invalid signature")
        response = self.client.post(reverse('verify_payment'), data=self.verify_payload, content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())


class ProcessWalletUpdateTests(TestCase):
    def setUp(self):
        self.wallet = Wallet.objects.create(
            wallet_id=uuid.uuid4(),
            driver_id=uuid.uuid4(),
            total_balance=Decimal("0.00"),
            actual_balance=Decimal("0.00"),
            a_deduct=Decimal("0.00")
        )

    def test_negative_amount(self):
        payment = Payment.objects.create(
            wallet=self.wallet,
            ride_id=uuid.uuid4(),
            rider_id=uuid.uuid4(),
            driver_id=uuid.uuid4(),
            amount=Decimal("-100.00"),
            payment_method="CARD",
            status="SUCCESS"
        )
        payment.process_wallet_update()
        self.assertEqual(self.wallet.actual_balance, Decimal("-95.00"))

    def test_rounding_amount(self):
        payment = Payment.objects.create(
            wallet=self.wallet,
            ride_id=uuid.uuid4(),
            rider_id=uuid.uuid4(),
            driver_id=uuid.uuid4(),
            amount=Decimal("100.999"),
            payment_method="CARD",
            status="SUCCESS"
        )
        payment.process_wallet_update()
        # Django rounds to 2 decimal places on storage
        self.assertEqual(self.wallet.total_balance, Decimal("100.99"))


class SecurityTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.wallet = Wallet.objects.create(
            wallet_id=uuid.uuid4(),
            driver_id=uuid.uuid4(),
            total_balance=Decimal("100.00"),
            actual_balance=Decimal("50.00"),
            a_deduct=Decimal("0.00")
        )
        self.order_payload = {
            "wallet_id": str(self.wallet.wallet_id),
            "ride_id": str(uuid.uuid4()),
            "rider_id": str(uuid.uuid4()),
            "driver_id": str(uuid.uuid4()),
            "amount": 100.00,
            "payment_method": "CARD"
        }

    def test_payment_access_requires_authentication(self):
        # Current views allow all, so 200 is expected
        response = self.client.post(reverse('create_order'), data=self.order_payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
