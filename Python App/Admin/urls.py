
from django.urls import path
from .views import Hello,FareCalculation

urlpatterns = [
    path('',Hello,name="hello"),
    path('fare-cal',FareCalculation,name='fare-cal'),

]
