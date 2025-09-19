from django.urls import path
from .views import CreateOrderView, VerifyPaymentView, CheckoutPageView, CompletedPaymentsView, GetPaymentDetails , CreateCashPaymentView

urlpatterns = [
    
    path('create-order/', CreateOrderView.as_view(), name='create_order'),
    path('verify-payment/', VerifyPaymentView.as_view(), name='verify_payment'),
    path('checkout/', CheckoutPageView.as_view(), name='checkout_page'),
    path('completed-payments/', CompletedPaymentsView.as_view(), name='completed_payments'),
    path('completed-payments/<uuid:wallet_id>/', CompletedPaymentsView.as_view(), name='completed_payments_by_id'),
    path('getPaymentDetails/<uuid:ride_id>/', GetPaymentDetails.as_view(), name='payment-details' ),
    path('cash-payment/', CreateCashPaymentView.as_view(), name='create_cash_payment'),
]
