from django.urls import path
from .views import CreateOrderView, VerifyPaymentView, CheckoutPageView

urlpatterns = [
    path('create-order/', CreateOrderView.as_view(), name='create_order'),
    path('verify-payment/', VerifyPaymentView.as_view(), name='verify_payment'),
    path('checkout/', CheckoutPageView.as_view(), name='checkout_page'),
]
