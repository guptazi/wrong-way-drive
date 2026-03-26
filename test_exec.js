// Sample Wrong-Way Driving Incident Data for Virginia
// 25 realistic incidents across major Virginia corridors

const SAMPLE_DATA = [
  {
    id: 'WWD-001',
    dateTime: '2024-01-14T02:45:00',
    road: 'I-95 NB',
    routeNumber: 'I-95',
    municipality: 'Fairfax County',
    lat: 38.7551,
    lng: -77.2286,
    rampType: 'direct-connector',
    travelDirection: 'SB',
    severity: 'Fatal',
    vehiclesInvolved: 2,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: [],
    notes: 'Driver entered I-95 SB via NB on-ramp. Head-on collision resulted in fatality.',
    riskScore: null
  },
  {
    id: 'WWD-002',
    dateTime: '2024-01-28T22:15:00',
    road: 'I-395 NB',
    routeNumber: 'I-395',
    municipality: 'Arlington County',
    lat: 38.8516,
    lng: -77.0511,
    rampType: 'entrance-ramp',
    travelDirection: 'SB',
    severity: 'Injury',
    vehiclesInvolved: 2,
    postedSpeedLimit: 55,
    lightingCondition: 'Dark - Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: ['Enhanced Signage'],
    notes: 'Driver exited onto I-395 NB entrance ramp going wrong way. Sideswipe collision.',
    riskScore: null
  },
  {
    id: 'WWD-003',
    dateTime: '2024-02-03T01:30:00',
    road: 'I-64 WB',
    routeNumber: 'I-64',
    municipality: 'Virginia Beach',
    lat: 36.8529,
    lng: -76.0159,
    rampType: 'exit-ramp',
    travelDirection: 'EB',
    severity: 'Fatal',
    vehiclesInvolved: 3,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Rainy',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: [],
    notes: 'Multi-vehicle wrong-way incident on I-64. Driver entered via exit ramp.',
    riskScore: null
  },
  {
    id: 'WWD-004',
    dateTime: '2024-02-17T23:55:00',
    road: 'I-495 Inner Loop',
    routeNumber: 'I-495',
    municipality: 'Fairfax County',
    lat: 38.8304,
    lng: -77.1071,
    rampType: 'direct-connector',
    travelDirection: 'Outer Loop',
    severity: 'Near-Miss',
    vehiclesInvolved: 1,
    postedSpeedLimit: 55,
    lightingCondition: 'Dark - Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: false,
    countermeasures: ['Wrong-Way Detection System'],
    notes: 'Alert received from detection system; driver self-corrected after seeing flashing signals.',
    riskScore: null
  },
  {
    id: 'WWD-005',
    dateTime: '2024-03-08T03:10:00',
    road: 'I-264 EB',
    routeNumber: 'I-264',
    municipality: 'Norfolk',
    lat: 36.8507,
    lng: -76.2859,
    rampType: 'entrance-ramp',
    travelDirection: 'WB',
    severity: 'Injury',
    vehiclesInvolved: 2,
    postedSpeedLimit: 55,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Foggy',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: [],
    notes: 'Confused entry onto wrong ramp in foggy conditions. Minor injuries reported.',
    riskScore: null
  },
  {
    id: 'WWD-006',
    dateTime: '2024-03-22T21:40:00',
    road: 'I-81 SB',
    routeNumber: 'I-81',
    municipality: 'Roanoke County',
    lat: 37.2710,
    lng: -79.9414,
    rampType: 'exit-ramp',
    travelDirection: 'NB',
    severity: 'PDO',
    vehiclesInvolved: 1,
    postedSpeedLimit: 70,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: false,
    countermeasures: ['Pavement Markings'],
    notes: 'Driver entered exit ramp going wrong way. No collision, self-corrected.',
    riskScore: null
  },
  {
    id: 'WWD-007',
    dateTime: '2024-04-05T00:20:00',
    road: 'I-95 SB',
    routeNumber: 'I-95',
    municipality: 'Richmond City',
    lat: 37.5407,
    lng: -77.4360,
    rampType: 'direct-connector',
    travelDirection: 'NB',
    severity: 'Fatal',
    vehiclesInvolved: 2,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: [],
    notes: 'Head-on crash on I-95 SB. Driver proceeded north in southbound lanes from direct connector ramp.',
    riskScore: null
  },
  {
    id: 'WWD-008',
    dateTime: '2024-04-19T22:05:00',
    road: 'US-29 NB',
    routeNumber: 'US-29',
    municipality: 'Charlottesville',
    lat: 38.0293,
    lng: -78.4767,
    rampType: 'entrance-ramp',
    travelDirection: 'SB',
    severity: 'Injury',
    vehiclesInvolved: 2,
    postedSpeedLimit: 55,
    lightingCondition: 'Dark - Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: ['Enhanced Signage'],
    notes: 'Wrong-way entry near US-29 interchange. Enhanced signage present but insufficient.',
    riskScore: null
  },
  {
    id: 'WWD-009',
    dateTime: '2024-05-11T01:50:00',
    road: 'I-66 WB',
    routeNumber: 'I-66',
    municipality: 'Prince William County',
    lat: 38.7268,
    lng: -77.5428,
    rampType: 'exit-ramp',
    travelDirection: 'EB',
    severity: 'Near-Miss',
    vehiclesInvolved: 1,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: false,
    countermeasures: ['Wrong-Way Detection System', 'Enhanced Signage'],
    notes: 'Detection system activated; driver reversed out of ramp safely.',
    riskScore: null
  },
  {
    id: 'WWD-010',
    dateTime: '2024-05-30T23:15:00',
    road: 'I-295 NB',
    routeNumber: 'I-295',
    municipality: 'Chesterfield County',
    lat: 37.3382,
    lng: -77.3310,
    rampType: 'loop-ramp',
    travelDirection: 'SB',
    severity: 'Injury',
    vehiclesInvolved: 2,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: [],
    notes: 'Driver entered I-295 via loop ramp going wrong way. Rear-end collision, two injured.',
    riskScore: null
  },
  {
    id: 'WWD-011',
    dateTime: '2024-06-14T02:30:00',
    road: 'I-64 EB',
    routeNumber: 'I-64',
    municipality: 'Hampton',
    lat: 37.0299,
    lng: -76.3452,
    rampType: 'direct-connector',
    travelDirection: 'WB',
    severity: 'Fatal',
    vehiclesInvolved: 3,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: [],
    notes: 'Triple-vehicle wrong-way crash on I-64 EB. Two fatalities. Driver highly intoxicated.',
    riskScore: null
  },
  {
    id: 'WWD-012',
    dateTime: '2024-06-28T00:45:00',
    road: 'I-95 NB',
    routeNumber: 'I-95',
    municipality: 'Stafford County',
    lat: 38.4220,
    lng: -77.4083,
    rampType: 'entrance-ramp',
    travelDirection: 'SB',
    severity: 'PDO',
    vehiclesInvolved: 1,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: false,
    countermeasures: ['Pavement Markings'],
    notes: 'Driver entered wrong way but recovered after seeing road markings. No collision.',
    riskScore: null
  },
  {
    id: 'WWD-013',
    dateTime: '2024-07-19T22:00:00',
    road: 'I-395 SB',
    routeNumber: 'I-395',
    municipality: 'Arlington County',
    lat: 38.8630,
    lng: -77.0490,
    rampType: 'direct-connector',
    travelDirection: 'NB',
    severity: 'Injury',
    vehiclesInvolved: 2,
    postedSpeedLimit: 55,
    lightingCondition: 'Dark - Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: ['Enhanced Signage'],
    notes: 'Repeat wrong-way location on I-395 direct connector. Signage upgrade needed.',
    riskScore: null
  },
  {
    id: 'WWD-014',
    dateTime: '2024-08-02T03:20:00',
    road: 'I-77 NB',
    routeNumber: 'I-77',
    municipality: 'Carroll County',
    lat: 36.7201,
    lng: -80.7720,
    rampType: 'exit-ramp',
    travelDirection: 'SB',
    severity: 'Fatal',
    vehiclesInvolved: 2,
    postedSpeedLimit: 70,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Rainy',
    timeCategory: 'Night',
    alcoholInvolved: false,
    countermeasures: [],
    notes: 'Fatality crash on I-77 in heavy rain. Driver confused exit ramp as entry.',
    riskScore: null
  },
  {
    id: 'WWD-015',
    dateTime: '2024-08-23T01:10:00',
    road: 'I-81 NB',
    routeNumber: 'I-81',
    municipality: 'Augusta County',
    lat: 38.1589,
    lng: -79.0023,
    rampType: 'entrance-ramp',
    travelDirection: 'SB',
    severity: 'Injury',
    vehiclesInvolved: 2,
    postedSpeedLimit: 70,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: ['Retroreflective Delineators'],
    notes: 'Wrong-way entry on I-81 northbound. Driver appeared impaired. Two injuries.',
    riskScore: null
  },
  {
    id: 'WWD-016',
    dateTime: '2024-09-07T22:50:00',
    road: 'I-64 WB',
    routeNumber: 'I-64',
    municipality: 'Chesapeake',
    lat: 36.7682,
    lng: -76.2452,
    rampType: 'loop-ramp',
    travelDirection: 'EB',
    severity: 'Near-Miss',
    vehiclesInvolved: 1,
    postedSpeedLimit: 60,
    lightingCondition: 'Dark - Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: false,
    countermeasures: ['Enhanced Signage', 'Pavement Markings'],
    notes: 'Near-miss reported by motorist via 511 system. No crash occurred.',
    riskScore: null
  },
  {
    id: 'WWD-017',
    dateTime: '2024-09-28T00:05:00',
    road: 'I-495 Outer Loop',
    routeNumber: 'I-495',
    municipality: 'Fairfax County',
    lat: 38.8160,
    lng: -77.1246,
    rampType: 'direct-connector',
    travelDirection: 'Inner Loop',
    severity: 'Injury',
    vehiclesInvolved: 2,
    postedSpeedLimit: 55,
    lightingCondition: 'Dark - Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: ['Wrong-Way Detection System'],
    notes: 'Second incident at this I-495 direct connector. Existing detector did not trigger.',
    riskScore: null
  },
  {
    id: 'WWD-018',
    dateTime: '2024-10-13T02:40:00',
    road: 'I-95 SB',
    routeNumber: 'I-95',
    municipality: 'Fairfax County',
    lat: 38.7880,
    lng: -77.2100,
    rampType: 'exit-ramp',
    travelDirection: 'NB',
    severity: 'Fatal',
    vehiclesInvolved: 2,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: [],
    notes: 'Driver entered I-95 exit ramp going NB. Head-on with tractor-trailer. Fatality.',
    riskScore: null
  },
  {
    id: 'WWD-019',
    dateTime: '2024-11-01T23:30:00',
    road: 'VA-267 WB',
    routeNumber: 'VA-267',
    municipality: 'Loudoun County',
    lat: 38.9592,
    lng: -77.4097,
    rampType: 'entrance-ramp',
    travelDirection: 'EB',
    severity: 'PDO',
    vehiclesInvolved: 1,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Foggy',
    timeCategory: 'Night',
    alcoholInvolved: false,
    countermeasures: ['Enhanced Signage'],
    notes: 'Driver entered Dulles Toll Road going wrong way in fog. No crash, self-corrected.',
    riskScore: null
  },
  {
    id: 'WWD-020',
    dateTime: '2024-11-22T01:15:00',
    road: 'I-66 EB',
    routeNumber: 'I-66',
    municipality: 'Fairfax County',
    lat: 38.8617,
    lng: -77.3497,
    rampType: 'direct-connector',
    travelDirection: 'WB',
    severity: 'Injury',
    vehiclesInvolved: 2,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: false,
    countermeasures: ['Pavement Markings'],
    notes: 'Wrong-way crash on I-66 direct connector. Driver fell asleep, drifted wrong way.',
    riskScore: null
  },
  {
    id: 'WWD-021',
    dateTime: '2024-12-06T02:55:00',
    road: 'I-95 NB',
    routeNumber: 'I-95',
    municipality: 'Fredericksburg',
    lat: 38.3032,
    lng: -77.4605,
    rampType: 'exit-ramp',
    travelDirection: 'SB',
    severity: 'Near-Miss',
    vehiclesInvolved: 1,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Lighted',
    weatherCondition: 'Snowy',
    timeCategory: 'Night',
    alcoholInvolved: false,
    countermeasures: ['Wrong-Way Detection System', 'Enhanced Signage'],
    notes: 'Detection system alerts prevented crash. Snow obscured pavement markings.',
    riskScore: null
  },
  {
    id: 'WWD-022',
    dateTime: '2024-12-20T00:10:00',
    road: 'I-64 EB',
    routeNumber: 'I-64',
    municipality: 'Norfolk',
    lat: 36.8850,
    lng: -76.2598,
    rampType: 'loop-ramp',
    travelDirection: 'WB',
    severity: 'Injury',
    vehiclesInvolved: 2,
    postedSpeedLimit: 55,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: [],
    notes: 'Wrong-way entry on I-64 loop ramp near Hampton Roads Bridge-Tunnel.',
    riskScore: null
  },
  {
    id: 'WWD-023',
    dateTime: '2025-01-10T03:00:00',
    road: 'I-95 SB',
    routeNumber: 'I-95',
    municipality: 'Prince William County',
    lat: 38.5854,
    lng: -77.3365,
    rampType: 'direct-connector',
    travelDirection: 'NB',
    severity: 'Fatal',
    vehiclesInvolved: 2,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: [],
    notes: 'Head-on fatality crash on I-95. High-priority countermeasure needed at this interchange.',
    riskScore: null
  },
  {
    id: 'WWD-024',
    dateTime: '2025-01-25T22:30:00',
    road: 'I-81 SB',
    routeNumber: 'I-81',
    municipality: 'Shenandoah County',
    lat: 38.9362,
    lng: -78.5075,
    rampType: 'entrance-ramp',
    travelDirection: 'NB',
    severity: 'PDO',
    vehiclesInvolved: 1,
    postedSpeedLimit: 70,
    lightingCondition: 'Dark - Not Lighted',
    weatherCondition: 'Clear',
    timeCategory: 'Night',
    alcoholInvolved: false,
    countermeasures: ['Pavement Markings', 'Enhanced Signage'],
    notes: 'Driver went wrong way on I-81 entrance. Reported to 911. No crash.',
    riskScore: null
  },
  {
    id: 'WWD-025',
    dateTime: '2025-02-14T01:45:00',
    road: 'I-295 SB',
    routeNumber: 'I-295',
    municipality: 'Henrico County',
    lat: 37.5821,
    lng: -77.3785,
    rampType: 'direct-connector',
    travelDirection: 'NB',
    severity: 'Injury',
    vehiclesInvolved: 2,
    postedSpeedLimit: 65,
    lightingCondition: 'Dark - Lighted',
    weatherCondition: 'Rainy',
    timeCategory: 'Night',
    alcoholInvolved: true,
    countermeasures: ['Retroreflective Delineators'],
    notes: 'Injury crash on I-295. Rain and reduced visibility contributed. Delineators insufficient.',
    riskScore: null
  }
];

