"""
Route Ranking and Recommendation Engine for Spotter AI.

Assessment Priority Order (Strict Lexicographic Ranking):
1. Fewest Severe miles
2. Fewest High miles
3. Lowest average risk
4. Shortest travel time

Safety Override:
- A route containing any No Travel checkpoint is flagged as unsafe (is_safe = False).
- Safe routes (zero No Travel miles) take absolute precedence over routes with No Travel.
- Never recommend an unsafe route as safe. If all routes encounter No Travel hazards,
  the system flags all routes with critical warnings and advises delaying departure.
"""

from typing import List, Dict, Any
from .risk import RiskLevel, RISK_SCORE_MAP


def calculate_route_risk_metrics(
    route: Dict[str, Any],
    checkpoints: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Calculate exact distance-weighted risk metrics for a route using its checkpoints.
    """
    total_distance_miles = route.get("distance_miles", 0.0)
    total_segment_miles = sum(cp.get("segment_miles", 0.0) for cp in checkpoints)
    effective_total = total_segment_miles if total_segment_miles > 0 else total_distance_miles

    low_miles = 0.0
    moderate_miles = 0.0
    high_miles = 0.0
    severe_miles = 0.0
    no_travel_miles = 0.0
    unknown_miles = 0.0

    weighted_score_sum = 0.0
    weighted_score_distance = 0.0

    num_no_travel_checkpoints = 0
    no_travel_reasons = []

    for cp in checkpoints:
        seg_miles = cp.get("segment_miles", 0.0)
        risk = cp.get("overall_risk", RiskLevel.UNKNOWN.value)
        score = cp.get("numeric_score")

        if risk == RiskLevel.LOW.value:
            low_miles += seg_miles
        elif risk == RiskLevel.MODERATE.value:
            moderate_miles += seg_miles
        elif risk == RiskLevel.HIGH.value:
            high_miles += seg_miles
        elif risk == RiskLevel.SEVERE.value:
            severe_miles += seg_miles
        elif risk == RiskLevel.NO_TRAVEL.value:
            no_travel_miles += seg_miles
            num_no_travel_checkpoints += 1
            reason = cp.get("override_reason") or "Weather conditions exceed No Travel safety threshold"
            if reason not in no_travel_reasons:
                no_travel_reasons.append(reason)
        else:
            unknown_miles += seg_miles

        if score is not None:
            weighted_score_sum += seg_miles * score
            weighted_score_distance += seg_miles

    # Average numerical risk score: 1.0 (Low) to 5.0 (No Travel)
    if weighted_score_distance > 0:
        avg_risk_score = round(weighted_score_sum / weighted_score_distance, 2)
    else:
        avg_risk_score = 1.0

    has_no_travel = num_no_travel_checkpoints > 0 or no_travel_miles > 0.0
    is_safe = not has_no_travel

    return {
        "low_miles": round(low_miles, 1),
        "moderate_miles": round(moderate_miles, 1),
        "high_miles": round(high_miles, 1),
        "severe_miles": round(severe_miles, 1),
        "no_travel_miles": round(no_travel_miles, 1),
        "unknown_miles": round(unknown_miles, 1),
        "average_risk_score": avg_risk_score,
        "num_checkpoints": len(checkpoints),
        "has_no_travel": has_no_travel,
        "is_safe": is_safe,
        "num_no_travel_checkpoints": num_no_travel_checkpoints,
        "no_travel_reasons": no_travel_reasons,
    }


def rank_and_recommend_routes(routes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Rank route alternatives using the strict lexicographic hierarchy:
    1. Safety override: routes without No Travel come first
    2. Fewest Severe miles
    3. Fewest High miles
    4. Lowest average risk
    5. Shortest travel time (duration_seconds)
    """
    if not routes:
        return []

    def sort_key(r: Dict[str, Any]):
        # is_safe: True sorts before False (0 before 1)
        safety_priority = 0 if r.get("is_safe", True) else 1
        severe = r.get("severe_miles", 0.0)
        high = r.get("high_miles", 0.0)
        avg_risk = r.get("average_risk_score", 1.0)
        duration = r.get("duration_seconds", 0.0)
        return (safety_priority, severe, high, avg_risk, duration)

    sorted_routes = sorted(routes, key=sort_key)

    # Determine recommended route
    for idx, r in enumerate(sorted_routes):
        r["rank"] = idx + 1
        r["is_recommended"] = (idx == 0)

    # Generate explanatory rationale for the recommended route
    winner = sorted_routes[0]
    is_winner_safe = winner.get("is_safe", True)

    if not is_winner_safe:
        explanation = (
            f"WARNING: All {len(sorted_routes)} route alternatives contain No Travel conditions "
            f"({winner.get('no_travel_miles')} miles affected). While this route minimizes severe hazards "
            f"({winner.get('severe_miles')} mi Severe), travel is currently unsafe. Consider delaying departure."
        )
    elif len(sorted_routes) == 1:
        explanation = (
            f"Optimal route: {winner.get('severe_miles')} Severe miles, "
            f"{winner.get('high_miles')} High miles, average risk {winner.get('average_risk_score')}/5.0. "
            f"No Travel hazards detected."
        )
    else:
        runner_up = sorted_routes[1]
        reasons = []
        
        # Check safety contrast
        if not runner_up.get("is_safe", True) and is_winner_safe:
            reasons.append(f"avoids critical No Travel hazards present on alternative routes")
        elif winner.get("severe_miles", 0) < runner_up.get("severe_miles", 0):
            diff = runner_up.get("severe_miles", 0) - winner.get("severe_miles", 0)
            reasons.append(f"eliminates {diff:.1f} Severe weather miles compared to Route {runner_up.get('route_index', 2)}")
        elif winner.get("high_miles", 0) < runner_up.get("high_miles", 0):
            diff = runner_up.get("high_miles", 0) - winner.get("high_miles", 0)
            reasons.append(f"reduces High weather risk by {diff:.1f} miles")
        elif winner.get("average_risk_score", 0) < runner_up.get("average_risk_score", 0):
            reasons.append(f"has lower overall average risk ({winner.get('average_risk_score')} vs {runner_up.get('average_risk_score')})")
        else:
            time_diff_min = round((runner_up.get("duration_seconds", 0) - winner.get("duration_seconds", 0)) / 60)
            if time_diff_min > 0:
                reasons.append(f"saves {time_diff_min} minutes of driving time with equal risk exposure")
            else:
                reasons.append(f"offers the most direct and weather-optimal trajectory")

        explanation = (
            f"Recommended by Spotter AI: {reasons[0].capitalize() if reasons else 'Optimal risk balance'}. "
            f"Summary: {winner.get('severe_miles')} mi Severe, {winner.get('high_miles')} mi High, "
            f"Avg risk {winner.get('average_risk_score')}/5.0."
        )

    winner["recommendation_reason"] = explanation

    for r in sorted_routes[1:]:
        r["recommendation_reason"] = (
            f"Ranked #{r['rank']} due to higher risk exposure ({r.get('severe_miles')} mi Severe, "
            f"{r.get('high_miles')} mi High) or longer travel duration."
        )

    return sorted_routes
