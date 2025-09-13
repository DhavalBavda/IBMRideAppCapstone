
from django.urls import path

from .views import Hello,FareCalculation, RegisterAdminView, LoginAdminView, AdminDetailView,AddOtherAdminView



urlpatterns = [
    path('',Hello,name="hello"),
    path('fare-cal',FareCalculation,name='fare-cal'),
    path('register/', RegisterAdminView.as_view(), name='register-admin'),
    path('login/', LoginAdminView.as_view(), name='login-admin'),
    path('admin/<str:email>/', AdminDetailView.as_view(), name='get-update-admin'),
 
]
