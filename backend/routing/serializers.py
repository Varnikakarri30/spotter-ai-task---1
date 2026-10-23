"""
Request and Response Serializers for Spotter AI Route Planning.
"""

from rest_framework import serializers
from datetime import datetime


class RoutePlanRequestSerializer(serializers.Serializer):
    origin = serializers.CharField(
        required=True,
        max_length=255,
        error_messages={
            "required": "Origin location is required.",
            "blank": "Origin location cannot be empty."
        }
    )
    destination = serializers.CharField(
        required=True,
        max_length=255,
        error_messages={
            "required": "Destination location is required.",
            "blank": "Destination location cannot be empty."
        }
    )
    departure_time = serializers.DateTimeField(
        required=True,
        format="%Y-%m-%dT%H:%M:%S",
        error_messages={
            "required": "Departure date and time are required.",
            "invalid": "Invalid departure date/time format. Use ISO 8601 (e.g. YYYY-MM-DDTHH:MM)."
        }
    )
    load_weight_lb = serializers.FloatField(
        required=True,
        min_value=0.0,
        max_value=150000.0,
        error_messages={
            "required": "Truck load weight in pounds is required.",
            "min_value": "Load weight cannot be negative.",
            "max_value": "Load weight exceeds maximum realistic vehicle limits (150,000 lb)."
        }
    )
    checkpoint_interval_miles = serializers.ChoiceField(
        choices=[10, 25, 50],
        default=25,
        required=False,
        error_messages={
            "invalid_choice": "Checkpoint interval must be 10, 25, or 50 miles."
        }
    )

    def validate(self, data):
        origin = data.get("origin", "").strip().lower()
        dest = data.get("destination", "").strip().lower()
        if origin and dest and origin == dest:
            raise serializers.ValidationError("Origin and destination must be different locations.")
        return data


class GeocodeRequestSerializer(serializers.Serializer):
    query = serializers.CharField(required=True, max_length=255)
