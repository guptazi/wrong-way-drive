/**
 * arcgis-wwd.js – ArcGIS REST API service for Possible Wrong-Way Driving crash locations
 * Queries VDOT Full Crash FeatureServer for head-on collisions on divided highways at ramps
 * (strong indicator of wrong-way driving scenarios)
 */

const ArcGISWWD = (() => {

  const BASE_URL = 'https://services.arcgis.com/p5v98VHDX9Atv3l7/arcgis/rest/services/Full_Crash/FeatureServer/0';

  // Query criteria (ArcGIS uses coded values, not display text):
  // COLLISION_TYPE = '3' → Head On
  // ROADWAY_DESCRIPTION = '3' → Two-Way, Divided, Positive Median Barrier
  // ROADWAY_ALIGNMENT = '10' → On/Off Ramp
  const DEFAULT_WHERE = "COLLISION_TYPE = '3' AND ROADWAY_DESCRIPTION = '3' AND ROADWAY_ALIGNMENT = '10'";

  const RESULT_RECORD_COUNT = 1000;

  /**
   * Fetch possible wrong-way driving crash locations from ArcGIS
   * @returns {Promise<Array>} Array of normalized crash objects
   */
  async function fetchPossibleWwdLocations() {
    const params = new URLSearchParams({
      where: DEFAULT_WHERE,
      outFields: '*',
      outSR: 4326,
      returnGeometry: true,
      resultRecordCount: RESULT_RECORD_COUNT,
      f: 'json'
    });

    const url = `${BASE_URL}/query?${params}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`ArcGIS request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message || 'ArcGIS API error');
    }

    const features = data.features || [];
    return features.map(normalizeFeature);
  }

  /**
   * Normalize ArcGIS feature to app-friendly format
   */
  function normalizeFeature(f) {
    const attrs = f.attributes || {};
    const geom = f.geometry || {};
    const lat = attrs.LAT ?? geom.y ?? null;
    const lng = attrs.LON ?? geom.x ?? null;

    const crashDate = attrs.CRASH_DT ? new Date(attrs.CRASH_DT) : null;
    const militaryTime = attrs.CRASH_MILITARY_TM;
    const timeStr = militaryTime != null
      ? `${String(Math.floor(militaryTime / 100)).padStart(2, '0')}:${String(militaryTime % 100).padStart(2, '0')}`
      : null;

    return {
      id: `arcgis-${attrs.OBJECTID}`,
      objectId: attrs.OBJECTID,
      documentNbr: attrs.DOCUMENT_NBR,
      lat,
      lng,
      road: attrs.ROUTE_OR_STREET_NM || attrs.RTE_NM || 'Unknown',
      routeName: attrs.RTE_NM,
      crashYear: attrs.CRASH_YEAR,
      crashDate: crashDate ? crashDate.toISOString().slice(0, 10) : null,
      crashTime: timeStr,
      severity: mapSeverity(attrs.CRASH_SEVERITY),
      kPeople: attrs.K_PEOPLE || 0,
      aPeople: attrs.A_PEOPLE || 0,
      bPeople: attrs.B_PEOPLE || 0,
      cPeople: attrs.C_PEOPLE || 0,
      vehiclesInvolved: attrs.VEH_COUNT || 1,
      alcoholInvolved: attrs.ALCOHOL_NOTALCOHOL === '1',
      night: attrs.NIGHT === '1',
      vdotDistrict: attrs.VDOT_DISTRICT,
      jurisCode: attrs.JURIS_CODE,
      physicalJuris: attrs.PHYSICAL_JURIS,
      municipality: resolveJurisdiction(attrs.PHYSICAL_JURIS),
      collisionType: 'Head On',
      roadwayDesc: 'Two-Way, Divided, Positive Median Barrier',
      roadwayAlignment: 'On/Off Ramp',
      source: 'arcgis'
    };
  }

  function mapSeverity(code) {
    const map = { K: 'Fatal', A: 'Severe Injury', B: 'Visible Injury', C: 'Nonvisible Injury', O: 'PDO' };
    return map[code] || code || 'Unknown';
  }

  /**
   * Resolve jurisdiction code to display name (simplified; full mapping from ArcGIS metadata)
   */
  function resolveJurisdiction(code) {
    if (!code) return 'Unknown';
    const known = {
      '29': 'Fairfax County', '76': 'Prince William County', '20': 'Chesterfield County',
      '43': 'Henrico County', '127': 'Richmond City', '131': 'Chesapeake', '134': 'Virginia Beach',
      '122': 'Norfolk', '121': 'Newport News', '114': 'Hampton', '124': 'Portsmouth',
      '80': 'Roanoke County', '128': 'Roanoke City', '88': 'Spotsylvania County',
      '89': 'Stafford County', '111': 'Fredericksburg', '151': 'Fairfax City',
      '112': 'Front Royal', '138': 'Winchester', '53': 'Loudoun County', '34': 'Frederick County'
    };
    return known[code] || `Jurisdiction ${code}`;
  }

  return { fetchPossibleWwdLocations };
})();
