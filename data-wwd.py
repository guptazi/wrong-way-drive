import pdfplumber
import re
import json

pdf_path = "wwd-dataset.pdf"

data = []
id_counter = 1

def parse_direction(route):
    if route.endswith("N"): return "N"
    if route.endswith("S"): return "S"
    if route.endswith("E"): return "E"
    if route.endswith("W"): return "W"
    return None

def parse_route_number(route):
    match = re.search(r'I-\d+', route)
    return match.group(0) if match else None

def parse_severity(sev):
    if "." in sev:
        return sev.split(".")[-1]
    return sev

def detect_ramp(crash_mp):
    if "Ramp" in crash_mp:
        return "ramp"
    return None

def clean_row(row):
    return [cell.strip() if cell else "" for cell in row]

with pdfplumber.open(pdf_path) as pdf:
    for page_num, page in enumerate(pdf.pages):
        tables = page.extract_tables()

        for table in tables:
            for i, row in enumerate(table):
                if i == 0:  # skip header
                    continue

                row = clean_row(row)

                if len(row) < 5:
                    continue

                route, crash_mp, lat, lng, severity = row[:5]

                try:
                    lat = float(lat)
                    lng = float(lng)
                except:
                    continue

                obj = {
                    "id": f"WWD-{id_counter:03}",
                    "dateTime": None,
                    "road": route,
                    "routeNumber": parse_route_number(route),
                    "municipality": f"District Page-{page_num+1}",
                    "lat": lat,
                    "lng": lng,
                    "rampType": detect_ramp(crash_mp),
                    "travelDirection": parse_direction(route),
                    "severity": parse_severity(severity),
                    "vehiclesInvolved": None,
                    "postedSpeedLimit": None,
                    "lightingCondition": None,
                    "weatherCondition": None,
                    "timeCategory": None,
                    "alcoholInvolved": None,
                    "countermeasures": [],
                    "notes": f"Crash Mile Point: {crash_mp}",
                    "riskScore": None
                }

                data.append(obj)
                id_counter += 1

# Save JSON
with open("wwd_full_dataset.json", "w") as f:
    json.dump(data, f, indent=2)

# Save JS file
with open("wwd_full_dataset.js", "w") as f:
    f.write("const SAMPLE_DATA = ")
    json.dump(data, f, indent=2)
    f.write(";")

print(f"Extracted {len(data)} records.")