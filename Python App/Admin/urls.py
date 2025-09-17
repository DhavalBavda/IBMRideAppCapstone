
from django.urls import path

from .views import FareCalculation, RegisterAdminView, LoginAdminView, AdminDetailView



urlpatterns = [
   
    # Fare Calculation Url
    path('fare-cal',FareCalculation,name='fare-cal'),

    # Register Admin Url
    path('register/', RegisterAdminView.as_view(), name='register-admin'),
    
    # Admin Login url
    path('login/', LoginAdminView.as_view(), name='login-admin'),
    
    # Admin Update Url
    path('admin/<str:email>/', AdminDetailView.as_view(), name='get-update-admin'),
 
]
