"""
Unit and Integration Tests for Spotter AI Weather-Aware Truck Routing.
"""

from datetime import datetime, timezone
from django.test import TestCase
from rest_framework.test import APIClient

from .risk import (
    RiskLevel,
    classify_wind_risk,
    classify_rain_risk,
    classify_snow_risk,
    evaluate_checkpoint_risk,
)
from .geometry import (
    haversine_distance_miles,
    calculate_polyline_distance_profile,
    generate_route_checkpoints,
)
from .ranking import (
    calculate_route_risk_metrics,
    rank_and_recommend_routes,
)


class WeatherRiskThresholdTests(TestCase):
    """Test every weather threshold and boundary values from the assessment."""

    def test_wind_thresholds(self):
        # Low: < 25 mph
        self.assertEqual(classify_wind_risk(0.0)[0], RiskLevel.LOW)
        self.assertEqual(classify_wind_risk(15.5)[0], RiskLevel.LOW)
        self.assertEqual(classify_wind_risk(24.9)[0], RiskLevel.LOW)

        # Moderate: 25-34 mph
        self.assertEqual(classify_wind_risk(25.0)[0], RiskLevel.MODERATE)
        self.assertEqual(classify_wind_risk(30.0)[0], RiskLevel.MODERATE)
        self.assertEqual(classify_wind_risk(34.9)[0], RiskLevel.MODERATE)

        # High: 35-44 mph
        self.assertEqual(classify_wind_risk(35.0)[0], RiskLevel.HIGH)
        self.assertEqual(classify_wind_risk(40.0)[0], RiskLevel.HIGH)
        self.assertEqual(classify_wind_risk(44.9)[0], RiskLevel.HIGH)

        # Severe: 45-54 mph
        self.assertEqual(classify_wind_risk(45.0)[0], RiskLevel.SEVERE)
        self.assertEqual(classify_wind_risk(50.0)[0], RiskLevel.SEVERE)
        self.assertEqual(classify_wind_risk(54.9)[0], RiskLevel.SEVERE)

        # No Travel: >= 55 mph
        self.assertEqual(classify_wind_risk(55.0)[0], RiskLevel.NO_TRAVEL)
        self.assertEqual(classify_wind_risk(65.0)[0], RiskLevel.NO_TRAVEL)

    def test_rain_thresholds(self):
        # Low: < 0.10 in/hr
        self.assertEqual(classify_rain_risk(0.0), RiskLevel.LOW)
        self.assertEqual(classify_rain_risk(0.05), RiskLevel.LOW)
        self.assertEqual(classify_rain_risk(0.099), RiskLevel.LOW)

        # Moderate: 0.10 - 0.25 in/hr
        self.assertEqual(classify_rain_risk(0.10), RiskLevel.MODERATE)
        self.assertEqual(classify_rain_risk(0.18), RiskLevel.MODERATE)
        self.assertEqual(classify_rain_risk(0.249), RiskLevel.MODERATE)

        # High: 0.25 - 0.50 in/hr
        self.assertEqual(classify_rain_risk(0.25), RiskLevel.HIGH)
        self.assertEqual(classify_rain_risk(0.35), RiskLevel.HIGH)
        self.assertEqual(classify_rain_risk(0.499), RiskLevel.HIGH)

        # Severe: 0.50 - 1.00 in/hr
        self.assertEqual(classify_rain_risk(0.50), RiskLevel.SEVERE)
        self.assertEqual(classify_rain_risk(0.75), RiskLevel.SEVERE)
        self.assertEqual(classify_rain_risk(1.00), RiskLevel.SEVERE)

        # No Travel: > 1.00 in/hr
        self.assertEqual(classify_rain_risk(1.01), RiskLevel.NO_TRAVEL)
        self.assertEqual(classify_rain_risk(2.50), RiskLevel.NO_TRAVEL)

    def test_snow_thresholds(self):
        # Low: < 0.5 in/hr
        self.assertEqual(classify_snow_risk(0.0), RiskLevel.LOW)
        self.assertEqual(classify_snow_risk(0.25), RiskLevel.LOW)
        self.assertEqual(classify_snow_risk(0.49), RiskLevel.LOW)

        # Moderate: 0.5 - 1.0 in/hr
        self.assertEqual(classify_snow_risk(0.50), RiskLevel.MODERATE)
        self.assertEqual(classify_snow_risk(0.75), RiskLevel.MODERATE)
        self.assertEqual(classify_snow_risk(0.99), RiskLevel.MODERATE)

        # High: 1.0 - 2.0 in/hr
        self.assertEqual(classify_snow_risk(1.00), RiskLevel.HIGH)
        self.assertEqual(classify_snow_risk(1.50), RiskLevel.HIGH)
        self.assertEqual(classify_snow_risk(1.99), RiskLevel.HIGH)

        # Severe: 2.0 - 3.0 in/hr
        self.assertEqual(classify_snow_risk(2.00), RiskLevel.SEVERE)
        self.assertEqual(classify_snow_risk(2.50), RiskLevel.SEVERE)
        self.assertEqual(classify_snow_risk(3.00), RiskLevel.SEVERE)

        # No Travel: > 3.0 in/hr
        self.assertEqual(classify_snow_risk(3.01), RiskLevel.NO_TRAVEL)
        self.assertEqual(classify_snow_risk(4.50), RiskLevel.NO_TRAVEL)


