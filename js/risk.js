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
