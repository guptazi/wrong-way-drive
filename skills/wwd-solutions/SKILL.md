---
name: wwd-solutions
description: >
  FHWA-based Wrong-Way Driving (WWD) countermeasure recommendation engine grounded in
  "Guidelines for Reducing Wrong-Way Crashes on Freeways" (FHWA-ICT-14-010, Zhou & Rouholamin, 2014).
  Use this skill whenever the user needs to recommend, evaluate, or document WWD countermeasures
  for a specific interchange, ramp, or roadway segment. Triggers include: "what signs should I add",
  "countermeasures for this interchange", "how do I fix wrong-way entries", "WWD treatment for
  parclo / diamond / DDI / SPDI", "ITS detection for wrong-way", "what pavement markings",
  "geometric fixes for exit ramp", "DUI enforcement plan", "FHWA 4E countermeasures",
  or any request to reduce wrong-way driving crashes at a specific location.
  Always structure recommendations across the FHWA 4E framework: Engineering (TCDs, geometry, ITS),
  Enforcement, Education, and Emergency Response. Always tie recommendations to interchange type
  and observed risk factors. Always use Python for any scoring, tabulation, or reporting outputs.
---

# Wrong-Way Driving (WWD) Countermeasures Skill

## Source Authority

All guidance is derived from:
**FHWA-ICT-14-010** — *Guidelines for Reducing Wrong-Way Crashes on Freeways*
Zhou, H. & Rouholamin, M. (2014). Illinois Center for Transportation / FHWA.

This document synthesizes NCHRP synthesis, FHWA crash data (1990s–2011), NTSB recommendations,
and AASHTO/MUTCD standards into actionable countermeasure guidelines.

---

## Core Framework: FHWA 4E

Every WWD countermeasure recommendation must be organized under one or more of these four pillars:

1. **Engineering** — TCDs (signs, markings, signals), geometric design, ITS
2. **Enforcement** — Law enforcement strategies, detection/intercept protocols, legal deterrents
3. **Education** — Public awareness, targeted driver groups (DUI, elderly, young)
4. **Emergency Response** — Detection-to-alert-to-intercept pipeline

---

## Chapter 2: Traffic Control Devices (TCDs)

### Priority Signs at Exit Ramp Terminals

| Sign | Code | Size (Freeway) | Placement |
|------|------|----------------|-----------|
| Do Not Enter (DNE) | R5-1 | 48×48 in | Right side of road at ramp terminal; also at ends of frontage roads connecting to one-way ramps |
| Wrong Way (WW) | R5-1a | 42×30 in | On exit ramp ~125 ft from DNE sign, facing wrong-way driver; second set at ~350 ft at high-crash locations; also on back of ramp exit signs |
| One Way | R6-1 | 54×18 in (preferred over R6-2) | At ramp-crossroad intersections parallel to one-way ramp; on both sides of divided crossroads |
| Keep Right | R4-7 | 48×60 in | At medians between exit/entrance ramp pairs at parclo; required when median ≥8 ft wide; consider DNE if median ≥12 ft |
| Turn Prohibition | R3-1/R3-2 | 36×36 in (expressway) | At corners facing potential wrong-way turners; adjacent to signal heads |

**Placement rule of thumb:** DNE and WW signs should be redundant — the WW sign functions as confirmation for a driver who has already passed the DNE, giving them a second chance to self-correct before entering the ramp.

### Pavement Markings

- **In-lane arrows**: Minimum 2 per approach on exit ramps; arrows reinforce one-way direction of travel
- **Wrong-way arrow**: 23.5 ft longitudinal arrow on exit ramp surface facing wrong-way driver
- **Longitudinal yellow edge line**: Left edge of exit ramp (signals wrong direction to entering driver)
- **Stop lines**: 12–24 in wide at exit ramp end, delineating the stopping point at the terminal
- **Raised Pavement Markers (RPMs)**: Red reflective RPMs facing wrong-way direction; yellow facing correct way — retroreflection at night is critical
- **Barrier delineators**: Yellow = correct-way traffic, Red = wrong-way warning

