#!/bin/bash
# Detect hardcoded English strings in tsx/ts files
# Matches all anti-patterns from .claude/rules/translation.md

FILE="$CLAUDE_FILE_PATH"

# Skip non-TS/TSX files
echo "$FILE" | grep -qE '\.(tsx?|jsx?)$' || exit 0

# Skip dictionary files and tests files (false positives)
echo "$FILE" | grep -qE '(dictionaries/|__tests__/|\.tests\.|\.spec\.)' && exit 0

FOUND=""

# 1. Hardcoded FormLabel text
MATCHES=$(grep -nE '<FormLabel>[A-Za-z][^{<]+</FormLabel>' "$FILE" 2>/dev/null | head -3)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES"
  echo "  ^ Use dictionary: <FormLabel>{d.form.fieldName}</FormLabel>"
  FOUND=1
fi

# 2. Hardcoded toast messages
MATCHES=$(grep -nE "toast\.(success|error|warning|info)\([\"'][A-Za-z]" "$FILE" 2>/dev/null | head -3)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES"
  echo "  ^ Use ToastHelper: toast.success(t.success.created())"
  FOUND=1
fi

# 3. Hardcoded Button text
MATCHES=$(grep -nE '<Button[^>]*>[A-Za-z][^{<]+</Button>' "$FILE" 2>/dev/null | head -3)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES"
  echo "  ^ Use dictionary: <Button>{dictionary.common.save}</Button>"
  FOUND=1
fi

# 4. Hardcoded error return strings
MATCHES=$(grep -nE "error:\s*[\"'][A-Z][^\"']+[\"']" "$FILE" 2>/dev/null | head -3)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES"
  echo "  ^ Use error codes: { errorCode: \"NOT_AUTHENTICATED\" }"
  FOUND=1
fi

# 5. Hardcoded select/option labels
MATCHES=$(grep -nE "label:\s*[\"'][A-Z][^\"']+[\"']" "$FILE" 2>/dev/null | head -3)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES"
  echo "  ^ Use dictionary factory: getOptions(dictionary)"
  FOUND=1
fi

# 6. Hardcoded Zod validation messages
MATCHES=$(grep -nE "\.(min|max|email|url|regex|refine)\([^)]*[\"'][A-Z][^\"']+[\"']" "$FILE" 2>/dev/null | head -3)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES"
  echo "  ^ Use ValidationHelper: .min(1, v.required())"
  FOUND=1
fi

# 7. Bilingual field names
MATCHES=$(grep -nE '(title|name|description|label|body)(Ar|En|Arabic|English)\b' "$FILE" 2>/dev/null | head -3)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES"
  echo "  ^ Use generic field names with lang field instead"
  FOUND=1
fi

# 8. Hardcoded placeholder text
MATCHES=$(grep -nE "placeholder=[\"'][A-Z][^\"'{]+[\"']" "$FILE" 2>/dev/null | head -3)
if [ -n "$MATCHES" ]; then
  echo "$MATCHES"
  echo "  ^ Use dictionary: placeholder={d.form.fieldPlaceholder}"
  FOUND=1
fi

if [ -n "$FOUND" ]; then
  echo ""
  echo "WARNING: Hardcoded strings detected. See .claude/rules/translation.md"
fi
exit 0
