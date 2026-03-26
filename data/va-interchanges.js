/**
 * va-interchanges.js
 * Virginia interchange inventory with type classification and WWD risk factors.
 * Used by the "🔀 VA Interchange Types" map layer.
 */
const VA_INTERCHANGES = [
  {
    name: "I-66 & VA-123 (Chain Bridge Rd)",
    type: "Single Point Diamond Interchange (SPDI)",
    typeShort: "SPDI",
    latitude: 38.863,
    longitude: -77.322,
    riskLevel: "High",
    riskDetail: "Centralized Signal Confusion",
    wwd_risk_factor: "High - Centralized Signal Confusion"
  },
  {
    name: "I-95 & VA-620 (Braddock Rd)",
    type: "Single Point Diamond Interchange (SPDI)",
    typeShort: "SPDI",
    latitude: 38.795,
    longitude: -77.195,
    riskLevel: "High",
    riskDetail: "Urban Volume/Complex Signals",
    wwd_risk_factor: "High - Urban Volume/Complex Signals"
  },
  {
    name: "US-13 & US-58 (Norfolk)",
    type: "Single Point Diamond Interchange (SPDI)",
    typeShort: "SPDI",
    latitude: 36.852,
    longitude: -76.208,
    riskLevel: "Medium",
    riskDetail: "Large Footprint",
    wwd_risk_factor: "Medium - Large Footprint"
  },
  {
    name: "VA-7 & Battlefield Pkwy",
    type: "Single Point Diamond Interchange (SPDI)",
    typeShort: "SPDI",
    latitude: 39.098,
    longitude: -77.534,
    riskLevel: "Medium",
    riskDetail: "Suburban Turning Radius",
    wwd_risk_factor: "Medium - Suburban Turning Radius"
  },
  {
    name: "I-395 & VA-27 (Washington Blvd)",
    type: "Diamond with Frontage Roads",
    typeShort: "DFR",
    latitude: 38.871,
    longitude: -77.067,
    riskLevel: "Very High",
    riskDetail: "Multiple Parallel Feeders",
    wwd_risk_factor: "Very High - Multiple Parallel Feeders"
  },
  {
    name: "I-95 & VA-613 (Franconia Rd)",
    type: "Diamond with Frontage Roads",
    typeShort: "DFR",
    latitude: 38.791,
    longitude: -77.174,
    riskLevel: "High",
    riskDetail: "C-D Road Entry Points",
    wwd_risk_factor: "High - C-D Road Entry Points"
  },
  {
    name: "I-495 & US-50 (Arlington Blvd)",
    type: "Diamond with Frontage Roads",
    typeShort: "DFR",
    latitude: 38.872,
    longitude: -77.224,
    riskLevel: "High",
    riskDetail: "Dense Local Access",
    wwd_risk_factor: "High - Dense Local Access"
  },
  {
    name: "I-81 & VA-675 (Mt. Jackson)",
    type: "Standard Diamond",
    typeShort: "SDI",
    latitude: 38.744,
    longitude: -78.632,
    riskLevel: "Medium",
    riskDetail: "Rural Speed/Poor Lighting",
    wwd_risk_factor: "Medium - Rural Speed/Poor Lighting"
  },
  {
    name: "I-95 & VA-630 (Courthouse Rd)",
    type: "Standard Diamond (Now DDI)",
    typeShort: "DDI",
    latitude: 38.441,
    longitude: -77.411,
    riskLevel: "Low",
    riskDetail: "Geometry-Based Mitigation",
    wwd_risk_factor: "Low - Geometry-Based Mitigation"
  },
  {
    name: "I-64 & VA-623 (Ashland Rd)",
    type: "Standard Diamond",
    typeShort: "SDI",
    latitude: 37.674,
    longitude: -77.653,
    riskLevel: "Medium",
    riskDetail: "Direct Ramp-to-Crossroad",
    wwd_risk_factor: "Medium - Direct Ramp-to-Crossroad"
  },
  {
    name: "I-81 & US-11 (Greenville)",
    type: "Partial Cloverleaf (Parclo)",
    typeShort: "PCL",
    latitude: 38.014,
    longitude: -79.160,
    riskLevel: "Very High",
    riskDetail: "Parallel Exit/Entry Ramps",
    wwd_risk_factor: "Very High - Parallel Exit/Entry Ramps"
  },
  {
    name: "I-64 & US-29 (Charlottesville)",
    type: "Partial Cloverleaf (Parclo)",
    typeShort: "PCL",
    latitude: 38.010,
    longitude: -78.514,
    riskLevel: "High",
    riskDetail: "Loop Ramp Confusion",
    wwd_risk_factor: "High - Loop Ramp Confusion"
  },
  {
    name: "I-95 & VA-234 (Dumfries)",
    type: "Partial Cloverleaf (Parclo)",
    typeShort: "PCL",
    latitude: 38.563,
    longitude: -77.311,
    riskLevel: "High",
    riskDetail: "Regional Commuter Volume",
    wwd_risk_factor: "High - Regional Commuter Volume"
  },
  {
    name: "I-64/I-264 Interchange",
    type: "Freeway Feeder/System Interchange",
    typeShort: "FFI",
    latitude: 36.847,
    longitude: -76.185,
    riskLevel: "Very High",
    riskDetail: "Multi-lane Flyovers",
    wwd_risk_factor: "Very High - Multi-lane Flyovers"
  },
  {
    name: "I-95/I-495 Mixing Bowl",
    type: "Freeway Feeder/System Interchange",
    typeShort: "FFI",
    latitude: 38.791,
    longitude: -77.178,
    riskLevel: "High",
    riskDetail: "High Speed Decision Points",
    wwd_risk_factor: "High - High Speed Decision Points"
  },

  // ── Additional entries (sourced from Wikimapia interchange inventory) ──────

  {
    name: "I-81 Exit 26 at SR 737 (College Drive), Emory",
    type: "Compressed Diamond Interchange",
    typeShort: "SDI",
    latitude: 36.765,
    longitude: -81.833333,
    riskLevel: "Medium",
    riskDetail: "Rural Compressed Ramp Geometry",
    wwd_risk_factor: "Medium - Rural Compressed Ramp Geometry",
    source: "https://wikimapia.org/9915007/Interstate-81-Exit-26"
  },
  {
    name: "VA-7 & VA-123 Interchange, Tysons",
    type: "Partial Cloverleaf (Parclo-A)",
    typeShort: "PCL",
    latitude: 38.918611,
    longitude: -77.230556,
    riskLevel: "High",
    riskDetail: "Urban Parclo Loop Ramp Confusion",
    wwd_risk_factor: "High - Urban Parclo Loop Ramp Confusion",
    source: "https://wikimapia.org/41300379/Virginia-Route-7-and-123-Interchange"
  },
  {
    name: "I-81 Exit 313 at US-17/US-50/US-522, Winchester",
    type: "Partial Cloverleaf (Parclo-B)",
    typeShort: "PCL",
    latitude: 39.164444,
    longitude: -78.156667,
    riskLevel: "High",
    riskDetail: "Multi-Route Merge/Diverge Complexity",
    wwd_risk_factor: "High - Multi-Route Merge/Diverge Complexity",
    source: "https://wikimapia.org/9930221/Interstate-81-Exit-313"
  },
  {
    name: "US-50 (Arlington Blvd) at Gallows Rd, Merrifield",
    type: "Single Point Urban Interchange (SPUI/SPDI)",
    typeShort: "SPDI",
    latitude: 38.865556,
    longitude: -77.226944,
    riskLevel: "High",
    riskDetail: "Urban Centralized Signal Confusion",
    wwd_risk_factor: "High - Urban Centralized Signal Confusion",
    source: "https://wikimapia.org/24223699/U-S-Route-50-and-Route-650-Interchange"
  },
  {
    name: "I-495 Express Lanes at US-29, Merrifield",
    type: "Inverted SPUI Half Interchange",
    typeShort: "SPDI",
    latitude: 38.873889,
    longitude: -77.220278,
    riskLevel: "Very High",
    riskDetail: "Express Lane Inverted Entry Confusion",
    wwd_risk_factor: "Very High - Express Lane Inverted Entry Confusion",
    source: "https://wikimapia.org/40855690/Interstate-495-Express-and-U-S-Route-29-Interchange"
  },
  {
    name: "I-66 Exit 69 at US-29/VA-237, Falls Church",
    type: "Split Diamond with Frontage Roads",
    typeShort: "DFR",
    latitude: 38.887778,
    longitude: -77.158889,
    riskLevel: "High",
    riskDetail: "Split Diamond Parallel Frontage Feeders",
    wwd_risk_factor: "High - Split Diamond Parallel Frontage Feeders",
    source: "https://wikimapia.org/9991424/Interstate-66-Exit-69"
  },
  {
    name: "I-66 Exit 73 near Rosslyn",
    type: "Split Interchange with Feeder Roads",
    typeShort: "FFI",
    latitude: 38.8975,
    longitude: -77.076389,
    riskLevel: "Very High",
    riskDetail: "Urban Feeder/Frontage Merge Points",
    wwd_risk_factor: "Very High - Urban Feeder/Frontage Merge Points",
    source: "https://wikimapia.org/9991460/Interstate-66-Exit-73"
  },
  {
    name: "I-81 Exit 32 near Glade Spring",
    type: "Diamond with Feeder-Style Connection",
    typeShort: "FFI",
    latitude: 36.783611,
    longitude: -81.733333,
    riskLevel: "Medium",
    riskDetail: "Rural Feeder Road Connection",
    wwd_risk_factor: "Medium - Rural Feeder Road Connection",
    source: "https://wikimapia.org/9914987/Interstate-81-Exit-32"
  }
];