### Traffic Signals

- **Green arrow** preferred over circular green + "No Right Turn" sign for exclusive right-turn channelization — eliminates ambiguity about which movements are permitted
- At expressway intersections: Turn prohibition signs should be mounted adjacent to signal heads, not independently

---

## Chapter 3: Geometric Design

### Exit Ramp Characteristics That REDUCE WWD Risk (Favorable Geometry)

Design for these conditions at new or modified interchanges:

- Acute angle between exit ramp and one-way crossroad/frontage road
- Right angle between exit ramp and two-way crossroad (maximizes wrong-way detection by driver)
- Sweeping, wide-radius connections that make exit ramp visually distinct from entrance
- Narrow exit throat with raised curb islands channelizing the driver outbound
- Raised/non-traversable median between exit ramp and adjacent entrance ramp

### Exit Ramp Characteristics That INCREASE WWD Risk (Problem Geometry)

Audit for and remediate these conditions:

| Risk Feature | Countermeasure |
|---|---|
| Adjacent parclo entrance+exit ramps with narrow median | Keep Right sign + raised median or channelizer |
| Isolated exits (no adjacent entrance) | Additional DNE/WW signs; lighting improvement |
| Left-side exit ramps | Geometric redesign priority; enhanced signing both sides |
| Unchannelized T-intersections at ramp terminal | Add channelizing island; curb radii treatments |
| Two-way frontage roads (vs. one-way) | Convert to one-way where feasible; additional signing |
| Button-hook / J-shaped ramps | Longitudinal channelizers; signing on back of exit signs |
| Freeway feeder / system interchange | CMSs + detection system; enhanced overhead signing |
| Side streets adjacent to exit ramps | Prohibitory signing facing side-street entry; RPMs |
| Scissors channelization | Remove/redesign — scissors channelization is actively dangerous for WWD |

### Raised Medians and Islands

- A raised, non-traversable median on the crossroad deters wrong-way left turns at exit ramp terminals — one of the highest-impact geometric countermeasures
- Where no raised median exists: longitudinal channelizing devices (tubular markers, flexible delineators)
- Narrow median openings: reduce opportunity for wrong-way U-turns at median crossovers
- **CRITICAL — Avoid**: raised medians that divide same-direction traffic on an exit ramp (this confuses drivers)
- Raised islands ≥4 in height at ramp noses reduce perceived exit width, deterring wrong-way entry
- Minimum 50 ft between parallel ramps at parclo (4-quadrant: 200 ft from gore to controlled terminal)

### Control Radius and Corner Geometry

- Short radius or angular break at left edge of exit ramp / right edge of crossroad makes wrong-way entry physically awkward
- Control radius should be tangent to centerline, not edge of travel lane
- Max left-turn control radius: 80 ft (crossroad → entrance ramp), 100 ft (exit ramp → crossroad)

### Sight Distance and Lighting

- Maintain open sight distance along the full ramp length — drivers should be able to see DNE/WW signs from far back
- Uniform lighting at both entrance and exit ramps — asymmetric lighting creates confusion at night (highest WWD risk period)
- At parclo stop lines: driver should see 50–60% of the intersection beyond the stop line
- **Avoid**: median barriers that block a driver's view of the entrance ramp from the exit ramp
- **Avoid**: grade differentials between parallel ramps and the crossroad that obscure sign visibility

### Interchange-Type Specific Notes

**Standard Diamond (SDI):**
- Add channelizing island + sharp corner radius at undivided crossroad ramp terminals
- Raised median on divided crossroad is effective

**Diamond with Frontage Roads (DFR):**
- Acute angle to one-way frontage road (favorable)
- Right angle to two-way frontage road
- Two-way frontage with multiple driveways is highest-risk configuration — prioritize conversion

