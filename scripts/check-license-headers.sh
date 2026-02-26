#!/bin/bash
# Check that all source files have the SSPL license header
# Used in CI to enforce headers on new files
# Excludes: src/components/ui/ (MIT/shadcn), *.d.ts, node_modules

MISSING=0
FILES=()

while IFS= read -r -d '' file; do
  # Skip .d.ts declaration files
  [[ "$file" == *.d.ts ]] && continue

  # Check for header (could be line 1 or after "use client"/"use server" on line 1)
  if ! grep -q "Copyright (c) 2025-present databayt" "$file" 2>/dev/null; then
    FILES+=("$file")
    ((MISSING++))
  fi
done < <(find src -type f \( -name '*.ts' -o -name '*.tsx' \) \
  -not -path '*/node_modules/*' \
  -not -path '*/.next/*' \
  -not -path 'src/components/ui/*' \
  -not -path '*/components/ui/*' \
  -print0 2>/dev/null)

# Also check prisma/seeds and scripts
for dir in prisma/seeds scripts; do
  while IFS= read -r -d '' file; do
    [[ "$file" == *.d.ts ]] && continue
    if ! grep -q "Copyright (c) 2025-present databayt" "$file" 2>/dev/null; then
      FILES+=("$file")
      ((MISSING++))
    fi
  done < <(find "$dir" -type f -name '*.ts' -print0 2>/dev/null)
done

if [ $MISSING -gt 0 ]; then
  echo "ERROR: $MISSING file(s) missing SSPL license header:"
  echo ""
  for f in "${FILES[@]}"; do
    echo "  - $f"
  done
  echo ""
  echo "Add this header to the top of each file (after 'use client'/'use server' if present):"
  echo ""
  echo '  // Copyright (c) 2025-present databayt'
  echo '  // Licensed under SSPL-1.0 -- see LICENSE for details'
  echo ""
  exit 1
else
  echo "All source files have SSPL license headers."
  exit 0
fi
