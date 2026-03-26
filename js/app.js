/**
 * app.js – WWD App Bootstrap & State Management
 */

// ── Global State ─────────────────────────────────────────────────────────────
let appState = {
  incidents: [],
  clusters: [],
  incidentRiskMap: new Map(),
  wwdArcGisData: [],
  activePanel: 'panel-map',
  showHeatmap: false,
  selectedCounty: null,
  spatialFilterFn: null,     // set by SpatialFilterModule; inc => bool
  // FHWA analysis data — populated by loadWwdAdditionalLayers()
  method2Data:  [],          // fetchWeightedWwdCrashPoints() output
  method3Data:  [],          // fetchSegmentWwdRisk() output
  method6Data:  [],          // computeMethod6Score() output
  rwdPsiData:   []           // fetchRwdPsiLayer() output
};

// ── Utility: Toast notifications ─────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

// ── Panel Navigation ──────────────────────────────────────────────────────────
function showPanel(panelId) {
  // Never let panel switcher touch the slide-in form
  if (panelId === 'panel-form') { openForm(); return; }

  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
  const navItem = document.querySelector(`.nav-item[data-panel="${panelId}"]`);
  if (navItem) navItem.classList.add('active');
  appState.activePanel = panelId;

  // Refresh charts when dashboard is shown
  if (panelId === 'panel-dashboard') {
    setTimeout(() => ChartsModule.renderAll(appState.incidents, appState.clusters), 50);
  }
  if (panelId === 'panel-risk') {
    renderRiskTable();
  }
  if (panelId === 'panel-wwd-arcgis') {
    renderWwdArcGisTable();
  }
}

// ── Slide-in Form Open/Close ────────────────────────────────────────────────
function openForm(lat, lng) {
  InventoryModule.openAddForm(lat ?? null, lng ?? null);
  const form = document.getElementById('panel-form');
  if (form) form.classList.add('active');
}

function closeForm() {
  const form = document.getElementById('panel-form');
  if (form) form.classList.remove('active');
  MapModule.clearTempPin();
}