**Partial Cloverleaf / Parclo (PCL):**
- Keep Right signs at median between ramp pairs (median ≥8 ft)
- DNE on back of exit signs facing loop ramp drivers
- 4-quadrant: 200 ft separation from gore; 50 ft min between adjacent ramps

**Single Point Diamond Interchange (SPDI) / SPUI:**
- Centralized signal is primary confusion point — ensure green arrow vs. circular green treatment
- All approaches need clear one-way designation

**Diverging Diamond Interchange (DDI):**
- Geometry-based mitigation is built in — but signing still critical during transition zones
- Enhanced pavement markings in crossover zones; RPMs throughout

**Freeway-to-Freeway / System Interchange (FFI):**
- Multi-lane flyovers = high-speed decision points; overhead CMSs required
- Detection + alert pipeline essential (see Chapter 4)

---

## Chapter 4: Advanced Technology, Enforcement, and Education

### ITS Detection Technologies

Select based on site constraints and cost tolerance:

| Technology | Placement | Accuracy | Cost | Notes |
|---|---|---|---|---|
| **Inductive Loop Detectors (ILD)** | In-pavement | Excellent | Low | All-weather; requires lane closure for installation/maintenance |
| **Magnetic Sensors** | In-pavement or roadside | Very Good | Low–Med | ≥50 ft from stop line, ≥70 ft from crosswalk |
| **Video Image Processors (VIP)** | Overhead (≥40 ft height) | Good | Moderate–High | Affected by weather/shadows; requires good lighting |
| **Microwave Radar** | Roadside/overhead (≥40 ft) | Very Good | Low | Multi-lane coverage; ≥40 ft from ramp terminal for 12-ft lane; low maintenance |

**Deployment recommendation**: Combine detection (ILD or magnetic) with CCTV verification to reduce false alarms before alerting field personnel.

### ITS Warning and Response Devices

- **LED Wrong-Way Signs**: Activate on detection trigger; supplement static DNE/WW signs at night
- **Changeable Message Signs (CMS)**: Two message options depending on agency protocol:
  - Passive: *"Wrong Way Driver Reported — Use Extreme Caution"*
  - Active/directive: *"All Traffic Move to Shoulder and Stop"* (for high-severity intercept)
- **In-Pavement Warning Lights**: Embedded LED arrays that activate at exit ramp terminal on detection

### Detection-to-Response Pipeline (HCTRA Texas Model)

A proven 4-step protocol for agencies with TMC operations:

1. **Detect**: ITS sensor (ILD/magnetic/radar) triggers alert — activates LED WW sign at ramp
2. **Verify**: TMC operator reviews CCTV footage; confirms wrong-way vehicle via GIS location
3. **Warn**: TMC posts CMS messages on affected freeway segments upstream
4. **Intercept**: Law enforcement dispatched with GPS coordination; equipped with tire deflation devices

### Enforcement Strategies

**Data-driven deployment:**
- Identify peak WWD periods: midnight–5AM on weekends/holidays at freeway system entries
- Deploy DUI checkpoints at high-crash entrance ramps during these windows
- Use crash history to prioritize patrol corridors (where to watch, not just when)

**Intercept methods** (escalation order):
1. Tire deflation devices (spike strips) — most effective non-contact stop
2. Traffic break (rolling slow-down in front of WWD vehicle)
3. Roadblock at controlled choke point
4. Patrol car contact/ram — last resort; significant officer risk
5. Pinning against median barrier — highest risk, emergency-only

**Legal deterrents:**
- Ignition Interlock Devices (IIDs) mandated for convicted DUI offenders — addresses root cause (≈50–60% of WWD crashes are DUI-related)
- Crash reporting forms should capture entry point and direction to support spatial analysis

### Education Strategies

**Target audiences** (ranked by crash overrepresentation):
1. DUI drivers — highest representation in fatal WWD crashes
2. Elderly drivers (65+) — navigation confusion, reduced night vision
3. Young/novice drivers — overconfidence, unfamiliarity with interchange geometry

