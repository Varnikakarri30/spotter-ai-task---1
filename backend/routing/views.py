"""
API Views for Spotter AI Weather-Aware Truck Routing.
"""

import logging
from datetime import datetime, timedelta
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers import RoutePlanRequestSerializer, GeocodeRequestSerializer
from .routing_service import geocode_location, get_distinct_routes
from .geometry import generate_route_checkpoints
from .weather import sample_checkpoints_weather
from .risk import evaluate_checkpoint_risk
from .ranking import calculate_route_risk_metrics, rank_and_recommend_routes

logger = logging.getLogger(__name__)


def format_seconds_to_duration(seconds: float) -> str:
    """Format seconds into 'Xh Ym' string."""
    total_minutes = int(round(seconds / 60))
    hours = total_minutes // 60
    minutes = total_minutes % 60
    if hours > 0 and minutes > 0:
        return f"{hours}h {minutes}m"
    elif hours > 0:
        return f"{hours}h"
    else:
        return f"{minutes}m"


@api_view(['GET'])
def health_check(request):
    """Health check endpoint."""
    return Response({
        "status": "healthy",
        "service": "Spotter AI Weather-Aware Routing Backend",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0"
    })


@api_view(['GET', 'POST'])
def geocode_view(request):
    """Geocode a US location query."""
    if request.method == 'GET':
        query = request.GET.get('query', '')
    else:
        serializer = GeocodeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        query = serializer.validated_data['query']

    if not query.strip():
        return Response({"error": "Query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

    result = geocode_location(query)
    if not result:
        return Response({"error": f"Location '{query}' could not be resolved."}, status=status.HTTP_404_NOT_FOUND)

    return Response(result)


@api_view(['POST'])
def plan_route(request):
    """
    Main Route Planning Endpoint:
    - Validates trip inputs
    - Geocodes origin & destination
    - Retrieves up to 3 distinct route options
    - Samples weather checkpoints at specified interval (10, 25, 50 mi)
    - Evaluates weather risk and load-specific overrides
    - Calculates distance-weighted metrics
    - Ranks routes lexicographically and recommends the best option
    - Generates 0-48h forecast corridor data for the interactive slider
    """
    serializer = RoutePlanRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "error": "Validation failed",
            "details": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    origin_query = data["origin"]
    dest_query = data["destination"]
    departure_time: datetime = data["departure_time"]
    load_weight_lb = data["load_weight_lb"]
    interval_miles = data.get("checkpoint_interval_miles", 25)

    # 1. Geocode Origin & Destination
    origin_geo = geocode_location(origin_query)
    if not origin_geo:
        return Response({
            "error": f"Could not find coordinates for origin: '{origin_query}'. Please specify a US city or address."
        }, status=status.HTTP_400_BAD_REQUEST)

    dest_geo = geocode_location(dest_query)
    if not dest_geo:
        return Response({
            "error": f"Could not find coordinates for destination: '{dest_query}'. Please specify a US city or address."
        }, status=status.HTTP_400_BAD_REQUEST)

    origin_coords = (origin_geo["latitude"], origin_geo["longitude"])
    dest_coords = (dest_geo["latitude"], dest_geo["longitude"])

    # 2. Retrieve Route Alternatives
    routes, routing_note = get_distinct_routes(origin_coords, dest_coords, max_routes=3)
    if not routes:
        return Response({
            "error": "No drivable routes could be established between origin and destination.",
            "details": routing_note
        }, status=status.HTTP_404_NOT_FOUND)

    # 3. Process each route: Checkpoints, Weather, Risk & Metrics
    processed_routes = []
    recommended_corridor_grid = {}

    for route in routes:
        coords = route.get("coordinates", [])
        duration_sec = route.get("duration_seconds", 0.0)
        dist_miles = route.get("distance_miles", 0.0)

        # Checkpoints sampling
        raw_checkpoints = generate_route_checkpoints(
            coordinates=coords,
            total_duration_seconds=duration_sec,
            departure_time=departure_time,
            interval_miles=interval_miles
        )

        # Retrieve weather for each checkpoint at ETA
        checkpoints_with_weather, corridor_grid = sample_checkpoints_weather(
            checkpoints=raw_checkpoints,
            departure_time=departure_time
        )

        # Classify risk at each checkpoint
        evaluated_checkpoints = []
        for cp in checkpoints_with_weather:
            risk_eval = evaluate_checkpoint_risk(
                wind_mph=cp.get("wind_mph"),
                rain_in_hr=cp.get("rain_in_hr"),
                snow_in_hr=cp.get("snow_in_hr"),
                load_weight_lb=load_weight_lb
            )
            evaluated_cp = {**cp, **risk_eval}
            evaluated_checkpoints.append(evaluated_cp)

        # Calculate distance-weighted route risk metrics
        metrics = calculate_route_risk_metrics(route, evaluated_checkpoints)

        arrival_dt = departure_time + timedelta(seconds=duration_sec)

        full_route_obj = {
            "route_index": route.get("route_index", 1),
            "name": route.get("name", f"Route Option {route.get('route_index', 1)}"),
            "provider": route.get("provider", "Routing Engine"),
            "distance_miles": dist_miles,
            "duration_seconds": duration_sec,
            "formatted_duration": format_seconds_to_duration(duration_sec),
            "departure_time": departure_time.isoformat(),
            "arrival_time": arrival_dt.isoformat(),
            "coordinates": coords,
            "checkpoints": evaluated_checkpoints,
            **metrics
        }
        processed_routes.append((full_route_obj, corridor_grid))

    # 4. Rank routes lexicographically and determine recommendation
    route_objs = [r[0] for r in processed_routes]
    ranked_routes = rank_and_recommend_routes(route_objs)

    # Save corridor grid for the top-ranked route (for the 0-48h slider)
    winning_index = ranked_routes[0]["route_index"]
    for r_obj, c_grid in processed_routes:
        if r_obj["route_index"] == winning_index:
            recommended_corridor_grid = c_grid
            break

    response_payload = {
        "status": "success",
        "origin": origin_geo,
        "destination": dest_geo,
        "departure_time": departure_time.isoformat(),
        "load_weight_lb": load_weight_lb,
        "checkpoint_interval_miles": interval_miles,
        "routes": ranked_routes,
        "recommended_route_index": ranked_routes[0]["route_index"],
        "corridor_forecast_grid": recommended_corridor_grid,
        "routing_note": routing_note,
        "units": {
            "distance": "miles",
            "duration": "seconds",
            "wind": "mph",
            "rain": "in/hr",
            "snow": "in/hr",
            "weight": "lb",
            "temperature": "F"
        }
    }

    return Response(response_payload)
