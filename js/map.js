/**
 * map.js – Leaflet.js Map Module for WWD App
 * Handles base layers, incident markers, heatmap, cluster polygons
 */

const MapModule = (() => {

  let map = null;
  let markersLayer = null;
  let heatLayer = null;
  let riskPolygonsLayer = null;
  let wwdArcGisLayer = null;
  let wwdProhibitedLayer = null;
  let wwdCurveDelineationLayer = null;

  let wwdFcRampLayer = null;        // VDOT Functional Classification ramps
  let wwdMethod2Layer = null;       // FHWA Method 2 Weighted WWD Crash Entry Points
  let wwdMethod3Layer = null;       // FHWA Method 3 Segment-Level WWD Risk
  let wwdMethod6Layer = null;       // FHWA Method 6 Point-Based Interchange Risk Score
  let wwdRwdPsiLayer  = null;       // VDOT RwD PSI 20-24 — pre-computed PSI rankings
  let vaInterchangesLayer = null;   // VA Interchange type inventory (static dataset)
  let tigerCountiesLayer = null;
  let clickCallback = null;
  let countyClickCallback = null;
  let markerMap = {}; // id -> L.marker
  let _addIncidentMode = false;  // map-click → add incident only when this is true

  const SEVERITY_COLORS = {
    Fatal:      '#FF4757',
    Injury:     '#FFA502',
    PDO:        '#FFDD59',
    'Near-Miss':'#7BED9F'
  };

  const RISK_COLORS = {
    Critical: '#FF4757',
    High:     '#FFA502',
    Moderate: '#FFDD59',
    Low:      '#7BED9F'
  };

  /**
   * Initialize the Leaflet map
   */
  function init(containerId, onMapClick, onCountyClick) {
    clickCallback = onMapClick;
    countyClickCallback = onCountyClick;

    map = L.map(containerId, {
      center: [37.4316, -78.6569], // Virginia center
      zoom: 7,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // ── Base Layers ─────────────────────────────────────────────────────────
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    });

    const esriStreets = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 19
    });

    const esriSatellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 19
    });

    const cartoDark = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CARTO',
      maxZoom: 19
    });

    osm.addTo(map); // default base layer

    // ── Overlay Layers ───────────────────────────────────────────────────────
    tigerCountiesLayer = L.layerGroup().addTo(map); // Default active
    markersLayer = L.layerGroup().addTo(map);
    riskPolygonsLayer = L.layerGroup().addTo(map);
    wwdArcGisLayer           = L.layerGroup(); // Possible WWD crash points (ArcGIS)
    wwdProhibitedLayer       = L.layerGroup(); // VDOT Prohibited Roadways (ArcGIS)
    wwdCurveDelineationLayer = L.layerGroup(); // VDOT Curve Delineation (ArcGIS)

    wwdFcRampLayer           = L.layerGroup(); // VDOT Functional Classification Ramps
    wwdMethod2Layer          = L.layerGroup(); // FHWA Method 2 Weighted WWD Crash Entry Points
    wwdMethod3Layer          = L.layerGroup(); // FHWA Method 3 Segment-Level WWD Risk
    wwdMethod6Layer          = L.layerGroup(); // FHWA Method 6 Point-Based Interchange Risk Score
    wwdRwdPsiLayer           = L.layerGroup(); // VDOT RwD PSI 20-24
    vaInterchangesLayer      = L.layerGroup(); // VA Interchange Type Inventory

    // ── Layer Control ──────────────────────────────────────────────────────
    const baseLayers = {
      '🌑 Carto Dark': cartoDark,
      '🗺️ OSM Streets': osm,
      '🏙️ ESRI Streets': esriStreets,
      '🛰️ ESRI Satellite': esriSatellite
    };

    const overlays = {
      '🗺️ VA Counties': tigerCountiesLayer,
      '📍 Incidents': markersLayer,
      '🔴 Risk Zones': riskPolygonsLayer,
      '⚠️ Possible WWD Locations': wwdArcGisLayer,
      '🚫 Prohibited Roadways': wwdProhibitedLayer,
      '🔶 Curve Delineation': wwdCurveDelineationLayer,

      '🛣️ FC Ramps (VDOT)': wwdFcRampLayer,
      '⚖️ Weighted WWD Entry Points (Method 2)': wwdMethod2Layer,
      '📊 Segment WWD Risk (Method 3)': wwdMethod3Layer,
      '🎯 Interchange Risk Score (Method 6)': wwdMethod6Layer,
      '🚦 VDOT RwD PSI Rankings (2020-24)':  wwdRwdPsiLayer,
      '🔀 VA Interchange Types':             vaInterchangesLayer,
    };

    L.control.layers(baseLayers, overlays, { position: 'topright', collapsed: false }).addTo(map);

    // ── Scale bar ────────────────────────────────────────────────────────────
    L.control.scale({ imperial: true, metric: true }).addTo(map);

    // ── Map click → add incident (only when mode is active) ───────────────
    map.on('click', e => {
      if (_addIncidentMode && clickCallback) {
        clickCallback(e.latlng.lat, e.latlng.lng);
        // Auto-exit add mode after a single placement
        _addIncidentMode = false;
        const mapEl = document.getElementById('map-container');
        if (mapEl) mapEl.classList.remove('add-incident-mode');
      }
    });
    
    // Fetch and draw counties
    loadTigerWebCounties();
  }

  function loadTigerWebCounties() {
    const url = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2020/MapServer/82/query?where=STATE='51'&outFields=BASENAME,NAME,GEOID&outSR=4326&f=geojson";
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const geoJsonLayer = L.geoJSON(data, {
          style: {
            color: '#a78bfa',
            weight: 1.5,
            fillColor: '#8b5cf6',
            fillOpacity: 0.15,
            dashArray: '4 4'
          },
          onEachFeature: (feature, layer) => {
            // Optional tooltip on hover
            layer.bindTooltip(`<b>${feature.properties.NAME}</b>`, { sticky: true, className: 'county-tooltip' });
            
            layer.on('click', e => {
              L.DomEvent.stopPropagation(e);
              if (countyClickCallback) {
                // Return the true map coordinate clicked, plus the county name
                countyClickCallback(feature.properties.NAME, e.latlng.lat, e.latlng.lng);
              }
              // Update style to show selected
              geoJsonLayer.resetStyle();
              layer.setStyle({ fillColor: '#7c3aed', fillOpacity: 0.25, weight: 3, color: '#a78bfa', dashArray: null });
            });
          }
        });
        
        // Expose method to reset style globally
        tigerCountiesLayer.resetSelection = () => geoJsonLayer.resetStyle();
        
        tigerCountiesLayer.addLayer(geoJsonLayer);
      })
      .catch(err => console.error("TigerWeb fetch error:", err));
  }
  
  function clearCountySelection() {
    if(tigerCountiesLayer && tigerCountiesLayer.resetSelection) {
      tigerCountiesLayer.resetSelection();
    }
  }

  /**
   * Render all incident markers
   */
  function renderMarkers(incidents) {
    markersLayer.clearLayers();
    markerMap = {};

    incidents.forEach(inc => {
      const color = SEVERITY_COLORS[inc.severity] || '#FFFFFF';
      const marker = L.circleMarker([inc.lat, inc.lng], {
        radius: inc.severity === 'Fatal' ? 10 : inc.severity === 'Injury' ? 8 : 6,
        fillColor: color,
        color: '#fff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.85
      });

      marker.bindPopup(buildPopup(inc), { maxWidth: 320 });
      marker.on('click', e => {
        e.originalEvent.stopPropagation();
        highlightRow(inc.id);
      });

      markersLayer.addLayer(marker);
      markerMap[inc.id] = marker;
    });
  }

  /**
   * Render heatmap from incidents
   */
  function renderHeatmap(incidents) {
    if (heatLayer) {
      map.removeLayer(heatLayer);
      heatLayer = null;
    }

    if (!incidents || incidents.length === 0) return; // Prevent Leaflet heat crashes on empty data

    const points = incidents.map(inc => {
      let intensity = 0.3;
      if (inc.severity === 'Fatal') intensity = 1.0;
      else if (inc.severity === 'Injury') intensity = 0.7;
      else if (inc.severity === 'PDO') intensity = 0.4;
      return [inc.lat, inc.lng, intensity];
    });

    if (typeof L.heatLayer !== 'undefined') {
      heatLayer = L.heatLayer(points, {
        radius: 35,
        blur: 20,
        maxZoom: 12,
        gradient: { 0.2: '#2ED573', 0.4: '#FFDD59', 0.6: '#FFA502', 0.8: '#FF6B6B', 1.0: '#FF4757' }
      }).addTo(map);
    }
  }

  /**
   * Render risk zone circles from clusters
   */
  function renderRiskZones(clusters) {
    riskPolygonsLayer.clearLayers();

    clusters.forEach(cl => {
      const color = RISK_COLORS[cl.riskLevel] || '#FFFFFF';
      L.circle([cl.lat, cl.lng], {
        radius: 800,
        color: color,
        fillColor: color,
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6 4'
      })
      .bindPopup(buildClusterPopup(cl), { maxWidth: 360 })
      .addTo(riskPolygonsLayer);
    });
  }

  /**
   * Build HTML popup for an incident
   */
  function buildPopup(inc) {
    const color = SEVERITY_COLORS[inc.severity] || '#fff';
    const date = new Date(inc.dateTime).toLocaleString('en-US', { dateStyle:'medium', timeStyle:'short'});
    return `
      <div class="popup-card">
        <div class="popup-header" style="border-left:4px solid ${color}">
          <span class="popup-id">${inc.id}</span>
          <span class="popup-sev sev-${inc.severity.toLowerCase().replace('-','')}">${inc.severity}</span>
        </div>
        <div class="popup-body">
          <div class="popup-row"><span>📍</span> <b>${inc.road}</b> — ${inc.municipality}</div>
          <div class="popup-row"><span>📅</span> ${date}</div>
          <div class="popup-row"><span>🚗</span> ${inc.vehiclesInvolved} vehicle(s) | ${inc.rampType}</div>
          <div class="popup-row"><span>🌙</span> ${inc.timeCategory} | ${inc.lightingCondition}</div>
          <div class="popup-row"><span>🍺</span> Alcohol: ${inc.alcoholInvolved ? '✅ Yes' : '❌ No'}</div>
          <div class="popup-row"><span>🛡️</span> ${inc.countermeasures?.length ? inc.countermeasures.join(', ') : 'None'}</div>
          ${inc.notes ? `<div class="popup-notes">"${inc.notes}"</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render Possible WWD Locations from ArcGIS (head-on on divided ramps)
   */
  function renderWwdArcGisMarkers(features) {
    if (!wwdArcGisLayer) return;
    wwdArcGisLayer.clearLayers();

    (features || []).forEach(f => {
      if (f.lat == null || f.lng == null) return;
      const isFatal = (f.kPeople || 0) > 0 || f.severity === 'Fatal';
      const marker = L.circleMarker([f.lat, f.lng], {
        radius: isFatal ? 9 : 7,
        fillColor: isFatal ? '#FF4757' : '#FFA502',
        color: '#fff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.9,
        className: 'wwd-arcgis-marker'
      });
      marker.bindPopup(buildWwdArcGisPopup(f), { maxWidth: 340 });
      wwdArcGisLayer.addLayer(marker);
    });
  }

  /**
   * Build HTML popup for ArcGIS possible WWD location
   */
  function buildWwdArcGisPopup(f) {
    const sev = f.severity || 'Unknown';
    const dateStr = f.crashDate ? new Date(f.crashDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—';
    const timeStr = f.crashTime || '—';
    return `
      <div class="popup-card popup-wwd-arcgis">
        <div class="popup-header" style="border-left:4px solid #FFA502">
          <span class="popup-id">Possible WWD</span>
          <span class="popup-sev">Head-On @ Ramp</span>
        </div>
        <div class="popup-body">
          <div class="popup-row"><span>📍</span> <b>${escapeHtml(f.road)}</b></div>
          <div class="popup-row"><span>🏛️</span> ${escapeHtml(f.municipality)}</div>
          <div class="popup-row"><span>📅</span> ${dateStr} ${timeStr}</div>
          <div class="popup-row"><span>🚨</span> Severity: ${sev} ${(f.kPeople || 0) > 0 ? ` | 💀 ${f.kPeople} Fatal` : ''}</div>
          <div class="popup-row"><span>🚗</span> ${f.vehiclesInvolved || 1} vehicle(s)</div>
          <div class="popup-row"><span>🍺</span> Alcohol: ${f.alcoholInvolved ? 'Yes' : 'No'} | 🌙 Night: ${f.night ? 'Yes' : 'No'}</div>
          <div class="popup-row popup-source"><small>Source: VDOT ArcGIS Crash Data</small></div>
        </div>
      </div>
    `;
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // ── Popup attribute helpers ──────────────────────────────────────────────
  const FRIENDLY_FIELDS = {
    OBJECTID: 'Object ID', FID: 'FID',
    RTE_NM: 'Route Name', RTE_COMMON: 'Common Name', RTE_CATEGO: 'Route Category',
    RTE_JURIS_: 'Jurisdiction', FROM_JURIS: 'From Jurisdiction', TO_JURISDI: 'To Jurisdiction',
    FUNC_CLASS: 'Functional Class', FUNCTIONAL_CLASS: 'Functional Class',
    FC_CODE: 'FC Code', FC: 'Functional Class',
    COUNTY: 'County', COUNTY_CODE: 'County Code', CTY_CODE: 'County Code',
    BMP: 'Begin Milepost', EMP: 'End Milepost', MILEPOST: 'Milepost', MP: 'Milepost',
    INTERSECTION_ID: 'Intersection ID', INT_ID: 'Intersection ID',
    DISTRICT: 'District', DISTRICT_N: 'District Name', ADMIN_DIST: 'Admin District',
    LRS_DATE: 'LRS Date', ROUTE_TYPE: 'Route Type', SEC_RT_NM: 'Secondary Route',
    Shape__Length: 'Shape Length (ft)', GlobalID: 'Global ID'
  };

  const SKIP_ATTRS = new Set([
    'OBJECTID', 'FID', 'objectid', 'GlobalID', 'Shape__Length',
    'Shape__Area', 'Shape', 'created_user', 'created_date',
    'last_edited_user', 'last_edited_date', 'ST_Length(Shape)'
  ]);

  function formatFieldName(key) {
    return FRIENDLY_FIELDS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function buildAttrRows(attrs) {
    if (!attrs || !Object.keys(attrs).length) {
      return '<span class="popup-no-attrs">No attributes available</span>';
    }
    const rows = Object.entries(attrs)
      .filter(([k, v]) => !SKIP_ATTRS.has(k) && v != null && String(v).trim() !== '')
      .map(([k, v]) => `
        <span class="popup-attr-key">${escapeHtml(formatFieldName(k))}</span>
        <span class="popup-attr-val">${escapeHtml(String(v))}</span>`)
      .join('');
    return rows || '<span class="popup-no-attrs">No additional attributes</span>';
  }

  /**
   * Render Prohibited Roadways polylines from ArcGIS
   */
  function renderProhibitedRoadways(features) {
    if (!wwdProhibitedLayer) return;
    wwdProhibitedLayer.clearLayers();

    (features || []).forEach(f => {
      (f.coordinates || []).forEach(path => {
        if (!path || path.length < 2) return;
        const line = L.polyline(path, {
          color: '#A55EEA',
          weight: 2.5,
          opacity: 0.9,
          className: 'wwd-prohibited'
        });
        line.bindPopup(buildProhibitedPopup(f), { maxWidth: 340 });
        wwdProhibitedLayer.addLayer(line);
      });
    });
  }

  function buildProhibitedPopup(feature) {
    const mapped = feature.attrs || {};
    const raw    = feature.raw   || {};
    const name   = mapped.routeCommon || mapped.routeName || raw.RTE_COMMON || raw.RTE_NM || 'Prohibited Roadway';
    const displayAttrs = Object.keys(raw).length ? raw : {
      RTE_NM:      mapped.routeName,
      RTE_COMMON:  mapped.routeCommon,
      RTE_CATEGO:  mapped.routeCategory,
      RTE_JURIS_:  mapped.jurisdiction,
      FROM_JURIS:  mapped.fromJuris,
      TO_JURISDI:  mapped.toJuris
    };
    return `
      <div class="popup-card popup-rich">
        <div class="popup-header" style="border-left:4px solid #A55EEA">
          <span class="popup-id">🚫 Prohibited Roadway</span>
        </div>
        <div class="popup-body">
          <div class="popup-title">${escapeHtml(name)}</div>
          <div class="popup-attr-table">${buildAttrRows(displayAttrs)}</div>
          <div class="popup-source-row">Source: VDOT Prohibited Roadways – No Ramp (ArcGIS)</div>
        </div>
      </div>
    `;
  }

  /**
   * Render VDOT Curve Delineation features from ArcGIS
   */
  function renderCurveDelineation(features) {
    if (!wwdCurveDelineationLayer) return;
    wwdCurveDelineationLayer.clearLayers();

    (features || []).forEach(f => {
      let layer;
      if (f.coordinates && f.coordinates.length >= 2) {
        layer = L.polyline(f.coordinates, {
          color: '#FF6348',
          weight: 2.5,
          opacity: 0.9,
          dashArray: '6 3',
          className: 'wwd-curve-delineation'
        });
      } else if (f.lat != null && f.lng != null) {
        layer = L.circleMarker([f.lat, f.lng], {
          radius: 5,
          color: '#FF6348',
          fillColor: '#FF6348',
          fillOpacity: 0.8,
          weight: 1.5,
          className: 'wwd-curve-delineation'
        });
      }
      if (!layer) return;
      layer.bindPopup(buildCurveDelineationPopup(f), { maxWidth: 340 });
      wwdCurveDelineationLayer.addLayer(layer);
    });
  }

  function buildCurveDelineationPopup(f) {
    const name = f.name || `Curve Feature ${f.objectId ?? 'N/A'}`;
    return `
      <div class="popup-card popup-rich">
        <div class="popup-header" style="border-left:4px solid #FF6348">
          <span class="popup-id">🔶 Curve Delineation</span>
          <span class="popup-badge">ID: ${f.objectId ?? 'N/A'}</span>
        </div>
        <div class="popup-body">
          <div class="popup-title">${escapeHtml(name)}</div>
          <div class="popup-attr-table">${buildAttrRows(f.attrs)}</div>
          <div class="popup-source-row">Source: VDOT Curve Delineation (ArcGIS)</div>
        </div>
      </div>
    `;
  }

  /**
   * Build HTML popup for a risk cluster
   */
  function buildClusterPopup(cl) {
    const color = RISK_COLORS[cl.riskLevel];
    const recs = cl.recommendations?.slice(0, 3) || [];
    return `
      <div class="popup-card">
        <div class="popup-header" style="border-left:4px solid ${color}">
          <span class="popup-id">Risk Zone</span>
          <span class="popup-sev" style="background:${color}">${cl.riskLevel} — ${cl.riskScore}/100</span>
        </div>
        <div class="popup-body">
          <div class="popup-row"><b>${cl.road || cl.routeNumber}</b> — ${cl.municipality}</div>
          <div class="popup-row">🔢 ${cl.incidents.length} incident(s) clustered</div>
          ${recs.map(r => `<div class="popup-row">• ${r.icon} ${r.type} (${r.priority})</div>`).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Flash/highlight a marker by incident ID
   */
  function focusMarker(id) {
    const marker = markerMap[id];
    if (marker) {
      map.flyTo(marker.getLatLng(), 14, { animate: true, duration: 0.8 });
      setTimeout(() => marker.openPopup(), 900);
    }
  }

  /**
   * Dummy row highlight trigger (wired in inventory.js)
   */
  let highlightRowHandler = () => {};
  function setHighlightRowHandler(fn) { highlightRowHandler = fn; }
  function highlightRow(id) { highlightRowHandler(id); }

  /**
   * Add a single temporary pin (for add-incident form)
   */
  let tempMarker = null;
  function setTempPin(lat, lng) {
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker([lat, lng], {
      icon: L.divIcon({ className: 'temp-pin-icon', html: '📌', iconSize: [24, 24], iconAnchor: [12, 24] })
    }).addTo(map);
  }

  function clearTempPin() {
    if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
  }

  function getMap() { return map; }


  /**
   * Render VDOT Functional Classification ramp polylines.
   * Coordinates already in WGS84 (fetched via f=geojson from ArcGIS).
   */
  function renderFcRamps(features) {
    if (!wwdFcRampLayer) return;
    wwdFcRampLayer.clearLayers();
    features.forEach(f => {
      if (!f.coordinates || f.coordinates.length < 2) return;
      const line = L.polyline(f.coordinates, {
        color:   '#E67E22',   // amber – distinct from other layers
        weight:  2,
        opacity: 0.8
      });
      line.bindPopup(`
        <div class="popup-content">
          <div class="popup-title">🛣️ FC Ramp</div>
          <div class="popup-row"><span>Route</span>${f.attrs.routeName  || 'N/A'}</div>
          <div class="popup-row"><span>Class</span>${f.attrs.functClass || 'N/A'}</div>
          <div class="popup-row"><span>Category</span>${f.attrs.category || 'N/A'}</div>
          <div class="popup-source-row">Source: VDOT Functional Classification – FeatureServer/2</div>
        </div>`);
      wwdFcRampLayer.addLayer(line);
    });
  }

  function showFcRampLayer() {
    if (wwdFcRampLayer && map && !map.hasLayer(wwdFcRampLayer)) map.addLayer(wwdFcRampLayer);
  }

  // ── FHWA Method 2 — Weighted WWD Crash Entry Points ───────────────────────

  /**
   * Render Method 2 interchange markers.
   * Each marker is a circle scaled by weightedSum, coloured by tier.
   */
  function renderWeightedWwdLayer(interchanges) {
    if (!wwdMethod2Layer) return;
    wwdMethod2Layer.clearLayers();

    interchanges.forEach(ic => {
      if (ic.lat == null || ic.lng == null) return;

      // Radius proportional to weighted sum (min 8 px, max 22 px)
      const radius = Math.min(22, Math.max(8, 8 + ic.weightedSum * 5));

      const marker = L.circleMarker([ic.lat, ic.lng], {
        radius,
        color:       ic.tierColor || '#BD0026',
        fillColor:   ic.tierColor || '#BD0026',
        fillOpacity: 0.82,
        weight:      2,
        opacity:     1,
        className:   'wwd-method2-marker'
      });

      // Build terminals table for popup
      const termRows = (ic.terminals || []).map(t => `
        <tr>
          <td style="padding:2px 6px">${t.entryType}</td>
          <td style="padding:2px 6px;text-align:center">${t.weight.toFixed(1)}</td>
          <td style="padding:2px 6px;text-align:center">${t.crashes}</td>
          <td style="padding:2px 6px;opacity:.7">${(t.routes||[]).join(', ') || '—'}</td>
        </tr>`).join('');

      marker.bindPopup(`
        <div class="popup-card popup-rich" style="min-width:300px">
          <div class="popup-header" style="border-left:4px solid ${ic.tierColor}">
            <span class="popup-id">⚖️ Method 2 — Weighted WWD Entry Points</span>
            <span class="popup-badge" style="background:${ic.tierColor}">#${ic.rank} ${ic.tier}</span>
          </div>
          <div class="popup-body">
            <div class="popup-title">${escapeHtml(ic.topRoute) || 'Interchange'}</div>
            <div class="popup-attr-table">
              <div class="popup-row"><span>Weighted Entry Points</span><b>${ic.weightedSum.toFixed(2)}</b></div>
              <div class="popup-row"><span>Crash Rate CR<sub>int</sub></span><b>${ic.crashRate} / 100 int · yr</b></div>
              <div class="popup-row"><span>Total Crashes</span>${ic.totalCrashes}</div>
              <div class="popup-row"><span>Terminal Count</span>${ic.terminalCount}</div>
              <div class="popup-row"><span>Study Period</span>${ic.studyYears} yr</div>
              <div class="popup-row"><span>VDOT District</span>${escapeHtml(ic.district) || '—'}</div>
            </div>
            <div style="margin-top:8px;font-size:11px;color:var(--text-muted,#888)">Entry point breakdown</div>
            <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:4px">
              <thead><tr style="color:var(--text-muted,#888)">
                <th style="text-align:left;padding:2px 6px">Type</th>
                <th style="padding:2px 6px">W</th>
                <th style="padding:2px 6px">Crashes</th>
                <th style="padding:2px 6px">Route(s)</th>
              </tr></thead>
              <tbody>${termRows}</tbody>
            </table>
            <div class="popup-source-row" style="margin-top:8px">
              Source: VDOT Full_Crash (Head-On / Divided Hwy / Ramp) · FHWA Method 2 (Box 2-2)
            </div>
          </div>
        </div>`, { maxWidth: 380 });

      marker.bindTooltip(
        `<b>#${ic.rank}</b> ${ic.tier} — Weighted: ${ic.weightedSum.toFixed(2)} | ${ic.totalCrashes} crashes`,
        { sticky: true }
      );
      wwdMethod2Layer.addLayer(marker);

      // ── Terminal sub-markers (individual ramp cluster positions) ─────────
      // These are the specific ramp-level locations within the interchange,
      // more precise than the interchange centroid dot above.
      (ic.terminals || []).forEach((t, k) => {
        if (t.lat == null || t.lng == null) return;
        const tColor = k === 0 ? '#fff' : (k === 1 ? '#fed976' : '#fd8d3c');
        const tMarker = L.circleMarker([t.lat, t.lng], {
          radius:      5,
          color:       ic.tierColor,
          fillColor:   tColor,
          fillOpacity: 1,
          weight:      1.5,
          className:   'wwd-terminal-pin'
        });
        tMarker.bindTooltip(
          `${t.entryType} · ${t.crashes} crash${t.crashes !== 1 ? 'es' : ''} · W=${t.weight.toFixed(1)}`,
          { sticky: true }
        );
        wwdMethod2Layer.addLayer(tMarker);
      });
    });
  }

  function showWeightedWwdLayer() {
    if (wwdMethod2Layer && map && !map.hasLayer(wwdMethod2Layer)) map.addLayer(wwdMethod2Layer);
  }

  // ── FHWA Method 3 — Segment-Level WWD Risk ────────────────────────────────

  /**
   * Render Method 3 segment markers and corridor polylines.
   * Each segment is displayed as:
   *   • A polyline connecting its interchange centroids (colored by tier)
   *   • A circle marker at the segment centroid (popup with SPF breakdown)
   */
  function renderMethod3Layer(segments) {
    if (!wwdMethod3Layer) return;
    wwdMethod3Layer.clearLayers();

    segments.forEach(seg => {
      if (!seg.interchanges || !seg.interchanges.length) return;

      // Sort interchanges west→east for a coherent polyline
      const pts = [...seg.interchanges].sort((a, b) => a.lng - b.lng);
      const latlngs = pts.map(ic => [ic.lat, ic.lng]);

      // ── Corridor polyline (PRIMARY visual — popup lives here) ────────────
      if (latlngs.length >= 2) {
        const lrsTag = seg.lrsMatched
          ? '<span style="color:#2ecc71;font-size:10px;margin-left:4px">✓ VDOT LRS</span>'
          : '<span style="color:#888;font-size:10px;margin-left:4px">(name fallback)</span>';

        L.polyline(latlngs, {
          color:     seg.tierColor,
          weight:    seg.tier === 'Critical' ? 9 : 7,
          opacity:   0.78,
          dashArray: seg.tier === 'Critical' ? null : '12 5',
          className: 'wwd-method3-segment'
        })
        .bindPopup(`
          <div class="popup-card popup-rich" style="min-width:330px">
            <div class="popup-header" style="border-left:4px solid ${seg.tierColor}">
              <span class="popup-id">📊 Method 3 — Segment WWD Risk</span>
              <span class="popup-badge" style="background:${seg.tierColor}">#${seg.rank} ${seg.tier}</span>
            </div>
            <div class="popup-body">
              <div class="popup-title">
                ${escapeHtml(seg.routeLabel || (seg.topRoutes || []).join(', ') || 'Freeway Segment')}
                ${lrsTag}
              </div>
              <div class="popup-attr-table">
                <div class="popup-row">
                  <span>Total Risk (crashes/yr)</span>
                  <b style="color:${seg.tierColor}">${seg.totalRisk.toFixed(3)}</b>
                </div>
                <div class="popup-row"><span>Predicted SPF (crashes/yr)</span>${seg.predictedYr.toFixed(3)}</div>
                <div class="popup-row"><span>Observed (crashes/yr)</span>${seg.observedYr.toFixed(3)}</div>
                <div class="popup-row"><span>Observed Total (${seg.studyYears} yr)</span>${seg.obsTotal}</div>
                <div class="popup-row"><span>Segment Length</span>${seg.segLenMi.toFixed(1)} mi</div>
                <div class="popup-row"><span>Interchanges in Segment</span>${seg.interchangeCount}</div>
                <div class="popup-row"><span>VDOT Route Key</span>${escapeHtml(seg.routeKey || '—')}</div>
              </div>
              <div style="margin-top:8px;font-size:11px;color:var(--text-muted,#888)">
                SPF Input Variables (Box 2-3)
              </div>
              <div class="popup-attr-table" style="margin-top:4px">
                <div class="popup-row"><span>Citations (proxy = crashes)</span>${seg.citations}</div>
                <div class="popup-row"><span>911 Calls (proxy = 3×)</span>${seg.calls911}</div>
                <div class="popup-row"><span>AADT${seg.aadtSource ? ' (VDOT)' : ' (VA default)'}</span>${seg.aadt.toLocaleString()}</div>
                <div class="popup-row"><span>Major Directional/mi</span>${seg.majorPerMi.toFixed(3)}</div>
                <div class="popup-row"><span>2-to-3-Leg Directional/mi</span>${seg.twoThreePerMi.toFixed(3)}</div>
                <div class="popup-row"><span>Predicted (4-yr SPF)</span>${seg.predicted4yr.toFixed(3)} crashes</div>
              </div>
              <div class="popup-source-row" style="margin-top:8px">
                Source: VDOT Full_Crash + LRS Route Master · FHWA Method 3 SPF (Box 2-3)
              </div>
            </div>
          </div>`, { maxWidth: 430 })
        .bindTooltip(
          `<b>Seg #${seg.rank}</b> (${seg.tier}) — ${seg.totalRisk.toFixed(2)} crashes/yr · ${seg.segLenMi.toFixed(1)} mi · ${seg.interchangeCount} interchanges`,
          { sticky: true }
        )
        .addTo(wwdMethod3Layer);
      }

      // ── Small rank label at segment midpoint ─────────────────────────────
      // Replaces the large centroid dot — just a tiny numbered badge so segments
      // are identifiable without cluttering the same spots as Method 2.
      const midIc = seg.interchanges[Math.floor(seg.interchanges.length / 2)];
      if (midIc) {
        const labelIcon = L.divIcon({
          className: '',
          html: `<div style="
            background:${seg.tierColor};color:#fff;font-size:10px;font-weight:700;
            width:20px;height:20px;border-radius:50%;display:flex;align-items:center;
            justify-content:center;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.5);
          ">${seg.rank}</div>`,
          iconSize:   [20, 20],
          iconAnchor: [10, 10]
        });
        wwdMethod3Layer.addLayer(L.marker([midIc.lat, midIc.lng], { icon: labelIcon, interactive: false }));
      }
    });
  }

  function showMethod3Layer() {
    if (wwdMethod3Layer && map && !map.hasLayer(wwdMethod3Layer)) map.addLayer(wwdMethod3Layer);
  }

  // ── FHWA Method 6 — Point-Based Interchange Risk Score ───────────────────
  /**
   * Render Method 6 scored interchanges as circle markers.
   * Marker size ∝ totalScore; color = tier color.
   * Popup shows full score breakdown (A–F components + bonus).
   */
  function renderMethod6Layer(interchanges) {
    if (!wwdMethod6Layer) return;
    wwdMethod6Layer.clearLayers();

    interchanges.forEach(ic => {
      if (ic.lat == null || ic.lng == null || !ic.m6) return;
      const m6 = ic.m6;

      const radius = Math.max(8, Math.min(32, 8 + m6.totalScore / 8));

      const marker = L.circleMarker([ic.lat, ic.lng], {
        radius,
        fillColor:   m6.tierColor,
        color:       '#fff',
        weight:      2,
        opacity:     0.9,
        fillOpacity: 0.8
      });

      // ── Fatal badge overlay (star if interchange has fatals) ────────────
      if (ic.hasFatal) {
        const icon = L.divIcon({
          className: '',
          html: `<div style="font-size:13px;line-height:1;text-align:center;margin-top:-6px">⭐</div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        wwdMethod6Layer.addLayer(L.marker([ic.lat, ic.lng], { icon, interactive: false }));
      }

      // ── Rich popup ───────────────────────────────────────────────────────
      const routeStr   = (ic.allRoutes || [ic.topRoute]).join(', ') || 'Unknown';
      const fatalBadge = ic.hasFatal
        ? `<span style="background:#67000D;color:#fff;padding:1px 5px;border-radius:3px;font-size:11px">⭐ ${ic.totalFatals} FATAL</span>`
        : '';

      marker.bindPopup(`
        <div class="popup-card popup-rich" style="min-width:320px">
          <div class="popup-header" style="border-left:4px solid ${m6.tierColor}">
            <span class="popup-id">🎯 Method 6 — Interchange Risk Score</span>
            <span class="popup-badge" style="background:${m6.tierColor}">#${m6.rank} ${m6.tier}</span>
          </div>
          <div class="popup-body">
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
              <span class="popup-tag" style="background:#1a1a2e">📍 ${ic.district || 'Unknown District'}</span>
              <span class="popup-tag" style="background:#16213e">🛣️ ${routeStr}</span>
              ${fatalBadge}
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <tr style="background:#0a0a1a">
                <th style="padding:4px 6px;text-align:left;color:#aaa">Component</th>
                <th style="padding:4px 6px;text-align:right;color:#aaa">Score</th>
                <th style="padding:4px 6px;text-align:left;color:#aaa">Note</th>
              </tr>
              <tr><td style="padding:3px 6px">A. Crash History</td>
                  <td style="padding:3px 6px;text-align:right"><b>${m6.scoreA}</b></td>
                  <td style="padding:3px 6px;color:#888">${ic.totalFatals||0} fatal × 75 + ${Math.max(0,(ic.totalCrashes||0)-(ic.totalFatals||0))} non-fatal × 5</td></tr>
              <tr><td style="padding:3px 6px">B. Noncrash Events</td>
                  <td style="padding:3px 6px;text-align:right"><b>${m6.scoreB}</b></td>
                  <td style="padding:3px 6px;color:#888">No public VDOT data</td></tr>
              <tr><td style="padding:3px 6px">C. Interchange Geometry</td>
                  <td style="padding:3px 6px;text-align:right"><b>${m6.scoreC}</b></td>
                  <td style="padding:3px 6px;color:#888">${ic.terminalCount} terminal${ic.terminalCount !== 1 ? 's' : ''}</td></tr>
              <tr><td style="padding:3px 6px">D. Liquor Proximity</td>
                  <td style="padding:3px 6px;text-align:right"><b>${m6.scoreD}</b></td>
                  <td style="padding:3px 6px;color:#888">No public data</td></tr>
              <tr><td style="padding:3px 6px">E. Mainline AADT</td>
                  <td style="padding:3px 6px;text-align:right"><b>${m6.scoreE}</b></td>
                  <td style="padding:3px 6px;color:#888">${m6.mainlineAadt.toLocaleString()} vpd (default)</td></tr>
              <tr><td style="padding:3px 6px">F. Side Road AADT</td>
                  <td style="padding:3px 6px;text-align:right"><b>${m6.scoreF}</b></td>
                  <td style="padding:3px 6px;color:#888">~${m6.sideAadt.toLocaleString()} vpd (est. 7%)</td></tr>
              <tr style="border-top:1px solid #333">
                <td style="padding:4px 6px"><b>Raw Score</b></td>
                <td style="padding:4px 6px;text-align:right"><b>${m6.rawScore}</b></td>
                <td style="padding:4px 6px;color:#888"></td></tr>
              <tr><td style="padding:3px 6px">Top-30% Bonus</td>
                  <td style="padding:3px 6px;text-align:right">${m6.bonus > 0 ? `+${m6.bonus}` : '—'}</td>
                  <td style="padding:3px 6px;color:#888">${m6.bonus > 0 ? 'In top 30% statewide' : ''}</td></tr>
              <tr style="background:#1a1a2e;border-top:1px solid #555">
                <td style="padding:5px 6px"><b>TOTAL SCORE</b></td>
                <td style="padding:5px 6px;text-align:right;font-size:15px;color:${m6.tierColor}"><b>${m6.totalScore}</b></td>
                <td style="padding:5px 6px"></td></tr>
            </table>
            <div style="margin-top:6px;font-size:11px;color:#777">
              Method 2 data: ${ic.totalCrashes} crashes · ${ic.studyYears}yr study · weighted ${ic.weightedSum}
            </div>
          </div>
        </div>`, { maxWidth: 380 }
      );

      marker.bindTooltip(
        `<b>#${m6.rank}</b> ${m6.tier} — Score: ${m6.totalScore} | ${ic.totalCrashes} crashes`,
        { sticky: true }
      );

      wwdMethod6Layer.addLayer(marker);
    });
  }

  function showMethod6Layer() {
    if (wwdMethod6Layer && map && !map.hasLayer(wwdMethod6Layer)) map.addLayer(wwdMethod6Layer);
  }

  // ── VDOT RwD PSI 2020-24 — Pre-Computed Spatial PSI Rankings ────────────
  /**
   * Render VDOT RwD PSI features.
   *  • Polyline segments colored by tier (distinct from crash-cluster methods)
   *  • Small rank badge at segment midpoint
   *  • Popup shows PSI rank, score, route, milepost range, district
   */
  function renderRwdPsiLayer(features) {
    if (!wwdRwdPsiLayer) return;
    wwdRwdPsiLayer.clearLayers();

    features.forEach(f => {
      if (f.lat == null || f.lng == null) return;

      // ── Route polyline ────────────────────────────────────────────────────
      if (f.coords && f.coords.length >= 2) {
        L.polyline(f.coords, {
          color:     f.tierColor,
          weight:    6,
          opacity:   0.75,
          dashArray: f.tier === 'Critical' ? null : (f.tier === 'High' ? '8 4' : '4 4'),
          className: 'wwd-rwd-psi-line'
        })
        .bindPopup(`
          <div class="popup-card popup-rich" style="min-width:300px">
            <div class="popup-header" style="border-left:4px solid ${f.tierColor}">
              <span class="popup-id">🚦 VDOT RwD PSI 2020-24</span>
              <span class="popup-badge" style="background:${f.tierColor}">#${f.rank} ${f.tier}</span>
            </div>
            <div class="popup-body">
              <div class="popup-title">${escapeHtml(f.route)}</div>
              <div class="popup-attr-table">
                <div class="popup-row"><span>PSI Rank</span><b>${f.rank}</b></div>
                <div class="popup-row"><span>PSI Score</span><b>${f.score.toFixed ? f.score.toFixed(3) : f.score}</b></div>
                <div class="popup-row"><span>VDOT District</span>${escapeHtml(f.district) || '—'}</div>
                ${f.mpFrom != null ? `<div class="popup-row"><span>Milepost Range</span>${(+f.mpFrom).toFixed(2)} – ${(+f.mpTo||+f.mpFrom).toFixed(2)}</div>` : ''}
              </div>
              <div class="popup-source-row" style="margin-top:8px">
                Source: VDOT RwD_PSI_20_24 · VDOT spatial PSI model (not crash-cluster based)
              </div>
            </div>
          </div>`, { maxWidth: 360 })
        .bindTooltip(
          `<b>VDOT PSI #${f.rank}</b> ${f.tier} · ${escapeHtml(f.route)}`,
          { sticky: true }
        )
        .addTo(wwdRwdPsiLayer);
      }

      // ── Rank badge at midpoint ────────────────────────────────────────────
      const badge = L.divIcon({
        className: '',
        html: `<div style="
          background:${f.tierColor};color:#fff;font-size:9px;font-weight:700;
          padding:2px 4px;border-radius:3px;border:1px solid #fff;
          box-shadow:0 1px 3px rgba(0,0,0,.5);white-space:nowrap;
        ">PSI ${f.rank}</div>`,
        iconSize:   [40, 16],
        iconAnchor: [20, 8]
      });
      wwdRwdPsiLayer.addLayer(L.marker([f.lat, f.lng], { icon: badge, interactive: false }));
    });
  }

  function showRwdPsiLayer() {
    if (wwdRwdPsiLayer && map && !map.hasLayer(wwdRwdPsiLayer)) map.addLayer(wwdRwdPsiLayer);
  }

  // ── VA Interchange Types Layer ─────────────────────────────────────────────
  const _IC_RISK_STYLE = {
    'Very High': { color: '#BD0026', fill: '#BD0026', radius: 16, label: 'VH' },
    'High':      { color: '#F03B20', fill: '#F03B20', radius: 13, label: 'H'  },
    'Medium':    { color: '#FD8D3C', fill: '#FD8D3C', radius: 11, label: 'M'  },
    'Low':       { color: '#41AB5D', fill: '#41AB5D', radius: 9,  label: 'L'  },
  };

  // Short-label color per interchange type (border accent on badge)
  const _IC_TYPE_COLOR = {
    'SPDI': '#7B2FBE',  // purple
    'DFR':  '#1A6BAD',  // blue
    'SDI':  '#2D6A4F',  // green
    'DDI':  '#1A6BAD',  // blue
    'PCL':  '#C97D00',  // amber
    'FFI':  '#9B1C1C',  // deep red
  };

  function renderVaInterchangesLayer(data) {
    if (!vaInterchangesLayer) return;
    vaInterchangesLayer.clearLayers();

    (data || []).forEach(ic => {
      const risk  = _IC_RISK_STYLE[ic.riskLevel] || _IC_RISK_STYLE['Medium'];
      const tcol  = _IC_TYPE_COLOR[ic.typeShort]  || '#555';

      // Outer glow ring
      L.circleMarker([ic.latitude, ic.longitude], {
        radius: risk.radius + 5,
        color: risk.color,
        fillColor: risk.fill,
        fillOpacity: 0.12,
        weight: 1,
        interactive: false,
        pane: 'shadowPane'
      }).addTo(vaInterchangesLayer);

      // Main circle
      const circle = L.circleMarker([ic.latitude, ic.longitude], {
        radius: risk.radius,
        color: risk.color,
        fillColor: risk.fill,
        fillOpacity: 0.85,
        weight: 2.5
      });

      circle.bindTooltip(
        `<b>${ic.name}</b><br/>${ic.type}<br/>WWD Risk: <b>${ic.riskLevel}</b> — ${ic.riskDetail}`,
        { sticky: true, className: 'ic-tooltip' }
      );

      circle.bindPopup(`
        <div style="min-width:240px;font-size:13px">
          <div style="font-weight:700;font-size:14px;margin-bottom:6px">${ic.name}</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <tr><td style="color:#888;padding:3px 0">Type</td>
                <td style="font-weight:600;padding:3px 0 3px 8px">
                  <span style="background:${tcol};color:#fff;border-radius:4px;padding:1px 6px;font-size:11px">${ic.typeShort}</span>
                  ${ic.type}
                </td></tr>
            <tr><td style="color:#888;padding:3px 0">WWD Risk</td>
                <td style="padding:3px 0 3px 8px">
                  <span style="background:${risk.color};color:#fff;border-radius:4px;padding:1px 8px;font-size:11px;font-weight:700">${ic.riskLevel}</span>
                </td></tr>
            <tr><td style="color:#888;padding:3px 0">Risk Detail</td>
                <td style="padding:3px 0 3px 8px">${ic.riskDetail}</td></tr>
            <tr><td style="color:#888;padding:3px 0">Coordinates</td>
                <td style="padding:3px 0 3px 8px;font-family:monospace;font-size:11px">${ic.latitude.toFixed(4)}, ${ic.longitude.toFixed(4)}</td></tr>
            ${ic.source ? `<tr><td style="color:#888;padding:3px 0">Source</td>
                <td style="padding:3px 0 3px 8px"><a href="${ic.source}" target="_blank" rel="noopener"
                  style="color:#3B82F6;font-size:11px">View on Wikimapia ↗</a></td></tr>` : ''}
          </table>
        </div>
      `, { maxWidth: 300 });

      vaInterchangesLayer.addLayer(circle);

      // Type badge label at centre
      const badge = L.marker([ic.latitude, ic.longitude], {
        icon: L.divIcon({
          className: '',
          html: `<div style="
            background:${tcol};color:#fff;font-size:9px;font-weight:800;
            border-radius:3px;padding:1px 4px;white-space:nowrap;
            box-shadow:0 1px 3px rgba(0,0,0,0.5);pointer-events:none;
            transform:translate(-50%,-50%);position:absolute;top:50%;left:50%
          ">${ic.typeShort}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        }),
        interactive: false
      });
      vaInterchangesLayer.addLayer(badge);
    });

    if (vaInterchangesLayer && map && !map.hasLayer(vaInterchangesLayer)) {
      map.addLayer(vaInterchangesLayer);
    }
  }

  function showWwdArcGisLayer() {
    if (wwdArcGisLayer && map && !map.hasLayer(wwdArcGisLayer)) {
      map.addLayer(wwdArcGisLayer);
    }
  }

  function showProhibitedLayer() {
    if (wwdProhibitedLayer && map && !map.hasLayer(wwdProhibitedLayer)) map.addLayer(wwdProhibitedLayer);
  }
  function showCurveDelineationLayer() {
    if (wwdCurveDelineationLayer && map && !map.hasLayer(wwdCurveDelineationLayer)) map.addLayer(wwdCurveDelineationLayer);
  }
  return {
    init, renderMarkers, renderHeatmap, renderRiskZones,
    renderWwdArcGisMarkers, renderProhibitedRoadways, renderCurveDelineation,
    renderFcRamps, showFcRampLayer,
    renderWeightedWwdLayer, showWeightedWwdLayer,
    renderMethod3Layer, showMethod3Layer,
    renderMethod6Layer, showMethod6Layer,
    renderRwdPsiLayer, showRwdPsiLayer,
    renderVaInterchangesLayer,
    showWwdArcGisLayer, showProhibitedLayer, showCurveDelineationLayer,
    focusMarker, setTempPin, clearTempPin, clearCountySelection, getMap, setHighlightRowHandler,
    setAddIncidentMode: (on) => {
      _addIncidentMode = !!on;
      const mapEl = document.getElementById('map-container');
      if (mapEl) mapEl.classList.toggle('add-incident-mode', _addIncidentMode);
    },
    isAddIncidentMode: () => _addIncidentMode
  };
})();
