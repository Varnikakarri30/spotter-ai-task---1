"""
Risk Classification and Load Override Module for Spotter AI.

Source of Truth: fs-assessment-spotter.pdf
Follows exact thresholds and priority order.

Risk Levels:
- Low (Score: 1)
- Moderate (Score: 2)
- High (Score: 3)
- Severe (Score: 4)
- No Travel (Score: 5)
- Unknown / Missing (Explicitly represented, never defaulted to Low/0)

Exact Weather Risk Rules:
1. Wind Speed:
   - Low: < 25 mph
   - Moderate: 25 - 34 mph (25 <= wind < 35)
   - High: 35 - 44 mph (35 <= wind < 45)
   - Severe: 45 - 54 mph (45 <= wind < 55)
   - No Travel: >= 55 mph

2. Rain Intensity:
   - Low: < 0.10 in/hr
   - Moderate: 0.10 - 0.25 in/hr (0.10 <= rain < 0.25)
   - High: 0.25 - 0.50 in/hr (0.25 <= rain < 0.50)
   - Severe: 0.50 - 1.00 in/hr (0.50 <= rain <= 1.00)
   - No Travel: > 1.00 in/hr

3. Snowfall Intensity:
   - Low: < 0.5 in/hr
   - Moderate: 0.5 - 1.0 in/hr (0.5 <= snow < 1.0)
   - High: 1.0 - 2.0 in/hr (1.0 <= snow < 2.0)
   - Severe: 2.0 - 3.0 in/hr (2.0 <= snow <= 3.0)
   - No Travel: > 3.0 in/hr

Load-Specific Overrides:
- Wind >= 55 mph -> No Travel for any load
- Wind 45 - 54 mph (45 <= wind < 55) + Load > 30,000 lb -> No Travel
- Wind 35 - 44 mph (35 <= wind < 45) + Load > 40,000 lb -> Severe
"""

from enum import Enum
from typing import Optional, Dict, Any, Tuple


