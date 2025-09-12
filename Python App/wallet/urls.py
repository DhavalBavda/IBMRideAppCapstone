
from django.urls import path
from .views import Hello,Wallet_Oprs

urlpatterns = [
    path('',Hello,name="hello"),
    path('driver-wallet/<uuid:driver_id>/', Wallet_Oprs.as_view(), name="wallet-operations"),
]
