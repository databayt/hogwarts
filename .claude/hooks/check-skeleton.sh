#!/bin/bash
# Detect skeleton anti-patterns in loading/skeleton files
# Enforces consistent shimmer animation and semantic tokens

FILE="$CLAUDE_FILE_PATH"

# Only check tsx/ts files
echo "$FILE" | grep -qE '\.(tsx?|jsx?)$' || exit 0

# Skip test files
echo "$FILE" | grep -qE '(__tests__/|\.test\.|\.spec\.)' && exit 0

FOUND=""

# 1. animate-pulse used for skeleton loading (should be animate-shimmer via <Skeleton>)
MATCHES=$(grep -nE 'animate-pulse.*rounded|rounded.*animate-pulse' "$FILE" 2>/dev/null | grep -vE '(status|badge|dot|indicator|recording|live|pulse-dot)' | head -3)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES"
  echo "  ^ Use <Skeleton> component instead (has animate-shimmer)"
  FOUND=1
fi

# 2. Hardcoded gray colors for skeleton placeholders
MATCHES=$(grep -nE 'bg-gray-[0-9]+.*dark:bg-gray' "$FILE" 2>/dev/null | head -3)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES"
  echo "  ^ Use <Skeleton> or bg-accent for semantic theming"
  FOUND=1
fi

# 3. Text-based loading fallbacks in Suspense
MATCHES=$(grep -nE 'fallback=\{?<div[^>]*>Loading' "$FILE" 2>/dev/null | head -3)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES"
  echo "  ^ Use a skeleton component as Suspense fallback"
  FOUND=1
fi

# 4. Image-based spinner for page loading
MATCHES=$(grep -nE 'Loading\.png|loading\.gif|loading\.svg' "$FILE" 2>/dev/null | head -3)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES"
  echo "  ^ Use <Skeleton> components or atom/loading spinner"
  FOUND=1
fi

if [ -n "$FOUND" ]; then
  echo ""
  echo "WARNING: Skeleton anti-pattern detected. See .claude/rules/skeleton.md"
fi
exit 0
