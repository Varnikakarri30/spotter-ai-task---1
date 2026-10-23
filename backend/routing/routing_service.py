"""
Routing and Geocoding Service for Spotter AI.

Supports:
- Geocoding US locations via OpenRouteService Geocode or OpenStreetMap Nominatim.
- Multi-route retrieval (up to 3 genuinely distinct routes) via:
  1. OpenRouteService Directions API (driving-hgv or driving-car) when API key is provided.
  2. Public OSRM routing engine with highway corridor alternatives.
- Distance conversion from meters to miles.
- Duration conversion from seconds to human-readable format.
- Accurate route geometries as [[lat, lon], ...].
- Graceful handling when fewer than 3 alternatives exist.
"""

import os
import math
import logging
from typing import List, Dict, Any, Optional, Tuple
import requests

logger = logging.getLogger(__name__)

ORS_API_KEY = os.getenv("OPENROUTESERVICE_API_KEY", "").strip()
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving"
ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-hgv/geojson"

ORS_GEOCODE_URL = "https://api.openrouteservice.org/geocode/search"

# Common US logistics hubs cache for speed and resilience
HUB_CACHE: Dict[str, Tuple[float, float, str]] = {
    "chicago": (41.8781, -87.6298, "Chicago, IL, USA"),
    "denver": (39.7392, -104.9903, "Denver, CO, USA"),
    "dallas": (32.7767, -96.7970, "Dallas, TX, USA"),
    "los angeles": (34.0522, -118.2437, "Los Angeles, CA, USA"),
    "seattle": (47.6062, -122.3321, "Seattle, WA, USA"),
    "atlanta": (33.7490, -84.3880, "Atlanta, GA, USA"),
    "new york": (40.7128, -74.0060, "New York, NY, USA"),
    "kansas city": (39.0997, -94.5786, "Kansas City, MO, USA"),
    "st louis": (38.6270, -90.1994, "St. Louis, MO, USA"),
    "omaha": (41.2565, -95.9345, "Omaha, NE, USA"),
    "des moines": (41.5868, -93.6250, "Des Moines, IA, USA"),
    "salt lake city": (40.7608, -111.8910, "Salt Lake City, UT, USA"),
    "minneapolis": (44.9778, -93.2650, "Minneapolis, MN, USA"),
    "houston": (29.7604, -95.3698, "Houston, TX, USA"),
    "phoenix": (33.4484, -112.0740, "Phoenix, AZ, USA"),
    "indianapolis": (39.7684, -86.1581, "Indianapolis, IN, USA"),
}


def geocode_location(query: str) -> Optional[Dict[str, Any]]:
    """
    Geocode a US location query into latitude, longitude, and formatted name.
    """
    clean_query = query.strip()
    if not clean_query:
        return None

    # Check common hub cache
    norm_key = clean_query.lower().replace(", usa", "").replace(", us", "").strip()
    if norm_key in HUB_CACHE:
        lat, lon, name = HUB_CACHE[norm_key]
        return {"latitude": lat, "longitude": lon, "display_name": name}

    for key, (lat, lon, name) in HUB_CACHE.items():
        if key in norm_key:
            return {"latitude": lat, "longitude": lon, "display_name": name}

    # If coordinates format e.g. "41.8781, -87.6298"
    if "," in clean_query:
        parts = clean_query.split(",")
        if len(parts) == 2:
            try:
                lat = float(parts[0].strip())
                lon = float(parts[1].strip())
                if -90 <= lat <= 90 and -180 <= lon <= 180:
                    return {
                        "latitude": round(lat, 5),
                        "longitude": round(lon, 5),
                        "display_name": f"{lat:.4f}, {lon:.4f} (Coordinates)"
                    }
            except ValueError:
                pass

    # Try OpenRouteService Geocode if key available
    if ORS_API_KEY:
        try:
            headers = {"Authorization": ORS_API_KEY}
            params = {"text": clean_query, "boundary.country": "USA", "size": 1}
            resp = requests.get(ORS_GEOCODE_URL, headers=headers, params=params, timeout=6)
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                if features:
                    feat = features[0]
                    coords = feat["geometry"]["coordinates"]
                    label = feat.get("properties", {}).get("label", clean_query)
                    return {
                        "latitude": round(coords[1], 5),
                        "longitude": round(coords[0], 5),
                        "display_name": label
                    }
        except Exception as e:
            logger.warning(f"ORS geocoding error: {e}")

    # Fallback to OpenStreetMap Nominatim
    try:
        headers = {"User-Agent": "SpotterAI-TruckRouting/1.0"}
        params = {
            "q": clean_query,
            "format": "json",
            "countrycodes": "us",
            "limit": 1
        }
        resp = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=6)
        if resp.status_code == 200:
            data = resp.json()
            if data:
                return {
                    "latitude": round(float(data[0]["lat"]), 5),
                    "longitude": round(float(data[0]["lon"]), 5),
                    "display_name": data[0]["display_name"]
                }
    except Exception as e:
        logger.error(f"Nominatim geocoding error: {e}")

    return None