class LoadSpecificOverrideTests(TestCase):
    """Test vehicle load weight override rules."""

    def test_wind_55_plus_no_travel_all_loads(self):
        # >= 55 mph -> No Travel for any load
        risk, reason = classify_wind_risk(55.0, load_weight_lb=10000)
        self.assertEqual(risk, RiskLevel.NO_TRAVEL)

        risk, reason = classify_wind_risk(62.0, load_weight_lb=50000)
        self.assertEqual(risk, RiskLevel.NO_TRAVEL)

    def test_wind_45_to_54_with_heavy_load(self):
        # 45-54 mph + > 30,000 lb -> No Travel
        risk, reason = classify_wind_risk(48.0, load_weight_lb=30001)
        self.assertEqual(risk, RiskLevel.NO_TRAVEL)
        self.assertIn("No Travel override", reason)

        risk, reason = classify_wind_risk(50.0, load_weight_lb=45000)
        self.assertEqual(risk, RiskLevel.NO_TRAVEL)

        # 45-54 mph + <= 30,000 lb -> Remains Severe
        risk, reason = classify_wind_risk(48.0, load_weight_lb=30000)
        self.assertEqual(risk, RiskLevel.SEVERE)
        self.assertIsNone(reason)

        risk, reason = classify_wind_risk(48.0, load_weight_lb=15000)
        self.assertEqual(risk, RiskLevel.SEVERE)

    def test_wind_35_to_44_with_heavy_load(self):
        # 35-44 mph + > 40,000 lb -> Severe
        risk, reason = classify_wind_risk(38.0, load_weight_lb=40001)
        self.assertEqual(risk, RiskLevel.SEVERE)
        self.assertIn("Severe risk override", reason)

        risk, reason = classify_wind_risk(42.0, load_weight_lb=52000)
        self.assertEqual(risk, RiskLevel.SEVERE)

        # 35-44 mph + <= 40,000 lb -> Remains High
        risk, reason = classify_wind_risk(38.0, load_weight_lb=40000)
        self.assertEqual(risk, RiskLevel.HIGH)
        self.assertIsNone(reason)

        risk, reason = classify_wind_risk(38.0, load_weight_lb=25000)
        self.assertEqual(risk, RiskLevel.HIGH)


