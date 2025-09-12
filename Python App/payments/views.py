from django.shortcuts import render, HttpResponse

# Create your views here.
def Hello(request):
    return HttpResponse("<H1>Hello This is the Payment Apis End Point</h1>")
