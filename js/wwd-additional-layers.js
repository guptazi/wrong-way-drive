/**
 * wwd-additional-layers.js – Additional Possible WWD data sources
 * 1. ArcGIS Prohibited Roadways (No Ramp) – VDOT prohibited roadways
 * 2. ArcGIS Curve Delineation – VDOT curve delineation features
 * 3. ArcGIS FatalCrash YTD – VDOT year-to-date fatal crashes
 * 4. VA Ramps Classified – ON-RAMP / OFF-RAMP / UNKNOWN (pre-processed GeoJSON)
 * 5. VA Off-Ramp Terminals – terminal points for OFF-RAMP features (pre-processed GeoJSON)
 */

const WWDAdditionalLayers = (() => {

  const PROHIBITED_BASE         = 'https://services.arcgis.com/p5v98VHDX9Atv3l7/ArcGIS/rest/services/ProhibitedRoadways_NoRamp/FeatureServer/0';
  const CURVE_DELINEATION_ROOT  = 'https://services.arcgis.com/p5v98VHDX9Atv3l7/ArcGIS/rest/services/Curve_Delineation/FeatureServer';
  const FATAL_CRASH_ROOT        = 'https://services.arcgis.com/p5v98VHDX9Atv3l7/ArcGIS/rest/services/FatalCrash_YTD/FeatureServer';

  /**
   * Fetch Prohibited Roadways (No Ramp) from VDOT ArcGIS
   * @returns {Promise<Array>} Array of { id, coordinates, raw, attrs }
   */
  async function fetchProhibitedRoadways() {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      outSR: 4326,
      returnGeometry: true,
      resultRecordCount: 2000,
      f: 'json'
    });

    const res = await fetch(`${PROHIBITED_BASE}/query?${params}`);
    if (!res.ok) throw new Error(`ArcGIS Prohibited request failed: ${res.status} ${res.statusText}`);

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'ArcGIS API error');

    return (data.features || []).map(f => {
      const attrs = f.attributes || {};
      const paths = f.geometry?.paths || [];
      const coordinates = paths.map(path =>
        path.map(([x, y]) => [y, x]) // [lon,lat] → [lat,lon]
      );
      return {
        id: `prohibited-${attrs.FID ?? attrs.OBJECTID ?? Math.random().toString(36).slice(2)}`,
        coordinates,
        raw: f.attributes,
        attrs: {
          routeName:     attrs.RTE_NM,
          routeCommon:   attrs.RTE_COMMON,
          routeCategory: attrs.RTE_CATEGO,
          jurisdiction:  attrs.RTE_JURIS_,
          fromJuris:     attrs.FROM_JURIS,
          toJuris:       attrs.TO_JURISDI
        }
      };
    });
  }

  /**
   * Fetch Curve Delineation features from VDOT ArcGIS.
   * Discovers available layer IDs from the FeatureServer root first,
   * then queries every geometry-bearing layer.
   * @returns {Promise<Array>} Array of { id, objectId, coordinates?, lat?, lng?, attrs, name }
   */
  async function fetchCurveDelineation() {
    // ── Step 1: discover layers ──────────────────────────────────────────────
    const infoRes = await fetch(`${CURVE_DELINEATION_ROOT}?f=json`);
    if (!infoRes.ok) throw new Error(`Curve Delineation service info failed: ${infoRes.status} ${infoRes.statusText}`);
    const info = await infoRes.json();
    if (info.error) throw new Error(info.error.message || 'ArcGIS service info error');

    // Collect layer IDs that have geometry (exclude pure tables)
    const layerIds = (info.layers || [])
      .filter(l => l.geometryType && l.geometryType !== 'esriGeometryNull')
      .map(l => l.id);

    if (!layerIds.length) {
      console.warn('Curve Delineation: no geometry layers found, falling back to layer 0');
      layerIds.push(0);
    }

    // ── Step 2: query each layer in parallel ─────────────────────────────────
    const queryParams = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      outSR: 4326,
      returnGeometry: true,
      resultRecordCount: 2000,
      f: 'json'
    });

    const pages = await Promise.all(
      layerIds.map(async id => {
        const res = await fetch(`${CURVE_DELINEATION_ROOT}/${id}/query?${queryParams}`);
        if (!res.ok) { console.warn(`Curve Delineation layer ${id} failed: ${res.status}`); return []; }
        const data = await res.json();
        if (data.error) { console.warn(`Curve Delineation layer ${id} error:`, data.error.message); return []; }
        return data.features || [];
      })
    );

    // ── Step 3: map raw ArcGIS features to app objects ───────────────────────
    const features = [];
    pages.flat().forEach(f => {
      const attrs    = f.attributes || {};
      const geom     = f.geometry   || {};
      const objectId = attrs.OBJECTID ?? attrs.FID ?? attrs.objectid;
      const name     = attrs.RTE_NM || attrs.ROUTE_NAME || attrs.Name || attrs.NAME || `Curve ${objectId}`;

      const paths = geom.paths || [];
      paths.forEach((path, i) => {
        if (!path || path.length < 2) return;
        features.push({
          id: `curve-${objectId}-${i}`,
          objectId,
          coordinates: path.map(([x, y]) => [y, x]), // [lon,lat] → [lat,lon]
          attrs,
          name
        });
      });

      if (!paths.length && geom.x != null && geom.y != null) {
        features.push({ id: `curve-${objectId}`, objectId, lat: geom.y, lng: geom.x, attrs, name });
      }
    });

    return features;
  }

  /**
   * Fetch Fatal Crash YTD (point features) from VDOT ArcGIS.
   * Discovers layer IDs from the FeatureServer root, then queries all geometry layers.
   * @returns {Promise<Array>} Array of { id, objectId, lat, lng, attrs, name }
   */
  async function fetchFatalCrash() {
    // Step 1: discover layers
    const infoRes = await fetch(`${FATAL_CRASH_ROOT}?f=json`);
    if (!infoRes.ok) throw new Error(`Fatal Crash service info failed: ${infoRes.status} ${infoRes.statusText}`);
    const info = await infoRes.json();
    if (info.error) throw new Error(info.error.message || 'ArcGIS service info error');

    const layerIds = (info.layers || [])
      .filter(l => l.geometryType && l.geometryType !== 'esriGeometryNull')
      .map(l => l.id);

    if (!layerIds.length) {
      console.warn('Fatal Crash: no geometry layers found, falling back to layer 0');
      layerIds.push(0);
    }

    // Step 2: query each layer in parallel
    const queryParams = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      outSR: 4326,
      returnGeometry: true,
      resultRecordCount: 2000,
      f: 'json'
    });

    const pages = await Promise.all(
      layerIds.map(async id => {
        const res = await fetch(`${FATAL_CRASH_ROOT}/${id}/query?${queryParams}`);
        if (!res.ok) { console.warn(`Fatal Crash layer ${id} failed: ${res.status}`); return []; }
        const data = await res.json();
        if (data.error) { console.warn(`Fatal Crash layer ${id} error:`, data.error.message); return []; }
        return data.features || [];
      })
    );

    // Step 3: map to app objects — fatal crashes are point features
    return pages.flat()
      .filter(f => f.geometry?.x != null && f.geometry?.y != null)
      .map(f => {
        const attrs    = f.attributes || {};
        const objectId = attrs.OBJECTID ?? attrs.FID ?? attrs.objectid;
        const name     = attrs.CRASH_TYPE || attrs.CRASH_DESCRIPTION || attrs.RTE_NM
                      || attrs.Route || attrs.ROUTE || `Fatal Crash ${objectId}`;
        return {
          id: `fatal-crash-${objectId}`,
          objectId,
          lat:  f.geometry.y,
          lng:  f.geometry.x,
          attrs,
          name
        };
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Functional Classification Ramps – VDOT ArcGIS FeatureServer/2
  // Uses f=geojson → coordinates returned in WGS84, no reprojection needed.
  // Paginated (1000 records/page) to retrieve all statewide ramp features.
  // ─────────────────────────────────────────────────────────────────────────

  const RAMP_BASE = 'https://services.arcgis.com/p5v98VHDX9Atv3l7/ArcGIS/rest/services/Functional_Classification_Feature_Service/FeatureServer/2/query';

  /**
   * Fetch all ramp polylines from VDOT Functional Classification FeatureServer/2.
   * Uses f=geojson which returns GeoJSON with WGS84 coordinates directly.
   * Paginates automatically until all features are retrieved.
   * @returns {Promise<Array>} Array of { id, coordinates [[lat,lon],...], attrs }
   */
  async function fetchFunctionalClassRamps() {
    const allFeatures = [];
    let offset = 0;
    const pageSize = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const params = new URLSearchParams({
        where:             '1=1',
        outFields:         'OBJECTID,RTE_NM,STATE_FUNCT_CLASS_ID,RTE_CATEGORY_NM,TMPD_FUNCTIONAL_CLASS_DSC',
        returnGeometry:    'true',
        f:                 'geojson',          // WGS84 direct – no reprojection
        resultRecordCount: pageSize,
        resultOffset:      offset
      });

      const res = await fetch(`${RAMP_BASE}?${params}`);
      if (!res.ok) throw new Error(`Ramp fetch failed: ${res.status} ${res.statusText}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'ArcGIS ramp API error');

      const features = data.features || [];
      allFeatures.push(...features);

      // Stop when fewer records than page size (last page)
      if (features.length < pageSize) keepFetching = false;
      else offset += pageSize;
    }

    // Convert GeoJSON features to internal format
    return allFeatures.map((f, i) => {
      const geom  = f.geometry  || {};
      const attrs = f.properties || {};

      // GeoJSON coordinates are [lon, lat]; Leaflet needs [lat, lon]
      let coordinates = [];
      if (geom.type === 'LineString') {
        coordinates = (geom.coordinates || []).map(([lon, lat]) => [lat, lon]);
      } else if (geom.type === 'MultiLineString') {
        coordinates = (geom.coordinates || []).flatMap(seg =>
          seg.map(([lon, lat]) => [lat, lon])
        );
      }

      return {
        id:   `ramp-fc-${attrs.OBJECTID ?? i}`,
        coordinates,
        attrs: {
          routeName:     attrs.RTE_NM                     || '',
          functClass:    attrs.TMPD_FUNCTIONAL_CLASS_DSC   || attrs.STATE_FUNCT_CLASS_ID || '',
          category:      attrs.RTE_CATEGORY_NM             || ''
        }
      };
    }).filter(f => f.coordinates.length >= 2); // drop empty/point geometries
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  FHWA Network Screening Method 2 — Weighted WWD Crash Entry Points
  //
  //  Reference: Box 2-2, FHWA-SA-12-016 / NCHRP "Wrong-Way Driving" methods
  //
  //  CR_int = (100 × Σ W_i × E_i) / (N_int × T)
  //
  //  W weights per entry-point type (from the method):
  //    W_recorded_entry_point = 1.0
  //    W_first_entry_point    = 0.7
  //    W_second_entry_point   = 0.3
  //
  //  Data source: Same VDOT Full_Crash FeatureServer used by ArcGISWWD
  //    (HEAD-ON crashes on divided-highway ramps = best public proxy for
  //     confirmed WWD entry points in Virginia)
  //  ══════════════════════════════════════════════════════════════════════════

  const FULL_CRASH_URL = 'https://services.arcgis.com/p5v98VHDX9Atv3l7/arcgis/rest/services/Full_Crash/FeatureServer/0/query';

  // Haversine great-circle distance in km
  function _hav(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Single-linkage greedy spatial clustering.
   * Returns array of clusters, each being an array of point objects.
   * Points must have .lat and .lng.
   */
  function _greedyCluster(points, radiusKm) {
    const assigned = new Uint8Array(points.length);
    const clusters = [];
    for (let i = 0; i < points.length; i++) {
      if (assigned[i]) continue;
      const cluster = [points[i]];
      assigned[i] = 1;
      for (let j = i + 1; j < points.length; j++) {
        if (assigned[j]) continue;
        if (_hav(points[i].lat, points[i].lng, points[j].lat, points[j].lng) <= radiusKm) {
          cluster.push(points[j]);
          assigned[j] = 1;
        }
      }
      clusters.push(cluster);
    }
    return clusters;
  }

  /**
   * Fetch all paginated WWD crashes (head-on + divided highway + ramp).
   * Uses the same FeatureServer and WHERE clause as ArcGISWWD (arcgis-wwd.js).
   * Field names confirmed from the service schema via arcgis-wwd.js normalizeFeature.
   */
  async function _fetchAllWwdCrashes() {
    const WHERE = "COLLISION_TYPE = '3' AND ROADWAY_DESCRIPTION = '3' AND ROADWAY_ALIGNMENT = '10'";
    // Confirmed field names from Full_Crash FeatureServer schema
    const FIELDS = 'OBJECTID,LAT,LON,CRASH_DT,CRASH_YEAR,ROUTE_OR_STREET_NM,RTE_NM,CRASH_SEVERITY,VDOT_DISTRICT';
    const PAGE   = 1000;
    const all    = [];
    let   offset = 0;

    while (true) {
      const params = new URLSearchParams({
        where:             WHERE,
        outFields:         FIELDS,
        outSR:             4326,
        returnGeometry:    'true',
        orderByFields:     'OBJECTID',   // required for reliable offset pagination
        resultRecordCount: PAGE,
        resultOffset:      offset,
        f:                 'json'
      });
      const res  = await fetch(`${FULL_CRASH_URL}?${params}`);
      if (!res.ok) throw new Error(`Full_Crash fetch failed: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(`ArcGIS: ${data.error.message || JSON.stringify(data.error)}`);
      const feats = data.features || [];
      all.push(...feats);
      if (feats.length < PAGE) break;
      offset += PAGE;
    }
    return all;
  }

  /**
   * Fetch and compute FHWA Method 2 — Weighted WWD Crash Entry Points.
   *
   * Returns an array of interchange objects, sorted by weighted_sum descending.
   * Each object:
   *   { id, lat, lng, weightedSum, crashRate, tier, tierLabel,
   *     terminalCount, totalCrashes, studyYears, topRoute, district,
   *     terminals: [{ lat, lng, crashes, entryType, weight, routes }] }
   */
  async function fetchWeightedWwdCrashPoints() {
    // ── 1. Fetch all WWD crashes ───────────────────────────────────────────
    const rawFeats = await _fetchAllWwdCrashes();
    if (!rawFeats.length) return [];

    // ── 2. Normalise to point objects (field names from Full_Crash schema) ───
    const points = rawFeats.map((f, i) => {
      const a = f.attributes || {};
      const g = f.geometry   || {};
      // Prefer explicit LAT/LON attrs; fall back to geometry x/y
      const lat = (a.LAT != null ? a.LAT : null) ?? (g.y != null ? g.y : null);
      const lng = (a.LON != null ? a.LON : null) ?? (g.x != null ? g.x : null);
      return { idx: i, lat, lng,
               dt:       a.CRASH_DT                              || null,
               year:     a.CRASH_YEAR                            || null,
               route:    a.ROUTE_OR_STREET_NM || a.RTE_NM        || '',
               sev:      a.CRASH_SEVERITY                        || '',
               district: a.VDOT_DISTRICT                         || '' };
    }).filter(p => p.lat != null && p.lng != null &&
                   Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180);

    if (!points.length) return [];

    // ── 3. Derive study period T from data ────────────────────────────────
    // Try integer year field first (most reliable), then fall back to CRASH_DT
    const years = points.map(p => p.year).filter(y => y && y > 1990 && y < 2100);
    let T = 5; // default 5-year window
    if (years.length >= 2) {
      T = Math.max(1, Math.max(...years) - Math.min(...years) + 1);
    } else {
      const validDates = points.map(p => p.dt).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d));
      if (validDates.length >= 2) {
        T = Math.max(1, Math.round(
          (Math.max(...validDates.map(d => d.getTime())) - Math.min(...validDates.map(d => d.getTime()))) /
          (365.25 * 24 * 3600 * 1000)
        ));
      }
    }

    // ── 4. Stage 1 cluster: group crashes at the SAME TERMINAL (100 m) ────
    const terminalClusters = _greedyCluster(points, 0.1); // 100 m
    const terminals = terminalClusters.map((crashes, ti) => {
      const lat  = crashes.reduce((s, p) => s + p.lat, 0) / crashes.length;
      const lng  = crashes.reduce((s, p) => s + p.lng, 0) / crashes.length;
      const routes = [...new Set(crashes.map(p => p.route).filter(Boolean))];
      const fatalCount = crashes.filter(p => {
        const s = String(p.sev || '').trim().toUpperCase();
        return s === '1' || s === 'K' || s.includes('FATAL');
      }).length;
      return { ti, lat, lng, crashes: crashes.length, fatalCount, routes,
               district: crashes[0].district || '' };
    });

    // ── 5. Stage 2 cluster: group terminals into INTERCHANGES (400 m) ─────
    const interchangeClusters = _greedyCluster(terminals, 0.4); // 400 m

    // ── 6. Apply Method 2 weights per interchange ─────────────────────────
    // Weights (Box 2-2):
    const W = [1.0, 0.7, 0.3]; // recorded, first, second entry point

    const ENTRY_LABELS = ['Recorded entry point', 'First entry point', 'Second entry point'];
    const TIER_THRESHOLDS = [
      { label: 'Critical', min: 1.7,  color: '#BD0026' },
      { label: 'High',     min: 1.0,  color: '#F03B20' },
      { label: 'Moderate', min: 0.7,  color: '#FD8D3C' },
      { label: 'Low',      min: 0.0,  color: '#FECC5C' }
    ];

    const results = interchangeClusters.map((clusterTerminals, idx) => {
      // Sort terminals by crash count descending (highest-crash = recorded entry)
      const sorted = [...clusterTerminals].sort((a, b) => b.crashes - a.crashes);

      // Assign entry-point types and weights
      let weightedSum = 0;
      const enriched = sorted.map((t, k) => {
        const w = k < W.length ? W[k] : 0.1;
        weightedSum += w;
        return { ...t, entryType: ENTRY_LABELS[k] || 'Additional entry point', weight: w };
      });

      // Interchange centroid
      const lat = clusterTerminals.reduce((s, t) => s + t.lat, 0) / clusterTerminals.length;
      const lng = clusterTerminals.reduce((s, t) => s + t.lng, 0) / clusterTerminals.length;

      // Method 2 crash rate: CR_int = (100 × Σ W_i × E_i) / (N_int × T)
      // N_int = 1 per interchange; T = study period in years
      const crashRate  = +((100 * weightedSum) / (1 * T)).toFixed(1);
      const totalCrash = clusterTerminals.reduce((s, t) => s + t.crashes, 0);

      // Risk tier
      const tier = TIER_THRESHOLDS.find(t => weightedSum >= t.min) || TIER_THRESHOLDS.at(-1);

      // Top route names
      const allRoutes = [...new Set(clusterTerminals.flatMap(t => t.routes))].slice(0, 3);
      const district  = clusterTerminals[0].district || '';

      const totalFatals = clusterTerminals.reduce((s, t) => s + (t.fatalCount || 0), 0);
      return {
        id:             `wwdm2-${idx}`,
        lat:            +lat.toFixed(6),
        lng:            +lng.toFixed(6),
        weightedSum:    +weightedSum.toFixed(2),
        crashRate,
        terminalCount:  clusterTerminals.length,
        totalCrashes:   totalCrash,
        totalFatals,
        hasFatal:       totalFatals > 0,
        studyYears:     T,
        tier:           tier.label,
        tierColor:      tier.color,
        topRoute:       allRoutes[0] || 'Unknown',
        allRoutes,
        district,
        terminals:      enriched
      };
    });

    // Sort by weighted sum descending → rank
    results.sort((a, b) => b.weightedSum - a.weightedSum);
    results.forEach((r, i) => { r.rank = i + 1; });

    return results;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  FHWA Network Screening Method 3 — Segment-Level WWD Risk
  //
  //  Reference: Box 2-3, FHWA Wrong-Way Driving network screening methods
  //
  //  SPF: Predicted_crashes (4-yr per 7-exit segment) =
  //    exp[ −0.453523
  //         + (−0.302024 × ln(citations_segment))
  //         + (0.5865768 × ln(911_calls_segment))
  //         + (−1.062e−5 × AADT)
  //         + (1.4755753 × major_directional/mi)
  //         + (2.4113643 × 2-to-3-leg_directional/mi) ]
  //
  //  Segment definition — VDOT LRS Route Master (confirmed public):
  //    • Interchanges from Method 2 are snapped to the nearest IS or US route
  //      polyline within 3 km using the VDOT LRS Route Master view.
  //    • Within each route, interchanges are ordered by their projected
  //      position (cumulative km from route start) then batched into ~7.
  //    • Graceful fallback: when LRS is unavailable the interchanges are
  //      grouped by topRoute name and sorted along the dominant axis
  //      (lat for N-S routes, lng for E-W routes).
  //
  //  Virginia proxy variables (no citation / 911 database):
  //    citations_segment ← observed WWD crashes (best public proxy)
  //    911_calls_segment ← citations × 3 (~3 calls per crash)
  //    AADT              ← 45,000 default (VA divided-highway avg)
  //    major_directional ← 1st-ranked terminal per interchange
  //    2-to-3-leg        ← 2nd / 3rd-ranked terminals per interchange
  // ══════════════════════════════════════════════════════════════════════════

  // VDOT LRS Route Master – confirmed public, layer 0
  const LRS_ROUTE_URL =
    'https://services.arcgis.com/p5v98VHDX9Atv3l7/ArcGIS/rest/services' +
    '/LRS_Route_Master_view/FeatureServer/0/query';

  /**
   * Fetch VDOT LRS interstate + US route geometries within a bounding box.
   * Multiple direction-specific features (e.g. "0000095N" + "0000095S") are
   * merged by base route key after sorting by milepost.
   *
   * @returns {Array|null} [{routeKey, rteName, category, coords[[lat,lng],...]}]
   */
  async function _fetchLrsRoutes(minLat, minLng, maxLat, maxLng) {
    const params = new URLSearchParams({
      where:             "RTE_CATEGORY_NM IN ('IS','US')",
      outFields:         'OBJECTID,RTE_NM,RTE_CATEGORY_NM,FROM_MP,TO_MP',
      returnGeometry:    'true',
      f:                 'geojson',
      geometry:          `${minLng.toFixed(4)},${minLat.toFixed(4)},${maxLng.toFixed(4)},${maxLat.toFixed(4)}`,
      geometryType:      'esriGeometryEnvelope',
      spatialRel:        'esriSpatialRelIntersects',
      inSR:              '4326',
      resultRecordCount: '2000'
    });

    const res = await fetch(`${LRS_ROUTE_URL}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.features?.length) return null;

    // Group by base route code (strip trailing direction letter N/S/E/W)
    const byBase = {};
    for (const f of data.features) {
      const props    = f.properties || {};
      const rteNm    = props.RTE_NM    || props.rte_nm    || '';
      const category = props.RTE_CATEGORY_NM || '';
      const fromMp   = props.FROM_MP   ?? props.from_mp   ?? 0;
      if (!rteNm) continue;

      const baseKey = rteNm.replace(/[NSEWnsew]$/, '');

      let coords = [];
      const geom = f.geometry;
      if (geom?.type === 'LineString') {
        coords = geom.coordinates.map(([lon, lat]) => [lat, lon]);
      } else if (geom?.type === 'MultiLineString') {
        coords = geom.coordinates.flatMap(s => s.map(([lon, lat]) => [lat, lon]));
      }
      if (coords.length < 2) continue;

      if (!byBase[baseKey]) byBase[baseKey] = { rteName: rteNm, category, segs: [] };
      byBase[baseKey].segs.push({ fromMp, coords });
    }

    // Sort sub-segments by milepost then concatenate
    return Object.entries(byBase).map(([routeKey, v]) => {
      v.segs.sort((a, b) => a.fromMp - b.fromMp);
      return {
        routeKey,
        rteName:  v.rteName,
        category: v.category,
        coords:   v.segs.flatMap(s => s.coords)
      };
    });
  }

  /**
   * Project a lat/lng point onto a polyline.
   * @returns {{ distKm: number, posKm: number }}
   *   distKm = perpendicular distance from point to nearest segment (km)
   *   posKm  = cumulative distance from polyline start to projected point (km)
   */
  function _projectOnPolyline(lat, lng, coords) {
    let minDist = Infinity;
    let bestPos = 0;
    let cumKm   = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const [lat1, lon1] = coords[i];
      const [lat2, lon2] = coords[i + 1];
      const segKm = _hav(lat1, lon1, lat2, lon2);

      const dlat = lat2 - lat1, dlng = lon2 - lon1;
      const len2 = dlat * dlat + dlng * dlng;
      let t = 0;
      if (len2 > 0) {
        t = Math.max(0, Math.min(1,
          ((lat - lat1) * dlat + (lng - lon1) * dlng) / len2
        ));
      }
      const projLat = lat1 + t * dlat;
      const projLng = lon1 + t * dlng;
      const dist = _hav(lat, lng, projLat, projLng);

      if (dist < minDist) { minDist = dist; bestPos = cumKm + t * segKm; }
      cumKm += segKm;
    }
    return { distKm: minDist, posKm: bestPos };
  }

  /**
   * Snap an interchange to its nearest LRS route (within 3 km).
   * @returns {{ routeKey, rteName, posKm } | null}
   */
  function _assignToLrsRoute(ic, lrsRoutes) {
    const MAX_KM = 3.0;
    let best = null, bestDist = MAX_KM;
    for (const route of lrsRoutes) {
      const { distKm, posKm } = _projectOnPolyline(ic.lat, ic.lng, route.coords);
      if (distKm < bestDist) {
        bestDist = distKm;
        best = { routeKey: route.routeKey, rteName: route.rteName, posKm };
      }
    }
    return best;
  }

  /**
   * Fetch and compute FHWA Method 3 — Segment-Level WWD Risk.
   *
   * Segments follow VDOT LRS route geometry (IS + US routes).
   * Falls back to route-name grouping + orientation sort when LRS is unavailable.
   *
   * @param {Array} interchanges - output from fetchWeightedWwdCrashPoints()
   * @returns {Promise<Array>} ranked segment objects
   */
  async function fetchSegmentWwdRisk(interchanges) {
    if (!interchanges || interchanges.length < 2) return [];

    // ── 1. Bounding box of all interchanges (+0.25° buffer) ───────────────────
    const lats = interchanges.map(ic => ic.lat);
    const lngs = interchanges.map(ic => ic.lng);
    const BUF  = 0.25;
    const minLat = Math.min(...lats) - BUF, maxLat = Math.max(...lats) + BUF;
    const minLng = Math.min(...lngs) - BUF, maxLng = Math.max(...lngs) + BUF;

    // ── 2a. Fetch VDOT Traffic Volume AADT (best-effort, parallel with LRS) ─────
    let aadtStations = [];
    try {
      aadtStations = await fetchVdotAadt(minLat, minLng, maxLat, maxLng);
      if (aadtStations.length) {
        console.log(`[Method 3] AADT: ${aadtStations.length} traffic count stations loaded`);
      }
    } catch (e) {
      console.warn('[Method 3] AADT fetch failed, using 45,000 default:', e.message);
    }

    // ── 2b. Fetch VDOT LRS IS + US route geometries (best-effort) ────────────
    let lrsRoutes = null;
    try {
      lrsRoutes = await _fetchLrsRoutes(minLat, minLng, maxLat, maxLng);
      if (lrsRoutes?.length) {
        console.log(`[Method 3] LRS: ${lrsRoutes.length} routes loaded for segment definition`);
      }
    } catch (e) {
      console.warn('[Method 3] LRS fetch failed, using orientation fallback:', e.message);
    }

    // ── 3. Assign each interchange to a route + compute route position ─────────
    const enriched = interchanges.map(ic => ({ ...ic, _rKey: null, _pos: 0 }));

    if (lrsRoutes?.length) {
      enriched.forEach(ic => {
        const hit = _assignToLrsRoute(ic, lrsRoutes);
        if (hit) {
          ic._rKey = hit.routeKey;
          ic._pos  = hit.posKm;
        } else {
          // Outside snap distance — fall back to topRoute name grouping
          ic._rKey = `fb:${ic.topRoute || 'unknown'}`;
          ic._pos  = ic.lng; // placeholder; corrected by orientation below
        }
      });
    } else {
      // No LRS — group by topRoute name
      enriched.forEach(ic => { ic._rKey = ic.topRoute || 'Unknown'; });
    }

    // ── 4. Group by route key; fix fallback positions using orientation ─────────
    const byRoute = {};
    enriched.forEach(ic => {
      const k = ic._rKey || 'Unknown';
      (byRoute[k] || (byRoute[k] = [])).push(ic);
    });

    Object.entries(byRoute).forEach(([key, group]) => {
      const needsOrient = !lrsRoutes || key.startsWith('fb:') || key === 'Unknown';
      if (needsOrient) {
        // Detect N-S vs E-W from coordinate spread and sort accordingly
        const latSpread = Math.max(...group.map(ic => ic.lat)) - Math.min(...group.map(ic => ic.lat));
        const lngSpread = Math.max(...group.map(ic => ic.lng)) - Math.min(...group.map(ic => ic.lng));
        const isNS = latSpread > lngSpread;
        group.forEach(ic => {
          ic._pos = isNS ? ic.lat * 111.0 : ic.lng * Math.cos(ic.lat * Math.PI / 180) * 111.0;
        });
      }
      group.sort((a, b) => a._pos - b._pos);
    });

    // ── 5. Create ~7-interchange segments per route ────────────────────────────
    const SEG_SIZE  = 7;
    const rawSegs   = [];
    Object.entries(byRoute).forEach(([routeKey, group]) => {
      let i = 0;
      while (i < group.length) {
        const remaining = group.length - i;
        // Absorb a trailing stub (< 3) into the current segment
        const take = (remaining - SEG_SIZE > 0 && remaining - SEG_SIZE < 3)
          ? remaining
          : Math.min(SEG_SIZE, remaining);
        rawSegs.push({ routeKey, interchanges: group.slice(i, i + take) });
        i += take;
      }
    });

    // ── 6. SPF tier thresholds (crashes / yr) ─────────────────────────────────
    const TIER_M3 = [
      { label: 'Critical', min: 2.0, color: '#67000D' },
      { label: 'High',     min: 1.0, color: '#CB181D' },
      { label: 'Moderate', min: 0.5, color: '#FB6A4A' },
      { label: 'Low',      min: 0.0, color: '#FCAE91' }
    ];

    // ── 7. Apply Box 2-3 SPF formula per segment ──────────────────────────────
    const results = rawSegs.map((rawSeg, idx) => {
      const seg        = rawSeg.interchanges;
      const studyYears = seg[0].studyYears || 5;
      const obsTotal   = seg.reduce((s, ic) => s + (ic.totalCrashes || 0), 0);
      const citations  = Math.max(1, obsTotal);
      const calls911   = Math.max(1, obsTotal * 3);

      // Use real VDOT AADT — snap segment centroid to nearest traffic count station
      const centLat = seg.reduce((s, ic) => s + ic.lat, 0) / seg.length;
      const centLng = seg.reduce((s, ic) => s + ic.lng, 0) / seg.length;
      const snapAadt    = aadtStations.length
        ? _snapToNearestAadt({ lat: centLat, lng: centLng }, aadtStations, 15)
        : null;
      const aadt        = snapAadt || 45000; // fall back to VA freeway default
      const aadtSource  = snapAadt ? 'VDOT' : 'default';

      // Segment length = sum of consecutive interchange distances (route-ordered)
      let segLenKm = 0;
      for (let i = 0; i < seg.length - 1; i++) {
        segLenKm += _hav(seg[i].lat, seg[i].lng, seg[i + 1].lat, seg[i + 1].lng);
      }
      const segLenMi = Math.max(0.5, segLenKm / 1.60934);

      let majorCount = 0, twoThreeCount = 0;
      seg.forEach(ic => {
        (ic.terminals || []).forEach((t, k) => {
          if (k === 0) majorCount++;
          else if (k <= 2) twoThreeCount++;
        });
      });
      const majorPerMi    = majorCount    / segLenMi;
      const twoThreePerMi = twoThreeCount / segLenMi;

      const spfExp = -0.453523
        + (-0.302024  * Math.log(citations))
        + ( 0.5865768 * Math.log(calls911))
        + (-1.062e-5  * aadt)
        + ( 1.4755753 * majorPerMi)
        + ( 2.4113643 * twoThreePerMi);

      const predicted4yr = Math.exp(spfExp);
      const predictedYr  = predicted4yr / 4;
      const observedYr   = obsTotal / studyYears;
      const totalRisk    = +(predictedYr + observedYr).toFixed(3);
      const tier         = TIER_M3.find(t => totalRisk >= t.min) || TIER_M3.at(-1);

      const topRoutes = [...new Set(
        seg.flatMap(ic => ic.allRoutes || [ic.topRoute]).filter(Boolean)
      )].slice(0, 4);

      // Prefer LRS route name; fall back to crash-record name
      const lrsRoute   = lrsRoutes?.find(r => r.routeKey === rawSeg.routeKey);
      const routeLabel = lrsRoute
        ? lrsRoute.rteName                   // VDOT LRS route code
        : (topRoutes[0] || rawSeg.routeKey); // crash-record name or key

      return {
        id:               `wwdm3-seg-${idx}`,
        lat:              +centLat.toFixed(6),
        lng:              +centLng.toFixed(6),
        interchanges:     seg,
        interchangeCount: seg.length,
        segLenMi:         +segLenMi.toFixed(2),
        routeKey:         rawSeg.routeKey,
        routeLabel,
        lrsMatched:       !!lrsRoute,
        citations,
        calls911,
        aadt,
        aadtSource,
        majorPerMi:       +majorPerMi.toFixed(3),
        twoThreePerMi:    +twoThreePerMi.toFixed(3),
        predicted4yr:     +predicted4yr.toFixed(3),
        predictedYr:      +predictedYr.toFixed(3),
        observedYr:       +observedYr.toFixed(3),
        totalRisk,
        obsTotal,
        studyYears,
        tier:             tier.label,
        tierColor:        tier.color,
        topRoutes
      };
    });

    // ── 8. Sort by totalRisk descending, assign ranks ─────────────────────────
    results.sort((a, b) => b.totalRisk - a.totalRisk);
    results.forEach((r, i) => { r.rank = i + 1; });

    return results;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  FHWA Network Screening Method 6 — Point-Based Interchange Scoring
  //
  //  Reference: FHWA Wrong-Way Driving Countermeasures Guide, Method 6 table
  //
  //  Scoring components:
  //    A. Crash History   0–75 pts  (fatal=75ea, non-fatal=5ea; cap: no explicit max)
  //    B. Noncrash Events 10 pts/event  (no public VDOT data → 0)
  //    C. Interchange Geometry  0–50 pts  (based on terminal count)
  //    D. Liquor License Proximity  0–10 pts  (no public data → 0)
  //    E. Mainline AADT Percentile  1–10 pts
  //    F. Side Road AADT Percentile  1–10 pts  (estimated at 7% of mainline)
  //    Bonus: Top 30% by raw score → +5 pts
  //
  //  Tier thresholds: Critical ≥100 · High ≥60 · Moderate ≥30 · Low <30
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Score AADT against VA freeway distribution (1–10 pts).
   * Approximate percentile breaks derived from statewide VDOT traffic volume data.
   */
  function _aadtPercentileScore(aadt) {
    if (aadt >= 100000) return 10;
    if (aadt >=  75000) return 9;
    if (aadt >=  60000) return 8;
    if (aadt >=  50000) return 7;
    if (aadt >=  40000) return 6;
    if (aadt >=  30000) return 5;
    if (aadt >=  20000) return 4;
    if (aadt >=  12000) return 3;
    if (aadt >=   5000) return 2;
    return 1;
  }

  /**
   * Geometry score (0–50) based on number of terminal clusters.
   * More terminals = more complex interchange = higher score.
   */
  function _geometryScore(terminalCount) {
    if (terminalCount >= 6) return 50;
    if (terminalCount === 5) return 45;
    if (terminalCount === 4) return 35;
    if (terminalCount === 3) return 25;
    if (terminalCount === 2) return 15;
    return 5; // 1 terminal
  }

  /**
   * Compute FHWA Method 6 — Point-Based Interchange Risk Scores.
   *
   * @param {Array} interchanges - output from fetchWeightedWwdCrashPoints()
   * @returns {Array} scored + ranked interchange objects
   */
  function computeMethod6Score(interchanges) {
    if (!interchanges || !interchanges.length) return [];

    const DEFAULT_MAINLINE_AADT = 45000; // typical VA freeway

    // ── 1. Compute raw scores (without top-30% bonus) ─────────────────────
    const rawScored = interchanges.map((ic, idx) => {
      // A. Crash History
      const fatalPts    = (ic.totalFatals  || 0) * 75;
      const nonFatals   = Math.max(0, (ic.totalCrashes || 0) - (ic.totalFatals || 0));
      const nonFatalPts = nonFatals * 5;
      const scoreA      = fatalPts + nonFatalPts;

      // B. Noncrash Events (no public VDOT data)
      const scoreB = 0;

      // C. Interchange Geometry
      const scoreC = _geometryScore(ic.terminalCount || 1);

      // D. Liquor License Proximity (no public data)
      const scoreD = 0;

      // E. Mainline AADT
      const mainlineAadt = DEFAULT_MAINLINE_AADT;
      const scoreE       = _aadtPercentileScore(mainlineAadt);

      // F. Side Road AADT (estimated at 7% of mainline)
      const sideAadt = mainlineAadt * 0.07;
      const scoreF   = _aadtPercentileScore(sideAadt);

      const rawScore = scoreA + scoreB + scoreC + scoreD + scoreE + scoreF;

      return {
        ...ic,
        m6: {
          scoreA, scoreB, scoreC, scoreD, scoreE, scoreF,
          rawScore,
          bonus:      0,
          totalScore: rawScore,
          mainlineAadt,
          sideAadt:   +sideAadt.toFixed(0),
        }
      };
    });

    // ── 2. Apply Top-30% bonus ────────────────────────────────────────────
    const sortedRaw = [...rawScored].sort((a, b) => b.m6.rawScore - a.m6.rawScore);
    const top30Cutoff = Math.max(1, Math.ceil(sortedRaw.length * 0.30));
    const top30Threshold = sortedRaw[top30Cutoff - 1]?.m6.rawScore ?? 0;

    rawScored.forEach(ic => {
      if (ic.m6.rawScore >= top30Threshold) {
        ic.m6.bonus      = 5;
        ic.m6.totalScore = ic.m6.rawScore + 5;
      }
    });

    // ── 3. Tier assignment ────────────────────────────────────────────────
    const TIER_M6 = [
      { label: 'Critical', min: 100, color: '#67000D' },
      { label: 'High',     min:  60, color: '#CB181D' },
      { label: 'Moderate', min:  30, color: '#FB6A4A' },
      { label: 'Low',      min:   0, color: '#FCAE91' }
    ];

    rawScored.forEach(ic => {
      const tier      = TIER_M6.find(t => ic.m6.totalScore >= t.min) || TIER_M6.at(-1);
      ic.m6.tier      = tier.label;
      ic.m6.tierColor = tier.color;
    });

    // ── 4. Sort by totalScore descending, assign ranks ────────────────────
    rawScored.sort((a, b) => b.m6.totalScore - a.m6.totalScore);
    rawScored.forEach((ic, i) => { ic.m6.rank = i + 1; });

    return rawScored;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  VDOT Traffic Volume — Real AADT for Methods 3 and 6
  //
  //  Queries VDOT_Bidirectional_Traffic_Volume (confirmed public).
  //  Falls back gracefully if the service is unavailable.
  // ══════════════════════════════════════════════════════════════════════════

  const TRAFFIC_VOL_URL =
    'https://services.arcgis.com/p5v98VHDX9Atv3l7/ArcGIS/rest/services' +
    '/Traffic_Volume_2021/FeatureServer/0/query';

  /**
   * Fetch VDOT traffic count stations within a bounding box.
   * Returns [{lat, lng, aadt}] — one entry per count station.
   * Handles both Point and LineString geometries gracefully.
   */
  async function fetchVdotAadt(minLat, minLng, maxLat, maxLng) {
    const params = new URLSearchParams({
      geometry:         `${minLng.toFixed(4)},${minLat.toFixed(4)},${maxLng.toFixed(4)},${maxLat.toFixed(4)}`,
      geometryType:     'esriGeometryEnvelope',
      spatialRel:       'esriSpatialRelIntersects',
      inSR:             '4326',
      outSR:            '4326',
      outFields:        'OBJECTID,AADT,CUR_AADT,AADT_2021,ADT,VOLUME,RTE_NM',
      returnGeometry:   'true',
      f:                'geojson',
      resultRecordCount:'2000'
    });

    const res = await fetch(`${TRAFFIC_VOL_URL}?${params}`);
    if (!res.ok) throw new Error(`Traffic Volume fetch: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(`ArcGIS: ${data.error.message}`);

    return (data.features || []).map(f => {
      const p = f.properties || {};
      const g = f.geometry   || {};
      // Pick AADT from whichever field exists
      const aadt = +(p.AADT || p.CUR_AADT || p.AADT_2021 || p.ADT || p.VOLUME || 0);
      if (!aadt) return null;
      // Representative point: Point → direct; LineString → midpoint
      let lat = null, lng = null;
      if (g.type === 'Point' && g.coordinates) {
        [lng, lat] = g.coordinates;
      } else if (g.type === 'LineString' && g.coordinates?.length) {
        const mid = Math.floor(g.coordinates.length / 2);
        [lng, lat] = g.coordinates[mid];
      } else if (g.type === 'MultiLineString' && g.coordinates?.length) {
        const seg = g.coordinates[Math.floor(g.coordinates.length / 2)];
        if (seg?.length) [lng, lat] = seg[Math.floor(seg.length / 2)];
      }
      return (lat && lng) ? { lat, lng, aadt } : null;
    }).filter(Boolean);
  }

  /**
   * Snap an interchange to its nearest AADT count station (within maxKm).
   * Returns the AADT value or null.
   */
  function _snapToNearestAadt(ic, stations, maxKm = 10) {
    let best = null, bestDist = maxKm;
    for (const st of stations) {
      const d = _hav(ic.lat, ic.lng, st.lat, st.lng);
      if (d < bestDist) { bestDist = d; best = st.aadt; }
    }
    return best;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  VDOT RwD PSI Layer — Pre-Computed Wrong-Way Driving PSI Rankings
  //
  //  Service: RwD_PSI_20_24, layer 1 (confirmed public, token not required)
  //  These are VDOT's own spatial PSI model results — different locations
  //  from our crash-cluster approach (Method 2/3/6).
  // ══════════════════════════════════════════════════════════════════════════

  const RWD_PSI_URL =
    'https://services.arcgis.com/p5v98VHDX9Atv3l7/ArcGIS/rest/services' +
    '/RwD_PSI_20_24/FeatureServer/1/query';

  /**
   * Fetch VDOT RwD PSI (2020-2024) locations.
   * Returns an array of scored route-segment objects.
   */
  async function fetchRwdPsiLayer() {
    const PAGE   = 1000;
    const all    = [];
    let   offset = 0;

    while (true) {
      const params = new URLSearchParams({
        where:             '1=1',
        outFields:         '*',
        returnGeometry:    'true',
        outSR:             '4326',
        f:                 'geojson',
        resultRecordCount: PAGE,
        resultOffset:      offset,
        orderByFields:     'OBJECTID'
      });
      const res = await fetch(`${RWD_PSI_URL}?${params}`);
      if (!res.ok) throw new Error(`RwD PSI fetch: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(`ArcGIS: ${data.error.message}`);
      const feats = data.features || [];
      all.push(...feats);
      if (feats.length < PAGE) break;
      offset += PAGE;
    }

    return all.map((f, i) => {
      const p = f.properties || {};
      const g = f.geometry   || {};

      // Flexible field name resolution (schema may vary by vintage)
      const rank     = p.PSI_RANK    || p.RANK       || p.RWD_RANK    || (i + 1);
      const score    = +(p.PSI_SCORE || p.SCORE      || p.RWD_SCORE   || 0);
      const route    = p.ROUTE_NAME  || p.RTE_NM     || p.ROUTE       || 'Unknown';
      const district = p.DISTRICT    || p.VDOT_DISTRICT               || '';
      const mpFrom   = p.BEGIN_MP    || p.FROM_MP    || p.BEG_MP      || null;
      const mpTo     = p.END_MP      || p.TO_MP      || null;

      // Extract representative point + full coordinates for rendering
      let lat = null, lng = null, coords = null;
      if (g.type === 'LineString' && g.coordinates?.length) {
        coords = g.coordinates.map(([x, y]) => [y, x]); // [lng,lat] → [lat,lng]
        const mid = g.coordinates[Math.floor(g.coordinates.length / 2)];
        [lng, lat] = mid;
      } else if (g.type === 'MultiLineString' && g.coordinates?.length) {
        coords = g.coordinates.flatMap(seg => seg.map(([x, y]) => [y, x]));
        const seg = g.coordinates[Math.floor(g.coordinates.length / 2)];
        if (seg?.length) [lng, lat] = seg[Math.floor(seg.length / 2)];
      } else if (g.type === 'Point' && g.coordinates) {
        [lng, lat] = g.coordinates;
        coords = [[lat, lng]];
      }

      if (!lat || !lng) return null;

      // Tier by PSI rank percentile — top-20% Critical, next-30% High, etc.
      let tier = 'Low', tierColor = '#FCAE91';
      if (rank <= 20)  { tier = 'Critical'; tierColor = '#67000D'; }
      else if (rank <= 50)  { tier = 'High';     tierColor = '#CB181D'; }
      else if (rank <= 100) { tier = 'Moderate'; tierColor = '#FB6A4A'; }

      return { id: `rwd-psi-${i}`, lat, lng, coords, rank, score, route, district,
               mpFrom, mpTo, tier, tierColor };
    }).filter(Boolean);
  }

  return { fetchProhibitedRoadways, fetchCurveDelineation, fetchFatalCrash,
           fetchFunctionalClassRamps, fetchWeightedWwdCrashPoints,
           fetchSegmentWwdRisk, computeMethod6Score,
           fetchRwdPsiLayer, fetchVdotAadt, _snapToNearestAadt };
})();