/**
 * risk.js – WWD Risk Scoring & Location Suggestion Engine
 * Computes a 0-100 composite risk score per geographic cluster
 * and generates prioritized countermeasure recommendations.
 */

const RiskEngine = (() => {

  // ── Weight table for scoring factors ──────────────────────────────────────
  const WEIGHTS = {
    frequency:       0.30,
    severityIndex:   0.25,
    nightRatio:      0.15,
    alcoholRatio:    0.10,
    rampRisk:        0.10,
    noCountermeasure:0.10
  };

  // Ramp type base risk (0-1)
  const RAMP_RISK = {
    'direct-connector': 1.0,
    'exit-ramp':        0.75,
    'loop-ramp':        0.60,
    'entrance-ramp':    0.50
  };

  // Severity weights
  const SEVERITY_WEIGHT = { Fatal: 4, Injury: 2, PDO: 1, 'Near-Miss': 0.3 };

  // Countermeasure baseline scores (lower = better)
  const COUNTERMEASURE_EFFECTIVENESS = {
    'Wrong-Way Detection System': 0.85,
    'Enhanced Signage':           0.55,
    'Pavement Markings':          0.45,
    'Retroreflective Delineators':0.40,
    'Lighting Upgrade':           0.30,
    'Ramp Geometry Modification': 0.70
  };

  /**
   * Cluster incidents by proximity (within ~300m radius)
   * Returns array of { key, incidents, lat, lng }
   */
  function clusterByLocation(incidents) {
    const clusters = [];
    incidents.forEach(inc => {
      const existing = clusters.find(c =>
        haversine(c.lat, c.lng, inc.lat, inc.lng) < 0.3
      );
      if (existing) {
        existing.incidents.push(inc);
        existing.lat = (existing.lat * (existing.incidents.length - 1) + inc.lat) / existing.incidents.length;
        existing.lng = (existing.lng * (existing.incidents.length - 1) + inc.lng) / existing.incidents.length;
      } else {
        clusters.push({
          key: `cluster_${clusters.length + 1}`,
          road: inc.road,
          routeNumber: inc.routeNumber,
          municipality: inc.municipality,
          lat: inc.lat,
          lng: inc.lng,
          incidents: [inc]
        });
      }
    });
    return clusters;
  }

  /**
   * Haversine distance in km
   */
  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  /**
   * Score a single cluster of incidents
   */
  function scoreCluster(cluster) {
    const incs = cluster.incidents;
    const n = incs.length;

    // 1. Frequency score (log-normalized, max refs = 5+)
    const freqScore = Math.min(n / 5, 1.0);

    // 2. Severity index
    const totalSev = incs.reduce((sum, i) => sum + (SEVERITY_WEIGHT[i.severity] || 0), 0);
    const maxSev = n * 4; // all fatals
    const sevScore = Math.min(totalSev / maxSev, 1.0);

    // 3. Night-time ratio
    const nightCount = incs.filter(i => i.timeCategory === 'Night').length;
    const nightScore = nightCount / n;

    // 4. Alcohol ratio
    const alcCount = incs.filter(i => i.alcoholInvolved).length;
    const alcScore = alcCount / n;

    // 5. Ramp risk (average)
    const rampScore = incs.reduce((sum, i) => sum + (RAMP_RISK[i.rampType] || 0.5), 0) / n;

    // 6. Missing countermeasures
    const noCounterScore = incs.filter(i => !i.countermeasures || i.countermeasures.length === 0).length / n;

    // Weighted composite
    const raw =
      WEIGHTS.frequency       * freqScore +
      WEIGHTS.severityIndex   * sevScore +
      WEIGHTS.nightRatio      * nightScore +
      WEIGHTS.alcoholRatio    * alcScore +
      WEIGHTS.rampRisk        * rampScore +
      WEIGHTS.noCountermeasure* noCounterScore;

    const riskScore = Math.round(raw * 100);

    let riskLevel;
    if (riskScore >= 75) riskLevel = 'Critical';
    else if (riskScore >= 50) riskLevel = 'High';
    else if (riskScore >= 25) riskLevel = 'Moderate';
    else riskLevel = 'Low';

    return {
      ...cluster,
      riskScore,
      riskLevel,
      factors: { freqScore, sevScore, nightScore, alcScore, rampScore, noCounterScore },
      recommendations: generateRecommendations(cluster, riskLevel, { nightScore, alcScore, rampScore, noCounterScore })
    };
  }

  /**
   * Generate prioritized countermeasure recommendations
   */
  function generateRecommendations(cluster, riskLevel, factors) {
    const recs = [];
    const existingCounters = new Set(
      cluster.incidents.flatMap(i => i.countermeasures || [])
    );

    // Detection system
    if (!existingCounters.has('Wrong-Way Detection System') && riskLevel !== 'Low') {
      recs.push({
        priority: riskLevel === 'Critical' ? 'Immediate' : 'High',
        type: 'Wrong-Way Detection System',
        description: 'Install radar/LIDAR detection system with automated alerts to TMC and dynamic message signs (DMS).',
        icon: '🚨',
        fhwaGuidance: 'FHWA-SA-12-025'
      });
    }

    // Enhanced signage
    if (!existingCounters.has('Enhanced Signage')) {
      recs.push({
        priority: 'High',
        type: 'Enhanced Signage Package',
        description: 'Install R5-1 DO NOT ENTER and R5-1a WRONG WAY signs with retroreflective sheeting (Type IX or higher). Add overhead-mounted signs at ramp gores.',
        icon: '🪧',
        fhwaGuidance: 'MUTCD 2009 Rev. 3'
      });
    }

    // Pavement markings
    if (!existingCounters.has('Pavement Markings')) {
      recs.push({
        priority: 'Medium',
        type: 'Pavement Marking Enhancement',
        description: 'Apply large directional arrows, red retroreflective raised pavement markers (RRPMs), and transverse striping at ramp entry.',
        icon: '🔴',
        fhwaGuidance: 'MUTCD Section 3B'
      });
    }

    // Night/lighting factor
    if (factors.nightScore > 0.8 && !existingCounters.has('Lighting Upgrade')) {
      recs.push({
        priority: 'Medium',
        type: 'Lighting Upgrade',
        description: 'Improve ramp and gore area lighting to ANSI/IES RP-8 standards. High night-time incident ratio detected.',
        icon: '💡',
        fhwaGuidance: 'AASHTO Roadway Lighting Guide'
      });
    }

    // Alcohol factor
    if (factors.alcScore > 0.6) {
      recs.push({
        priority: 'Medium',
        type: 'Law Enforcement Coordination',
        description: 'Coordinate with local law enforcement for targeted DUI patrols at this corridor during 10PM–4AM window.',
        icon: '🚔',
        fhwaGuidance: 'NHTSA Impaired Driving Program'
      });
    }

    // Direct connector ramp factor
    if (factors.rampScore > 0.8) {
      recs.push({
        priority: 'Low',
        type: 'Ramp Geometry Study',
        description: 'Commission a geometric design review (direct connector). Consider channelization or physical barriers to prevent wrong-way access.',
        icon: '📐',
        fhwaGuidance: 'AASHTO Green Book'
      });
    }

    return recs;
  }

  /**
   * Main API: compute risk scores for all incidents
   * Returns { clusters: [...], incidentRiskMap: Map<id, score> }
   */
  function compute(incidents) {
    if (!incidents || incidents.length === 0) return { clusters: [], incidentRiskMap: new Map() };

    const clusters = clusterByLocation(incidents);
    const scoredClusters = clusters.map(scoreCluster).sort((a,b) => b.riskScore - a.riskScore);

    // Map individual incidents to their cluster risk score
    const incidentRiskMap = new Map();
    scoredClusters.forEach(cluster => {
      cluster.incidents.forEach(inc => {
        incidentRiskMap.set(inc.id, cluster.riskScore);
      });
    });

    return { clusters: scoredClusters, incidentRiskMap };
  }

  return { compute, clusterByLocation, scoreCluster, haversine };
})();

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
      return true;
    });
    renderTable();
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
    exportCSV, applyRiskScores, setupSort, getIncidents, applyFilters
  };
})();

