import re
import json

MONTHS_MAP = {
    "ENERO": 1, "FEBRERO": 2, "MARZO": 3, "ABRIL": 4,
    "MAYO": 5, "JUNIO": 6, "JULIO": 7, "AGOSTO": 8,
    "SEPTIEMBRE": 9, "OCTUBRE": 10, "NOVIEMBRE": 11, "DICIEMBRE": 12
}

def parse_agenda(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    
    events = []
    current_year = 2026
    current_month = None
    current_day = None
    
    month_regex = re.compile(r'^(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s*(\d{4})?', re.IGNORECASE)
    day_regex = re.compile(r'^0[1-9]$|^[1-2][0-9]$|^3[0-1]$')
    time_regex = re.compile(r'^(\d{1,2}[:.]?\d{2})\s*(?:a\.?m\.?|p\.?m\.?)?\s+(.+)', re.IGNORECASE)

    current_event = None

    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # 1. Is it a month header?
        month_match = month_regex.match(line)
        if month_match:
            month_str = month_match.group(1).upper()
            if month_match.group(2):
                current_year = int(month_match.group(2))
            current_month = MONTHS_MAP[month_str]
            continue
            
        # 2. Is it a day?
        if day_regex.match(line):
            current_day = int(line)
            continue
            
        # Skip days of week headers
        if line.upper() in ["LUNES", "MARTES", "MIERCOLES", "MIÉRCOLES", "JUEVES", "VIERNES", "SABADO", "SÁBADO", "DOMINGO"]:
            continue
            
        # 3. Is it an event line?
        # Sometimes there's a symbol like ‏ or ** at the start.
        cleaned_line = line.replace('\u200f', '').replace('**', '').strip()
        
        time_match = time_regex.match(cleaned_line)
        if time_match and current_month and current_day:
            if current_event:
                events.append(current_event)
                
            raw_time_str = time_match.group(1).replace('.', ':')
            # Fix cases like "830" without a colon
            if ':' not in raw_time_str:
                raw_time_str = f"{raw_time_str[:-2]}:{raw_time_str[-2:]}"
            time_str = raw_time_str
            
            event_text = time_match.group(2).strip()
            
            # Check if it was notified
            is_notified = '✔' in event_text
            event_text = event_text.replace('✔', '').strip()
            
            # Parse time
            parts = time_str.split(':')
            hour = int(parts[0])
            minute = int(parts[1])
            
            if hour >= 1 and hour <= 7:
                hour += 12
            
            date_str = f"{current_year}-{current_month:02d}-{current_day:02d}T{hour:02d}:{minute:02d}:00"
            
            # Determine status
            # If date is in the past (before July 7, 2026), it's completado
            is_past = date_str < "2026-07-07T00:00:00"
            
            if is_past:
                status = "completado"
            else:
                status = "notificado" if is_notified else "programado"
            
            current_event = {
                "id": f"evt_{len(events)}",
                "datetime": date_str,
                "description": event_text,
                "status": status,
                "is_notified": is_notified
            }
        elif current_event:
            # Continuation of previous event text
            is_notified = '✔' in cleaned_line
            if is_notified:
                current_event["is_notified"] = True
                cleaned_line = cleaned_line.replace('✔', '').strip()
                if current_event["datetime"] >= "2026-07-07T00:00:00":
                    current_event["status"] = "notificado"
            current_event["description"] += " " + cleaned_line

    if current_event:
        events.append(current_event)
        
    return events

if __name__ == "__main__":
    import os
    filepath = "/Users/lacalma/.gemini/antigravity/scratch/LexIA/agenda.txt"
    outpath = "/Users/lacalma/.gemini/antigravity/scratch/LexIA/src/lexia-os/packages/server/agenda.json"
    
    events = parse_agenda(filepath)
    with open(outpath, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)
        
    print(f"Parsed {len(events)} events.")
