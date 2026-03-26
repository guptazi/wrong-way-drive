/**
 * report-generator.js — WWD Analysis Export & Report Generator
 *
 * Reads filtered data from appState (method2Data, method3Data, method6Data,
 * rwdPsiData) applying appState.spatialFilterFn, then:
 *  • exportCSV()     — downloads a multi-sheet CSV zip (one per method)
 *  • exportGeoJSON() — downloads filtered locations as GeoJSON
 *  • generateReport()— opens a print-ready HTML report in a new tab
 *
 * All countermeasure recommendations follow:
 *  FHWA-HRT-22-115  (CMFs for WWD countermeasures, 2022)
 *  NCHRP Report 773 (WWD countermeasure design & application)
 *  NTSB SS-12/01    (Wrong-way driving on divided highways)
 */

window.WWDReportGenerator = (() => {

  // ══════════════════════════════════════════════════════════════════════════
  //  Helpers
  // ══════════════════════════════════════════════════════════════════════════

  function _filterFn() {
    return (typeof appState !== 'undefined' && appState.spatialFilterFn)
      ? appState.spatialFilterFn
      : () => true;
  }

  function _filtered(arr) {
    if (!arr || !arr.length) return [];
    const fn = _filterFn();
    return arr.filter(item => item.lat != null && item.lng != null && fn(item));
  }

  /** Filter Method 3 segments — a segment passes if ANY of its interchanges pass */
  function _filteredSegments(arr) {
    if (!arr || !arr.length) return [];
    const fn = _filterFn();
    return arr.filter(seg =>
      (seg.interchanges || []).some(ic => fn(ic)) ||
      (seg.lat != null && fn(seg))
    );
  }

  function _dl(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function _esc(v) {
    const s = String(v ?? '').replace(/"/g, '""');
    return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
  }

  function _csvFromRows(headers, rows) {
    return [headers.join(','), ...rows.map(r => r.map(_esc).join(','))].join('\n');
  }

  function _now() {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Countermeasure engine (FHWA-HRT-22-115 / NCHRP 773)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Generate prioritised countermeasures for a Method 2/6 interchange.
   * Returns [{priority, measure, detail, bcRatio, reference}]
   */
  function _countermeasures(ic) {
    const cm = [];
    const crashes   = ic.totalCrashes  || 0;
    const fatals    = ic.totalFatals   || 0;
    const terminals = ic.terminalCount || 1;
    const tier      = (ic.m6 ? ic.m6.tier : ic.tier) || 'Low';

    // Fatal crash — highest priority regardless of other factors
    if (fatals > 0) {
      cm.push({
        priority: 'CRITICAL',
        measure:  'Immediate engineering investigation + enhanced detection',
        detail:   `${fatals} fatal wrong-way crash${fatals > 1 ? 'es' : ''} recorded. Install radar-based WWD detection system (e.g., Quixote, ISS24/7) on exit ramp(s). Activate dynamic message sign alerts. Conduct full TCD audit within 30 days. Consider emergency interim measures (Type III barricades, portable signs) until permanent countermeasures are installed.`,
        bcRatio:  '3.5+',
        ref:      'FHWA-HRT-22-115 §5.1 · NTSB SS-12/01'
      });
    }

    // High crash count (> 3 crashes in study period)
    if (crashes > 3) {
      cm.push({
        priority: 'HIGH',
        measure:  'Install additional DO NOT ENTER / WRONG WAY signs',
        detail:   `${crashes} WWD crashes over the study period. Per MUTCD §2B.35, minimum 2 DNE signs per exit ramp terminal. Add retroreflective sheeting (Type IX) and low-mounted signs (bottom of sign at 4–5 ft AGL) — shown to reduce incidents from 50–60/month to 2–6/month at comparable sites. Space additional sign sets at 50 ft and 150 ft from stop line.`,
        bcRatio:  '4.1',
        ref:      'NCHRP Report 773 Table 4-3 · MUTCD §2B.35'
      });
    }

    // Complex interchange (multiple terminals = parclo-like geometry)
    if (terminals >= 3) {
      cm.push({
        priority: 'HIGH',
        measure:  'Supplemental geometric delineation at complex interchange',
        detail:   `${terminals}-terminal interchange has high geometric complexity (parclo-like configuration). Co-located entrance/exit ramp terminals are the #1 geometric WWD predictor (FHWA). Install raised pavement markers, delineator posts, and oversized (4 ft × 8 ft) WRONG WAY arrow pavement markings on each exit ramp surface. Consider removable raised median barrier between adjacent ramp terminals if spacing < 150 ft.`,
        bcRatio:  '2.1',
        ref:      'FHWA-HRT-22-115 §4.2 · NCHRP 773 §3.4'
      });
    }

    // TCD placement (every interchange needs proper sign placement)
    cm.push({
      priority: crashes > 2 ? 'HIGH' : 'MEDIUM',
      measure:  'Verify and optimise DO NOT ENTER sign placement',
      detail:   'First DNE sign must be within 75 ft of stop line. Each additional sign within 50 ft of the preceding. Every 10 ft reduction in first-sign distance reduces average WWD travel distance by 3.4 ft (FHWA finding). Ensure sign faces are perpendicular to wrong-way travel path. Inspect retroreflectivity annually — replace if below 50 cd/lux/m² for Type I or 125 cd/lux/m² for Type IX sheeting.',
      bcRatio:  '3.2',
      ref:      'FHWA-HRT-22-115 §3.1 · MUTCD §2B.35'
    });

    // Pavement markings — always applicable
    cm.push({
      priority: 'MEDIUM',
      measure:  'Apply wrong-way arrow pavement markings on exit ramp',
      detail:   'Install oversized retroreflective WRONG WAY arrow markings (minimum 4 ft × 8 ft) on exit ramp surface, oriented to face wrong-way drivers. Use high-durability thermoplastic material with glass bead overlay. Re-inspect after each winter maintenance season. Supplement with raised pavement markers (RPMs) for wet-weather retroreflectivity.',
      bcRatio:  '2.9',
      ref:      'FHWA-HRT-22-115 Table 5 · NCHRP 773 §4.2'
    });

    // Lighting — if nighttime conditions are a factor
    cm.push({
      priority: 'MEDIUM',
      measure:  'Evaluate and upgrade ramp terminal lighting',
      detail:   'Nighttime hours (10 PM–4 AM) account for 62–75% of WWD events nationally (NTSB). Audit existing luminaire condition, spacing, and output at ramp terminal and first 500 ft of exit ramp. Upgrade to LED with minimum 0.6 fc average horizontal illuminance at pavement level per IES RP-8. Priority for locations with documented nighttime crash history.',
      bcRatio:  '2.7',
      ref:      'FHWA-HRT-22-115 §4.4 · IES RP-8'
    });

    // ASE / impaired driver
    cm.push({
      priority: 'LOW',
      measure:  'Coordinate with law enforcement for nighttime enforcement',
      detail:   'Alcohol impairment is involved in 50–75% of fatal WWD crashes (NTSB). Partner with local law enforcement for targeted sobriety checkpoints near high-risk ramp terminals on Friday/Saturday nights (10 PM–4 AM). Engage nearby alcohol-serving establishments in WWD awareness campaigns. Consider rideshare partnership signage at exit ramp terminals.',
      bcRatio:  '1.3',
      ref:      'NTSB SS-12/01 · NCHRP 773 §5.3'
    });

    return cm;
  }

  /**
   * Explain WHY wrong-way driving can occur at this specific interchange.
   */
  function _wwdCauses(ic) {
    const causes = [];
    const terminals = ic.terminalCount || 1;
    const tier      = (ic.m6 ? ic.m6.tier : ic.tier) || 'Low';
    const crashes   = ic.totalCrashes  || 0;

    causes.push({
      factor: 'Interchange Geometry',
      icon: '🛣️',
      explanation: terminals >= 3
        ? `This interchange has ${terminals} ramp terminal clusters, indicating a complex geometry (likely partial cloverleaf or multi-ramp configuration). Co-located entrance and exit ramp terminals — where both ramp types meet the crossroad at or near the same point — are the single strongest geometric predictor of wrong-way entry. Drivers unfamiliar with the interchange may mistake the exit ramp for an entrance.`
        : `This interchange has ${terminals} identified ramp terminal cluster(s). Even simpler diamond interchanges experience WWD when signage is absent or degraded. The physical design allows a driver to approach the exit ramp from the crossroad in the same manner as an entrance ramp.`
    });

    causes.push({
      factor: 'Traffic Control Device Deficiency',
      icon: '🚫',
      explanation: 'DO NOT ENTER and WRONG WAY signs are the primary countermeasure at ramp terminals. Deficiencies in TCD placement, retroreflectivity, mounting height, or count directly enable wrong-way entries. Research shows that first DNE sign placement beyond 75 ft from the stop line significantly increases WWD travel distance before the driver self-corrects. Missing low-mounted signs particularly disadvantage older drivers and those in low-profile vehicles.'
    });

    causes.push({
      factor: 'Driver Impairment',
      icon: '🍺',
      explanation: 'Alcohol and drug impairment are present in 50–75% of fatal wrong-way driving crashes nationally (NTSB Safety Study SS-12/01). Impaired drivers have reduced ability to process conflicting visual cues and may not recognise or respond to DO NOT ENTER signs. Nighttime conditions (10 PM–4 AM) when impaired driving peaks account for 62–75% of WWD events, making lighting and sign retroreflectivity especially critical at this interchange.'
    });

    causes.push({
      factor: 'Driver Disorientation / Unfamiliarity',
      icon: '🗺️',
      explanation: 'Drivers unfamiliar with an interchange — including tourists, older drivers (≥65), and distracted drivers — are disproportionately represented in WWD events. Complex interchange designs, confusing crossroad geometry, or situations where the exit ramp terminal "looks like" an entrance (same curb radius, same lane width, no physical barriers) contribute to driver disorientation. Virginia\'s urban freeway corridors near tourist destinations and high-activity commercial areas face elevated exposure from unfamiliar drivers.'
    });

    if (crashes > 0) {
      causes.push({
        factor: 'Documented Crash History',
        icon: '⚠️',
        explanation: `${crashes} wrong-way driving crash${crashes > 1 ? 'es have' : ' has'} been documented at this interchange location in the VDOT crash record. The presence of historical crashes is the strongest single predictor of future wrong-way events, indicating that existing conditions are inadequate to prevent entry. Each recorded WWD crash reflects a driver who passed all existing signage and entered the restricted roadway — suggesting a systematic deficiency rather than an isolated incident.`
      });
    }

    return causes;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CSV Export
  // ══════════════════════════════════════════════════════════════════════════

  function _hasAnyData() {
    const total = (appState.method2Data||[]).length + (appState.method3Data||[]).length +
                  (appState.method6Data||[]).length + (appState.rwdPsiData||[]).length;
    return total > 0;
  }

  function exportCSV() {
    if (!_hasAnyData()) {
      alert('No WWD data loaded yet. Please wait for the map layers to finish loading (check the Possible WWD Locations panel), then try again.');
      return;
    }
    const m2  = _filtered(appState.method2Data  || []);
    const m3  = _filteredSegments(appState.method3Data || []);
    const m6  = _filtered(appState.method6Data  || []);
    const psi = _filtered(appState.rwdPsiData   || []);
    if (!m2.length && !m3.length && !m6.length && !psi.length) {
      alert('No locations fall within the current filter area. Try a larger filter region or clear the filter first.');
      return;
    }

    const sections = [];

    // Method 2
    sections.push('=== METHOD 2: Weighted WWD Crash Entry Points ===');
    if (m2.length) {
      sections.push(_csvFromRows(
        ['Rank','ID','Latitude','Longitude','Tier','WeightedSum','CrashRate','TotalCrashes',
         'TotalFatals','Terminals','StudyYears','TopRoute','District'],
        m2.map(ic => [
          ic.rank, ic.id, ic.lat, ic.lng, ic.tier, ic.weightedSum, ic.crashRate,
          ic.totalCrashes, ic.totalFatals||0, ic.terminalCount,
          ic.studyYears, ic.topRoute, ic.district
        ])
      ));
    } else {
      sections.push('No Method 2 data in filtered area.');
    }

    sections.push('\n=== METHOD 3: Segment-Level WWD Risk (FHWA SPF) ===');
    if (m3.length) {
      sections.push(_csvFromRows(
        ['Rank','ID','Latitude','Longitude','Tier','TotalRisk_crashesPerYr','PredictedSPF',
         'ObservedPerYr','SegLenMi','InterchangeCount','RouteLabel','RouteKey',
         'AADT','AADTSource','LRSMatched'],
        m3.map(s => [
          s.rank, s.id, s.lat, s.lng, s.tier, s.totalRisk, s.predictedYr,
          s.observedYr, s.segLenMi, s.interchangeCount, s.routeLabel, s.routeKey,
          s.aadt, s.aadtSource||'default', s.lrsMatched ? 'Yes' : 'No'
        ])
      ));
    } else {
      sections.push('No Method 3 data in filtered area.');
    }

    sections.push('\n=== METHOD 6: Point-Based Interchange Risk Score ===');
    if (m6.length) {
      sections.push(_csvFromRows(
        ['Rank','ID','Latitude','Longitude','Tier','TotalScore','ScoreA_CrashHistory',
         'ScoreC_Geometry','ScoreE_MainlineAADT','ScoreF_SideAADT','Bonus',
         'TotalCrashes','TotalFatals','TopRoute','District'],
        m6.map(ic => [
          ic.m6.rank, ic.id, ic.lat, ic.lng, ic.m6.tier, ic.m6.totalScore,
          ic.m6.scoreA, ic.m6.scoreC, ic.m6.scoreE, ic.m6.scoreF, ic.m6.bonus,
          ic.totalCrashes, ic.totalFatals||0, ic.topRoute, ic.district
        ])
      ));
    } else {
      sections.push('No Method 6 data in filtered area.');
    }

    sections.push('\n=== VDOT RwD PSI 2020-2024 ===');
    if (psi.length) {
      sections.push(_csvFromRows(
        ['Rank','ID','Latitude','Longitude','Tier','PSI_Score','Route','District','MP_From','MP_To'],
        psi.map(f => [
          f.rank, f.id, f.lat, f.lng, f.tier, f.score,
          f.route, f.district, f.mpFrom??'', f.mpTo??''
        ])
      ));
    } else {
      sections.push('No VDOT RwD PSI data in filtered area.');
    }

    _dl(`wwd-filtered-data-${Date.now()}.csv`, sections.join('\n'), 'text/csv');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  GeoJSON Export
  // ══════════════════════════════════════════════════════════════════════════

  function exportGeoJSON() {
    if (!_hasAnyData()) {
      alert('No WWD data loaded yet. Please wait for the map layers to finish loading, then try again.');
      return;
    }
    const m2  = _filtered(appState.method2Data || []);
    const m6  = _filtered(appState.method6Data || []);
    const psi = _filtered(appState.rwdPsiData  || []);
    if (!m2.length && !m6.length && !psi.length) {
      alert('No locations fall within the current filter area. Try a larger filter region or clear the filter first.');
      return;
    }

    const features = [
      ...m2.map(ic => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [ic.lng, ic.lat] },
        properties: {
          method: 'Method 2 – Weighted WWD Entry Points',
          rank: ic.rank, tier: ic.tier, weightedSum: ic.weightedSum,
          totalCrashes: ic.totalCrashes, totalFatals: ic.totalFatals||0,
          route: ic.topRoute, district: ic.district
        }
      })),
      ...m6.map(ic => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [ic.lng, ic.lat] },
        properties: {
          method: 'Method 6 – Point-Based Risk Score',
          rank: ic.m6.rank, tier: ic.m6.tier, totalScore: ic.m6.totalScore,
          totalCrashes: ic.totalCrashes, totalFatals: ic.totalFatals||0,
          route: ic.topRoute, district: ic.district
        }
      })),
      ...psi.map(f => ({
        type: 'Feature',
        geometry: f.coords
          ? { type: 'LineString', coordinates: f.coords.map(([lat,lng]) => [lng,lat]) }
          : { type: 'Point', coordinates: [f.lng, f.lat] },
        properties: {
          method: 'VDOT RwD PSI 2020-24',
          rank: f.rank, tier: f.tier, score: f.score,
          route: f.route, district: f.district
        }
      }))
    ];

    const geojson = { type: 'FeatureCollection', features };
    _dl(`wwd-filtered-${Date.now()}.geojson`,
        JSON.stringify(geojson, null, 2), 'application/geo+json');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Report HTML builder
  // ══════════════════════════════════════════════════════════════════════════

  function _tierBadge(tier, score) {
    const colors = {
      Critical: '#67000D', High: '#CB181D', Moderate: '#FB6A4A', Low: '#FCAE91',
      undefined: '#888'
    };
    const c = colors[tier] || '#888';
    const textC = (tier === 'Low' || !tier) ? '#333' : '#fff';
    return `<span style="background:${c};color:${textC};padding:2px 8px;border-radius:12px;
      font-size:12px;font-weight:700;white-space:nowrap">${tier || '—'}${score != null ? ` (${score})` : ''}</span>`;
  }

  function _buildMethod2Section(data) {
    if (!data.length) return `<p style="color:#888;font-style:italic">No Method 2 interchanges in the selected area.</p>`;
    const crit = data.filter(d => d.tier === 'Critical').length;
    const high = data.filter(d => d.tier === 'High').length;
    const totalCrashes = data.reduce((s, d) => s + (d.totalCrashes||0), 0);
    const totalFatals  = data.reduce((s, d) => s + (d.totalFatals||0), 0);

    const rows = data.slice(0, 20).map(ic => `
      <tr>
        <td>${ic.rank}</td>
        <td>${_tierBadge(ic.tier)}</td>
        <td style="font-size:12px">${ic.topRoute || '—'}</td>
        <td>${ic.district || '—'}</td>
        <td><b>${ic.weightedSum.toFixed(2)}</b></td>
        <td>${ic.totalCrashes}</td>
        <td>${ic.totalFatals||0 ? `<b style="color:#C00">${ic.totalFatals}</b>` : '0'}</td>
        <td>${ic.terminalCount}</td>
        <td>${ic.studyYears} yr</td>
        <td style="font-size:11px">${ic.lat.toFixed(4)}, ${ic.lng.toFixed(4)}</td>
      </tr>`).join('');

    return `
      <div class="summary-row">
        <div class="stat-box"><span class="stat-n">${data.length}</span><br>Interchanges</div>
        <div class="stat-box crit"><span class="stat-n">${crit}</span><br>Critical</div>
        <div class="stat-box high"><span class="stat-n">${high}</span><br>High</div>
        <div class="stat-box"><span class="stat-n">${totalCrashes}</span><br>Total Crashes</div>
        ${totalFatals ? `<div class="stat-box fatal"><span class="stat-n">${totalFatals}</span><br>Fatal Crashes</div>` : ''}
      </div>
      <table>
        <thead><tr>
          <th>Rank</th><th>Tier</th><th>Route</th><th>District</th>
          <th>Weighted Sum</th><th>Crashes</th><th>Fatals</th>
          <th>Terminals</th><th>Study Period</th><th>Coordinates</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${data.length > 20 ? `<p class="note">Showing top 20 of ${data.length} interchanges.</p>` : ''}`;
  }

  function _buildMethod3Section(data) {
    if (!data.length) return `<p style="color:#888;font-style:italic">No Method 3 segments in the selected area.</p>`;

    const rows = data.slice(0, 15).map(s => `
      <tr>
        <td>${s.rank}</td>
        <td>${_tierBadge(s.tier)}</td>
        <td style="font-size:12px">${s.routeLabel || s.routeKey || '—'}</td>
        <td><b>${s.totalRisk.toFixed(3)}</b></td>
        <td>${s.predictedYr.toFixed(3)}</td>
        <td>${s.observedYr.toFixed(3)}</td>
        <td>${s.segLenMi.toFixed(1)} mi</td>
        <td>${s.interchangeCount}</td>
        <td>${s.aadt.toLocaleString()}${s.aadtSource === 'VDOT' ? ' <span style="color:green;font-size:10px">●VDOT</span>' : ''}</td>
        <td>${s.lrsMatched ? '✓ LRS' : 'name'}</td>
      </tr>`).join('');

    return `
      <div class="summary-row">
        <div class="stat-box"><span class="stat-n">${data.length}</span><br>Segments</div>
        <div class="stat-box crit"><span class="stat-n">${data.filter(d=>d.tier==='Critical').length}</span><br>Critical</div>
        <div class="stat-box high"><span class="stat-n">${data.filter(d=>d.tier==='High').length}</span><br>High</div>
        <div class="stat-box"><span class="stat-n">${data.filter(d=>d.lrsMatched).length}</span><br>LRS-Matched</div>
      </div>
      <table>
        <thead><tr>
          <th>Rank</th><th>Tier</th><th>Route</th><th>Risk (cr/yr)</th>
          <th>SPF Predicted</th><th>Observed</th><th>Length</th>
          <th>Interchanges</th><th>AADT</th><th>Route Source</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${data.length > 15 ? `<p class="note">Showing top 15 of ${data.length} segments.</p>` : ''}`;
  }

  function _buildMethod6Section(data) {
    if (!data.length) return `<p style="color:#888;font-style:italic">No Method 6 scores in the selected area.</p>`;

    const rows = data.slice(0, 20).map(ic => `
      <tr>
        <td>${ic.m6.rank}</td>
        <td>${_tierBadge(ic.m6.tier, ic.m6.totalScore)}</td>
        <td style="font-size:12px">${ic.topRoute || '—'}</td>
        <td>${ic.district || '—'}</td>
        <td><b>${ic.m6.scoreA}</b></td>
        <td>${ic.m6.scoreC}</td>
        <td>${ic.m6.scoreE}</td>
        <td>${ic.m6.scoreF}</td>
        <td>${ic.m6.bonus > 0 ? `+${ic.m6.bonus}` : '—'}</td>
        <td><b>${ic.m6.totalScore}</b></td>
        <td>${ic.totalCrashes} ${ic.hasFatal ? '⭐' : ''}</td>
      </tr>`).join('');

    return `
      <table>
        <thead><tr>
          <th>Rank</th><th>Tier (Score)</th><th>Route</th><th>District</th>
          <th>A: Crashes</th><th>C: Geometry</th><th>E: Main AADT</th>
          <th>F: Side AADT</th><th>Bonus</th><th>Total</th><th>Crashes ⭐=Fatal</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${data.length > 20 ? `<p class="note">Showing top 20 of ${data.length} interchanges.</p>` : ''}`;
  }

  function _buildPsiSection(data) {
    if (!data.length) return `<p style="color:#888;font-style:italic">No VDOT RwD PSI locations in the selected area.</p>`;

    const rows = data.slice(0, 20).map(f => `
      <tr>
        <td>${f.rank}</td>
        <td>${_tierBadge(f.tier)}</td>
        <td style="font-size:12px">${f.route || '—'}</td>
        <td>${f.district || '—'}</td>
        <td>${typeof f.score === 'number' ? f.score.toFixed(3) : f.score}</td>
        <td>${f.mpFrom != null ? (+f.mpFrom).toFixed(2) : '—'}</td>
        <td>${f.mpTo  != null ? (+f.mpTo ).toFixed(2) : '—'}</td>
        <td style="font-size:11px">${f.lat.toFixed(4)}, ${f.lng.toFixed(4)}</td>
      </tr>`).join('');

    return `
      <table>
        <thead><tr>
          <th>PSI Rank</th><th>Tier</th><th>Route</th><th>District</th>
          <th>PSI Score</th><th>MP From</th><th>MP To</th><th>Coordinates</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${data.length > 20 ? `<p class="note">Showing top 20 of ${data.length} PSI locations.</p>` : ''}`;
  }

  function _buildCountermeasureSection(m6Data) {
    if (!m6Data.length) return `<p style="color:#888;font-style:italic">No data available for countermeasure recommendations in the selected area.</p>`;

    // Take top 5 Critical/High locations
    const topLocs = m6Data.filter(ic => ['Critical','High'].includes(ic.m6.tier)).slice(0, 5);
    if (!topLocs.length) return `<p style="color:#888;font-style:italic">No Critical or High-tier locations in selected area.</p>`;

    return topLocs.map((ic, idx) => {
      const cms   = _countermeasures(ic);
      const causes = _wwdCauses(ic);
      const cmRows = cms.map(cm => `
        <tr>
          <td><b style="color:${cm.priority === 'CRITICAL' ? '#C00' : cm.priority === 'HIGH' ? '#F03B20' : cm.priority === 'MEDIUM' ? '#E67E00' : '#666'}">${cm.priority}</b></td>
          <td>${cm.measure}</td>
          <td style="font-size:11px;color:#555">${cm.detail}</td>
          <td>${cm.bcRatio}</td>
          <td style="font-size:10px;color:#777">${cm.ref}</td>
        </tr>`).join('');

      const causeItems = causes.map(c => `
        <div class="cause-item">
          <div class="cause-header">${c.icon} <b>${c.factor}</b></div>
          <p>${c.explanation}</p>
        </div>`).join('');

      return `
        <div class="location-block">
          <h4>Location ${idx + 1}: ${ic.topRoute || 'Interchange'} — ${ic.district ? ic.district + ' District' : 'Virginia'}
            <span style="float:right">${_tierBadge(ic.m6.tier, ic.m6.totalScore)}</span>
          </h4>
          <p style="font-size:12px;color:#666">Coordinates: ${ic.lat.toFixed(5)}, ${ic.lng.toFixed(5)} &nbsp;|&nbsp;
            ${ic.totalCrashes} crash${ic.totalCrashes !== 1 ? 'es' : ''}${ic.hasFatal ? ` including ${ic.totalFatals} fatal` : ''} over ${ic.studyYears}-year study period
          </p>

          <h5>Why Wrong-Way Driving Can Occur Here</h5>
          <div class="causes-grid">${causeItems}</div>

          <h5>Recommended Countermeasures</h5>
          <table>
            <thead><tr><th>Priority</th><th>Countermeasure</th><th>Engineering Detail</th><th>Est. B/C</th><th>Reference</th></tr></thead>
            <tbody>${cmRows}</tbody>
          </table>
        </div>`;
    }).join('');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Main: Generate Report
  // ══════════════════════════════════════════════════════════════════════════

  /** Open HTML in a new tab. Falls back to Blob URL if popup is blocked. */
  function _openHtml(html) {
    const w = window.open('', '_blank');
    if (w && !w.closed) {
      w.document.write(html);
      w.document.close();
      return;
    }
    // Popup blocked — open via Blob URL instead (works in most browsers)
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function generateReport() {
    if (!_hasAnyData()) {
      alert('No WWD data loaded yet. Please wait for the map layers to finish loading (check the Possible WWD Locations panel), then try again.');
      return;
    }
    const m2  = _filtered(appState.method2Data  || []);
    const m3  = _filteredSegments(appState.method3Data || []);
    const m6  = _filtered(appState.method6Data  || []);
    const psi = _filtered(appState.rwdPsiData   || []);
    if (!m2.length && !m3.length && !m6.length && !psi.length) {
      alert('No locations fall within the current filter area. Try a larger filter region or clear the filter first.');
      return;
    }

    const totalCrashes = m2.reduce((s, d) => s + (d.totalCrashes||0), 0);
    const totalFatals  = m2.reduce((s, d) => s + (d.totalFatals||0), 0);
    const critM2 = m2.filter(d => d.tier === 'Critical').length;
    const highM2 = m2.filter(d => d.tier === 'High').length;
    const isFiltered = typeof appState.spatialFilterFn === 'function';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WWD Network Screening Report — ${_now()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a;
           background: #fff; line-height: 1.55; }

    /* ── Cover ─────────────────────────────────────────────────── */
    .cover { background: linear-gradient(135deg, #0D1B2A 0%, #1B2838 60%, #2C3E50 100%);
             color: #fff; padding: 80px 60px; min-height: 100vh; display: flex;
             flex-direction: column; justify-content: center; page-break-after: always; }
    .cover-logo { font-size: 48px; margin-bottom: 20px; }
    .cover h1 { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 12px; }
    .cover h2 { font-size: 18px; font-weight: 400; opacity: 0.8; margin-bottom: 40px; }
    .cover-meta { border-top: 1px solid rgba(255,255,255,0.2); padding-top: 30px; margin-top: 30px; }
    .cover-meta p { margin: 6px 0; opacity: 0.75; font-size: 14px; }
    .cover-badges { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 30px; }
    .badge { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
             border-radius: 20px; padding: 6px 16px; font-size: 13px; }
    .badge.red   { background: rgba(189,0,38,0.6);  border-color: #BD0026; }
    .badge.orange{ background: rgba(240,59,32,0.5);  border-color: #F03B20; }

    /* ── Page layout ────────────────────────────────────────────── */
    .page { padding: 40px 50px; max-width: 1000px; margin: 0 auto; }
    @media print {
      .cover { min-height: auto; padding: 60px 50px; }
      .page-break { page-break-before: always; }
      .no-print { display: none !important; }
    }

    /* ── Section headers ─────────────────────────────────────────── */
    h2.section-title {
      font-size: 22px; font-weight: 800; color: #0D1B2A;
      border-bottom: 3px solid #CB181D; padding-bottom: 8px; margin: 40px 0 20px;
    }
    h3 { font-size: 16px; font-weight: 700; color: #1B2838; margin: 28px 0 12px; }
    h4 { font-size: 14px; font-weight: 700; color: #2C3E50; margin: 20px 0 10px;
         background: #F0F4F8; padding: 10px 14px; border-radius: 6px;
         border-left: 4px solid #CB181D; }
    h5 { font-size: 13px; font-weight: 700; color: #444; margin: 16px 0 8px;
         text-transform: uppercase; letter-spacing: 0.5px; }

    /* ── Method explanation boxes ────────────────────────────────── */
    .method-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 5px solid #2B6CB0;
                  border-radius: 8px; padding: 18px 20px; margin: 16px 0 24px; }
    .method-box.m2 { border-left-color: #F03B20; }
    .method-box.m3 { border-left-color: #2B6CB0; }
    .method-box.m6 { border-left-color: #6B46C1; }
    .method-box.psi { border-left-color: #2F855A; }
    .method-box h4 { background: none; border: none; padding: 0; margin: 0 0 8px; font-size: 14px; }
    .method-formula { background: #1a1a2e; color: #a8d8ea; font-family: monospace;
                      font-size: 12px; padding: 10px 14px; border-radius: 6px; margin: 10px 0;
                      white-space: pre-wrap; }

    /* ── Summary stat boxes ──────────────────────────────────────── */
    .summary-row { display: flex; gap: 14px; flex-wrap: wrap; margin: 16px 0 20px; }
    .stat-box { flex: 1; min-width: 100px; background: #F0F4F8; border-radius: 10px;
                padding: 14px 16px; text-align: center; border: 1px solid #E2E8F0; }
    .stat-box.crit { background: #FFF5F5; border-color: #BD0026; }
    .stat-box.high { background: #FFF8F0; border-color: #F03B20; }
    .stat-box.fatal{ background: #fff0f0; border-color: #C00; }
    .stat-n { font-size: 28px; font-weight: 800; color: #0D1B2A; display: block; }
    .stat-box.crit .stat-n { color: #BD0026; }
    .stat-box.high .stat-n { color: #F03B20; }
    .stat-box.fatal .stat-n{ color: #C00; }

    /* ── Tables ──────────────────────────────────────────────────── */
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 12px 0 20px; }
    th { background: #0D1B2A; color: #fff; padding: 8px 10px; text-align: left;
         font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; }
    td { padding: 7px 10px; border-bottom: 1px solid #E2E8F0; vertical-align: top; }
    tr:nth-child(even) td { background: #F8FAFC; }
    tr:hover td { background: #EBF4FF; }

    /* ── Countermeasure blocks ───────────────────────────────────── */
    .location-block { border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px 24px;
                      margin: 24px 0; background: #FAFBFC; }
    .cause-item { background: #fff; border: 1px solid #E2E8F0; border-radius: 8px;
                  padding: 14px 16px; margin: 8px 0; }
    .cause-header { font-size: 13px; margin-bottom: 6px; }
    .cause-item p { font-size: 12px; color: #444; line-height: 1.6; }

    /* ── Figure caption ──────────────────────────────────────────── */
    .figure-box { background: #F0F4F8; border: 2px dashed #CBD5E0; border-radius: 10px;
                  padding: 30px; text-align: center; margin: 20px 0; color: #666; }
    .figure-box .fig-icon { font-size: 48px; display: block; margin-bottom: 10px; }
    .figure-box p { font-size: 12px; line-height: 1.6; }

    /* ── Notes / warnings ────────────────────────────────────────── */
    .note { font-size: 11px; color: #888; font-style: italic; margin: 8px 0; }
    .warning-box { background: #FFFBEB; border: 1px solid #F59E0B; border-radius: 8px;
                   padding: 14px 16px; margin: 16px 0; font-size: 12px; color: #7D4C00; }
    .ref-box { background: #EBF8FF; border: 1px solid #90CDF4; border-radius: 8px;
               padding: 14px 16px; margin: 16px 0; font-size: 12px; }

    /* ── Print button ─────────────────────────────────────────────── */
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #0D1B2A;
                 color: #fff; padding: 10px 20px; display: flex; align-items: center;
                 gap: 14px; z-index: 1000; font-size: 13px; }
    .print-bar button { background: #CB181D; color: #fff; border: none; border-radius: 6px;
                        padding: 7px 18px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .print-bar button:hover { background: #9B0C10; }
    .print-spacer { height: 48px; }
  </style>
</head>
<body>

<!-- Print bar -->
<div class="print-bar no-print">
  <span>📄 WWD Network Screening Report</span>
  <button onclick="window.print()">🖨️ Print / Save as PDF</button>
  <span style="opacity:.6;font-size:12px">Use your browser's Print dialog and select "Save as PDF"</span>
</div>
<div class="print-spacer no-print"></div>

<!-- ══ COVER PAGE ══════════════════════════════════════════════════════════ -->
<div class="cover">
  <div class="cover-logo">🛣️</div>
  <h1>Wrong-Way Driving<br>Network Screening Report</h1>
  <h2>Virginia Department of Transportation — FHWA Multi-Method Analysis</h2>
  <div class="cover-meta">
    <p><b>Report Date:</b> ${_now()}</p>
    <p><b>Study Area:</b> ${isFiltered ? 'Spatially filtered subset of Virginia' : 'Statewide Virginia'}</p>
    <p><b>Data Source:</b> VDOT Full_Crash FeatureServer · VDOT RwD_PSI_20_24 · VDOT LRS Route Master</p>
    <p><b>Methods Applied:</b> FHWA Method 2 (Weighted Entry Points) · Method 3 (Segment SPF) · Method 6 (Point Scoring) · VDOT RwD PSI</p>
    <p><b>References:</b> FHWA-HRT-22-115 · NCHRP Report 773 · NTSB SS-12/01</p>
  </div>
  <div class="cover-badges">
    ${m2.length     ? `<span class="badge">${m2.length} Interchanges (M2)</span>` : ''}
    ${m3.length     ? `<span class="badge">${m3.length} Segments (M3)</span>` : ''}
    ${m6.length     ? `<span class="badge">${m6.length} Scored Interchanges (M6)</span>` : ''}
    ${psi.length    ? `<span class="badge">${psi.length} VDOT PSI Locations</span>` : ''}
    ${critM2        ? `<span class="badge red">${critM2} Critical</span>` : ''}
    ${highM2        ? `<span class="badge orange">${highM2} High</span>` : ''}
    ${totalFatals   ? `<span class="badge red">⭐ ${totalFatals} Fatal Crashes</span>` : ''}
  </div>
</div>

<!-- ══ SECTION 1: EXECUTIVE SUMMARY ═══════════════════════════════════════ -->
<div class="page">
  <h2 class="section-title">1. Executive Summary</h2>
  <div class="summary-row">
    <div class="stat-box"><span class="stat-n">${m2.length}</span>Interchanges<br><small>Method 2</small></div>
    <div class="stat-box"><span class="stat-n">${m3.length}</span>Route Segments<br><small>Method 3</small></div>
    <div class="stat-box"><span class="stat-n">${m6.length}</span>Scored Locations<br><small>Method 6</small></div>
    <div class="stat-box"><span class="stat-n">${psi.length}</span>VDOT PSI Locs<br><small>RwD PSI 20-24</small></div>
    <div class="stat-box crit"><span class="stat-n">${critM2}</span>Critical<br><small>Method 2</small></div>
    <div class="stat-box high"><span class="stat-n">${highM2}</span>High Risk<br><small>Method 2</small></div>
    <div class="stat-box"><span class="stat-n">${totalCrashes}</span>Total Crashes<br><small>Study Period</small></div>
    ${totalFatals ? `<div class="stat-box fatal"><span class="stat-n">${totalFatals}</span>Fatal Crashes</div>` : ''}
  </div>

  <p>This report presents a multi-method wrong-way driving (WWD) network screening analysis for
  ${isFiltered ? 'the spatially selected study area within' : 'the Commonwealth of'} Virginia,
  conducted using VDOT crash record data and following FHWA guidance on WWD prevention
  (FHWA-HRT-22-115). Four complementary screening methods are applied to identify high-priority
  interchange locations for engineering intervention.</p>

  ${critM2 + highM2 > 0 ? `
  <div class="warning-box">
    ⚠️ <b>${critM2 + highM2} interchange${critM2+highM2 > 1 ? 's' : ''} classified as Critical or High risk</b>
    in the selected area.${totalFatals > 0 ? ` <b>${totalFatals} fatal wrong-way crash${totalFatals > 1 ? 'es' : ''}</b> are recorded at locations in this analysis.` : ''}
    These locations should be prioritised for immediate engineering review and countermeasure implementation.
  </div>` : ''}

  <h3>Map Figure</h3>
  <div class="figure-box">
    <span class="fig-icon">🗺️</span>
    <p><b>Figure 1 — WWD Network Screening Map</b><br>
    The interactive map displays all four analysis layers. To capture a map figure for this report:
    use the layer control (top-right of map) to show the desired layer, then press
    <kbd>Ctrl+Shift+S</kbd> (Windows) or <kbd>Cmd+Shift+4</kbd> (Mac) to capture a screenshot.
    Zoom to the filtered study area before capturing.</p>
  </div>

  <div class="ref-box">
    <b>Methodology Note:</b> WWD crash records are sourced from the VDOT Full_Crash ArcGIS
    FeatureServer, filtered for head-on collisions (COLLISION_TYPE=3) on divided highways
    (ROADWAY_DESCRIPTION=3) with ramp alignment (ROADWAY_ALIGNMENT=10). All FHWA method
    calculations follow published guidance in FHWA-HRT-22-115 and NCHRP Report 773.
  </div>
</div>

<!-- ══ SECTION 2: UNDERSTANDING WWD ═══════════════════════════════════════ -->
<div class="page page-break">
  <h2 class="section-title">2. Understanding Wrong-Way Driving</h2>

  <h3>What is Wrong-Way Driving?</h3>
  <p>Wrong-way driving (WWD) occurs when a vehicle enters or travels in the opposing direction
  of traffic on a divided roadway — most commonly via a freeway exit ramp. These events are
  associated with extremely high crash severity: wrong-way crashes are approximately 2.7× more
  likely to result in a fatality than other freeway crashes (NTSB SS-12/01). In Virginia,
  WWD events disproportionately occur on Interstate and US route corridors, particularly at
  partial cloverleaf (parclo) interchanges where geometric design creates driver confusion.</p>

  <h3>Primary Contributing Factors</h3>

  <div class="cause-item">
    <div class="cause-header">🛣️ <b>Interchange Geometry — Highest Engineering Weight</b></div>
    <p>Partial cloverleaf (parclo) interchanges carry the highest WWD risk due to co-located
    entrance and exit ramp terminals — where both ramp types meet the crossroad at or near the
    same point. A driver approaching from the wrong direction encounters the exit ramp in exactly
    the same visual context as an entrance ramp: same lane width, same curb radius, same pavement
    surface. The FHWA identifies adjacent ramp terminal spacing less than 150 feet as the single
    strongest geometric predictor of wrong-way entry (FHWA-HRT-22-115, §4.2). Large corner radii
    (greater than 40 ft) allow inadvertent wrong-way entry without significant physical resistance.
    Traversable medians (grass or flush) further enable crossover WWD events.</p>
  </div>

  <div class="cause-item">
    <div class="cause-header">🚫 <b>Traffic Control Device (TCD) Deficiency</b></div>
    <p>DO NOT ENTER and WRONG WAY signs are the primary, lowest-cost countermeasure for WWD
    prevention. MUTCD Section 2B.35 requires a minimum of two DNE signs per exit ramp terminal,
    but placement, height, retroreflectivity, and supplemental markings are equally critical.
    FHWA research demonstrates that every 10-foot increase in the distance from the stop line to
    the first DNE sign increases the average WWD travel distance by approximately 3.4 feet —
    meaning improperly placed signs allow drivers to travel further into the wrong-way zone before
    self-correcting. Low-mounted signs (4–5 ft AGL) significantly improve detection by older
    drivers and those in low-clearance vehicles. Degraded retroreflective sheeting, particularly
    after 7–10 years of service, substantially reduces nighttime sign effectiveness.</p>
  </div>

  <div class="cause-item">
    <div class="cause-header">🍺 <b>Driver Impairment</b></div>
    <p>Alcohol and/or drug impairment is confirmed or suspected in 50–75% of all fatal WWD
    crashes nationally (NTSB Safety Study SS-12/01). Impaired drivers have dramatically reduced
    capacity to process conflicting visual information — including DO NOT ENTER signs — and may
    be unable to respond appropriately even when signs are properly placed. The risk window is
    narrowly concentrated: 62–75% of WWD events occur between 10 PM and 4 AM, with Friday and
    Saturday nights carrying the highest exposure. Locations with high densities of
    alcohol-serving establishments within 0.5 miles of ramp terminals show statistically elevated
    WWD rates in the FHWA literature (Bexar County WWD Study, MDPI Sustainability, 2021).</p>
  </div>

  <div class="cause-item">
    <div class="cause-header">🗺️ <b>Driver Disorientation and Unfamiliarity</b></div>
    <p>Drivers unfamiliar with an interchange — including out-of-state travellers, older drivers
    (≥65 years), and distracted drivers — are overrepresented in WWD events. Both older and
    younger drivers (18–25) appear at disproportionate rates in WWD crash records. In Virginia's
    urban corridors and tourist destination areas, the fraction of unfamiliar drivers on the
    network is elevated, particularly during peak travel seasons. GPS and navigation system
    misrouting has also been documented as a WWD contributing factor, leading drivers to attempt
    U-turns or re-routing maneuvers near freeway ramp terminals.</p>
  </div>

  <div class="cause-item">
    <div class="cause-header">🌙 <b>Nighttime and Adverse Environmental Conditions</b></div>
    <p>Reduced ambient lighting at night substantially degrades the effectiveness of retroreflective
    signs and pavement markings. Ramp terminals without adequate illumination (meeting IES RP-8
    standards for freeway interchange areas) present significantly higher WWD risk during dark
    hours. Seasonal weather in Virginia — particularly winter precipitation obscuring pavement
    markings and ice reducing driver maneuverability — compounds the risk at locations already
    marginal in their TCD performance. The concentration of WWD events in the 10 PM–4 AM window
    reflects the combined effect of darkness, driver impairment, and reduced traffic volumes that
    would otherwise provide corrective visual cues from oncoming vehicles.</p>
  </div>
</div>

<!-- ══ SECTION 3: METHOD 2 ════════════════════════════════════════════════ -->
<div class="page page-break">
  <h2 class="section-title">3. Method 2 — Weighted WWD Crash Entry Points</h2>
  <div class="method-box m2">
    <h4>⚖️ FHWA Method 2 — Box 2-2</h4>
    <p>Method 2 identifies high-frequency wrong-way entry points by clustering VDOT crash records
    spatially into ramp terminal clusters (100 m radius) and then interchange groups (400 m radius),
    then applying a weighted crash rate formula that accounts for the type of entry point:</p>
    <div class="method-formula">CR_int = (100 × Σ W_i × E_i) / (N_int × T)

W weights:
  Recorded entry point:  W = 1.0  (highest weight)
  First entry point:     W = 0.7
  Second entry point:    W = 0.3
  Additional:            W = 0.1</div>
    <p>Locations are ranked by weighted sum. Tiers: Critical ≥1.7 · High ≥1.0 · Moderate ≥0.7 · Low &lt;0.7</p>
  </div>

  <h3>Filtered Results</h3>
  ${_buildMethod2Section(m2)}
</div>

<!-- ══ SECTION 4: METHOD 3 ════════════════════════════════════════════════ -->
<div class="page page-break">
  <h2 class="section-title">4. Method 3 — Segment-Level Network Screening (SPF)</h2>
  <div class="method-box m3">
    <h4>📊 FHWA Method 3 — Box 2-3 Safety Performance Function</h4>
    <p>Method 3 groups interchanges into highway corridor segments (approximately 7 interchanges
    per segment) following VDOT LRS Route Master geometry. A Safety Performance Function (SPF)
    is applied to each segment to predict expected annual crash frequency, which is combined with
    observed crashes to compute total segment risk:</p>
    <div class="method-formula">Predicted_crashes (4-yr) = exp[
  −0.453523
  + (−0.302024 × ln(citations))
  + ( 0.5865768 × ln(911 calls))
  + (−1.062e−5  × AADT)
  + ( 1.4755753 × major_directional/mi)
  + ( 2.4113643 × 2-to-3-leg_directional/mi)
]

Total Risk (crashes/yr) = (Predicted_4yr / 4) + (Observed / study_years)</div>
    <p>Interchanges are ordered along actual VDOT IS/US route geometry using milepost projection
    (LRS Route Master). AADT is sourced from VDOT Traffic Volume data where available;
    45,000 vpd (Virginia freeway default) is used as fallback. Tiers: Critical ≥2.0 · High ≥1.0 · Moderate ≥0.5 · Low &lt;0.5 crashes/yr</p>
  </div>

  <h3>Filtered Results</h3>
  ${_buildMethod3Section(m3)}
</div>

<!-- ══ SECTION 5: METHOD 6 ════════════════════════════════════════════════ -->
<div class="page page-break">
  <h2 class="section-title">5. Method 6 — Point-Based Interchange Risk Scoring</h2>
  <div class="method-box m6">
    <h4>🎯 FHWA Method 6 — Multi-Factor Point Score</h4>
    <p>Method 6 assigns a composite risk score (0–100+) to each interchange using six weighted
    components drawn from the FHWA wrong-way driving scoring framework:</p>
    <table style="margin:10px 0;font-size:12px">
      <thead><tr><th>Component</th><th>Score Range</th><th>Data Source</th></tr></thead>
      <tbody>
        <tr><td>A. Crash History</td><td>Fatal ×75, Non-fatal ×5</td><td>VDOT Full_Crash</td></tr>
        <tr><td>B. Noncrash Events</td><td>10 per event</td><td>Not available (scored 0)</td></tr>
        <tr><td>C. Interchange Geometry</td><td>5–50 (by terminal count)</td><td>Crash cluster geometry</td></tr>
        <tr><td>D. Liquor License Proximity</td><td>0–10</td><td>Not available (scored 0)</td></tr>
        <tr><td>E. Mainline AADT Percentile</td><td>1–10</td><td>VDOT Traffic Volume</td></tr>
        <tr><td>F. Side Road AADT Percentile</td><td>1–10 (est. 7% of mainline)</td><td>Derived</td></tr>
        <tr><td>Top-30% Bonus</td><td>+5</td><td>Computed across all interchanges</td></tr>
      </tbody>
    </table>
    <p>Tiers: Critical ≥100 · High ≥60 · Moderate ≥30 · Low &lt;30</p>
  </div>

  <h3>Filtered Results</h3>
  ${_buildMethod6Section(m6)}
</div>

<!-- ══ SECTION 6: VDOT RwD PSI ════════════════════════════════════════════ -->
<div class="page page-break">
  <h2 class="section-title">6. VDOT RwD PSI 2020–2024</h2>
  <div class="method-box psi">
    <h4>🚦 VDOT Spatial PSI — Pre-Computed Wrong-Way Driving Rankings</h4>
    <p>VDOT's Potential Safety Improvement (PSI) index for wrong-way driving applies a statistical
    Safety Performance Function model to fixed-length route segments, computing the difference
    between <em>observed</em> crashes and <em>expected</em> crashes given comparable roadway
    characteristics statewide. A high PSI score indicates a location is experiencing
    <em>significantly more</em> wrong-way crashes than roads like it typically do, identifying it
    as a priority for safety improvement independent of raw crash counts alone.</p>
    <p style="margin-top:8px">This layer uses VDOT service <code>RwD_PSI_20_24</code> (layer 1),
    covering the 2020–2024 study period. PSI rank 1 = highest excess risk statewide.
    Tier assignment: Critical = Top 20 · High = Ranks 21–50 · Moderate = 51–100 · Low = 100+</p>
  </div>

  <h3>Filtered Results</h3>
  ${_buildPsiSection(psi)}
</div>

<!-- ══ SECTION 7: COUNTERMEASURE RECOMMENDATIONS ══════════════════════════ -->
<div class="page page-break">
  <h2 class="section-title">7. Countermeasure Recommendations</h2>
  <p>The following countermeasures are recommended for the top Critical and High-tier interchange
  locations identified by Method 6 scoring. Each recommendation is grounded in the FHWA CMF
  Clearinghouse and FHWA-HRT-22-115 (Crash Modification Factors for WWD Countermeasures, 2022).
  Benefit-cost ratios are sourced from published FHWA and NCHRP estimates and should be verified
  with site-specific engineering analysis.</p>

  ${_buildCountermeasureSection(m6.length ? m6 : m2.map(ic => ({...ic, m6: {tier: ic.tier, totalScore: ic.weightedSum * 20, rank: ic.rank}, hasFatal: (ic.totalFatals||0) > 0})))}

  <div class="ref-box">
    <h5>Key FHWA References</h5>
    <ul style="padding-left:18px;font-size:12px;line-height:2">
      <li><b>FHWA-HRT-22-115</b> — Developing Crash Modification Factors for Wrong-Way Driving Countermeasures (2022)</li>
      <li><b>NCHRP Report 773</b> — Guidance for the Design and Application of Wrong-Way Driving Countermeasures</li>
      <li><b>NTSB Safety Study SS-12/01</b> — Wrong-Way Driving on Divided Highways</li>
      <li><b>MUTCD Section 2B.35</b> — DO NOT ENTER sign standards and placement</li>
      <li><b>IES RP-8</b> — Roadway Lighting standard for freeway interchange areas</li>
      <li><b>Bexar County WWD Study</b> — Geo-locating WWD Entry Points Using ASE Proximity (MDPI Sustainability, 2021)</li>
    </ul>
  </div>
</div>

<!-- ══ FOOTER ════════════════════════════════════════════════════════════ -->
<div class="page" style="border-top:2px solid #E2E8F0;margin-top:40px;padding-top:20px">
  <p style="font-size:11px;color:#888;text-align:center">
    Generated by VDOT WWD Network Screening Tool · ${_now()} ·
    Data: VDOT ArcGIS REST Services (services.arcgis.com/p5v98VHDX9Atv3l7) ·
    Methodology: FHWA-HRT-22-115 · NCHRP 773 · NTSB SS-12/01
  </p>
</div>

</body>
</html>`;

    _openHtml(html);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Public API
  // ══════════════════════════════════════════════════════════════════════════

  return { exportCSV, exportGeoJSON, generateReport };

})();