/**
 * charts.js – Chart.js Analytics Dashboard for WWD App
 */

const ChartsModule = (() => {

  const charts = {};

  function destroyChart(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
  }

  function renderAll(incidents, clusters) {
    renderSeverityPie(incidents);
    renderMunicipalityBar(incidents);
    renderMonthlyTrend(incidents);
    renderRampTypeDonut(incidents);
    renderTopRiskBar(clusters);
  }

  // 1. Severity Distribution (Pie)
  function renderSeverityPie(incidents) {
    const ctx = document.getElementById('chart-severity');
    if (!ctx) return;
    destroyChart('severity');

    const counts = { Fatal: 0, Injury: 0, PDO: 0, 'Near-Miss': 0 };
    incidents.forEach(i => { counts[i.severity] = (counts[i.severity] || 0) + 1; });

    charts['severity'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(counts),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: ['#FF4757','#FFA502','#FFDD59','#7BED9F'],
          borderColor: '#1a1f35',
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#c5cde3', font: { family: 'Inter', size: 11 }, padding: 12 } },
          title: { display: true, text: 'Severity Distribution', color: '#e8ecf5', font: { size: 14, family: 'Inter', weight: 600 }, padding: { bottom: 12 } }
        },
        cutout: '62%'
      }
    });
  }

  // 2. Incidents by Municipality (Horizontal Bar)
  function renderMunicipalityBar(incidents) {
    const ctx = document.getElementById('chart-municipality');
    if (!ctx) return;
    destroyChart('municipality');

    const counts = {};
    incidents.forEach(i => { counts[i.municipality] = (counts[i.municipality] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 10);

    charts['municipality'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(e => e[0]),
        datasets: [{
          label: 'Incidents',
          data: sorted.map(e => e[1]),
          backgroundColor: sorted.map((_, i) =>
            `hsl(${220 + i * 8}, 70%, ${65 - i * 3}%)`),
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Incidents by Jurisdiction (Top 10)', color: '#e8ecf5', font: { size: 14, family: 'Inter', weight: 600 }, padding: { bottom: 12 } }
        },
        scales: {
          x: { ticks: { color: '#8a93b0', font: { family: 'Inter' } }, grid: { color: '#2a3050' } },
          y: { ticks: { color: '#c5cde3', font: { family: 'Inter', size: 11 } }, grid: { display: false } }
        }
      }
    });
  }

  // 3. Monthly Trend (Line)
  function renderMonthlyTrend(incidents) {
    const ctx = document.getElementById('chart-trend');
    if (!ctx) return;
    destroyChart('trend');

    const monthly = {};
    incidents.forEach(i => {
      const key = i.dateTime?.slice(0,7); // YYYY-MM
      if (key) monthly[key] = (monthly[key] || 0) + 1;
    });
    const keys = Object.keys(monthly).sort();

    const fatalMonthly = {};
    incidents.filter(i => i.severity === 'Fatal').forEach(i => {
      const key = i.dateTime?.slice(0,7);
      if (key) fatalMonthly[key] = (fatalMonthly[key] || 0) + 1;
    });

    charts['trend'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: keys.map(k => {
          const [y, m] = k.split('-');
          return new Date(y, m-1).toLocaleString('en-US', { month:'short', year:'2-digit' });
        }),
        datasets: [
          {
            label: 'Total Incidents',
            data: keys.map(k => monthly[k] || 0),
            borderColor: '#5352ED',
            backgroundColor: 'rgba(83,82,237,0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#5352ED'
          },
          {
            label: 'Fatal Only',
            data: keys.map(k => fatalMonthly[k] || 0),
            borderColor: '#FF4757',
            backgroundColor: 'rgba(255,71,87,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#FF4757',
            borderDash: [4,3]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#c5cde3', font: { family: 'Inter' } } },
          title: { display: true, text: 'Monthly Incident Trend', color: '#e8ecf5', font: { size: 14, family: 'Inter', weight: 600 }, padding: { bottom: 12 } }
        },
        scales: {
          x: { ticks: { color: '#8a93b0', font:{family:'Inter'} }, grid: { color: '#2a3050' } },
          y: { ticks: { color: '#8a93b0', font:{family:'Inter'} }, grid: { color: '#2a3050' }, beginAtZero: true }
        }
      }
    });
  }

  // 4. Ramp Type Breakdown (Donut)
  function renderRampTypeDonut(incidents) {
    const ctx = document.getElementById('chart-ramp');
    if (!ctx) return;
    destroyChart('ramp');

    const counts = {};
    incidents.forEach(i => { counts[i.rampType] = (counts[i.rampType] || 0) + 1; });
    const labels = Object.keys(counts);

    charts['ramp'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: labels.map(l => counts[l]),
          backgroundColor: ['#FF6B6B','#FFA502','#5352ED','#2ED573'],
          borderColor: '#1a1f35',
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#c5cde3', font: { family: 'Inter', size: 11 }, padding: 10 } },
          title: { display: true, text: 'Ramp Type Breakdown', color: '#e8ecf5', font: { size: 14, family: 'Inter', weight: 600 }, padding: { bottom: 12 } }
        },
        cutout: '60%'
      }
    });
  }

  // 5. Top 10 High-Risk Locations (Bar)
  function renderTopRiskBar(clusters) {
    const ctx = document.getElementById('chart-risk-locations');
    if (!ctx) return;
    destroyChart('risk-locations');

    const top = clusters.slice(0, 10);

    charts['risk-locations'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top.map(c => c.road || c.routeNumber || 'Unknown'),
        datasets: [{
          label: 'Risk Score',
          data: top.map(c => c.riskScore),
          backgroundColor: top.map(c => {
            if (c.riskScore >= 75) return 'rgba(255,71,87,0.85)';
            if (c.riskScore >= 50) return 'rgba(255,165,2,0.85)';
            if (c.riskScore >= 25) return 'rgba(255,221,89,0.85)';
            return 'rgba(123,237,159,0.85)';
          }),
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Top High-Risk Locations (Risk Score)', color: '#e8ecf5', font: { size: 14, family: 'Inter', weight: 600 }, padding: { bottom: 12 } }
        },
        scales: {
          x: { ticks: { color: '#8a93b0', font:{ family:'Inter', size:10 }, maxRotation: 45 }, grid: { color: '#2a3050' } },
          y: { min: 0, max: 100, ticks: { color: '#8a93b0', font:{family:'Inter'} }, grid: { color: '#2a3050' } }
        }
      }
    });
  }

  return { renderAll };
})();