def fetch_ors_routes(
    origin: Tuple[float, float],
    destination: Tuple[float, float]
) -> List[Dict[str, Any]]:
    """
    Fetch routes using OpenRouteService Directions API.
    """
    if not ORS_API_KEY:
        return []

    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json, application/geo+json"
    }
    body = {
        "coordinates": [
            [origin[1], origin[0]],  # [lon, lat]
            [destination[1], destination[0]]
        ],
        "alternative_routes": {
            "target_count": 3,
            "share_factor": 0.6,
            "weight_factor": 1.4
        },
        "instructions": False,
        "geometry": True
    }

    try:
        # Try driving-hgv first, fallback to driving-car
        resp = requests.post(ORS_DIRECTIONS_URL, json=body, headers=headers, timeout=12)
        if resp.status_code != 200:
            car_url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
            resp = requests.post(car_url, json=body, headers=headers, timeout=12)

        if resp.status_code == 200:
            data = resp.json()
            features = data.get("features", [])
            routes = []
            for idx, feat in enumerate(features):
                props = feat.get("properties", {})
                summary = props.get("summary", {})
                dist_meters = summary.get("distance", 0.0)
                duration_sec = summary.get("duration", 0.0)
                coords = feat.get("geometry", {}).get("coordinates", [])

                # Convert [lon, lat] to [lat, lon]
                lat_lon_coords = [[c[1], c[0]] for c in coords]
                dist_miles = dist_meters / 1609.344

                routes.append({
                    "route_index": idx + 1,
                    "provider": "OpenRouteService",
                    "name": f"ORS Route Option {idx + 1}",
                    "distance_miles": round(dist_miles, 1),
                    "duration_seconds": round(duration_sec),
                    "coordinates": lat_lon_coords,
                })
            return routes
    except Exception as e:
        logger.error(f"ORS routing request failed: {e}")

    return []


def fetch_osrm_routes(
    origin: Tuple[float, float],
    destination: Tuple[float, float]
) -> List[Dict[str, Any]]:
    """
    Fetch alternative routes using OSRM routing engine.
    """
    routes = []
    try:
        url = f"{OSRM_BASE_URL}/{origin[1]},{origin[0]};{destination[1]},{destination[0]}"
        params = {
            "overview": "full",
            "geometries": "geojson",
            "alternatives": "true",
            "steps": "false"
        }
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            raw_routes = data.get("routes", [])
            for idx, r in enumerate(raw_routes):
                dist_miles = r.get("distance", 0.0) / 1609.344
                duration_sec = r.get("duration", 0.0)
                coords = r.get("geometry", {}).get("coordinates", [])
                lat_lon_coords = [[c[1], c[0]] for c in coords]

                routes.append({
                    "route_index": idx + 1,
                    "provider": "OSRM",
                    "name": f"Route Option {idx + 1} ({round(dist_miles)} mi)",
                    "distance_miles": round(dist_miles, 1),
                    "duration_seconds": round(duration_sec),
                    "coordinates": lat_lon_coords,
                })
    except Exception as e:
        logger.error(f"OSRM routing request failed: {e}")

    return routes