class MultiHazardAndMissingDataTests(TestCase):
    """Test multiple simultaneous hazards and missing values."""

    def test_conservative_combination(self):
        # Wind Low, Rain Severe, Snow Moderate -> Overall Severe
        res = evaluate_checkpoint_risk(wind_mph=10, rain_in_hr=0.75, snow_in_hr=0.6, load_weight_lb=20000)
        self.assertEqual(res["overall_risk"], RiskLevel.SEVERE.value)

        # Wind High (with >40k lb override to Severe), Rain Moderate -> Overall Severe
        res = evaluate_checkpoint_risk(wind_mph=38, rain_in_hr=0.15, snow_in_hr=0.0, load_weight_lb=45000)
        self.assertEqual(res["overall_risk"], RiskLevel.SEVERE.value)
        self.assertTrue(res["load_override_applied"])

        # No Travel takes precedence
        res = evaluate_checkpoint_risk(wind_mph=20, rain_in_hr=1.2, snow_in_hr=0.0, load_weight_lb=10000)
        self.assertEqual(res["overall_risk"], RiskLevel.NO_TRAVEL.value)

    def test_missing_weather_values(self):
        # Missing values must not default to Low or 0
        res = evaluate_checkpoint_risk(wind_mph=None, rain_in_hr=None, snow_in_hr=None)
        self.assertEqual(res["overall_risk"], RiskLevel.UNKNOWN.value)
        self.assertIsNone(res["numeric_score"])
        self.assertTrue(res["has_missing_data"])

        # Partial missing: Rain is High, wind is None -> overall risk is High, has_missing_data is True
        res = evaluate_checkpoint_risk(wind_mph=None, rain_in_hr=0.35, snow_in_hr=0.0)
        self.assertEqual(res["overall_risk"], RiskLevel.HIGH.value)
        self.assertTrue(res["has_missing_data"])


class RouteRankingHierarchyTests(TestCase):
    """Test strict lexicographic route recommendation priority."""

    def test_priority_1_fewest_severe_miles(self):
        r1 = {"route_index": 1, "is_safe": True, "severe_miles": 5.0, "high_miles": 50.0, "average_risk_score": 3.0, "duration_seconds": 10000}
        r2 = {"route_index": 2, "is_safe": True, "severe_miles": 15.0, "high_miles": 10.0, "average_risk_score": 2.0, "duration_seconds": 8000}
        
        ranked = rank_and_recommend_routes([r2, r1])
        # r1 has fewer severe miles (5 vs 15), so r1 must win despite higher high_miles and longer duration
        self.assertEqual(ranked[0]["route_index"], 1)
        self.assertTrue(ranked[0]["is_recommended"])

    def test_priority_2_fewest_high_miles_tiebreak(self):
        r1 = {"route_index": 1, "is_safe": True, "severe_miles": 0.0, "high_miles": 12.0, "average_risk_score": 2.8, "duration_seconds": 12000}
        r2 = {"route_index": 2, "is_safe": True, "severe_miles": 0.0, "high_miles": 25.0, "average_risk_score": 2.1, "duration_seconds": 10000}

        ranked = rank_and_recommend_routes([r2, r1])
        # Both have 0 severe miles. r1 has fewer high miles (12 vs 25), so r1 wins
        self.assertEqual(ranked[0]["route_index"], 1)

    def test_priority_3_lowest_average_risk_tiebreak(self):
        r1 = {"route_index": 1, "is_safe": True, "severe_miles": 0.0, "high_miles": 10.0, "average_risk_score": 1.8, "duration_seconds": 15000}
        r2 = {"route_index": 2, "is_safe": True, "severe_miles": 0.0, "high_miles": 10.0, "average_risk_score": 2.4, "duration_seconds": 12000}

        ranked = rank_and_recommend_routes([r2, r1])
        # Severe miles equal (0), High miles equal (10). r1 has lower average risk (1.8 vs 2.4)
        self.assertEqual(ranked[0]["route_index"], 1)

    def test_priority_4_shortest_travel_time_tiebreak(self):
        r1 = {"route_index": 1, "is_safe": True, "severe_miles": 0.0, "high_miles": 10.0, "average_risk_score": 2.0, "duration_seconds": 9000}
        r2 = {"route_index": 2, "is_safe": True, "severe_miles": 0.0, "high_miles": 10.0, "average_risk_score": 2.0, "duration_seconds": 12000}

        ranked = rank_and_recommend_routes([r2, r1])
        # All weather metrics identical -> r1 wins on duration (9000 vs 12000)
        self.assertEqual(ranked[0]["route_index"], 1)

    def test_safety_override_with_no_travel(self):
        # r1 has 0 severe miles but 1 No Travel checkpoint -> unsafe
        # r2 has 2 severe miles but 0 No Travel -> safe alternative
        r1 = {"route_index": 1, "is_safe": False, "severe_miles": 0.0, "high_miles": 5.0, "average_risk_score": 4.5, "duration_seconds": 5000, "no_travel_miles": 15.0}
        r2 = {"route_index": 2, "is_safe": True, "severe_miles": 2.0, "high_miles": 10.0, "average_risk_score": 2.5, "duration_seconds": 7000, "no_travel_miles": 0.0}

        ranked = rank_and_recommend_routes([r1, r2])
        # Safe route r2 must be recommended over unsafe route r1
        self.assertEqual(ranked[0]["route_index"], 2)
        self.assertTrue(ranked[0]["is_safe"])
        self.assertFalse(ranked[1]["is_safe"])