// ── Risk Table Rendering ──────────────────────────────────────────────────────
function renderRiskTable() {
  const tbody = document.getElementById('risk-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  appState.clusters.forEach((cl, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td><b>${cl.road || cl.routeNumber}</b><br><small>${cl.municipality}</small></td>
      <td>${cl.incidents.length}</td>
      <td>${cl.incidents.filter(i => i.severity === 'Fatal').length}</td>
      <td>
        <div class="risk-bar-container">
          <div class="risk-bar" style="width:${cl.riskScore}%;background:${getRiskColor(cl.riskScore)}"></div>
          <span>${cl.riskScore}</span>
        </div>
      </td>
      <td><span class="risk-level-badge risk-${cl.riskLevel.toLowerCase()}">${cl.riskLevel}</span></td>
      <td>
        <button class="btn-sm" onclick="openRecommendations(${idx})">View Recs</button>
        <button class="btn-sm btn-secondary" onclick="MapModule.focusMarker('${cl.incidents[0]?.id}'); showPanel('panel-map')">Map</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getRiskColor(score) {
  if (score >= 75) return '#FF4757';
  if (score >= 50) return '#FFA502';
  if (score >= 25) return '#FFDD59';
  return '#7BED9F';
}

// ── Possible WWD Locations (ArcGIS) ───────────────────────────────────────────
async function loadWwdArcGisData() {
  const loadingEl = document.getElementById('wwd-arcgis-loading');
  const errorEl = document.getElementById('wwd-arcgis-error');
  const tableWrap = document.getElementById('wwd-arcgis-table-wrap');
  const countEl = document.getElementById('wwd-arcgis-count');
  const badgeEl = document.getElementById('badge-wwd-arcgis');

  if (loadingEl) loadingEl.style.display = 'flex';
  if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
  if (tableWrap) tableWrap.style.display = 'none';

  try {
    const data = await ArcGISWWD.fetchPossibleWwdLocations();
    appState.wwdArcGisData = data;
    MapModule.renderWwdArcGisMarkers(data);

    if (countEl) countEl.textContent = `${data.length} locations`;
    if (badgeEl) badgeEl.textContent = data.length;
    if (tableWrap) tableWrap.style.display = 'block';
    renderWwdArcGisTable();
    showToast(`Loaded ${data.length} possible WWD locations from ArcGIS`, 'success');
  } catch (err) {
    console.error('ArcGIS WWD fetch error:', err);
    if (errorEl) {
      errorEl.textContent = `Failed to load: ${err.message}`;
      errorEl.style.display = 'block';
    }
    showToast(`ArcGIS load failed: ${err.message}`, 'error');
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

// ── Additional WWD Layers (Prohibited Roadways + Curves + FC Ramps + Method 2) ──────
async function loadWwdAdditionalLayers() {
  try {
    // ── Fast layers: fetch in parallel ────────────────────────────────────────
    const [prohibitedRoadways, curveDelineation, fcRamps] = await Promise.all([
      WWDAdditionalLayers.fetchProhibitedRoadways().catch(e => { console.warn('Prohibited Roadways fetch failed:', e); return []; }),
      WWDAdditionalLayers.fetchCurveDelineation().catch(e => { console.warn('ArcGIS Curve Delineation fetch failed:', e); return []; }),
      WWDAdditionalLayers.fetchFunctionalClassRamps().catch(e => { console.warn('FC Ramps fetch failed:', e); return []; })
    ]);
    MapModule.renderProhibitedRoadways(prohibitedRoadways);
    MapModule.renderCurveDelineation(curveDelineation);
    MapModule.renderFcRamps(fcRamps);

    const total = prohibitedRoadways.length + curveDelineation.length + fcRamps.length;
    if (total > 0) showToast(
      `Loaded ${prohibitedRoadways.length} prohibited + ${curveDelineation.length} curves + ${fcRamps.length} FC ramps`,
      'success'
    );

    // ── Method 2: Weighted WWD Crash Entry Points (heavier computation) ───────
    // Run after fast layers so the map is already populated
    let method2 = [];
    try {
      showToast('⚖️ Computing Method 2 weighted entry points…', 'info');
      method2 = await WWDAdditionalLayers.fetchWeightedWwdCrashPoints();
      appState.method2Data = method2;
      MapModule.renderWeightedWwdLayer(method2);
      MapModule.showWeightedWwdLayer();
      const crit = method2.filter(i => i.tier === 'Critical').length;
      const high = method2.filter(i => i.tier === 'High').length;
      showToast(
        `⚖️ Method 2: ${method2.length} interchanges — ${crit} Critical · ${high} High`,
        'success'
      );
    } catch (m2err) {
      console.warn('Method 2 computation failed:', m2err);
      showToast('⚖️ Method 2 layer unavailable', 'error');
    }

    // ── Method 3: Segment-Level WWD Risk (VDOT LRS route-based segmentation) ──
    // Fetches LRS route geometries to order interchanges along actual VDOT routes
    try {
      if (method2.length >= 2) {
        showToast('📊 Method 3: Fetching VDOT LRS route data for segment definition…', 'info');
        const method3 = await WWDAdditionalLayers.fetchSegmentWwdRisk(method2);
        appState.method3Data = method3;
        MapModule.renderMethod3Layer(method3); // data loaded; user toggles layer via control
        const critSeg  = method3.filter(s => s.tier === 'Critical').length;
        const highSeg  = method3.filter(s => s.tier === 'High').length;
        const lrsCount = method3.filter(s => s.lrsMatched).length;
        showToast(
          `📊 Method 3: ${method3.length} segments — ${critSeg} Critical · ${highSeg} High · ${lrsCount} LRS-matched`,
          'success'
        );
      }
    } catch (m3err) {
      console.warn('Method 3 computation failed:', m3err);
      showToast('📊 Method 3 segment computation failed', 'error');
    }

    // ── Method 6: Point-Based Interchange Risk Score ──────────────────────
    // Synchronous computation — uses Method 2 interchange data already in memory
    try {
      if (method2.length >= 1) {
        const method6 = WWDAdditionalLayers.computeMethod6Score(method2);
        appState.method6Data = method6;
        MapModule.renderMethod6Layer(method6); // data loaded; user toggles layer via control
        const critIc  = method6.filter(ic => ic.m6.tier === 'Critical').length;
        const highIc  = method6.filter(ic => ic.m6.tier === 'High').length;
        const fatalIc = method6.filter(ic => ic.hasFatal).length;
        showToast(
          `🎯 Method 6: ${method6.length} interchanges — ${critIc} Critical · ${highIc} High · ${fatalIc} with fatals`,
          'success'
        );
      }
    } catch (m6err) {
      console.warn('Method 6 computation failed:', m6err);
      showToast('🎯 Method 6 scoring failed', 'error');
    }

    // ── VDOT RwD PSI 2020-24 — Pre-Computed PSI Rankings ─────────────────
    // Different methodology from Methods 2/3/6 (VDOT spatial PSI model),
    // so these locations are genuinely independent of crash-cluster data.
    try {
      showToast('🚦 Fetching VDOT RwD PSI rankings…', 'info');
      const rwdPsi = await WWDAdditionalLayers.fetchRwdPsiLayer();
      appState.rwdPsiData = rwdPsi;
      MapModule.renderRwdPsiLayer(rwdPsi);
      const critPsi = rwdPsi.filter(f => f.tier === 'Critical').length;
      const highPsi = rwdPsi.filter(f => f.tier === 'High').length;
      showToast(
        `🚦 VDOT RwD PSI: ${rwdPsi.length} locations — ${critPsi} Critical · ${highPsi} High`,
        'success'
      );
    } catch (psiErr) {
      console.warn('VDOT RwD PSI fetch failed:', psiErr);
      showToast('🚦 VDOT RwD PSI unavailable', 'warning');
    }

  } catch (err) {
    console.error('WWD additional layers error:', err);
  }
}

function renderWwdArcGisTable() {
  const tbody = document.getElementById('wwd-arcgis-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const data = appState.wwdArcGisData || [];

  data.forEach(f => {
    const tr = document.createElement('tr');
    const dateStr = f.crashDate ? new Date(f.crashDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—';
    tr.innerHTML = `
      <td><b>${escapeHtml(f.road)}</b></td>
      <td>${escapeHtml(f.municipality)}</td>
      <td>${dateStr}</td>
      <td><span class="sev-badge sev-${getSevClass(f.severity)}">${f.severity}</span></td>
      <td>${(f.kPeople || 0) > 0 ? `<span style="color:var(--accent-red)">${f.kPeople}</span>` : '0'}</td>
      <td>${f.alcoholInvolved ? '🍺 Yes' : 'No'}</td>
      <td>${f.night ? '🌙 Yes' : 'No'}</td>
      <td>${f.lat != null && f.lng != null ? `<button class="btn-sm" onclick="MapModule.showWwdArcGisLayer(); MapModule.getMap().flyTo([${f.lat},${f.lng}], 14); showPanel('panel-map')">Map</button>` : '—'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function getSevClass(sev) {
  if (!sev) return 'pdo';
  const s = sev.toLowerCase();
  if (s.includes('fatal')) return 'fatal';
  if (s.includes('injury') || s.includes('severe') || s.includes('visible')) return 'injury';
  if (s.includes('near') || s.includes('miss')) return 'nearmiss';
  return 'pdo';
}

// ── Recommendations Modal ─────────────────────────────────────────────────────
function openRecommendations(clusterIdx) {
  const cl = appState.clusters[clusterIdx];
  if (!cl) return;
  const modal = document.getElementById('rec-modal');
  const body  = document.getElementById('rec-modal-body');

  document.getElementById('rec-modal-title').textContent =
    `Recommendations — ${cl.road || cl.routeNumber} (${cl.municipality})`;

  const priorityOrder = { Immediate:0, High:1, Medium:2, Low:3 };
  const sorted = [...cl.recommendations].sort((a,b) => (priorityOrder[a.priority]||4) - (priorityOrder[b.priority]||4));

  body.innerHTML = `
    <div class="rec-score-row">
      <div class="rec-score-box" style="border-color:${getRiskColor(cl.riskScore)}">
        <div class="rec-score-num" style="color:${getRiskColor(cl.riskScore)}">${cl.riskScore}</div>
        <div class="rec-score-label">Risk Score</div>
      </div>
      <div class="rec-meta">
        <div class="rec-meta-row">🔢 <b>${cl.incidents.length}</b> incidents at this location</div>
        <div class="rec-meta-row">💀 <b>${cl.incidents.filter(i=>i.severity==='Fatal').length}</b> fatal(s)</div>
        <div class="rec-meta-row">🌙 <b>${Math.round(cl.factors.nightScore*100)}%</b> night-time</div>
        <div class="rec-meta-row">🍺 <b>${Math.round(cl.factors.alcScore*100)}%</b> alcohol-involved</div>
      </div>
    </div>
    <div class="rec-list">
      ${sorted.map(r => `
        <div class="rec-card priority-${r.priority.toLowerCase()}">
          <div class="rec-card-header">
            <span class="rec-icon">${r.icon}</span>
            <span class="rec-type">${r.type}</span>
            <span class="rec-priority priority-badge-${r.priority.toLowerCase()}">${r.priority}</span>
          </div>
          <p>${r.description}</p>
          <div class="rec-guidance">📋 Ref: ${r.fhwaGuidance}</div>
        </div>
      `).join('')}
    </div>
  `;

  modal.classList.add('open');
}

// ── KPI Cards ──────────────────────────────────────────────────────────────────
function updateKPIs(incidents, clusters) {
  const total = incidents.length;
  const fatal = incidents.filter(i => i.severity === 'Fatal').length;
  const critical = clusters.filter(c => c.riskLevel === 'Critical').length;
  const avgRisk = clusters.length
    ? Math.round(clusters.reduce((s,c)=>s+c.riskScore,0)/clusters.length)
    : 0;
  const noCounter = incidents.filter(i => !i.countermeasures || i.countermeasures.length === 0).length;
  const nightPct = total ? Math.round(incidents.filter(i=>i.timeCategory==='Night').length/total*100) : 0;

  setKPI('kpi-total',    total,             '📍 Total Incidents');
  setKPI('kpi-fatal',    fatal,             '💀 Fatalities');
  setKPI('kpi-critical', critical,          '🚨 Critical Locations');
  setKPI('kpi-avgrisk',  avgRisk + '/100',  '📊 Avg Risk Score');
  setKPI('kpi-nocounter',noCounter,         '🛡️ Unprotected Sites');
  setKPI('kpi-night',    nightPct + '%',    '🌙 Night Incidents');
}

function setKPI(id, value, label) {
  const el = document.getElementById(id);
  if (el) {
    el.querySelector('.kpi-value').textContent = value;
    el.querySelector('.kpi-label').textContent = label;
  }
}

// ── Global App Filtering ───────────────────────────────────────────────────────
function applyAppFilters() {
  let activeIncidents = appState.incidents;

  // County filter
  if (appState.selectedCounty) {
     activeIncidents = activeIncidents.filter(inc => {
        const c = appState.selectedCounty.toLowerCase();
        const m = inc.municipality.toLowerCase();
        return m.includes(c) || c.includes(m);
     });
  }

  // Spatial filter (point buffer / line corridor / polygon)
  if (appState.spatialFilterFn) {
    activeIncidents = activeIncidents.filter(appState.spatialFilterFn);
    SpatialFilterModule.updateCount(activeIncidents.length);
  }
  
  const { clusters, incidentRiskMap } = RiskEngine.compute(activeIncidents);
  appState.clusters = clusters;
  appState.incidentRiskMap = incidentRiskMap;
  
  updateKPIs(activeIncidents, clusters);
  InventoryModule.applyRiskScores(incidentRiskMap, clusters);
  InventoryModule.setCountyFilter(appState.selectedCounty);
  
  try {
    MapModule.renderMarkers(activeIncidents);
    if (appState.showHeatmap) MapModule.renderHeatmap(activeIncidents);
    else MapModule.renderHeatmap([]);
    MapModule.renderRiskZones(clusters);
  } catch (e) {
    console.error("Leaflet Layer Crash", e);
  }
  
  if (appState.activePanel === 'panel-dashboard') {
     ChartsModule.renderAll(activeIncidents, clusters);
  }
  if (appState.activePanel === 'panel-risk') {
     renderRiskTable();
  }
}

// ── Main Init ──────────────────────────────────────────────────────────────────
function initApp() {

  // 1. Initialize map
  MapModule.init('map-container', (lat, lng) => {
    // Map click → pre-fill lat/lng and open form (only fires when add-incident mode is on)
    document.getElementById('f-lat').value = lat.toFixed(6);
    document.getElementById('f-lng').value = lng.toFixed(6);
    document.getElementById('form-title').textContent = 'Add New Incident';
    MapModule.setTempPin(lat, lng);
    document.getElementById('panel-form').classList.add('active');
    // Reset the toggle button now that a pin was placed
    const btn = document.getElementById('btn-add-incident');
    if (btn) { btn.textContent = '＋ Add Incident'; btn.classList.remove('active'); }
  }, (countyName) => {
    // County click → filter data
    if (appState.selectedCounty === countyName) {
      appState.selectedCounty = null;
      MapModule.clearCountySelection();
      showToast('Cleared county filter', 'info');
    } else {
      appState.selectedCounty = countyName;
      showToast(`Filtered map to ${countyName}`, 'info');
    }
    applyAppFilters();
  });

  // 1b. Spatial filter toolbar (Select / Drop a point / Draw a line / Draw an area)
  SpatialFilterModule.init(MapModule.getMap(), filterFn => {
    appState.spatialFilterFn = filterFn;
    applyAppFilters();
  });

  // 2. Load data
  appState.incidents = JSON.parse(JSON.stringify(SAMPLE_DATA));

  // 3. Initialize inventory
  InventoryModule.init(appState.incidents, (updatedIncidents) => {
    appState.incidents = updatedIncidents;
    applyAppFilters();
  });

  // 4. Initial filter & render (deferred to allow flexbox layout to measure map height)
  setTimeout(() => {
    applyAppFilters();
    MapModule.getMap().invalidateSize();
  }, 250);

  // 4a. Load WWD layers (async, non-blocking)
  setTimeout(() => {
    loadWwdArcGisData();
    loadWwdAdditionalLayers(); // ArcGIS Prohibited Roadways + Curve Delineation + Fatal Crashes
  }, 500);

  // 4b. VA Interchange Types — static dataset, render immediately
  if (typeof VA_INTERCHANGES !== 'undefined' && VA_INTERCHANGES.length) {
    MapModule.renderVaInterchangesLayer(VA_INTERCHANGES);
    showToast(`🔀 ${VA_INTERCHANGES.length} VA interchange types loaded`, 'success');
  }

  // 4b. Resize observer to catch layout shifts
  window.addEventListener('resize', () => {
    setTimeout(() => MapModule.getMap().invalidateSize(), 50);
  });

  // 7. Wire navigation
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.addEventListener('click', () => {
      showPanel(nav.dataset.panel);
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      nav.classList.add('active');
    });
  });

  // 8. Wire buttons
  // "Add Incident" is now a toggle: click once to enter map-click mode,
  // click again (or after placing a pin) to cancel.
  document.getElementById('btn-add-incident')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const isActive = MapModule.isAddIncidentMode();
    if (isActive) {
      // Cancel mode
      MapModule.setAddIncidentMode(false);
      MapModule.clearTempPin();
      btn.textContent = '＋ Add Incident';
      btn.classList.remove('active');
    } else {
      // Enter mode — next click on map will place a pin
      MapModule.setAddIncidentMode(true);
      btn.textContent = '✕ Cancel Adding';
      btn.classList.add('active');
      showToast('Click anywhere on the map to place the incident', 'info');
      showPanel('panel-map');
    }
  });
  document.getElementById('btn-export-csv')?.addEventListener('click', () => InventoryModule.exportCSV());
  document.getElementById('btn-apply-filters')?.addEventListener('click', () => InventoryModule.applyFilters());

  // 9. Heatmap toggle
  document.getElementById('btn-toggle-heatmap')?.addEventListener('click', (e) => {
    appState.showHeatmap = !appState.showHeatmap;
    if (appState.showHeatmap) {
      MapModule.renderHeatmap(appState.incidents);
      e.target.classList.add('active');
      e.target.textContent = '🔥 Heatmap ON';
    } else {
      const map = MapModule.getMap();
      // heatmap is toggled internally
      MapModule.renderHeatmap([]);
      e.target.classList.remove('active');
      e.target.textContent = '🔥 Heatmap';
    }
  });

  // 10. Sort headers
  InventoryModule.setupSort();

  // 11. Modal + form close
  document.getElementById('rec-modal-close')?.addEventListener('click', () => {
    document.getElementById('rec-modal').classList.remove('open');
  });
  document.getElementById('rec-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'rec-modal') document.getElementById('rec-modal').classList.remove('open');
  });
  document.getElementById('cancel-form')?.addEventListener('click', closeForm);

  // 11b. Possible WWD Locations panel buttons
  document.getElementById('btn-refresh-wwd-arcgis')?.addEventListener('click', () => {
    loadWwdArcGisData();
    loadWwdAdditionalLayers();
  });
  document.getElementById('btn-show-wwd-on-map')?.addEventListener('click', () => {
    MapModule.showWwdArcGisLayer();
    MapModule.showProhibitedLayer();
    MapModule.showFcRampLayer();
    showPanel('panel-map');
  });

  // 12. Highlight row when map marker clicked
  MapModule.setHighlightRowHandler((id) => {
    const rows = document.querySelectorAll('#inventory-tbody tr');
    rows.forEach(r => r.classList.remove('selected'));
    const row = document.querySelector(`#inventory-tbody tr[data-id="${id}"]`);
    if (row) {
      row.classList.add('selected');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // 13. Show default panel
  showPanel('panel-map');
  showToast('🗺️ WWD Analyzer loaded — ' + SAMPLE_DATA.length + ' incidents ready', 'success');
}

// ── Run Init Safely ────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
