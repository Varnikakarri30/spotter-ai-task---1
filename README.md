# Spotter AI — Weather-Aware Commercial Truck Routing Engine

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![Django 4.2](https://img.shields.io/badge/django-4.2-green.svg)](https://www.djangoproject.com/)
[![React 19](https://img.shields.io/badge/react-19-cyan.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/tests-18%2F18%20passing-brightgreen.svg)]()

> A full-stack logistics and routing web application engineered for commercial truck drivers. Spotter AI balances weather hazards, vehicle load weights, and travel durations to deterministically recommend the safest highway route alternatives.

---

## Table of Contents
1. [Core Features](#core-features)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Exact Weather Risk Rules & Inclusivity Conventions](#exact-weather-risk-rules--inclusivity-conventions)
5. [Vehicle Load-Specific Overrides](#vehicle-load-specific-overrides)
6. [Lexicographic Route Recommendation Hierarchy](#lexicographic-route-recommendation-hierarchy)
7. [Local Setup & Run Instructions](#local-setup--run-instructions)
8. [Automated Testing](#automated-testing)
9. [Manual End-to-End Test Scenarios](#manual-end-to-end-test-scenarios)
10. [Docker & Deployment Guide](#docker--deployment-guide)
11. [5–10 Minute Loom Walkthrough Script](#510-minute-loom-walkthrough-script)
12. [Known Limitations & Future Work](#known-limitations--future-work)

---

## Core Features

- **Up to 3 Genuinely Distinct Route Alternatives**: Queries routing engines for distinct physical highway corridors (e.g. I-80 vs I-70 vs I-40) without duplicate routes or invented geometries.
- **Configurable Weather Checkpoints**: Samples route geometries at user-selected intervals of **10, 25, or 50 miles**, including origin and destination.
- **Dynamic Arrival Time (ETA) Interpolation**: Estimates the truck's arrival timestamp at each checkpoint using cumulative distance and route duration.
- **Live Open-Meteo Weather Integration**: Fetches real hourly forecasts (wind speed in mph, rain intensity in in/hr, snow intensity in in/hr, and temperature in °F) matching each checkpoint's estimated arrival time.
- **Strict Vehicle Load Weight Overrides**: Applies dynamic safety overrides for heavy loads (>30k lb and >40k lb) in high-wind conditions.
- **Distance-Weighted Exposure Metrics**: Partitions routes into continuous segments (Voronoi 1D representation) to calculate continuous Severe miles, High miles, and average numerical risk.
- **Interactive Leaflet Map**: Dark-mode CartoDB basemap with color-coded routes, glow-highlighted recommendations, clickable checkpoint pins with weather telemetry, and origin/destination markers.
- **0–48 Hour Trip Corridor Heatmap Slider**: Dynamic scrubber with timeline play/pause animation displaying corridor weather hazard intensity using real forecast data.
- **Missing Telemetry Safety Guarantee**: Incomplete or out-of-horizon weather values are explicitly flagged as `Unknown` and never defaulted to Low/Zero risk.

---

## Technology Stack

### Frontend
- **Framework**: React 19 with Vite & TypeScript (`strict` & `verbatimModuleSyntax`)
- **Map & Geo**: Leaflet 1.9, React Leaflet 5.0, CartoDB Dark Matter tiles
- **Styling**: Tailwind CSS v4, custom glassmorphism design system, dark-mode color palette
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: Python 3.9+, Django 4.2 LTS, Django REST Framework (DRF)
- **CORS & Environment**: `django-cors-headers`, `python-dotenv`
- **Routing Providers**: OpenRouteService (ORS) Directions API & OSRM (Open Source Routing Machine)
- **Weather Provider**: Open-Meteo Forecast API (hourly variables in native US units: `mph`, `inch`, `fahrenheit`)

---

## Architecture Overview

```
Spotter AI
├── backend/
│   ├── spotter_backend/       # Django project configuration & settings
│   │   ├── settings.py        # CORS, DRF, and dotenv configuration
│   │   ├── urls.py            # Root URL router
│   ├── routing/               # Core routing application
│   │   ├── risk.py            # Weather thresholds & load override rules
│   │   ├── ranking.py         # Lexicographic recommendation engine
│   │   ├── geometry.py        # Haversine distance, checkpoint sampling & Voronoi partitioning
│   │   ├── weather.py         # Open-Meteo live API integration & batch queries
│   │   ├── routing_service.py # Geocoding & multi-route highway corridor generation
│   │   ├── serializers.py     # Request validation (origin, dest, time, weight, interval)
│   │   ├── views.py           # REST endpoints (/api/plan-route/, /api/geocode/, /api/health/)
│   │   └── tests.py           # 18 automated unit and integration tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Brand header with status indicator & rules trigger
│   │   │   ├── TripForm.tsx         # Trip configuration form with presets
│   │   │   ├── RouteCard.tsx        # Lexicographic route comparison card & risk bar
│   │   │   ├── MapView.tsx          # Leaflet map with multi-route lines & checkpoint pins
│   │   │   ├── ForecastSlider.tsx   # 0-48h forecast scrubber with play/pause
│   │   │   ├── CheckpointList.tsx   # Detailed checkpoint telemetry table & hazard filter
│   │   │   └── RiskRulesModal.tsx   # Modal documenting assessment rules & thresholds
│   │   ├── services/
│   │   │   └── api.ts               # Axios client
│   │   ├── types.ts                 # TypeScript interfaces
│   │   ├── App.tsx                  # Root dashboard layout
│   │   └── index.css                # Tailwind v4 & Leaflet dark mode styling
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Exact Weather Risk Rules & Inclusivity Conventions

The system implements the exact thresholds from the hiring assessment specification.

### 1. Wind Speed (mph)
| Category | Range | Assessment Specification | Implementation Convention |
|---|---|---|---|
| **Low** | < 25 mph | `< 25 mph` | `0.0 <= wind < 25.0` |
| **Moderate** | 25–34 mph | `25–34` | `25.0 <= wind < 35.0` |
| **High** | 35–44 mph | `35–44` | `35.0 <= wind < 45.0` |
| **Severe** | 45–54 mph | `45–54` | `45.0 <= wind < 55.0` |
| **No Travel** | ≥ 55 mph | `≥ 55 mph` | `wind >= 55.0` |

### 2. Rain Intensity (in/hr)
| Category | Range | Assessment Specification | Implementation Convention |
|---|---|---|---|
| **Low** | < 0.10 in/hr | `< 0.10 in/hr` | `0.0 <= rain < 0.10` |
| **Moderate** | 0.10–0.25 in/hr | `0.10–0.25` | `0.10 <= rain < 0.25` |
| **High** | 0.25–0.50 in/hr | `0.25–0.50` | `0.25 <= rain < 0.50` |
| **Severe** | 0.50–1.00 in/hr | `0.50–1.00` | `0.50 <= rain <= 1.00` |
| **No Travel** | > 1.00 in/hr | `> 1.00` | `rain > 1.00` |

### 3. Snowfall Intensity (in/hr)
| Category | Range | Assessment Specification | Implementation Convention |
|---|---|---|---|
| **Low** | < 0.5 in/hr | `< 0.5 in/hr` | `0.0 <= snow < 0.5` |
| **Moderate** | 0.5–1.0 in/hr | `0.5–1.0` | `0.5 <= snow < 1.0` |
| **High** | 1.0–2.0 in/hr | `1.0–2.0` | `1.0 <= snow < 2.0` |
| **Severe** | 2.0–3.0 in/hr | `2.0–3.0` | `2.0 <= snow <= 3.0` |
| **No Travel** | > 3.0 in/hr | `> 3.0` | `snow > 3.0` |

*Note on Inclusivity:* To eliminate gaps across continuous decimal measurements (e.g. 34.6 mph), decimal values between integer boundaries are handled continuously using half-open intervals `[lower, upper)`.

---

## Vehicle Load-Specific Overrides

Commercial trucks with high-profile trailers are prone to rollover accidents under crosswinds. The backend applies three load rules:

1. **Wind ≥ 55 mph**: Triggers **No Travel** regardless of truck load weight.
2. **Wind 45–54 mph AND Load > 30,000 lb**: Overrides Severe wind to **No Travel**.
3. **Wind 35–44 mph AND Load > 40,000 lb**: Overrides High wind to **Severe**.

### Conservative Combination
The checkpoint risk is evaluated conservatively as:
$$\text{Overall Risk} = \max(\text{Wind Risk}_{\text{with overrides}}, \text{Rain Risk}, \text{Snow Risk})$$
Where severity ranks: $\text{Low (1)} < \text{Moderate (2)} < \text{High (3)} < \text{Severe (4)} < \text{No Travel (5)}$. **No Travel strictly supersedes all other hazards.**

---

## Lexicographic Route Recommendation Hierarchy

Routes are ranked using strict lexicographical ordering rather than an arbitrary weighted score:

1. **Safety Override**: Routes with **zero No Travel conditions** take absolute priority over routes with No Travel.
2. **Priority 1: Fewest Severe Miles** (Ascending)
3. **Priority 2: Fewest High Miles** (Ascending)
4. **Priority 3: Lowest Average Risk Score** (1.0 to 5.0, Ascending)
5. **Priority 4: Shortest Travel Time** (Duration in seconds, Ascending)

If all available routes encounter No Travel hazards, the system flags the entire trip as unsafe, warns the driver, and suggests delaying departure.

---

## Local Setup & Run Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm 9+
- Git

### 1. Clone & Environment Setup
```bash
git clone https://github.com/your-username/spotter-ai.git
cd spotter-ai

# Copy environment template
cp .env.example .env
cp .env.example backend/.env
```

### 2. Backend Setup (Django)
```bash
# Create and activate virtual environment
python3 -m venv backend/venv
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
python backend/manage.py migrate

# Start Django development server
python backend/manage.py runserver 0.0.0.0:8000
```
Backend runs at: `http://localhost:8000/api/health/`

### 3. Frontend Setup (React + Vite)
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173/`

---

## Automated Testing

The backend includes a comprehensive suite of 18 automated tests in `backend/routing/tests.py`.

Run tests via:
```bash
backend/venv/bin/python backend/manage.py test routing
```

### Test Coverage Highlights
- ✅ **Weather Thresholds**: Boundary values for wind (<25, 25-34, 35-44, 45-54, >=55), rain (<0.10, 0.10-0.25, 0.25-0.50, 0.50-1.00, >1.00), and snow (<0.5, 0.5-1.0, 1.0-2.0, 2.0-3.0, >3.0).
- ✅ **Load Overrides**: Wind >= 55 mph triggering No Travel for all loads; Wind 45-54 mph + >30k lb triggering No Travel; Wind 35-44 mph + >40k lb triggering Severe.
- ✅ **Multi-Hazard Combination**: Max severity conservative ranking; No Travel precedence.
- ✅ **Missing Data Handling**: Verification that missing measurements (`None`) return `Unknown` and are never treated as Low or Zero risk.
- ✅ **Route Ranking Hierarchy**: Deterministic lexicographic tests verifying that Priority 1 (Severe miles) beats duration, Priority 2 (High miles) breaks ties, Priority 3 (Avg risk) breaks ties, and Priority 4 (Duration) breaks ties.
- ✅ **Safety Override**: Verification that a route with 0 No Travel miles is preferred over a route with No Travel miles.
- ✅ **Geometry & Voronoi Partitioning**: Verification that the sum of segment miles equals the total route distance across 10, 25, and 50-mile sampling intervals.
- ✅ **API Validation**: Rejection of identical origin/destination, negative load weights, and invalid checkpoint intervals.

---

## Manual End-to-End Test Scenarios

| Scenario | Inputs | Expected Behavior |
|---|---|---|
| **1. Standard Route Planning** | Origin: `Chicago, IL`<br>Destination: `Denver, CO`<br>Weight: `35,000 lb`<br>Interval: `25 mi` | Generates 3 distinct route alternatives. Route 1 recommended. Map renders full polylines and colored checkpoint pins. |
| **2. Heavy Load Crosswind Override** | Origin: `Kansas City, MO`<br>Destination: `Salt Lake City, UT`<br>Weight: `45,000 lb`<br>Interval: `25 mi` | Weight exceeds 40,000 lb. Any checkpoint with wind between 35–44 mph is elevated from High to **Severe** risk with override tag. |
| **3. Rollover Hazard Override** | Any route with wind > 45 mph<br>Weight: `35,000 lb` | Checkpoints with 45–54 mph wind are promoted to **No Travel** due to > 30,000 lb load rule. Route flagged with No Travel warning. |
| **4. Checkpoint Sampling Density** | Toggle interval between `10 mi`, `25 mi`, `50 mi` | Checkpoint count increases proportionally (~100 pts for 10 mi, ~40 pts for 25 mi, ~20 pts for 50 mi). Segment distance sum remains equal to total route distance. |
| **5. 0–48 Hour Forecast Slider Scrubbing** | Move slider from 0h to +24h to +48h | Corridor heatmap circles update intensity and color based on future forecast. Play button animates hourly weather progression. |
| **6. Checkpoint Telemetry Focus** | Click Checkpoint #15 in table | Map smoothly flies to coordinates `[lat, lon]`, opens popup displaying exact wind, rain, snow, ETA, and risk classification. |

---

## Docker & Deployment Guide

Spotter AI can be deployed with Docker Compose in a single command:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173` (Served via Nginx)
- Backend: `http://localhost:8000` (Gunicorn/Django)

### Deployment on Cloud Platforms
- **Frontend (Vercel / Netlify)**:
  - Root directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `VITE_API_BASE_URL=https://your-backend-domain.com`
- **Backend (Render / Railway / AWS ECS)**:
  - Root directory: `backend`
  - Build command: `pip install -r requirements.txt && python manage.py migrate`
  - Start command: `gunicorn spotter_backend.wsgi:application --bind 0.0.0.0:$PORT`
  - Environment variables: `ALLOWED_HOSTS=*`, `CORS_ALLOW_ALL_ORIGINS=True`

---

## 5–10 Minute Loom Walkthrough Script

**Total Duration: ~6–8 Minutes**

### Part 1: Introduction & Mission (1:00)
- *"Hi everyone, this is Spotter AI, a weather-aware commercial truck routing engine built for the Full Stack Developer hiring assessment."*
- *"Commercial truck drivers face severe safety challenges from sudden weather events—particularly rollover risks under crosswinds and snow blizzards. Spotter AI is built to evaluate real-time forecasts along route corridors, apply vehicle load overrides, and deterministically recommend the safest path."*

### Part 2: Architecture & Tech Stack (1:00)
- *"On the backend, we use Python, Django, and Django REST Framework, integrating with Open-Meteo for live hourly weather forecasts and OpenRouteService / OSRM for genuine multi-route highway geometry."*
- *"On the frontend, we use React with Vite, TypeScript, Tailwind CSS, and Leaflet with React Leaflet."*

### Part 3: Live Trip Planning Demonstration (2:00)
- *"Let's plan a cross-country freight haul from Chicago, IL to Denver, CO."*
- *"Notice the input form: we specify departure date/time, a load weight of 38,000 lbs, and select our checkpoint interval—10, 25, or 50 miles."*
- *"Click 'Calculate Safe Routes'. The backend geocodes the coordinates, retrieves up to three distinct physical highway alternatives, and samples checkpoints along the route polyline."*
- *"Notice that each checkpoint calculates an exact estimated arrival time (ETA) based on departure time and cumulative driving distance, then queries Open-Meteo for the forecast matching that exact hour."*

### Part 4: Risk Rules & Load Overrides (1:30)
- *"Click the 'Risk Threshold Rules' button in the header. Here we display the exact rules from the assessment PDF: Wind (<25, 25-34, 35-44, 45-54, >=55), Rain, and Snow."*
- *"Notice the critical load rules: Any wind at 45-54 mph with a load over 30,000 lbs triggers a No Travel override, and 35-44 mph with a load over 40,000 lbs escalates to Severe risk."*
- *"Look at the route comparison cards: Route 1 is recommended because it has 0 Severe miles and the lowest High miles. Notice the stacked horizontal risk bar showing the proportion of miles under each hazard level."*

### Part 5: Interactive Map & 48-Hour Forecast Slider (1:30)
- *"On the map, we see the alternative routes in distinct colors, with Route 1 emphasized with an outer glow."*
- *"Click on a checkpoint pin: a popup opens showing the exact mile marker, ETA, wind speed in mph, rain in in/hr, snow in in/hr, and risk classification."*
- *"Now look at the 0–48 Hour Forecast Slider at the top. When we drag the slider to +12 hours or +24 hours, the corridor heatmap dynamically re-renders to visualize weather intensity across time. We can also hit Play to watch the weather progression animate in real time."*

### Part 6: Code Quality & Testing (1:00)
- *"Show terminal: Run `python manage.py test routing`. All 18 automated unit tests pass in 12 milliseconds, verifying every boundary condition, load override, and lexicographic ranking tie-breaker."*
- *"Thank you for watching!"*

---

## Known Limitations & Future Work

1. **Routing Provider Quotas**: While the system supports live OpenRouteService (ORS) API keys with driving-hgv profiles, public free tiers have rate limits (40 requests/min). The backend includes robust OSRM fallback with highway corridor waypoints to guarantee 3 distinct routes even without an API key.
2. **Forecast Horizon Limit**: Open-Meteo provides hourly forecast data up to 7 to 14 days in advance. Trips scheduled further in the future are explicitly marked as outside the supported forecast horizon rather than fabricating data.
3. **Mandatory Rest Breaks (HOS)**: Federal Hours of Service (HOS) rules require commercial drivers to take 30-minute breaks every 8 hours and 10-hour sleeper berth periods. Future iterations can incorporate driver rest stops into the ETA calculation.
