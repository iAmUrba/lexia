import json
from datetime import datetime

filepath = "/Users/lacalma/.gemini/antigravity/scratch/LexIA/src/lexia-os/packages/server/agenda.json"

with open(filepath, 'r', encoding='utf-8') as f:
    events = json.load(f)

# The current date is July 7, 2026.
# Any event after this date should not be marked as "completado".
cutoff = "2026-07-07T23:59:59"

fixed_count = 0

for evt in events:
    if evt["datetime"] > cutoff and evt["status"] == "completado":
        evt["status"] = "programado"
        fixed_count += 1

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(events, f, ensure_ascii=False, indent=2)

print(f"Fixed {fixed_count} future events that were marked as completado.")
