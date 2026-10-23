"""
Weather Integration Module for Spotter AI using Open-Meteo API.

Features:
- Live hourly forecasts via Open-Meteo API.
- Native US units: wind_speed_unit=mph, precipitation_unit=inch, temperature_unit=fahrenheit.
- Efficient batch location queries to sample multiple checkpoints in a single HTTP request.
- Strict forecast horizon validation: never silently returns current weather for out-of-bounds ETAs.
- In-memory time-based caching to prevent redundant API calls.
- Corridor forecast grid generation for the 0-48 hour forecast slider.
"""

import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
import requests

logger = logging.getLogger(__name__)

OPENMETEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"

# Simple in-memory cache: key -> (timestamp, data)
_WEATHER_CACHE: Dict[str, Tuple[float, Any]] = {}
CACHE_TTL_SECONDS = 600  # 10 minutes cache


def get_cache_key(latitudes: List[float], longitudes: List[float]) -> str:
    lat_str = ",".join(f"{lat:.3f}" for lat in latitudes)
    lon_str = ",".join(f"{lon:.3f}" for lon in longitudes)
    return f"{lat_str}|{lon_str}"


def fetch_open_meteo_forecasts(
    latitudes: List[float],
    longitudes: List[float],
    forecast_days: int = 7
) -> List[Optional[Dict[str, Any]]]:
    """
    Fetch hourly forecast data from Open-Meteo for a list of coordinates.
    Uses batch requests where possible.
    """
    if not latitudes or not longitudes or len(latitudes) != len(longitudes):
        return []

    cache_key = get_cache_key(latitudes, longitudes)
    now = time.time()
    if cache_key in _WEATHER_CACHE:
        cached_time, cached_data = _WEATHER_CACHE[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            return cached_data

    # Open-Meteo supports up to ~50-100 coordinates in batch mode
    # Split into chunks of 40 to avoid URL length issues
    chunk_size = 40
    results: List[Optional[Dict[str, Any]]] = []

    for i in range(0, len(latitudes), chunk_size):
        chunk_lats = latitudes[i:i + chunk_size]
        chunk_lons = longitudes[i:i + chunk_size]

        params = {
            "latitude": ",".join(f"{lat:.5f}" for lat in chunk_lats),
            "longitude": ",".join(f"{lon:.5f}" for lon in chunk_lons),
            "hourly": "wind_speed_10m,precipitation,rain,snowfall,temperature_2m,weather_code",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "temperature_unit": "fahrenheit",
            "timeformat": "iso8601",
            "forecast_days": min(forecast_days, 14),
            "timezone": "UTC",
        }

        try:
            resp = requests.get(OPENMETEO_BASE_URL, params=params, timeout=12)
            resp.raise_for_status()
            data = resp.json()

            if isinstance(data, list):
                results.extend(data)
            elif isinstance(data, dict):
                # When single coordinate requested, Open-Meteo returns single object
                results.append(data)
            else:
                results.extend([None] * len(chunk_lats))
        except Exception as e:
            logger.error(f"Error calling Open-Meteo API: {e}")
            # Append None for failed coordinates
            results.extend([None] * len(chunk_lats))

    _WEATHER_CACHE[cache_key] = (now, results)
    return results


def parse_to_utc(dt_or_str) -> datetime:
    if isinstance(dt_or_str, str):
        t_clean = dt_or_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(t_clean)
    else:
        dt = dt_or_str
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def find_closest_forecast_index(
    forecast_times: List[str],
    target_dt: datetime
) -> Tuple[Optional[int], bool]:
    """
    Find index of closest hourly forecast time to target_dt.
    Returns: (index, is_outside_horizon)
    """
    if not forecast_times:
        return None, True

    try:
        first_dt = parse_to_utc(forecast_times[0])
        last_dt = parse_to_utc(forecast_times[-1])
        target_utc = parse_to_utc(target_dt)

        # Check if outside forecast horizon
        if target_utc < first_dt or target_utc > last_dt:
            return None, True

        # Find closest hour by string prefix
        target_iso = target_utc.strftime("%Y-%m-%dT%H:00")
        for idx, t in enumerate(forecast_times):
            if t.startswith(target_iso):
                return idx, False

        # Fallback closest match by difference
        target_ts = target_utc.timestamp()
        best_idx = 0
        min_diff = float("inf")
        for idx, t in enumerate(forecast_times):
            dt = parse_to_utc(t)
            diff = abs(dt.timestamp() - target_ts)
            if diff < min_diff:
                min_diff = diff
                best_idx = idx

        # If min difference is within 2 hours, accept it
        if min_diff <= 7200:
            return best_idx, False
        return None, True

    except Exception as e:
        logger.error(f"Error parsing forecast timestamps: {e}")
        return None, True



def sample_checkpoints_weather(
    checkpoints: List[Dict[str, Any]],
    departure_time: datetime
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    For each checkpoint, query Open-Meteo and retrieve weather measurements at estimated arrival time.
    Also extracts corridor forecast grid for 0-48h forecast slider.
    """
    if not checkpoints:
        return [], {}

    latitudes = [cp["latitude"] for cp in checkpoints]
    longitudes = [cp["longitude"] for cp in checkpoints]

    forecasts = fetch_open_meteo_forecasts(latitudes, longitudes, forecast_days=7)

    enriched_checkpoints = []
    
    # Store hourly snapshots along the corridor for hours 0..48
    corridor_hourly_grid: Dict[int, List[Dict[str, Any]]] = {h: [] for h in range(49)}

    for idx, cp in enumerate(checkpoints):
        forecast_data = forecasts[idx] if idx < len(forecasts) else None
        eta = datetime.fromisoformat(cp["estimated_arrival_time"])

        weather_info = {
            "wind_mph": None,
            "rain_in_hr": None,
            "snow_in_hr": None,
            "temp_f": None,
            "weather_code": None,
            "is_outside_forecast_horizon": False,
            "forecast_matched_time": None,
            "data_missing": True,
        }

        if forecast_data and "hourly" in forecast_data:
            hourly = forecast_data["hourly"]
            times = hourly.get("time", [])
            match_idx, is_out = find_closest_forecast_index(times, eta)

            if is_out:
                weather_info["is_outside_forecast_horizon"] = True
                weather_info["data_missing"] = True
            elif match_idx is not None and match_idx < len(times):
                weather_info["wind_mph"] = round(float(hourly["wind_speed_10m"][match_idx]), 1) if hourly.get("wind_speed_10m") else 0.0
                weather_info["rain_in_hr"] = round(float(hourly["rain"][match_idx]), 3) if hourly.get("rain") else 0.0
                weather_info["snow_in_hr"] = round(float(hourly["snowfall"][match_idx]), 3) if hourly.get("snowfall") else 0.0
                weather_info["temp_f"] = round(float(hourly["temperature_2m"][match_idx]), 1) if hourly.get("temperature_2m") else 60.0
                weather_info["weather_code"] = int(hourly["weather_code"][match_idx]) if hourly.get("weather_code") else 0
                weather_info["forecast_matched_time"] = times[match_idx]
                weather_info["data_missing"] = False
                weather_info["is_outside_forecast_horizon"] = False

            # Populate corridor weather for hours 0 to 48
            if departure_time.tzinfo is None:
                dep_utc = departure_time.replace(tzinfo=timezone.utc)
            else:
                dep_utc = departure_time.astimezone(timezone.utc)

            for hour_offset in range(49):
                target_hour_dt = dep_utc.timestamp() + (hour_offset * 3600)
                # Find matching index in times
                h_idx, h_out = find_closest_forecast_index(times, datetime.fromtimestamp(target_hour_dt, tz=timezone.utc))
                if not h_out and h_idx is not None and h_idx < len(times):
                    corridor_hourly_grid[hour_offset].append({
                        "latitude": cp["latitude"],
                        "longitude": cp["longitude"],
                        "wind_mph": round(float(hourly["wind_speed_10m"][h_idx]), 1) if hourly.get("wind_speed_10m") else 0.0,
                        "rain_in_hr": round(float(hourly["rain"][h_idx]), 3) if hourly.get("rain") else 0.0,
                        "snow_in_hr": round(float(hourly["snowfall"][h_idx]), 3) if hourly.get("snowfall") else 0.0,
                        "temp_f": round(float(hourly["temperature_2m"][h_idx]), 1) if hourly.get("temperature_2m") else 60.0,
                    })

        enriched_cp = {**cp, **weather_info}
        enriched_checkpoints.append(enriched_cp)

    return enriched_checkpoints, corridor_hourly_grid
