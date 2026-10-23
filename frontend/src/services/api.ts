import axios from 'axios';
import type { PlanRouteResponse, TripInputs } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  const resp = await client.get('/api/health/');
  return resp.data;
}

export async function planRoute(inputs: TripInputs): Promise<PlanRouteResponse> {
  const payload = {
    origin: inputs.origin,
    destination: inputs.destination,
    departure_time: inputs.departureTime,
    load_weight_lb: inputs.loadWeightLb,
    checkpoint_interval_miles: inputs.checkpointIntervalMiles,
  };

  try {
    const resp = await client.post<PlanRouteResponse>('/api/plan-route/', payload);
    return resp.data;
  } catch (error: any) {
    if (error.response?.data?.details) {
      const details = error.response.data.details;
      const msg = typeof details === 'object' ? Object.values(details).flat().join(' ') : String(details);
      throw new Error(msg || error.response.data.error || 'Route planning failed.');
    }
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('API request timed out. Please try again.');
    }
    throw new Error(error.message || 'Network error while contacting routing server.');
  }
}