/**
 * map.js – Leaflet.js Map Module for WWD App
 * Handles base layers, incident markers, heatmap, cluster polygons
 */

const MapModule = (() => {

  let map = null;
  let markersLayer = null;
  let heatLayer = null;
  let riskPolygonsLayer = null;
  let clickCallback = null;
  let markerMap = {}; // id -> L.marker

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
  function init(containerId, onMapClick) {
    clickCallback = onMapClick;

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

    cartoDark.addTo(map); // default base layer

    // ── Overlay Layers ───────────────────────────────────────────────────────
    markersLayer = L.layerGroup().addTo(map);
    riskPolygonsLayer = L.layerGroup().addTo(map);

    // ── Layer Control ──────────────────────────────────────────────────────
    const baseLayers = {
      '🌑 Carto Dark': cartoDark,
      '🗺️ OSM Streets': osm,
      '🏙️ ESRI Streets': esriStreets,
      '🛰️ ESRI Satellite': esriSatellite
    };

    const overlays = {
      '📍 Incidents': markersLayer,
      '🔴 Risk Zones': riskPolygonsLayer
    };

    L.control.layers(baseLayers, overlays, { position: 'topright', collapsed: false }).addTo(map);

    // ── Scale bar ────────────────────────────────────────────────────────────
    L.control.scale({ imperial: true, metric: true }).addTo(map);

    // ── Map click → add incident ───────────────────────────────────────────
    map.on('click', e => {
      if (clickCallback) clickCallback(e.latlng.lat, e.latlng.lng);
    });
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

  return { init, renderMarkers, renderHeatmap, renderRiskZones, focusMarker, setTempPin, clearTempPin, getMap, setHighlightRowHandler };
})();

/**
 * app.js – WWD App Bootstrap & State Management
 */

// ── Global State ─────────────────────────────────────────────────────────────
let appState = {
  incidents: [],
  clusters: [],
  incidentRiskMap: new Map(),
  activePanel: 'panel-map',
  showHeatmap: false
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

// ── Main Init ──────────────────────────────────────────────────────────────────
function initApp() {

  // 1. Initialize map
  MapModule.init('map-container', (lat, lng) => {
    // Map click → pre-fill lat/lng and open form
    document.getElementById('f-lat').value = lat.toFixed(6);
    document.getElementById('f-lng').value = lng.toFixed(6);
    document.getElementById('form-title').textContent = 'Add New Incident';
    MapModule.setTempPin(lat, lng);
    document.getElementById('panel-form').classList.add('active');
  });

  // 2. Load data
  appState.incidents = JSON.parse(JSON.stringify(SAMPLE_DATA));

  // 3. Compute risk scores
  const { clusters, incidentRiskMap } = RiskEngine.compute(appState.incidents);
  appState.clusters = clusters;
  appState.incidentRiskMap = incidentRiskMap;

  // 4. Initialize inventory
  InventoryModule.init(appState.incidents, (updatedIncidents) => {
    appState.incidents = updatedIncidents;
    const result = RiskEngine.compute(appState.incidents);
    appState.clusters = result.clusters;
    appState.incidentRiskMap = result.incidentRiskMap;
    InventoryModule.applyRiskScores(result.incidentRiskMap, result.clusters);
    MapModule.renderMarkers(appState.incidents);
    MapModule.renderHeatmap(appState.incidents);
    MapModule.renderRiskZones(result.clusters);
    updateKPIs(appState.incidents, result.clusters);
  });

  InventoryModule.applyRiskScores(incidentRiskMap, clusters);

  // 5. Render map layers
  MapModule.renderMarkers(appState.incidents);
  MapModule.renderHeatmap(appState.incidents);
  MapModule.renderRiskZones(clusters);

  // 6. Update KPIs
  updateKPIs(appState.incidents, clusters);

  // 7. Wire navigation
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.addEventListener('click', () => {
      showPanel(nav.dataset.panel);
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      nav.classList.add('active');
    });
  });

  // 8. Wire buttons
  document.getElementById('btn-add-incident')?.addEventListener('click', () => {
    openForm();
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