def fetch_waypoint_alternative(
    origin: Tuple[float, float],
    waypoint: Tuple[float, float],
    destination: Tuple[float, float],
    name_suffix: str = "Corridor"
) -> Optional[Dict[str, Any]]:
    """
    Fetch a distinct highway route via a strategic corridor waypoint.
    """
    try:
        url = f"{OSRM_BASE_URL}/{origin[1]},{origin[0]};{waypoint[1]},{waypoint[0]};{destination[1]},{destination[0]}"
        params = {
            "overview": "full",
            "geometries": "geojson",
            "steps": "false"
        }
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            raw_routes = data.get("routes", [])
            if raw_routes:
                r = raw_routes[0]
                dist_miles = r.get("distance", 0.0) / 1609.344
                duration_sec = r.get("duration", 0.0)
                coords = r.get("geometry", {}).get("coordinates", [])
                lat_lon_coords = [[c[1], c[0]] for c in coords]

                return {
                    "provider": "OSRM",
                    "name": f"Alternative via {name_suffix}",
                    "distance_miles": round(dist_miles, 1),
                    "duration_seconds": round(duration_sec),
                    "coordinates": lat_lon_coords,
                }
    except Exception as e:
        logger.warning(f"Waypoint alternative request failed: {e}")

    return None


def get_distinct_routes(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    max_routes: int = 3
) -> Tuple[List[Dict[str, Any]], str]:
    """
    Request up to 3 genuinely distinct route alternatives.
    Prioritizes OpenRouteService if API key configured, otherwise OSRM with corridor options.
    Returns: (routes_list, status_note)
    """
    # 1. Try OpenRouteService
    routes = fetch_ors_routes(origin, destination)
    if routes:
        note = f"Retrieved {len(routes)} distinct route option(s) from OpenRouteService."
        return routes[:max_routes], note

    # 2. Try OSRM
    routes = fetch_osrm_routes(origin, destination)

    # 3. If OSRM returned fewer than 3, generate distinct highway corridor alternatives
    if len(routes) < max_routes and routes:
        # Calculate midpoint and perpendicular offsets for genuine alternative corridors
        mid_lat = (origin[0] + destination[0]) / 2.0
        mid_lon = (origin[1] + destination[1]) / 2.0
        d_lat = destination[0] - origin[0]
        d_lon = destination[1] - origin[1]

        # Perpendicular vector
        perp_lat = -d_lon * 0.25
        perp_lon = d_lat * 0.25

        # Northern / Western corridor waypoint
        wp1 = (mid_lat + perp_lat, mid_lon + perp_lon)
        alt1 = fetch_waypoint_alternative(origin, wp1, destination, "Northern Corridor")
        if alt1 and abs(alt1["distance_miles"] - routes[0]["distance_miles"]) > 5:
            # Check if sufficiently distinct (distance differs or path diverges)
            alt1["route_index"] = len(routes) + 1
            routes.append(alt1)

        if len(routes) < max_routes:
            # Southern / Eastern corridor waypoint
            wp2 = (mid_lat - perp_lat, mid_lon - perp_lon)
            alt2 = fetch_waypoint_alternative(origin, wp2, destination, "Southern Corridor")
            if alt2 and abs(alt2["distance_miles"] - routes[0]["distance_miles"]) > 5:
                alt2["route_index"] = len(routes) + 1
                routes.append(alt2)

    # Label routes cleanly
    for idx, r in enumerate(routes):
        r["route_index"] = idx + 1
        if "Option" not in r.get("name", ""):
            r["name"] = f"Route {idx + 1}: {r.get('name', 'Highway Corridor')}"

    count = len(routes)
    if count == 0:
        note = "No routes could be found between the specified origin and destination."
    elif count < max_routes:
        note = f"Routing provider found {count} distinct route alternative(s) for this corridor."
    else:
        note = f"Successfully generated {count} distinct route alternatives."

    return routes[:max_routes], note
