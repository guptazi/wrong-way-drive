/**
 * spatial-filter.js  –  Spatial selection & filtering tools for the WWD map.
 * Tools: Select | Drop a point | Draw a line | Draw an area | Collapse
 *
 * Usage (in app.js):
 *   SpatialFilterModule.init(MapModule.getMap(), filterFn => {
 *     appState.spatialFilterFn = filterFn;   // null = clear
 *     applyAppFilters();
 *   });
 *   // After applyAppFilters, call:  SpatialFilterModule.updateCount(n)
 */
const SpatialFilterModule = (() => {

  // ── Private state ──────────────────────────────────────────────────────────
  let _map          = null;
  let _onFilter     = null;   // callback: (inc => bool) | null
  let _mode         = null;   // 'select' | 'point' | 'line' | 'area' | null
  let _vertices     = [];     // drawing vertices [[lat,lng], …]
  let _liveLine     = null;   // preview polyline while drawing
  let _shapeLayer   = null;   // finalised shape on map
  let _bufferKm     = 1.0;    // last-used buffer radius / width

  // ── DOM refs ───────────────────────────────────────────────────────────────
  let _toolbar      = null;
  let _statusBar    = null;
  let _bufferPanel  = null;

  // ══════════════════════════════════════════════════════════════════════════
  //  Spatial mathematics (no Turf.js needed)
  // ══════════════════════════════════════════════════════════════════════════

  /** Great-circle distance in km (Haversine). */
  function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Ray-casting point-in-polygon test. ring = [[lat,lng], …]. */
  function ptInPolygon(lat, lng, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [yi, xi] = ring[i];
      const [yj, xj] = ring[j];
      if (((yi > lat) !== (yj > lat)) &&
          (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  /** Min distance from a point to a polyline (in km). pts = [[lat,lng], …]. */
  function distToPolylineKm(lat, lng, pts) {
    let best = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const [aLat, aLng] = pts[i];
      const [bLat, bLng] = pts[i + 1];
      const dx = bLng - aLng, dy = bLat - aLat;
      const lenSq = dx * dx + dy * dy;
      const t = lenSq > 0
        ? Math.max(0, Math.min(1, ((lng - aLng) * dx + (lat - aLat) * dy) / lenSq))
        : 0;
      const d = haversineKm(lat, lng, aLat + t * dy, aLng + t * dx);
      if (d < best) best = d;
    }
    return best;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Filter factory
  // ══════════════════════════════════════════════════════════════════════════

  function _makeFilterFn(spec) {
    if (!spec) return null;
    if (spec.type === 'point') {
      return inc => haversineKm(inc.lat, inc.lng, spec.lat, spec.lng) <= spec.radiusKm;
    }
    if (spec.type === 'line') {
      return inc => distToPolylineKm(inc.lat, inc.lng, spec.pts) <= spec.bufferKm;
    }
    if (spec.type === 'area') {
      return inc => ptInPolygon(inc.lat, inc.lng, spec.ring);
    }
    return null;
  }

  function _applySpec(spec) {
    const fn = _makeFilterFn(spec);
    if (_onFilter) _onFilter(fn);
    _setStatusActive();
    if (_toolbar) _toolbar.classList.add('sf-has-filter');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Drawing management
  // ══════════════════════════════════════════════════════════════════════════

  function _clearShape() {
    if (_shapeLayer) { _map.removeLayer(_shapeLayer); _shapeLayer = null; }
    if (_liveLine)   { _map.removeLayer(_liveLine);   _liveLine   = null; }
    _vertices = [];
  }

  function _exitMode(keepShape) {
    if (!keepShape) _clearShape();
    _mode = null;
    _map.getContainer().style.cursor = '';
    _map.off('click',     _handleClick);
    _map.off('mousemove', _handleMousemove);
    _map.off('dblclick',  _handleDblclick);
    _map.doubleClickZoom.enable();
    _setMenuActive(null);
    if (_toolbar) _toolbar.classList.remove('sf-drawing');
    _setStatusDrawing(null);
  }

  function _startMode(mode) {
    // Clicking the same tool again cancels it
    if (_mode === mode) { _exitMode(false); return; }
    _exitMode(false);

    if (mode === 'select') {
      // "Select" = normal pointer; just exits any active drawing mode
      return;
    }

    _mode = mode;
    _map.getContainer().style.cursor = 'crosshair';
    _map.doubleClickZoom.disable();
    _map.on('click', _handleClick);
    if (mode === 'line' || mode === 'area') {
      _map.on('mousemove', _handleMousemove);
      _map.on('dblclick',  _handleDblclick);
    }
    _setMenuActive(mode);
    if (_toolbar) {
      _toolbar.classList.add('sf-drawing');
      _toolbar.classList.add('collapsed'); // auto-close menu while drawing
    }
    _setStatusDrawing(mode);
  }

  // ── Map event handlers ─────────────────────────────────────────────────────

  function _handleClick(e) {
    L.DomEvent.stopPropagation(e);
    const { lat, lng } = e.latlng;

    if (_mode === 'point') {
      _clearShape();
      _vertices = [[lat, lng]];
      // Draw a provisional circle at the last-used buffer size
      _shapeLayer = L.circle([lat, lng], _circleOpts(_bufferKm * 1000)).addTo(_map);
      _exitMode(true); // exit crosshair; shape stays
      _showBufferPanel(lat, lng, 'point');

    } else if (_mode === 'line' || _mode === 'area') {
      _vertices.push([lat, lng]);
    }
  }

  function _handleMousemove(e) {
    if (_vertices.length === 0) return;
    if (_liveLine) { _map.removeLayer(_liveLine); _liveLine = null; }
    const preview = [..._vertices, [e.latlng.lat, e.latlng.lng]];
    _liveLine = L.polyline(preview, {
      color: '#5352ED', weight: 2, dashArray: '5 5', opacity: 0.7
    }).addTo(_map);
  }

  function _handleDblclick(e) {
    L.DomEvent.stopPropagation(e);
    // Leaflet fires two click events before dblclick; pop one duplicate vertex
    if (_vertices.length > 0) _vertices.pop();

    if (_mode === 'line' && _vertices.length >= 2) {
      const pts = _vertices.slice();
      _exitMode(false);
      if (_liveLine) { _map.removeLayer(_liveLine); _liveLine = null; }
      _shapeLayer = L.polyline(pts, {
        color: '#5352ED', weight: 3, opacity: 0.9
      }).addTo(_map);
      _vertices = pts;
      _showBufferPanel(null, null, 'line');

    } else if (_mode === 'area' && _vertices.length >= 3) {
      const ring = _vertices.slice();
      _exitMode(false);
      if (_liveLine) { _map.removeLayer(_liveLine); _liveLine = null; }
      _shapeLayer = L.polygon(ring, {
        color: '#5352ED', fillColor: '#5352ED', fillOpacity: 0.13, weight: 2
      }).addTo(_map);
      _vertices = ring;
      // Area filter has no buffer – apply immediately
      _applySpec({ type: 'area', ring });
    }
  }

  function _circleOpts(radiusMeters) {
    return {
      radius: radiusMeters,
      color: '#5352ED', fillColor: '#5352ED', fillOpacity: 0.13,
      dashArray: '6 4', weight: 2
    };
  }

  // ── Buffer panel ───────────────────────────────────────────────────────────

  function _showBufferPanel(lat, lng, type) {
    if (!_bufferPanel) return;
    document.getElementById('sf-bp-val').value = _bufferKm;
    _bufferPanel.style.display = 'flex';
    _bufferPanel.dataset.sfType = type;
    if (lat !== null) _bufferPanel.dataset.lat = lat;
    if (lng !== null) _bufferPanel.dataset.lng = lng;
  }

  // ── Status bar ─────────────────────────────────────────────────────────────

  function _setStatusDrawing(mode) {
    if (!_statusBar) return;
    const msgs = {
      point: '📍 Click on the map to drop a point',
      line:  '📏 Click to add vertices — double-click to finish',
      area:  '⬡ Click to draw polygon vertices — double-click to close'
    };
    if (!mode) { _statusBar.style.display = 'none'; return; }
    _statusBar.style.display = 'flex';
    _statusBar.dataset.state = 'drawing';
    document.getElementById('sf-status-text').textContent = msgs[mode] || '';
    const clearBtn = document.getElementById('sf-clear-filter');
    if (clearBtn) clearBtn.style.display = 'none';
  }

  function _setStatusActive() {
    if (!_statusBar) return;
    _statusBar.style.display = 'flex';
    _statusBar.dataset.state = 'active';
    document.getElementById('sf-status-text').textContent = '🔍 Spatial filter active';
    const clearBtn = document.getElementById('sf-clear-filter');
    if (clearBtn) clearBtn.style.display = 'inline-flex';
    const actionBtns = document.getElementById('sf-action-btns');
    if (actionBtns) actionBtns.style.display = 'flex';
  }

  function _setMenuActive(mode) {
    if (!_toolbar) return;
    _toolbar.querySelectorAll('.sf-item').forEach(el => el.classList.remove('sf-item-active'));
    if (mode) {
      const el = _toolbar.querySelector(`[data-mode="${mode}"]`);
      if (el) el.classList.add('sf-item-active');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  UI construction
  // ══════════════════════════════════════════════════════════════════════════

  function _buildUI() {
    const wrap = _map.getContainer();

    // ── Floating toolbar ────────────────────────────────────────────────────
    _toolbar = document.createElement('div');
    _toolbar.id = 'sf-toolbar';
    _toolbar.className = 'sf-toolbar collapsed';
    _toolbar.innerHTML = `
      <button class="sf-fab" id="sf-fab" title="Spatial filter tools">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
      </button>
      <div class="sf-menu" role="menu">

        <div class="sf-item" data-mode="select" role="menuitem" tabindex="0">
          <svg class="sf-icon" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 3l14 9-7 1-4 7z"/>
          </svg>
          <span>Select</span>
        </div>

        <div class="sf-item" data-mode="point" role="menuitem" tabindex="0">
          <svg class="sf-icon" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
          <span>Drop a point</span>
        </div>

        <div class="sf-item" data-mode="line" role="menuitem" tabindex="0">
          <svg class="sf-icon" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 17 10 11 14 15 20 7"/>
            <circle cx="4"  cy="17" r="2" fill="currentColor" stroke="none"/>
            <circle cx="20" cy="7"  r="2" fill="currentColor" stroke="none"/>
          </svg>
          <span>Draw a line</span>
        </div>

        <div class="sf-item" data-mode="area" role="menuitem" tabindex="0">
          <svg class="sf-icon" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 14 8 4 21 5 19 19 5 21"/>
          </svg>
          <span>Draw an area</span>
        </div>

        <div class="sf-divider"></div>

        <div class="sf-item sf-item-collapse" data-mode="collapse" role="menuitem" tabindex="0">
          <svg class="sf-icon" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="11 17 6 12 11 7"/>
            <polyline points="18 17 13 12 18 7"/>
          </svg>
          <span>&gt;&gt; Collapse</span>
        </div>

      </div>
    `;
    wrap.appendChild(_toolbar);

    // ── Buffer panel (shown after point / line is drawn) ────────────────────
    _bufferPanel = document.createElement('div');
    _bufferPanel.id = 'sf-buffer-panel';
    _bufferPanel.className = 'sf-buffer-panel';
    _bufferPanel.style.display = 'none';
    _bufferPanel.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" style="opacity:.6">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
      </svg>
      <span class="sf-bp-label">Buffer radius:</span>
      <input id="sf-bp-val" type="number" value="1" min="0.1" max="500" step="0.5" />
      <span class="sf-bp-unit">km</span>
      <button id="sf-bp-apply" class="sf-bp-apply">Apply</button>
      <button id="sf-bp-cancel" class="sf-bp-cancel" title="Cancel">✕</button>
    `;
    wrap.appendChild(_bufferPanel);

    // ── Status bar (shown while drawing or when filter is active) ────────────
    _statusBar = document.createElement('div');
    _statusBar.id = 'sf-status-bar';
    _statusBar.className = 'sf-status-bar';
    _statusBar.style.display = 'none';
    _statusBar.innerHTML = `
      <span id="sf-status-text"></span>
      <div class="sf-action-btns" id="sf-action-btns" style="display:none;gap:6px;align-items:center">
        <button class="sf-export-btn" id="sf-export-csv" title="Download filtered data as CSV">
          ⬇ CSV
        </button>
        <button class="sf-export-btn" id="sf-export-geojson" title="Download filtered data as GeoJSON">
          ⬇ GeoJSON
        </button>
        <button class="sf-report-btn" id="sf-generate-report" title="Generate full WWD analysis report">
          📄 Generate Report
        </button>
      </div>
      <button id="sf-clear-filter">✕ Clear filter</button>
    `;
    wrap.appendChild(_statusBar);

    // Prevent clicks on the overlay elements (toolbar, buffer panel, status bar)
    // from reaching the Leaflet map underneath. Must be applied to each overlay
    // element individually — NOT to `wrap` (the map container) which would break
    // Leaflet's own event handling.
    L.DomEvent.disableClickPropagation(_toolbar);
    L.DomEvent.disableClickPropagation(_bufferPanel);
    L.DomEvent.disableClickPropagation(_statusBar);
    L.DomEvent.disableScrollPropagation(_toolbar);

    // ── Wire events ──────────────────────────────────────────────────────────

    // FAB toggles the menu
    document.getElementById('sf-fab').addEventListener('click', e => {
      e.stopPropagation();
      _toolbar.classList.toggle('collapsed');
    });

    // Menu items
    _toolbar.querySelectorAll('.sf-item').forEach(item => {
      const handler = e => {
        e.stopPropagation();
        const mode = item.dataset.mode;
        if (mode === 'collapse') {
          _toolbar.classList.add('collapsed');
        } else {
          _startMode(mode);
        }
      };
      item.addEventListener('click', handler);
      item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(e); });
    });

    // Buffer panel – Apply
    document.getElementById('sf-bp-apply').addEventListener('click', () => {
      const radius = parseFloat(document.getElementById('sf-bp-val').value) || 1;
      _bufferKm = radius;
      const type = _bufferPanel.dataset.sfType;
      const lat  = parseFloat(_bufferPanel.dataset.lat);
      const lng  = parseFloat(_bufferPanel.dataset.lng);
      _bufferPanel.style.display = 'none';

      if (type === 'point') {
        if (_shapeLayer) { _map.removeLayer(_shapeLayer); }
        _shapeLayer = L.circle([lat, lng], _circleOpts(radius * 1000)).addTo(_map);
        _applySpec({ type: 'point', lat, lng, radiusKm: radius });
      } else if (type === 'line') {
        _applySpec({ type: 'line', pts: _vertices, bufferKm: radius });
      }
    });

    // Buffer panel – Cancel
    document.getElementById('sf-bp-cancel').addEventListener('click', clearFilter);

    // Status bar – Clear filter
    document.getElementById('sf-clear-filter').addEventListener('click', clearFilter);

    // Export / Report buttons
    document.getElementById('sf-export-csv').addEventListener('click', () => {
      if (window.WWDReportGenerator) WWDReportGenerator.exportCSV();
    });
    document.getElementById('sf-export-geojson').addEventListener('click', () => {
      if (window.WWDReportGenerator) WWDReportGenerator.exportGeoJSON();
    });
    document.getElementById('sf-generate-report').addEventListener('click', () => {
      if (window.WWDReportGenerator) WWDReportGenerator.generateReport();
    });

    // Close menu when clicking outside
    document.addEventListener('click', e => {
      if (_toolbar && !_toolbar.contains(e.target)) {
        _toolbar.classList.add('collapsed');
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Public API
  // ══════════════════════════════════════════════════════════════════════════

  /** Initialise the module. Call once after MapModule.init(). */
  function init(leafletMap, onFilterChange) {
    _map      = leafletMap;
    _onFilter = onFilterChange;
    _buildUI();
  }

  /** Remove the current filter and all drawn shapes. */
  function clearFilter() {
    _exitMode(false);
    _clearShape();
    if (_bufferPanel) _bufferPanel.style.display = 'none';
    if (_statusBar)   _statusBar.style.display   = 'none';
    const actionBtns = document.getElementById('sf-action-btns');
    if (actionBtns) actionBtns.style.display = 'none';
    if (_toolbar) {
      _toolbar.classList.remove('sf-has-filter');
      _toolbar.classList.remove('sf-drawing');
    }
    if (_onFilter) _onFilter(null);
  }

  /**
   * Update the incident count shown in the status bar.
   * Call this from app.js after applyAppFilters() whenever spatialFilterFn != null.
   */
  function updateCount(n) {
    const el = document.getElementById('sf-status-text');
    if (!el || !_statusBar || _statusBar.dataset.state !== 'active') return;
    el.textContent = `🔍 Spatial filter: ${n} incident${n === 1 ? '' : 's'} selected`;
  }

  return { init, clearFilter, updateCount };
})();
