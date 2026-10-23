"""
Geometry and Checkpoint Sampling Module for Spotter AI.

Handles:
- Haversine distance calculations in statute miles.
- Polyline distance profiling and interpolation.
- Checkpoint generation at fixed intervals (10, 25, 50 miles).
- Segment length partitioning (distance represented by each checkpoint).
- Checkpoint ETA calculations based on departure time and route duration.
"""

import math
from datetime import datetime, timedelta
from typing import List, Tuple, Dict, Any

EARTH_RADIUS_MILES = 3958.8


def haversine_distance_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in miles."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_MILES * c


def calculate_polyline_distance_profile(coordinates: List[List[float]]) -> Tuple[List[float], float]:
    """
    Given a list of [lat, lon] coordinates, calculate cumulative distance in miles.
    Returns:
        (cumulative_distances_list, total_distance_miles)
    """
    if not coordinates:
        return [0.0], 0.0

    cum_dist = [0.0]
    total = 0.0
    for i in range(1, len(coordinates)):
        d = haversine_distance_miles(
            coordinates[i - 1][0], coordinates[i - 1][1],
            coordinates[i][0], coordinates[i][1]
        )
        total += d
        cum_dist.append(total)

    return cum_dist, total


def interpolate_coordinate_at_distance(
    coordinates: List[List[float]],
    cum_dist: List[float],
    target_dist_miles: float
) -> Tuple[float, float]:
    """
    Find the interpolated [lat, lon] coordinate along a polyline at target_dist_miles.
    """
    if target_dist_miles <= 0.0 or len(coordinates) <= 1:
        return coordinates[0][0], coordinates[0][1]

    if target_dist_miles >= cum_dist[-1]:
        return coordinates[-1][0], coordinates[-1][1]

    # Binary search or scan for the segment containing target_dist_miles
    for i in range(1, len(cum_dist)):
        if cum_dist[i] >= target_dist_miles:
            seg_len = cum_dist[i] - cum_dist[i - 1]
            if seg_len <= 1e-7:
                return coordinates[i][0], coordinates[i][1]
            fraction = (target_dist_miles - cum_dist[i - 1]) / seg_len
            lat = coordinates[i - 1][0] + fraction * (coordinates[i][0] - coordinates[i - 1][0])
            lon = coordinates[i - 1][1] + fraction * (coordinates[i][1] - coordinates[i - 1][1])
            return lat, lon

    return coordinates[-1][0], coordinates[-1][1]


def generate_route_checkpoints(
    coordinates: List[List[float]],
    total_duration_seconds: float,
    departure_time: datetime,
    interval_miles: float = 25.0
) -> List[Dict[str, Any]]:
    """
    Sample route geometry at interval_miles, guaranteeing start and destination are included.
    
    Computes:
    - checkpoint index
    - exact lat, lon
    - cumulative distance in miles
    - segment representation length in miles (sum of all segments == total_distance_miles)
    - estimated arrival time (ETA)
    """
    if not coordinates:
        return []

    cum_dist, total_distance = calculate_polyline_distance_profile(coordinates)

    if total_distance <= 0.0:
        return [{
            "index": 0,
            "latitude": coordinates[0][0],
            "longitude": coordinates[0][1],
            "distance_from_origin_miles": 0.0,
            "segment_miles": 0.0,
            "estimated_arrival_time": departure_time.isoformat(),
        }]

    # Generate sampling target distances
    target_distances = [0.0]
    current = interval_miles
    while current < total_distance - (interval_miles * 0.25):  # avoid tiny trailing segments < 25% of interval
        target_distances.append(current)
        current += interval_miles

    # Always include destination
    if total_distance > target_distances[-1]:
        target_distances.append(total_distance)

    num_pts = len(target_distances)
    
    # Calculate segment representation miles for each checkpoint (Voronoi 1D partitioning)
    segment_miles = []
    for i in range(num_pts):
        if num_pts == 1:
            segment_miles.append(total_distance)
        elif i == 0:
            segment_miles.append((target_distances[1] - target_distances[0]) / 2.0)
        elif i == num_pts - 1:
            segment_miles.append((target_distances[-1] - target_distances[-2]) / 2.0)
        else:
            segment_miles.append((target_distances[i + 1] - target_distances[i - 1]) / 2.0)

    # Normalize segment_miles to ensure exact sum equals total_distance
    total_seg = sum(segment_miles)
    if total_seg > 0:
        factor = total_distance / total_seg
        segment_miles = [s * factor for s in segment_miles]

    checkpoints = []
    for i, target_dist in enumerate(target_distances):
        lat, lon = interpolate_coordinate_at_distance(coordinates, cum_dist, target_dist)
        
        # Calculate ETA
        fraction = target_dist / total_distance if total_distance > 0 else 0.0
        elapsed_seconds = fraction * total_duration_seconds
        eta = departure_time + timedelta(seconds=elapsed_seconds)

        checkpoints.append({
            "index": i,
            "latitude": round(lat, 5),
            "longitude": round(lon, 5),
            "distance_from_origin_miles": round(target_dist, 2),
            "segment_miles": round(segment_miles[i], 2),
            "estimated_arrival_time": eta.isoformat(),
            "eta_timestamp": int(eta.timestamp()),
        })

    return checkpoints
