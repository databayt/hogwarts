#!/bin/bash
FILE="$CLAUDE_FILE_PATH"
if echo "$FILE" | grep -qE '\.(tsx?|jsx?)$'; then
  # Check for bulk role reset without email exclusion
  if grep -n 'role.*USER' "$FILE" 2>/dev/null | grep -iE 'updateMany|update\(' | grep -v 'notIn\|PROTECTED' | head -3; then
    echo "WARNING: Role change detected without protected email exclusion"
    echo "Bulk role updates MUST exclude PROTECTED_EMAILS"
    echo "See .claude/rules/accounts.md"
  fi
fi
exit 0
