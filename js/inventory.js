/**
 * inventory.js – WWD Incident CRUD Table Module
 * Handles add, edit, delete, filter, sort, CSV import/export
 */

const InventoryModule = (() => {

  let incidents = [];
  let filtered = [];
  let sortField = 'dateTime';
  let sortDir = 'desc';
  let onChangeCallback = null;
  let editingId = null;
  let externalCountyFilter = null;

  const MUNICIPALITIES = [
    'Arlington County','Fairfax County','Prince William County','Stafford County',
    'Fredericksburg','Richmond City','Henrico County','Chesterfield County',
    'Loudoun County','Alexandria','Norfolk','Virginia Beach','Chesapeake',
    'Hampton','Newport News','Portsmouth','Roanoke County','Roanoke City',
    'Augusta County','Shenandoah County','Carroll County','Charlottesville',
    'Other'
  ];

  const COUNTERMEASURE_OPTIONS = [
    'Wrong-Way Detection System','Enhanced Signage','Pavement Markings',
    'Retroreflective Delineators','Lighting Upgrade','Ramp Geometry Modification'
  ];

  function init(data, onChange) {
    incidents = JSON.parse(JSON.stringify(data)); // deep clone
    onChangeCallback = onChange;
    filtered = [...incidents];
    renderTable();
    renderForm();
    setupFilters();
    setupImport();
  }

  // ── Table Rendering ───────────────────────────────────────────────────────

  function renderTable() {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const sorted = [...filtered].sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    sorted.forEach(inc => {
      const tr = document.createElement('tr');
      tr.dataset.id = inc.id;
      tr.innerHTML = `
        <td><span class="id-badge">${inc.id}</span></td>
        <td>${formatDate(inc.dateTime)}</td>
        <td title="${inc.road}"><b>${inc.road}</b><br><small>${inc.municipality}</small></td>
        <td><span class="sev-badge sev-${inc.severity.toLowerCase().replace('-','')}">${inc.severity}</span></td>
        <td>${inc.rampType}</td>
        <td>${inc.vehiclesInvolved}</td>
        <td>${inc.postedSpeedLimit} mph</td>
        <td>${inc.alcoholInvolved ? '🍺 Yes' : 'No'}</td>
        <td>${(inc.countermeasures||[]).length ? inc.countermeasures.join(', ') : '<span class="none-badge">None</span>'}</td>
        <td><span class="risk-badge risk-${(inc._riskLevel||'').toLowerCase()}">${inc._riskScore ?? '—'}</span></td>
        <td class="action-cell">
          <button class="btn-icon btn-map" onclick="InventoryModule.zoomTo('${inc.id}')" title="Show on Map">🗺️</button>
          <button class="btn-icon btn-edit" onclick="InventoryModule.openEdit('${inc.id}')" title="Edit">✏️</button>
          <button class="btn-icon btn-delete" onclick="InventoryModule.deleteIncident('${inc.id}')" title="Delete">🗑️</button>
        </td>
      `;
      tr.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        document.querySelectorAll('#inventory-tbody tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        MapModule.focusMarker(inc.id);
      });
      tbody.appendChild(tr);
    });

    document.getElementById('record-count').textContent = `${filtered.length} of ${incidents.length} records`;
  }

  function formatDate(dt) {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', { month:'short', day:'2-digit', year:'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  }

  // ── Column Sorting ────────────────────────────────────────────────────────

  function setupSort() {
    document.querySelectorAll('#inventory-table th[data-sort]').forEach(th => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (sortField === field) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = field; sortDir = 'asc'; }
        document.querySelectorAll('#inventory-table th[data-sort]').forEach(h => h.classList.remove('sort-asc','sort-desc'));
        th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
        renderTable();
      });
    });
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  function setupFilters() {
    const applyBtn = document.getElementById('apply-filters');
    const clearBtn = document.getElementById('clear-filters');
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    if (clearBtn) clearBtn.addEventListener('click', () => {
      document.getElementById('filter-severity').value = '';
      document.getElementById('filter-ramp').value = '';
      document.getElementById('filter-alcohol').value = '';
      document.getElementById('filter-date-from').value = '';
      document.getElementById('filter-date-to').value = '';
      filtered = [...incidents];
      renderTable();
    });
  }

  function applyFilters() {
    const severity = document.getElementById('filter-severity')?.value;
    const muni     = document.getElementById('filter-municipality')?.value;
    const ramp     = document.getElementById('filter-ramp')?.value;
    const alcohol  = document.getElementById('filter-alcohol')?.value;
    const dateFrom = document.getElementById('filter-date-from')?.value;
    const dateTo   = document.getElementById('filter-date-to')?.value;

    filtered = incidents.filter(inc => {
      if (severity && inc.severity !== severity) return false;
      if (muni     && !inc.municipality.includes(muni)) return false;
      if (ramp     && inc.rampType !== ramp) return false;
      if (alcohol !== '' && alcohol !== undefined) {
        const isAlc = inc.alcoholInvolved;
        if (alcohol === 'yes' && !isAlc) return false;
        if (alcohol === 'no'  && isAlc)  return false;
      }
      if (dateFrom && inc.dateTime < dateFrom) return false;
      if (dateTo   && inc.dateTime > dateTo + 'T23:59:59') return false;
      if (externalCountyFilter) {
        const c = externalCountyFilter.toLowerCase();
        const m = inc.municipality.toLowerCase();
        if (!m.includes(c) && !c.includes(m)) return false;
      }
      return true;
    });
    renderTable();
  }
  
  function setCountyFilter(county) {
    externalCountyFilter = county;
    applyFilters();
  }

  // ── Add/Edit Form ─────────────────────────────────────────────────────────

  function renderForm() {
    const muniSel = document.getElementById('f-municipality');
    const cmSel   = document.getElementById('f-countermeasures');
    if (!muniSel || !cmSel) return;

    muniSel.innerHTML = MUNICIPALITIES.map(m => `<option value="${m}">${m}</option>`).join('');
    cmSel.innerHTML   = COUNTERMEASURE_OPTIONS.map(c => `<option value="${c}">${c}</option>`).join('');

    document.getElementById('incident-form')?.addEventListener('submit', e => {
      e.preventDefault();
      saveIncident();
    });
    // cancel-form close is handled in app.js to avoid double-binding
  }

  function openAddForm(lat, lng) {
    editingId = null;
    document.getElementById('form-title').textContent = 'Add New Incident';
    clearFormFields();
    if (lat != null) {
      document.getElementById('f-lat').value = lat.toFixed(6);
      document.getElementById('f-lng').value = lng.toFixed(6);
      MapModule.setTempPin(lat, lng);
    }
    // Form is opened by the caller (openForm() in app.js)
  }

  function openEdit(id) {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;
    editingId = id;
    document.getElementById('form-title').textContent = 'Edit Incident';
    populateForm(inc);
    // Open the slide-in form directly
    const form = document.getElementById('panel-form');
    if (form) form.classList.add('active');
  }

  function populateForm(inc) {
    document.getElementById('f-road').value         = inc.road || '';
    document.getElementById('f-route').value        = inc.routeNumber || '';
    document.getElementById('f-municipality').value = inc.municipality || '';
    document.getElementById('f-lat').value          = inc.lat || '';
    document.getElementById('f-lng').value          = inc.lng || '';
    document.getElementById('f-datetime').value     = inc.dateTime?.slice(0,16) || '';
    document.getElementById('f-ramp').value         = inc.rampType || '';
    document.getElementById('f-direction').value    = inc.travelDirection || '';
    document.getElementById('f-severity').value     = inc.severity || '';
    document.getElementById('f-vehicles').value     = inc.vehiclesInvolved || 1;
    document.getElementById('f-speedlimit').value   = inc.postedSpeedLimit || '';
    document.getElementById('f-lighting').value     = inc.lightingCondition || '';
    document.getElementById('f-weather').value      = inc.weatherCondition || '';
    document.getElementById('f-alcohol').checked    = !!inc.alcoholInvolved;
    document.getElementById('f-notes').value        = inc.notes || '';
    // multi-select countermeasures
    const cmSel = document.getElementById('f-countermeasures');
    Array.from(cmSel.options).forEach(opt => {
      opt.selected = (inc.countermeasures || []).includes(opt.value);
    });
  }

  function clearFormFields() {
    document.getElementById('incident-form')?.reset();
  }

  function saveIncident() {
    const cms = Array.from(document.getElementById('f-countermeasures').selectedOptions).map(o => o.value);
    const lat = parseFloat(document.getElementById('f-lat').value);
    const lng = parseFloat(document.getElementById('f-lng').value);
    const dt  = document.getElementById('f-datetime').value;

    const inc = {
      id:               editingId || generateId(),
      dateTime:         dt,
      road:             document.getElementById('f-road').value,
      routeNumber:      document.getElementById('f-route').value,
      municipality:     document.getElementById('f-municipality').value,
      lat:              isNaN(lat) ? 37.43 : lat,
      lng:              isNaN(lng) ? -78.65 : lng,
      rampType:         document.getElementById('f-ramp').value,
      travelDirection:  document.getElementById('f-direction').value,
      severity:         document.getElementById('f-severity').value,
      vehiclesInvolved: parseInt(document.getElementById('f-vehicles').value) || 1,
      postedSpeedLimit: parseInt(document.getElementById('f-speedlimit').value) || 55,
      lightingCondition:document.getElementById('f-lighting').value,
      weatherCondition: document.getElementById('f-weather').value,
      timeCategory:     computeTimeCategory(dt),
      alcoholInvolved:  document.getElementById('f-alcohol').checked,
      countermeasures:  cms,
      notes:            document.getElementById('f-notes').value
    };

    if (editingId) {
      const idx = incidents.findIndex(i => i.id === editingId);
      if (idx !== -1) incidents[idx] = inc;
    } else {
      incidents.unshift(inc);
    }

    MapModule.clearTempPin();
    closeForm();
    applyFilters();
    if (onChangeCallback) onChangeCallback(incidents);
  }

  function deleteIncident(id) {
    if (!confirm(`Delete incident ${id}? This cannot be undone.`)) return;
    incidents = incidents.filter(i => i.id !== id);
    filtered  = filtered.filter(i => i.id !== id);
    renderTable();
    if (onChangeCallback) onChangeCallback(incidents);
  }

  function zoomTo(id) {
    MapModule.focusMarker(id);
    showPanel('panel-map');
  }

  function closeForm() {
    const form = document.getElementById('panel-form');
    if (form) form.classList.remove('active');
    MapModule.clearTempPin();
    editingId = null;
  }

  function computeTimeCategory(dt) {
    if (!dt) return 'Unknown';
    const h = new Date(dt).getHours();
    if (h >= 6 && h < 9)   return 'AM Peak';
    if (h >= 15 && h < 19) return 'PM Peak';
    if (h >= 22 || h < 6)  return 'Night';
    return 'Off-Peak';
  }

  function generateId() {
    const next = incidents.length + 1;
    return `WWD-${String(next).padStart(3,'0')}`;
  }

  // ── CSV Import ─────────────────────────────────────────────────────────────

  function setupImport() {
    const input = document.getElementById('csv-import-input');
    const dropzone = document.getElementById('csv-dropzone');
    if (!input || !dropzone) return;

    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) parseCSV(file);
    });
    dropzone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      if (input.files[0]) parseCSV(input.files[0]);
    });
  }

  function parseCSV(file) {
    const reader = new FileReader();
    reader.onload = evt => {
      const lines = evt.target.result.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,''));
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/"/g,''));
        if (vals.length < 3) continue;
        const row = {};
        headers.forEach((h, idx) => row[h] = vals[idx] || '');
        const inc = {
          id: row['id'] || generateId(),
          dateTime: row['dateTime'] || new Date().toISOString(),
          road: row['road'] || '',
          routeNumber: row['routeNumber'] || '',
          municipality: row['municipality'] || 'Other',
          lat: parseFloat(row['lat']) || 37.43,
          lng: parseFloat(row['lng']) || -78.65,
          rampType: row['rampType'] || 'entrance-ramp',
          travelDirection: row['travelDirection'] || 'SB',
          severity: row['severity'] || 'PDO',
          vehiclesInvolved: parseInt(row['vehiclesInvolved']) || 1,
          postedSpeedLimit: parseInt(row['postedSpeedLimit']) || 55,
          lightingCondition: row['lightingCondition'] || 'Dark - Not Lighted',
          weatherCondition: row['weatherCondition'] || 'Clear',
          timeCategory: computeTimeCategory(row['dateTime']),
          alcoholInvolved: row['alcoholInvolved'] === 'true' || row['alcoholInvolved'] === 'Yes',
          countermeasures: row['countermeasures'] ? row['countermeasures'].split('|') : [],
          notes: row['notes'] || ''
        };
        incidents.push(inc);
        imported++;
      }
      filtered = [...incidents];
      renderTable();
      if (onChangeCallback) onChangeCallback(incidents);
      showToast(`✅ Imported ${imported} incidents from CSV`);
    };
    reader.readAsText(file);
  }

  // ── CSV Export ─────────────────────────────────────────────────────────────

  function exportCSV() {
    const headers = ['id','dateTime','road','routeNumber','municipality','lat','lng','rampType',
      'travelDirection','severity','vehiclesInvolved','postedSpeedLimit','lightingCondition',
      'weatherCondition','timeCategory','alcoholInvolved','countermeasures','notes'];
    const rows = filtered.map(inc =>
      headers.map(h => {
        let v = inc[h];
        if (Array.isArray(v)) v = v.join('|');
        if (typeof v === 'boolean') v = v ? 'Yes' : 'No';
        return `"${String(v ?? '').replace(/"/g,'""')}"`;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WWD_Inventory_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 CSV exported successfully');
  }

  // ── Risk score injection ────────────────────────────────────────────────────

  function applyRiskScores(incidentRiskMap, clusters) {
    incidents.forEach(inc => {
      inc._riskScore = incidentRiskMap.get(inc.id) ?? null;
      const cl = clusters.find(c => c.incidents.some(i => i.id === inc.id));
      inc._riskLevel = cl?.riskLevel ?? '';
    });
    applyFilters();
  }

  function getIncidents() { return incidents; }

  return {
    init, renderTable, openAddForm, openEdit, deleteIncident, zoomTo,
    exportCSV, applyRiskScores, setupSort, getIncidents, applyFilters, setCountyFilter
  };
})();