class RiskLevel(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    SEVERE = "Severe"
    NO_TRAVEL = "No Travel"
    UNKNOWN = "Unknown"


# Numeric mapping for weighted average calculation
RISK_SCORE_MAP = {
    RiskLevel.LOW: 1.0,
    RiskLevel.MODERATE: 2.0,
    RiskLevel.HIGH: 3.0,
    RiskLevel.SEVERE: 4.0,
    RiskLevel.NO_TRAVEL: 5.0,
}

# Severity rank for conservative combination (higher rank = higher hazard)
SEVERITY_ORDER = {
    RiskLevel.UNKNOWN: 0,
    RiskLevel.LOW: 1,
    RiskLevel.MODERATE: 2,
    RiskLevel.HIGH: 3,
    RiskLevel.SEVERE: 4,
    RiskLevel.NO_TRAVEL: 5,
}


def classify_wind_risk(wind_mph: Optional[float], load_weight_lb: float = 0.0) -> Tuple[RiskLevel, Optional[str]]:
    """
    Classify wind hazard and evaluate truck load weight overrides.
    
    Returns:
        (RiskLevel, override_reason_if_any)
    """
    if wind_mph is None:
        return RiskLevel.UNKNOWN, "Wind speed data unavailable"
    
    if wind_mph < 0:
        return RiskLevel.UNKNOWN, "Invalid negative wind speed"

    # Base wind classification
    if wind_mph < 25.0:
        base_risk = RiskLevel.LOW
    elif wind_mph < 35.0:
        base_risk = RiskLevel.MODERATE
    elif wind_mph < 45.0:
        base_risk = RiskLevel.HIGH
    elif wind_mph < 55.0:
        base_risk = RiskLevel.SEVERE
    else:
        base_risk = RiskLevel.NO_TRAVEL

    # Load-specific overrides
    # 1. >= 55 mph -> No Travel for any load
    if wind_mph >= 55.0:
        return RiskLevel.NO_TRAVEL, "Wind speed >= 55 mph triggers No Travel for all vehicle loads"

    # 2. 45-54 mph + > 30,000 lb -> No Travel
    if 45.0 <= wind_mph < 55.0 and load_weight_lb > 30000.0:
        return RiskLevel.NO_TRAVEL, f"Severe wind ({wind_mph:.1f} mph) with heavy load ({load_weight_lb:,.0f} lb > 30k lb) triggers No Travel override"

    # 3. 35-44 mph + > 40,000 lb -> Severe
    if 35.0 <= wind_mph < 45.0 and load_weight_lb > 40000.0:
        return RiskLevel.SEVERE, f"High wind ({wind_mph:.1f} mph) with heavy load ({load_weight_lb:,.0f} lb > 40k lb) triggers Severe risk override"

    return base_risk, None


def classify_rain_risk(rain_in_hr: Optional[float]) -> RiskLevel:
    """
    Classify rain intensity hazard in inches per hour.
    
    Thresholds:
    - Low: < 0.10 in/hr
    - Moderate: 0.10 - 0.25 in/hr
    - High: 0.25 - 0.50 in/hr
    - Severe: 0.50 - 1.00 in/hr
    - No Travel: > 1.00 in/hr
    """
    if rain_in_hr is None:
        return RiskLevel.UNKNOWN
    
    if rain_in_hr < 0:
        return RiskLevel.UNKNOWN

    if rain_in_hr < 0.10:
        return RiskLevel.LOW
    elif rain_in_hr < 0.25:
        return RiskLevel.MODERATE
    elif rain_in_hr < 0.50:
        return RiskLevel.HIGH
    elif rain_in_hr <= 1.00:
        return RiskLevel.SEVERE
    else:
        return RiskLevel.NO_TRAVEL


def classify_snow_risk(snow_in_hr: Optional[float]) -> RiskLevel:
    """
    Classify snowfall intensity hazard in inches per hour.
    
    Thresholds:
    - Low: < 0.5 in/hr
    - Moderate: 0.5 - 1.0 in/hr
    - High: 1.0 - 2.0 in/hr
    - Severe: 2.0 - 3.0 in/hr
    - No Travel: > 3.0 in/hr
    """
    if snow_in_hr is None:
        return RiskLevel.UNKNOWN
    
    if snow_in_hr < 0:
        return RiskLevel.UNKNOWN

    if snow_in_hr < 0.5:
        return RiskLevel.LOW
    elif snow_in_hr < 1.0:
        return RiskLevel.MODERATE
    elif snow_in_hr < 2.0:
        return RiskLevel.HIGH
    elif snow_in_hr <= 3.0:
        return RiskLevel.SEVERE
    else:
        return RiskLevel.NO_TRAVEL


def evaluate_checkpoint_risk(
    wind_mph: Optional[float],
    rain_in_hr: Optional[float],
    snow_in_hr: Optional[float],
    load_weight_lb: float = 0.0
) -> Dict[str, Any]:
    """
    Evaluate weather conditions at a checkpoint and determine overall risk.
    
    Conservative combination:
    - The overall checkpoint risk is the highest applicable severity among wind, rain, snow, and load overrides.
    - No Travel takes precedence over every other category.
    - Missing weather measurements are explicitly tracked and not treated as zero or Low risk.
    """
    wind_risk, override_reason = classify_wind_risk(wind_mph, load_weight_lb)
    rain_risk = classify_rain_risk(rain_in_hr)
    snow_risk = classify_snow_risk(snow_in_hr)

    risks = [wind_risk, rain_risk, snow_risk]
    
    # Check if all data is missing
    all_missing = all(r == RiskLevel.UNKNOWN for r in risks)
    has_missing_data = any(r == RiskLevel.UNKNOWN for r in risks)

    # Determine highest severity among known risks
    known_risks = [r for r in risks if r != RiskLevel.UNKNOWN]
    if known_risks:
        overall_risk = max(known_risks, key=lambda r: SEVERITY_ORDER[r])
    else:
        overall_risk = RiskLevel.UNKNOWN

    # Numerical score
    numeric_score = RISK_SCORE_MAP.get(overall_risk, None)

    return {
        "overall_risk": overall_risk.value,
        "numeric_score": numeric_score,
        "wind_risk": wind_risk.value,
        "rain_risk": rain_risk.value,
        "snow_risk": snow_risk.value,
        "wind_mph": wind_mph,
        "rain_in_hr": rain_in_hr,
        "snow_in_hr": snow_in_hr,
        "load_weight_lb": load_weight_lb,
        "load_override_applied": override_reason is not None,
        "override_reason": override_reason,
        "has_missing_data": has_missing_data,
        "is_no_travel": overall_risk == RiskLevel.NO_TRAVEL,
    }
