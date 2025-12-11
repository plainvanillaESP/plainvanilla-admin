#!/usr/bin/env python3
import re

# FIX 1: db.js - Add color to formatPhase
db_file = '/opt/plainvanilla-admin/src/db.js'
with open(db_file, 'r') as f:
    db_content = f.read()

old_format = 'status: row.status, order: row.sort_order, calendarEventId: row.calendar_event_id'
new_format = 'status: row.status, color: row.color, order: row.sort_order, calendarEventId: row.calendar_event_id'

if old_format in db_content:
    db_content = db_content.replace(old_format, new_format)
    print("✅ db.js: Added color to formatPhase")
elif 'color: row.color' in db_content:
    print("ℹ️  db.js: color already exists")
else:
    print("❌ db.js: Pattern not found")

with open(db_file, 'w') as f:
    f.write(db_content)

# FIX 2: views.js - Fix TimelineView
views_file = '/opt/plainvanilla-admin/public/admin/js/views.js'
with open(views_file, 'r') as f:
    views_content = f.read()

old_line = "const phaseColorSet = window.getPhaseColors ? window.getPhaseColors(phase, i) : { bg: phaseColors[i % phaseColors.length], text: phaseTextColors[i % phaseTextColors.length] };"
new_line = "const phaseColorSet = getPhaseColorClasses(phase, i);"

if old_line in views_content:
    views_content = views_content.replace(old_line, new_line)
    print("✅ views.js: Fixed TimelineView")
elif 'const phaseColorSet = getPhaseColorClasses' in views_content:
    print("ℹ️  views.js: Already fixed")
else:
    print("❌ views.js: Pattern not found")

with open(views_file, 'w') as f:
    f.write(views_content)

print("\n🎉 Done!")