class GeometryAndSamplingTests(TestCase):
    """Test checkpoint generation and distance partitioning."""

    def test_checkpoint_intervals_and_segment_sum(self):
        # Route from (41.8781, -87.6298) to (39.7392, -104.9903) (Chicago to Denver, ~900 miles)
        # Create a simple 3-point polyline
        coords = [
            [41.8781, -87.6298],
            [41.2565, -95.9345],
            [39.7392, -104.9903]
        ]
        dep_time = datetime(2026, 10, 23, 12, 0, tzinfo=timezone.utc)
        duration_sec = 50000.0

        for interval in [10, 25, 50]:
            cps = generate_route_checkpoints(coords, duration_sec, dep_time, interval_miles=interval)
            self.assertGreater(len(cps), 2)
            # Verify origin and destination are present
            self.assertEqual(cps[0]["distance_from_origin_miles"], 0.0)
            self.assertAlmostEqual(cps[-1]["latitude"], 39.7392, delta=0.01)

            # Check that sum of segments equals total route distance
            _, total_dist = calculate_polyline_distance_profile(coords)
            seg_sum = sum(cp["segment_miles"] for cp in cps)
            self.assertAlmostEqual(seg_sum, total_dist, places=1)


class APIEndpointValidationTests(TestCase):
    """Test API serializers and validation logic."""

    def setUp(self):
        self.client = APIClient()

    def test_health_check(self):
        resp = self.client.get('/api/health/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "healthy")

    def test_plan_route_validation_missing_fields(self):
        resp = self.client.post('/api/plan-route/', {}, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn("origin", resp.data["details"])
        self.assertIn("destination", resp.data["details"])
        self.assertIn("departure_time", resp.data["details"])
        self.assertIn("load_weight_lb", resp.data["details"])

    def test_plan_route_validation_same_origin_dest(self):
        payload = {
            "origin": "Chicago, IL",
            "destination": "Chicago, IL",
            "departure_time": "2026-10-23T14:00:00",
            "load_weight_lb": 35000,
            "checkpoint_interval_miles": 25
        }
        resp = self.client.post('/api/plan-route/', payload, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_plan_route_validation_invalid_interval(self):
        payload = {
            "origin": "Chicago, IL",
            "destination": "Denver, CO",
            "departure_time": "2026-10-23T14:00:00",
            "load_weight_lb": 35000,
            "checkpoint_interval_miles": 35  # Invalid, must be 10, 25, or 50
        }
        resp = self.client.post('/api/plan-route/', payload, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn("checkpoint_interval_miles", resp.data["details"])
