# Wrong-Way Driving (WWD) — Virginia Diagnostics & Resource Collection Report

**Prepared:** 2026-02-19
**Scope:** Commonwealth of Virginia — Statewide
**Branch:** `claude/wrong-way-driving-resources-IN3W4`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Repository Reference Files](#3-repository-reference-files)
4. [Known WWD Locations — Virginia](#4-known-wwd-locations--virginia)
5. [Potential / High-Risk Sites](#5-potential--high-risk-sites)
6. [Data Sources & APIs](#6-data-sources--apis)
7. [Technical Architecture — How to Collect & Analyze WWD Data](#7-technical-architecture--how-to-collect--analyze-wwd-data)
8. [Geographic Data Integration (TIGERweb + VDOT)](#8-geographic-data-integration-tigerweb--vdot)
9. [BTS GeoData Validator — Role in This Project](#9-bts-geodata-validator--role-in-this-project)
10. [Countermeasure Technologies](#10-countermeasure-technologies)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Data Schema Design](#12-data-schema-design)
13. [References](#13-references)

---

## 1. Executive Summary

Wrong-way driving (WWD) on Virginia's limited-access freeways is a significant and recurring safety threat. Virginia Transportation Research Council (VTRC) Report **25-R10** — the primary reference document in this repository — documented **193 confirmed WWD crashes** between January 2016 and late 2022, with an additional 7 interstate crashes through November 2022. Separately, **4,144 WWD-related 911 calls** were recorded from January 2016 through July 2022.

This report outlines:
- All known existing WWD crash locations and spatial clusters in Virginia.
- Methodology for identifying **potential high-risk sites** not yet experiencing crashes but sharing the same geometric, lighting, and operational risk factors.
- A full technical plan integrating VDOT open data APIs, TIGERweb census geography, BTS national transportation datasets, and field-verifiable GIS layers.

---

## 2. Problem Statement

Wrong-way driving events occur when a vehicle enters a divided, limited-access roadway traveling against the legal direction of traffic. In Virginia:

- The majority of WWD crashes occur on **interstate highways**.
- Virginia has **11,720 miles of Limited Access Freeway (LAF)** roadway:
  - **18.0% (2,104 miles)** — Interstate
  - **82.0% (9,616 miles)** — Non-Interstate LAF
- The research focus (per VTRC 25-R10) is on **interstate** corridors because non-interstate LAF WWD crashes are comparatively rare.
- The **most dangerous interchange geometry** producing WWD entries: **partial cloverleaf interchanges** (two of the top three scoring interchanges in the VTRC study).
- Peak WWD entry times: **late night / early morning hours** with impaired driving as a primary contributing factor.
- Key districts with documented clusters: **Northern Virginia (I-66), Hampton Roads (I-264), Staunton (I-81), Culpeper (I-64)**.

---

## 3. Repository Reference Files

| File | Description | Role in WWD Analysis |
|---|---|---|
| `25-R10.pdf` | VTRC Report — *Systemic Evaluation of WWD Crashes and Countermeasures* | **Primary reference**: crash data, hotspot methodology, interchange scoring, countermeasure effectiveness |
| `4128-2.pdf` | Virginia regulatory / legislative document | Legal framework for WWD countermeasures and VDOT authority |
| `Tigerweb api.txt` | TIGERweb API + Virginia county/jurisdiction config (all 133 jurisdictions) | Geography base layer: bounding boxes, FIPS codes, map centers for all VA counties — used to spatially filter crash queries |
| `bts-geodata-validator (1).html.txt` | BTS GeoData API Endpoint Validator (Leaflet + ArcGIS) | Validation tool for 6 national transport datasets (HPMS, NBI, NTM, Railroad Grade Crossings, MPOs) — use to verify road/bridge/transit data for site analysis |

---

## 4. Known WWD Locations — Virginia

### 4.1 Confirmed Crash Cluster Corridors (VTRC 25-R10)

These corridors were specifically called out in the VTRC study for having documented WWD crash clusters and/or 911 call density:

| Corridor | Direction | District | Risk Factor Notes |
|---|---|---|---|
| **I-66 Eastbound** | Eastbound | Northern Virginia | High-density urban interchange complexity; multiple partial cloverleafs |
| **I-264 Eastbound** | Eastbound | Hampton Roads | Beach-area corridor; late-night alcohol-related entries at resort destination ramps |
| **I-81 Northbound** | Northbound | Staunton | Rural long-haul corridor; impaired + fatigued driver entries at rural interchanges |
| **I-64 Westbound** | Westbound | Culpeper | Cross-regional corridor; lighting deficiencies documented in VDOT HMMS lighting inventory |

### 4.2 Interchange Geometry Hotspots

The VTRC study scored interchanges using a **weighted normalized WWD score** combining:
- Number of WWD entries at or near the interchange
- Interchange type (partial cloverleaf scored highest)
- Lighting conditions (from VDOT Highway Maintenance Management System — HMMS)
- Traffic volumes (AADT from HPMS)
- Proximity to alcohol-serving establishments

**Top interchange types by WWD risk score:**
1. Partial Cloverleaf (highest)
2. Diamond
3. Directional / Trumpet

### 4.3 911 Call Spatial Clusters (2016–2022)

- Total 911 calls: **4,144** (after deduplication: calls within 20 min, 20 miles, same road/direction)
- Spatial cluster locations correspond with the four major corridors above.
- Clusters visualized in VTRC 25-R10 figures — most dense in:
  - Northern Virginia (I-66, I-495, I-95 interchanges)
  - Hampton Roads (I-264, I-64 Beach corridor)
  - Richmond metro (I-64/I-95 interchange complex)

---

## 5. Potential / High-Risk Sites

Sites with **no recorded WWD crash yet** but sharing the same risk-factor profile as confirmed hotspots.

### 5.1 Risk Factor Scoring Model

To identify potential sites, each interchange/ramp location in Virginia's interstate system should be scored on the following factors (derived from VTRC 25-R10 methodology):

| Factor | Data Source | Weight |
|---|---|---|
| Interchange type (partial cloverleaf = highest) | VDOT Road Inventory / NBI | High |
| Nighttime lighting adequacy | VDOT HMMS Lighting Inventory | High |
| AADT (traffic volume) | HPMS (BTS/FHWA) | Medium |
| Nearby alcohol-serving establishments (density within 1 mile) | OSM / Google Places API | Medium |
| Proximity to hospitals / late-night destinations | OSM | Low |
| Ramp geometry (tight radius, confusing signing) | VDOT Road Inventory | High |
| Crash history on adjacent segments | VDOT TREDS / CrashData | High |
| Distance from nearest highway patrol post | Virginia State Police data | Low |

### 5.2 Candidate High-Risk Corridors (Not Yet in VTRC Hotspot List)

Based on interchange geometry, traffic volumes, and regional characteristics:

| Corridor | Location | Risk Basis |
|---|---|---|
| **I-77 / I-81 interchange** | Wytheville | Complex multi-level interchange; rural, low lighting |
| **I-95 / I-395 interchange** | Springfield | High complexity, heavy late-night traffic, partial cloverleaf ramps |
| **I-64 / I-264 split** | Norfolk/Virginia Beach | Beach resort area, high alcohol establishment density |
| **US-17 / I-64** | Williamsburg | Tourism corridor, older interchange geometry |
| **I-66 / US-29 interchange** | Gainesville | Rapidly developing suburban area, heavy commuter volumes |
| **I-81 / I-77** | Hillsville | Rural, minimal lighting, long-haul truck corridor |
| **Route 288 / I-64** | Goochland County | High-speed suburban freeway, newer partial cloverleaf design |

### 5.3 Identification Methodology

```
FOR EACH interchange on Virginia interstates:
  1. Classify interchange type using VDOT Road Inventory
  2. Query HPMS for AADT on approach segments
  3. Query VDOT HMMS for lighting inventory
  4. Query TREDS crash data within 0.5-mile radius (past 7 years)
  5. Query OSM/Places for alcohol establishment density (1-mile radius)
  6. Assign weighted score
  7. Flag sites scoring above 75th percentile as "Potential High-Risk"
  8. Cross-validate with 911 call spatial cluster data
```

---

## 6. Data Sources & APIs

### 6.1 Primary Virginia Data Sources

| Source | URL | Data Type | Access |
|---|---|---|---|
| **VTRC Report 25-R10** | https://vtrc.virginia.gov/media/vtrc/vtrc-pdf/vtrc-pdf/25-R10.pdf | WWD crash analysis, methodology, scores | Public PDF |
| **VDOT Virginia Roads Open Data** | https://virginiaroads-vdot.opendata.arcgis.com | Crash data, road inventory, GIS layers | Public ArcGIS Hub |
| **VDOT Full Crash Layer** | https://virginiaroads-vdot.opendata.arcgis.com/datasets/full-crash-1 | All reportable crashes with attributes | Public |
| **VDOT CrashData Basic** | https://virginiaroads-vdot.opendata.arcgis.com/maps/VDOT::crashdata-basic-1 | Lightweight crash point layer | Public |
| **TREDS — Crash Locations Map** | https://www.treds.virginia.gov/Mapping/Map/CrashesByJurisdiction | Interactive crash mapping by jurisdiction | Public map |
| **TREDS — Full Data Access** | TREDS.SAVESLIVES@DMV.Virginia.Gov | Full crash records | Authorized users only |
| **Virginia DMV Crash Data Portal** | https://www.dmv.virginia.gov/safety/crash-data | Statewide crash statistics, annual reports | Public |
| **Virginia Open Data Portal — Crash** | https://data.virginia.gov/dataset/crash-data | DMV crash datasets (CSV, GeoJSON) | Public download |
| **SmarterRoads VDOT** | https://smarterroads.vdot.virginia.gov | Crash shapefiles, road data | Public (free) |
| **VDOT Crash Analysis Tool** | https://vdot.maps.arcgis.com/apps/webappviewer/index.html?id=ef9957cd10964a7286d2f9df5b85e833 | Interactive crash query tool | Public |

### 6.2 ArcGIS FeatureServer REST Endpoints (VDOT)

These endpoints can be queried directly via ArcGIS REST API (used in the BTS GeoData Validator tool):

```
# Full Crash — All reportable Virginia crashes
https://services.arcgis.com/[VDOT_ORG]/arcgis/rest/services/FullCrash/FeatureServer/0

# CrashData Basic — Lightweight point layer
https://services.arcgis.com/[VDOT_ORG]/arcgis/rest/services/CrashDataBasic/FeatureServer/0

# VDOT Administrative Boundaries (Districts)
https://services.arcgis.com/p5v98VHDX9Atv3l7/arcgis/rest/services/VDOTAdministrativeBoundaries/FeatureServer/2

# Query example — filter for potential WWD crash types
GET .../FullCrash/FeatureServer/0/query
  ?where=CRASH_TYPE='HEAD ON' OR CRASH_TYPE='WRONG WAY'
  &geometry={"xmin":-77.6,"ymin":37.45,"xmax":-77.3,"ymax":37.65,"spatialReference":{"wkid":4326}}
  &geometryType=esriGeometryEnvelope
  &spatialRel=esriSpatialRelIntersects
  &outFields=*
  &outSR=4326
  &f=geojson
```

> **Note:** Retrieve the exact VDOT org ID by visiting the ArcGIS Hub item page and clicking "View API Resources".

### 6.3 National / Federal Data Sources (via BTS GeoData Validator)

These are the 6 datasets validated in the `bts-geodata-validator` tool — all relevant to WWD site analysis:

| Dataset | BTS Endpoint | Relevance to WWD |
|---|---|---|
| **HPMS — Natl Highway Planning Network** | `https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_National_Highway_Planning_Network/FeatureServer/0` | AADT volumes, functional class, NHS designation — used to weight risk scores |
| **National Bridge Inventory (NBI)** | `https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_National_Bridge_Inventory/FeatureServer/0` | Bridge overpasses at interchange ramps — geometry risk indicator |
| **National Transit Map — Stops** | `https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_National_Transit_Map_Stops/FeatureServer/0` | Proximity of transit stops near freeway access — pedestrian/driver confusion indicator |
| **National Transit Map — Routes** | `https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_National_Transit_Map_Routes/FeatureServer/0` | Route alignments near interchange areas |
| **Railroad Grade Crossings** | `https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_Railroad_Grade_Crossings/FeatureServer/0` | Grade crossings near interchanges — driver disorientation zones |
| **Metropolitan Planning Organizations** | `https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_Metropolitan_Planning_Organizations/FeatureServer/0` | MPO boundaries — determines which planning authority owns the interchange |

### 6.4 TIGERweb Census API (Virginia)

Used for base geographic layer with all 133 Virginia jurisdictions pre-configured:

```
Base URL:
https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2020/MapServer

State FIPS: 51 (Virginia)

Key Layers:
  Layer 82 — Counties
  Layer 14 — Census Tracts
  Layer 16 — Block Groups
  Layer  1 — County Subdivisions (via Places_CouSub_ConCity_SubMCD)

All 133 jurisdictions configured in Tigerweb api.txt with:
  - FIPS codes
  - Bounding boxes (WGS84)
  - Map centers & zoom levels
  - Jurisdiction codes
```

---

## 7. Technical Architecture — How to Collect & Analyze WWD Data

### 7.1 Data Collection Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                   DATA INGESTION LAYER                   │
├──────────────────┬──────────────────┬───────────────────┤
│  VDOT TREDS /    │  BTS NTAD APIs   │  TIGERweb Census  │
│  Virginia Roads  │  (HPMS, NBI,     │  Geography API    │
│  ArcGIS REST     │   NTM, Crossings)│  (State FIPS: 51) │
└────────┬─────────┴────────┬─────────┴──────────┬────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│                SPATIAL FILTERING LAYER                   │
│  • Clip to Virginia bbox: [-83.7, 36.5, -75.2, 39.5]   │
│  • Filter by county using Tigerweb api.txt bboxes        │
│  • Filter by VDOT District boundary                      │
│  • Limit to Interstate / LAF segments only               │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              WRONG-WAY CRASH EXTRACTION                  │
│  • Filter crash attribute: CRASH_TYPE = 'HEAD ON' or    │
│    MANNER_OF_COLLISION = 'HEAD-ON'                       │
│  • Filter: ROAD_TYPE = 'INTERSTATE' or 'LAF'            │
│  • Flag records with WRONG_WAY_DRIVER = 'YES' if field  │
│    exists in TREDS schema                                │
│  • Cross-reference with 911 call spatial clusters        │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               RISK SCORING ENGINE                        │
│  For each interchange within 0.5 miles of any crash:    │
│  • Interchange type weight (VDOT Road Inventory)        │
│  • AADT weight (HPMS query)                             │
│  • Lighting adequacy (VDOT HMMS)                        │
│  • Alcohol establishment proximity (OSM Overpass)        │
│  • Historical crash count (TREDS 7-year window)         │
│  • 911 call cluster overlap                             │
│  OUTPUT: Normalized risk score [0–100] per interchange   │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│           OUTPUT: GeoJSON / Shapefile                    │
│  • confirmed_wwd_crashes.geojson                        │
│  • potential_high_risk_sites.geojson                    │
│  • risk_scores_by_interchange.geojson                   │
│  • virginia_wwd_heatmap.geojson                         │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Crash Attribute Filter for WWD Identification

Virginia's TREDS/VDOT crash schema contains several fields usable to isolate WWD events:

| Field | Value to Filter | Notes |
|---|---|---|
| `MANNER_OF_COLLISION` | `HEAD-ON` | Most WWD crashes are head-on collisions |
| `CRASH_TYPE` | `HEAD ON`, `WRONG WAY` | Direct crash classification |
| `ROAD_SYSTEM` | `INTERSTATE`, `US ROUTE` | Limit to divided highway context |
| `LIGHTING` | `DARK - NOT LIGHTED` | Nighttime lighting condition |
| `ALCOHOL_INVOLVED` | `YES` | Primary contributing factor in WWD |
| `VEHICLE_MANEUVER` | `WRONG SIDE OF ROAD` | Vehicle-level maneuver field |

> Query these via the Full Crash FeatureServer endpoint with `where` clause combining the above conditions.

### 7.3 Spatial Clustering Approach

Replicate the VTRC 911-call deduplication logic for crash data:
- **Spatial buffer:** 0.25 miles around each crash point
- **Time window:** Crashes within 6-month rolling window
- **Direction:** Same roadway direction (eastbound/westbound/northbound/southbound)
- Use **DBSCAN clustering** (density-based) to detect spatial hotspots
- Minimum cluster size: 3 events within a 1-mile radius over 7 years

### 7.4 Interchange Geometry Extraction

```python
# Pseudocode — ArcGIS REST query for interchange ramp locations
import requests

HPMS_ENDPOINT = "https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_National_Highway_Planning_Network/FeatureServer/0/query"

# Virginia bounding box
VIRGINIA_BBOX = {
    "xmin": -83.7, "ymin": 36.5,
    "xmax": -75.2, "ymax": 39.5,
    "spatialReference": {"wkid": 4326}
}

params = {
    "where": "STFIPS='51' AND (FCLASS=1 OR FCLASS=2)",  # Interstate + Other Freeways
    "geometry": str(VIRGINIA_BBOX),
    "geometryType": "esriGeometryEnvelope",
    "spatialRel": "esriSpatialRelIntersects",
    "outFields": "LNAME,AADT,FCLASS,SIGNT1,SIGNN1,MILES",
    "outSR": "4326",
    "f": "geojson",
    "resultRecordCount": 2000
}

response = requests.get(HPMS_ENDPOINT, params=params)
road_segments = response.json()
```

---

## 8. Geographic Data Integration (TIGERweb + VDOT)

The `Tigerweb api.txt` file configures all 133 Virginia jurisdictions. Each jurisdiction entry contains:
- `fips` — 3-digit county FIPS (combined with state FIPS `51` for full 5-digit code)
- `bbox` — WGS84 bounding box `[west, south, east, north]`
- `mapCenter` — `[lat, lon]` for map centering
- `mapZoom` — Default zoom level
- `jurisCode` — VDOT jurisdiction number
- `maintainsOwnRoads` — `true` for independent cities that maintain their own road network

### 8.1 Using Jurisdiction BBOXes for Spatial Queries

For each jurisdiction, execute targeted crash data queries:

```javascript
// Example: Query crashes in Henrico County
const henrico = jurisdictions["henrico"];
const bbox = henrico.bbox; // [-77.6533, 37.3473, -77.2137, 37.7073]

const queryUrl = `${CRASH_ENDPOINT}/query?` + new URLSearchParams({
  geometry: JSON.stringify({
    xmin: bbox[0], ymin: bbox[1], xmax: bbox[2], ymax: bbox[3],
    spatialReference: { wkid: 4326 }
  }),
  geometryType: "esriGeometryEnvelope",
  spatialRel: "esriSpatialRelIntersects",
  where: "MANNER_OF_COLLISION='HEAD-ON' AND ROAD_SYSTEM='INTERSTATE'",
  outFields: "*",
  outSR: "4326",
  f: "geojson"
});
```

### 8.2 Priority Jurisdictions for WWD Analysis

Based on VTRC findings, prioritize these jurisdictions first:

| Jurisdiction | FIPS | Relevant Corridor | VDOT District |
|---|---|---|---|
| Arlington | 013 | I-66, I-395, I-495 | Northern Virginia |
| Fairfax County | 059 | I-66, I-495, I-95 | Northern Virginia |
| Fairfax City | 600 | I-66, I-495 | Northern Virginia |
| Alexandria | 510 | I-395, I-495 | Northern Virginia |
| Virginia Beach | 810 | I-264, I-64 | Hampton Roads |
| Norfolk | 710 | I-264, I-64 | Hampton Roads |
| Chesapeake | 550 | I-64, I-464 | Hampton Roads |
| Richmond City | 760 | I-64, I-95, I-195 | Richmond |
| Henrico | 087 | I-64, I-95 | Richmond |
| Augusta | 015 | I-81 | Staunton |
| Rockingham | 165 | I-81 | Staunton |

---

## 9. BTS GeoData Validator — Role in This Project

The `bts-geodata-validator` HTML tool in this repository is a **Leaflet + ArcGIS REST** frontend that validates 6 national BTS/NTAD endpoints. Its role in WWD analysis:

### 9.1 Current Capabilities
- Tests all 6 NTAD endpoints with live bounding-box queries
- Supports preset areas (includes **Henrico Co, VA** preset)
- Paginates through up to 100,000 features per dataset
- Renders results on an interactive map with popups

### 9.2 Extension for Virginia WWD

To extend this tool for Virginia WWD data collection, add these additional dataset cards to the `DS` array:

```javascript
// Add to DS array in bts-geodata-validator
{
  id: 'vdot_crash', color: '#ff4444',
  name: 'VDOT Full Crash — Virginia',
  desc: 'All reportable crashes in Virginia from TREDS via VDOT. Filter for HEAD-ON / WRONG-WAY on interstates.',
  url: 'https://services.arcgis.com/[VDOT_ORG_ID]/arcgis/rest/services/FullCrash/FeatureServer/0',
  geom: 'point', queryMode: 'envelope',
  // Add popup and filter for MANNER_OF_COLLISION = HEAD-ON
},
{
  id: 'vdot_roads', color: '#3388ff',
  name: 'VDOT Road Inventory — Interstates',
  desc: 'Virginia interstate and LAF road segments from VDOT road inventory.',
  url: 'https://services.arcgis.com/[VDOT_ORG_ID]/arcgis/rest/services/RoadInventory/FeatureServer/0',
  geom: 'line', queryMode: 'envelope',
}
```

Also add a **Virginia state preset** to the bounding box presets:
```javascript
// Add to presets in bbox-ctrl
<button class="preset" onclick="applyPreset(this,-83.7,36.5,-75.2,39.5)">Virginia (Full State)</button>
<button class="preset" onclick="applyPreset(this,-77.6,38.7,-77.0,39.0)">Northern VA (I-66)</button>
<button class="preset" onclick="applyPreset(this,-76.3,36.7,-75.9,36.95)">Hampton Roads (I-264)</button>
<button class="preset" onclick="applyPreset(this,-79.5,38.0,-78.5,38.8)">Staunton (I-81)</button>
```

---

## 10. Countermeasure Technologies

Based on VTRC 25-R10 findings and FHWA guidance, the following countermeasures are recommended for confirmed and potential WWD sites:

### 10.1 Signing & Pavement Marking

| Countermeasure | Application | Effectiveness |
|---|---|---|
| Enhanced DO NOT ENTER / WRONG WAY signs (larger, retroreflective) | All ramp exits | High |
| Red retroreflective pavement markings at ramp exits | Exit ramp noses | High |
| Centerline rumble strips (transverse) | Ramp exit areas | Medium |
| Overhead DO NOT ENTER signs (cantilever) | High-volume partial cloverleafs | High |
| Flashing LED beacons on signs | Dark segments, I-66, I-264 | Very High |

### 10.2 Detection & Alert Technology

| Technology | Description | Deployment |
|---|---|---|
| **Wrong-way vehicle detection radar** | Radar sensors at ramp exits detect reverse movement | I-66, I-264, I-81 priority corridors |
| **CCTV + AI video analytics** | Camera-based detection triggering alerts | VDOT Smart Traffic Centers (Arlington, Hampton Roads) |
| **Dynamic Message Signs (DMS)** | Auto-activated "WRONG WAY DRIVER AHEAD" warnings | Downstream of detection points |
| **Automated 911 dispatch alert** | System-to-CAD integration for Virginia State Police | All detection points |
| **WAZE / navigation app alerts** | Crowd-sourced WWD reports fed to VDOT | Statewide — already partially active |
| **Intersection lighting upgrades** | LED lighting at dark partial cloverleaf exits | I-81 rural interchanges |

### 10.3 Geometric / Physical Countermeasures

| Countermeasure | Application |
|---|---|
| Raised pavement markers (red, retroreflective) at exit ramps | All priority interchanges |
| Pork chop islands at exit ramps | Channelize vehicles away from wrong direction |
| One-way gate arms / turtles | High-frequency WWD sites |
| Directional rumble strips | Exit ramp approach areas |

---

## 11. Implementation Roadmap

### Phase 1 — Data Collection (Weeks 1–4)

- [ ] Obtain full crash dataset from VDOT Virginia Roads / TREDS for 2016–2024
- [ ] Filter for HEAD-ON crashes on Interstate segments using TREDS attribute fields
- [ ] Cross-reference with 911 call cluster data from VTRC 25-R10
- [ ] Query HPMS for AADT on all Virginia interstate segments
- [ ] Query VDOT HMMS for lighting inventory on I-66, I-264, I-81, I-64
- [ ] Use TIGERweb jurisdiction bboxes (from `Tigerweb api.txt`) to batch queries by county

### Phase 2 — Spatial Analysis (Weeks 5–8)

- [ ] Build DBSCAN cluster model on confirmed WWD crash points
- [ ] Score all Virginia interstate interchanges using weighted risk model
- [ ] Identify top 25 potential high-risk sites not yet in VTRC hotspot list
- [ ] Generate GeoJSON outputs:
  - `confirmed_wwd_crashes.geojson`
  - `potential_high_risk_sites.geojson`
  - `interchange_risk_scores.geojson`

### Phase 3 — Visualization (Weeks 9–10)

- [ ] Extend `bts-geodata-validator` HTML tool with Virginia crash + road layers
- [ ] Add Virginia-specific bbox presets (full state + 4 priority corridors)
- [ ] Add heat map overlay for 911 call density
- [ ] Add interchange risk score choropleth layer

### Phase 4 — Reporting & Countermeasure Recommendations (Weeks 11–12)

- [ ] Map confirmed sites → recommended countermeasure per VTRC 25-R10 Table
- [ ] Cross-reference with VDOT capital improvement program for funding opportunities
- [ ] Submit findings to relevant VDOT District offices and Hampton Roads / NoVA MPOs
- [ ] Coordinate with Virginia State Police for CAD integration planning

---

## 12. Data Schema Design

### 12.1 WWD Crash Record Schema

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [lon, lat] },
  "properties": {
    "crash_id": "string",
    "crash_date": "YYYY-MM-DD",
    "crash_time": "HH:MM",
    "road_name": "string",
    "route_number": "string",
    "direction": "NB|SB|EB|WB",
    "county_fips": "51XXX",
    "vdot_district": "string",
    "manner_of_collision": "HEAD-ON",
    "lighting_condition": "string",
    "alcohol_involved": true,
    "fatalities": 0,
    "injuries": 0,
    "interchange_name": "string",
    "interchange_type": "PARTIAL_CLOVERLEAF|DIAMOND|DIRECTIONAL",
    "aadt": 0,
    "wwd_confirmed": true,
    "data_source": "TREDS|VTRC_25R10|911_CALL",
    "risk_score": 0.0
  }
}
```

### 12.2 Potential Site Record Schema

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [lon, lat] },
  "properties": {
    "site_id": "string",
    "interchange_name": "string",
    "route": "string",
    "county_fips": "51XXX",
    "vdot_district": "string",
    "interchange_type": "string",
    "aadt": 0,
    "lighting_adequate": false,
    "alcohol_density_1mi": 0,
    "historic_wwd_crashes": 0,
    "proximity_to_911_cluster": false,
    "risk_score": 0.0,
    "risk_tier": "HIGH|MEDIUM|LOW",
    "recommended_countermeasures": ["string"],
    "mpo": "string",
    "data_sources": ["HPMS", "TREDS", "VTRC_25R10"]
  }
}
```

---

## 13. References

| # | Reference | URL |
|---|---|---|
| 1 | VTRC Report 25-R10: Systemic Evaluation of WWD Crashes and Countermeasures | https://vtrc.virginia.gov/media/vtrc/vtrc-pdf/vtrc-pdf/25-R10.pdf |
| 2 | VDOT Virginia Roads Open Data Portal | https://virginiaroads-vdot.opendata.arcgis.com |
| 3 | VDOT Full Crash Dataset (ArcGIS Hub) | https://hub.arcgis.com/datasets/VDOT::full-crash |
| 4 | VDOT CrashData Basic | https://virginiaroads-vdot.opendata.arcgis.com/maps/VDOT::crashdata-basic-1 |
| 5 | Virginia TREDS Crash Locations Map | https://www.treds.virginia.gov/Mapping/Map/CrashesByJurisdiction |
| 6 | Virginia DMV Statewide Crash Data | https://www.dmv.virginia.gov/safety/crash-data |
| 7 | Virginia Open Data Portal — Crash Data | https://data.virginia.gov/dataset/crash-data |
| 8 | SmarterRoads VDOT (Crash Shapefiles) | https://smarterroads.vdot.virginia.gov |
| 9 | VDOT Interactive Crash Map | https://vdot.maps.arcgis.com/apps/webappviewer/index.html?id=ef9957cd10964a7286d2f9df5b85e833 |
| 10 | BTS NTAD — HPMS (National Highway Planning Network) | https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_National_Highway_Planning_Network/FeatureServer/0 |
| 11 | BTS NTAD — National Bridge Inventory | https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_National_Bridge_Inventory/FeatureServer/0 |
| 12 | BTS NTAD — National Transit Map Stops | https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_National_Transit_Map_Stops/FeatureServer/0 |
| 13 | BTS NTAD — Railroad Grade Crossings | https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_Railroad_Grade_Crossings/FeatureServer/0 |
| 14 | BTS NTAD — Metropolitan Planning Organizations | https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_Metropolitan_Planning_Organizations/FeatureServer/0 |
| 15 | TIGERweb Census 2020 MapServer (Virginia FIPS: 51) | https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2020/MapServer |
| 16 | VDOT HMMS (Highway Maintenance Management System) | https://smarterroads.vdot.virginia.gov |
| 17 | FHWA Wrong-Way Driving Safety Resource | https://safety.fhwa.dot.gov/roadway_dept/wrongwaydriving |
| 18 | Virginia Open Data Portal — CrashData Details | https://data.virginia.gov/dataset/crashdata-details1 |

---

*Report generated by Claude Code — Wrong-Way Driving Resource Collection Project — Virginia*
*Branch: `claude/wrong-way-driving-resources-IN3W4`*
