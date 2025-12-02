#!/bin/bash

# Script to replace lucide-react with @aliimam/icons across all platform modules

# Icon name mappings (old -> new)
declare -A ICON_MAPPINGS=(
  ["AlertCircle"]="CircleAlert"
  ["AlertTriangle"]="TriangleAlert"
  ["CheckCircle"]="CircleCheck"
  ["XCircle"]="CircleX"
  ["MoreHorizontal"]="Ellipsis"
  ["MoreVertical"]="EllipsisVertical"
  ["Edit"]="Pencil"
  ["Loader2"]="LoaderCircle"
  ["Filter"]="ListFilter"
  ["Home"]="House"
  ["Unlock"]="LockOpen"
)

# Files to process
FILES=(
  # Admin
  "src/components/platform/admin/configuration/content.tsx"
  "src/components/platform/admin/security/content.tsx"
  "src/components/platform/admin/content.tsx"
  "src/components/platform/admin/integration/content.tsx"
  "src/components/platform/admin/subscription/content.tsx"
  "src/components/platform/admin/system/content.tsx"
  "src/components/platform/admin/communication/content.tsx"
  "src/components/platform/admin/membership/content.tsx"
  "src/components/platform/admin/reports/content.tsx"

  # Admission
  "src/components/platform/admission/enrollment-table.tsx"
  "src/components/platform/admission/settings-content.tsx"
  "src/components/platform/admission/enrollment-columns.tsx"
  "src/components/platform/admission/applications-table.tsx"
  "src/components/platform/admission/merit-table.tsx"
  "src/components/platform/admission/campaigns-columns.tsx"
  "src/components/platform/admission/applications-columns.tsx"
  "src/components/platform/admission/merit-columns.tsx"
  "src/components/platform/admission/campaigns-table.tsx"

  # Announcements
  "src/components/platform/announcements/read-status-badge.tsx"
  "src/components/platform/announcements/scheduled-status-badge.tsx"
  "src/components/platform/announcements/columns.tsx"
  "src/components/platform/announcements/scheduling-section.tsx"
  "src/components/platform/announcements/table.tsx"
  "src/components/platform/announcements/read-count-indicator.tsx"

  # Assignments
  "src/components/platform/assignments/details.tsx"
  "src/components/platform/assignments/teacher-review.tsx"
  "src/components/platform/assignments/student-view.tsx"
  "src/components/platform/assignments/columns.tsx"
  "src/components/platform/assignments/export-button.tsx"
  "src/components/platform/assignments/submission-form.tsx"
  "src/components/platform/assignments/table.tsx"

  # Classes
  "src/components/platform/classes/columns.tsx"
  "src/components/platform/classes/export-button.tsx"
  "src/components/platform/classes/table.tsx"

  # Communication
  "src/components/platform/communication/hub.tsx"

  # Events
  "src/components/platform/events/management.tsx"
  "src/components/platform/events/columns.tsx"
  "src/components/platform/events/table.tsx"

  # Grades
  "src/components/platform/grades/bulk-entry.tsx"
  "src/components/platform/grades/columns.tsx"
  "src/components/platform/grades/generate/content.tsx"
  "src/components/platform/grades/table.tsx"

  # Import
  "src/components/platform/import/csv-import.tsx"

  # Lab
  "src/components/platform/lab/dashboard-cards-showcase.tsx"

  # Lessons
  "src/components/platform/lessons/schedule-details.tsx"
  "src/components/platform/lessons/columns.tsx"
  "src/components/platform/lessons/table.tsx"

  # Library
  "src/components/platform/library/management.tsx"

  # Messaging
  "src/components/platform/messaging/chat-interface.tsx"
  "src/components/platform/messaging/message-bubble.tsx"
  "src/components/platform/messaging/message-list.tsx"
  "src/components/platform/messaging/conversation-list.tsx"
  "src/components/platform/messaging/messaging-client.tsx"
  "src/components/platform/messaging/message-input.tsx"
  "src/components/platform/messaging/config.ts"
  "src/components/platform/messaging/conversation-card.tsx"

  # Notifications
  "src/components/platform/notifications/bell-icon.tsx"
  "src/components/platform/notifications/card.tsx"
  "src/components/platform/notifications/content.tsx"
  "src/components/platform/notifications/list.tsx"
  "src/components/platform/notifications/center.tsx"
  "src/components/platform/notifications/preferences-form.tsx"
  "src/components/platform/notifications/config.ts"
  "src/components/platform/notifications/preferences-content.tsx"

  # Parent
  "src/components/platform/parent/dashboard.tsx"

  # Parent Portal
  "src/components/platform/parent-portal/attendance/view.tsx"
  "src/components/platform/parent-portal/announcements/content.tsx"

  # Parents
  "src/components/platform/parents/columns.tsx"
  "src/components/platform/parents/table.tsx"

  # Reports
  "src/components/platform/reports/card-generator.tsx"

  # Settings
  "src/components/platform/settings/error-boundary.tsx"
  "src/components/platform/settings/appearance-settings.tsx"
  "src/components/platform/settings/content-enhanced.tsx"
  "src/components/platform/settings/permissions-panel.tsx"
  "src/components/platform/settings/role-switcher.tsx"
  "src/components/platform/settings/domain-request/form.tsx"
  "src/components/platform/settings/role-management.tsx"
  "src/components/platform/settings/notification-settings.tsx"

  # Shared
  "src/components/platform/shared/export-button.tsx"
  "src/components/platform/shared/view-toggle.tsx"
  "src/components/platform/shared/platform-toolbar.tsx"
  "src/components/platform/shared/stats/trending-stats.tsx"
  "src/components/platform/shared/stats/presets/admission.tsx"
  "src/components/platform/shared/stats/presets/attendance.tsx"
  "src/components/platform/shared/stats/presets/finance.tsx"
  "src/components/platform/shared/stats/presets/education.tsx"
  "src/components/platform/shared/grid-card.tsx"

  # Teacher
  "src/components/platform/teacher/dashboard.tsx"

  # Analytics
  "src/components/platform/analytics/dashboard.tsx"
)

# Counters
declare -A MODULE_COUNTS
TOTAL_FILES=0

echo "Starting icon replacement process..."
echo "======================================"

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Extract module name
    module=$(echo "$file" | cut -d'/' -f4)

    # Replace import statement
    sed -i '' 's/from "lucide-react"/from "@aliimam\/icons"/g' "$file"
    sed -i '' "s/from 'lucide-react'/from '@aliimam\/icons'/g" "$file"

    # Apply icon name mappings
    for old_name in "${!ICON_MAPPINGS[@]}"; do
      new_name="${ICON_MAPPINGS[$old_name]}"
      # Replace in imports
      sed -i '' "s/\b${old_name}\b/${new_name}/g" "$file"
    done

    # Increment counters
    MODULE_COUNTS[$module]=$((${MODULE_COUNTS[$module]:-0} + 1))
    TOTAL_FILES=$((TOTAL_FILES + 1))

    echo "✓ Updated: $file"
  else
    echo "✗ Not found: $file"
  fi
done

echo ""
echo "======================================"
echo "Summary by Module:"
echo "======================================"

for module in $(echo "${!MODULE_COUNTS[@]}" | tr ' ' '\n' | sort); do
  count=${MODULE_COUNTS[$module]}
  printf "%-20s: %3d files\n" "$module" "$count"
done

echo "======================================"
echo "Total files updated: $TOTAL_FILES"
echo "======================================"
