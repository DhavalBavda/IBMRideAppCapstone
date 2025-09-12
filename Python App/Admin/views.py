from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests
import os
from dotenv import load_dotenv
import time

load_dotenv()

@api_view(['GET'])
def Hello(request):
    return Response({"message": "Hello! This is the Admin API endpoint."})

@api_view(['POST'])
def FareCalculation(request):
    """
    Calculate estimated fare between two coordinates using OpenRouteService.
    Expects JSON body:
    {
        "cordinates": [[lon1, lat1], [lon2, lat2]]
    }
    """
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

        # Measure start time
        start_time = time.time()
        res = requests.post(url, json=body, headers=headers)
        end_time = time.time()
        execution_time = end_time - start_time

        # Check response
        if res.status_code != 200:
            return Response({
                "error": "Failed to fetch routes",
                "details": res.text,
                "status_code": res.status_code
            }, status=res.status_code)

        data = res.json()

        # Extract distance and duration
        distance_m = data['distances'][0][1]  # from location 1 to location 2
        duration_s = data['durations'][0][1]

        # Fare calculation
        base_fare = 50       # base fare in INR
        per_km_rate = 10     # per km fare
        distance_km = distance_m / 1000
        fare = base_fare + (distance_km * per_km_rate)

        return Response({
            "distance_km": round(distance_km, 2),
            "duration_minutes": round(duration_s / 60, 2),
            "fare_estimate": round(fare, 2),
            "api_execution_time_s": round(execution_time, 3)
        })

    except Exception as e:
        return Response({"error": "Internal server error", "details": str(e)}, status=500)