**Program types:**
- Community partnerships: DUI prevention programs at venue entry/exit points
- CHP Sober Graduation Program model: demonstrated 25% reduction in fatal crashes in pilot areas
- NTTA (2009): Public safety outreach campaign with media, signage, and checkpoint announcements
- WWD monitoring programs: Link crash data to countermeasure effectiveness; publish annual reports

---

## Countermeasure Selection Matrix

When recommending countermeasures, work through this decision matrix:

### Step 1 — Identify Interchange Type
SPDI | DFR | SDI | DDI | PCL | FFI → each has type-specific priorities above

### Step 2 — Identify Risk Factors
Cross-reference the site's observed risk factors against the Chapter 3 risk table above.

### Step 3 — Apply Countermeasures by Layer

**Layer 1 — TCDs (always first, lowest cost, fastest to implement):**
- Confirm DNE (R5-1) and WW (R5-1a) placement meets MUTCD spec
- Add second WW set if high-crash history
- Verify One Way signing on crossroad
- Add red RPMs at exit ramp terminal
- Add wrong-way pavement arrows

**Layer 2 — Geometry (medium cost, highest long-term effectiveness):**
- Address any scissors channelization (remove/redesign)
- Install raised island at exit ramp nose if absent
- Add longitudinal channelizers at narrow medians
- Improve lighting uniformity at ramp terminal
- Convert two-way frontage to one-way where feasible

**Layer 3 — ITS (higher cost, warranted at high/very-high risk sites):**
- Install detection (ILD or microwave radar)
- Add LED activated WW signs
- Connect to TMC for verification + CMS response
- Establish agency response protocol (4-step pipeline)

**Layer 4 — Enforcement and Education:**
- Share location data with patrol for priority coverage
- Schedule DUI checkpoints at site during midnight–5AM weekend window
- Include site in public outreach if area has repeat crashes

### Step 4 — Output Format

When producing recommendations, always structure output as:

```
LOCATION: [interchange name / route]
INTERCHANGE TYPE: [SPDI / DFR / SDI / DDI / PCL / FFI]
RISK LEVEL: [Very High / High / Medium / Low]
RISK FACTORS: [bulleted list]

RECOMMENDED COUNTERMEASURES:

Engineering — TCDs:
  [specific signs, markings, signals with MUTCD codes and dimensions]

Engineering — Geometry:
  [specific geometric improvements]

Engineering — ITS:
  [detection technology, devices, protocol]

Enforcement:
  [deployment strategy, intercept methods]

Education:
  [targeted programs]

Emergency Response:
  [detection-to-response pipeline]

PRIORITY ORDER: [list countermeasures 1–N by cost-effectiveness and urgency]
REFERENCE: FHWA-ICT-14-010, Chapter [X]
```

---

## Quick Reference: Sign Sizes by Road Class

| Sign | Freeway | Expressway | Conventional |
|------|---------|------------|--------------|
| Do Not Enter (R5-1) | 48×48 in | 36×36 in | 30×30 in |
| Wrong Way (R5-1a) | 42×30 in | 36×24 in | 30×24 in |
| One Way (R6-1) | 54×18 in | 48×18 in | 36×12 in |
| Keep Right (R4-7) | 48×60 in | — | — |
| Turn Prohibition (R3-1/R3-2) | — | 36×36 in | 30×30 in |

---

## Key Statistics (for reporting context)

- ~300–400 WWD incidents annually on U.S. freeways (NTSB estimate)
- Fatality rate: ~6–7% of WWD crashes result in fatality (vs. ~1% all highway crashes)
- Time of day: ~60% occur between midnight and 6AM
- DUI involvement: ~50–60% of fatal WWD crashes involve alcohol
- Location: ~75% occur within 1 mile of interchange/entrance ramp
- Age: Both younger (<35) and older (>70) drivers overrepresented
