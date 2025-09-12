
from django.urls import path
from .views import Hello,Wallet_Oprs,Withdraw_Oprs

urlpatterns = [
    path('',Hello,name="hello"),
    path('driver-wallet/', Wallet_Oprs.as_view(),name='get-all-wallet'),
    path('driver-wallet/<uuid:driver_id>/', Wallet_Oprs.as_view(), name="wallet-operations"),
     
    path('withdraw/<uuid:driver_id>/', Withdraw_Oprs.as_view(), name='withdraw-list-create'),

    path('withdraw/status/<uuid:withdraw_id>/', Withdraw_Oprs.as_view(), name='withdraw-update-status'),
]
