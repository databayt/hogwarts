#!/bin/bash
# Detect hardcoded English strings in tsx/ts files
FILE="$CLAUDE_FILE_PATH"
if echo "$FILE" | grep -qE '\.(tsx?|jsx?)$'; then
  FOUND=""
  # Check for hardcoded FormLabel text
  if grep -nE '<FormLabel>[A-Z][^{<]+</FormLabel>' "$FILE" 2>/dev/null | head -3; then
    FOUND=1
  fi
  # Check for hardcoded toast messages
  if grep -nE 'toast\.(success|error|warning|info)\("[^"]+"\)' "$FILE" 2>/dev/null | head -3; then
    FOUND=1
  fi
  if [ -n "$FOUND" ]; then
    echo "WARNING: Possible hardcoded English strings detected"
    echo "Use dictionary keys or i18n helpers instead"
    echo "See .claude/rules/translation.md for patterns"
  fi
fi
exit 0
