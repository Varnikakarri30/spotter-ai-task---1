export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe' | 'No Travel' | 'Unknown';

export interface Checkpoint {
  index: number;
  latitude: number;
  longitude: number;
  distance_from_origin_miles: number;
  segment_miles: number;
  estimated_arrival_time: string;
  eta_timestamp?: number;
  
  // Weather
  wind_mph: number | null;
  rain_in_hr: number | null;
  snow_in_hr: number | null;
  temp_f: number | null;
  weather_code: number | null;
  is_outside_forecast_horizon?: boolean;
  forecast_matched_time?: string | null;
  data_missing?: boolean;

  // Risk
  overall_risk: RiskLevel;
  numeric_score: number | null;
  wind_risk: RiskLevel;
  rain_risk: RiskLevel;
  snow_risk: RiskLevel;
  load_weight_lb?: number;
  load_override_applied?: boolean;
  override_reason?: string | null;
  has_missing_data?: boolean;
  is_no_travel?: boolean;
}

export interface RouteOption {
  route_index: number;
  name: string;
  provider: string;
  distance_miles: number;
  duration_seconds: number;
  formatted_duration: string;
  departure_time: string;
  arrival_time: string;
  coordinates: [number, number][]; // [lat, lon]
  checkpoints: Checkpoint[];

  // Risk metrics
  low_miles: number;
  moderate_miles: number;
  high_miles: number;
  severe_miles: number;
  no_travel_miles: number;
  unknown_miles: number;
  average_risk_score: number;
  num_checkpoints: number;
  has_no_travel: boolean;
  is_safe: boolean;
  num_no_travel_checkpoints: number;
  no_travel_reasons: string[];

  // Recommendation & Ranking
  rank: number;
  is_recommended: boolean;
  recommendation_reason: string;
}

export interface CorridorForecastPoint {
  latitude: number;
  longitude: number;
  wind_mph: number;
  rain_in_hr: number;
  snow_in_hr: number;
  temp_f: number;
}

export interface PlanRouteResponse {
  status: string;
  origin: {
    display_name: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    display_name: string;
    latitude: number;
    longitude: number;
  };
  departure_time: string;
  load_weight_lb: number;
  checkpoint_interval_miles: number;
  routes: RouteOption[];
  recommended_route_index: number;
  corridor_forecast_grid: Record<string, CorridorForecastPoint[]>;
  routing_note: string;
  units: Record<string, string>;
}

export interface TripInputs {
  origin: string;
  destination: string;
  departureTime: string;
  loadWeightLb: number;
  checkpointIntervalMiles: 10 | 25 | 50;
}
