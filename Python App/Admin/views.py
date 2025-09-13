from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests
import os
from dotenv import load_dotenv


from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Admin
from .serializers import AdminSerializer, AdminLoginSerializer,AdminUpdateSerializer 
from rest_framework.permissions import AllowAny 

load_dotenv()

@api_view(['GET'])
def Hello(request):
    return Response({"message": "Hello! This is the Admin API endpoint."})


# Register Admin
class RegisterAdminView(generics.CreateAPIView):
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer


# Login Admin
class LoginAdminView(APIView):
    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        if serializer.is_valid():
            admin = serializer.validated_data
            return Response({
                "message": "Login successful",
                "admin": AdminSerializer(admin).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminDetailView(generics.RetrieveUpdateAPIView):
    queryset = Admin.objects.all()
    serializer_class = AdminUpdateSerializer
    lookup_field = 'email'


 
 


@api_view(['POST'])
def FareCalculation(request):

    try:
        # Extract coordinates from request
        cordinates = request.data.get('cordinates')
        if not cordinates or len(cordinates) < 2:
            return Response({"error": "Please provide two coordinates: location1 and location2"}, status=400)

        # Get API key
        API_KEY = os.getenv('API_KEY')
        if not API_KEY:
            return Response({"error": "Your API Key is missing, please check API configuration"}, status=500)

        # OpenRouteService matrix endpoint (for distance & duration)
        url = "https://api.openrouteservice.org/v2/matrix/driving-car"
        headers = {
            "Authorization": API_KEY,
            "Content-Type": "application/json"
        }
        body = {
            "locations": cordinates,
            "metrics": ["distance", "duration"]
        }

     
        res = requests.post(url, json=body, headers=headers)
       
        # Check response
        if res.status_code != 200:
            return Response({
                "error": "Failed to fetch routes",
                "details": res.text,
                "status_code": res.status_code
            }, status=res.status_code)

        data = res.json()

        # Extract distance and duration
        distance_m = data['distances'][0][1]  
        duration_s = data['durations'][0][1]

        # Fare calculation
        base_fare = 50      
        per_km_rate = 10    
        distance_km = distance_m / 1000
        fare = base_fare + (distance_km * per_km_rate)

        return Response({
            "distance_km": round(distance_km, 2),
            "duration_minutes": round(duration_s / 60, 2),
            "fare_estimate": round(fare, 2),
            
        })

    except Exception as e:
        return Response({"error": "Internal server error", "details": str(e)}, status=500)
