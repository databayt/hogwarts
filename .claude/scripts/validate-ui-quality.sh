#!/bin/bash
# UI Component Quality Validation Script
# Checks for semantic token violations, typography utilities, and hardcoded text

echo "🎨 Validating UI Component Quality..."

# Get staged UI component files (excluding test files)
UI_FILES=$(git diff --cached --name-only | grep 'src/components/.*\.tsx$' | grep -v '.test.tsx$' || echo '')

if [ -z "$UI_FILES" ]; then
  echo "✅ UI Quality: No UI component changes detected"
  exit 0
fi

echo "📝 Checking $(echo $UI_FILES | wc -w) UI component file(s)..."
echo ""

TOTAL_VIOLATIONS=0
HARDCODED_COLOR_COUNT=0
TYPOGRAPHY_UTIL_COUNT=0
HARDCODED_TEXT_COUNT=0

for file in $UI_FILES; do
  if [ ! -f "$file" ]; then
    continue
  fi

  # Check for hardcoded colors (semantic token violations)
  HARDCODED_COLORS=$(grep -n -E 'className="[^"]*(?:bg-(?:white|black|gray-[0-9]+|slate-[0-9]+|zinc-[0-9]+|blue-[0-9]+|red-[0-9]+|green-[0-9]+|yellow-[0-9]+|purple-[0-9]+|pink-[0-9]+|indigo-[0-9]+)|text-(?:white|black|gray-[0-9]+|slate-[0-9]+|zinc-[0-9]+)|border-(?:white|black|gray-[0-9]+|slate-[0-9]+|zinc-[0-9]+)|dark:(?:bg-|text-|border-))' "$file" 2>/dev/null || echo '')
  COLOR_COUNT=$(echo "$HARDCODED_COLORS" | grep -c -v '^$' || echo 0)

  # Check for typography utilities on divs/spans (semantic HTML violations)
  TYPOGRAPHY_UTILS=$(grep -n -E '<(?:div|span)[^>]*className="[^"]*(?:text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)|font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black))' "$file" 2>/dev/null || echo '')
  TYPO_COUNT=$(echo "$TYPOGRAPHY_UTILS" | grep -c -v '^$' || echo 0)

  # Check for hardcoded English text (i18n violations)
  HARDCODED_TEXT=$(grep -n -E '>[A-Z][a-z]{2,}(\s+[a-z]{2,})+<' "$file" | grep -v 'dictionary' | grep -v 'defaultValue' || echo '')
  TEXT_COUNT=$(echo "$HARDCODED_TEXT" | grep -c -v '^$' || echo 0)

  FILE_VIOLATIONS=$((COLOR_COUNT + TYPO_COUNT + TEXT_COUNT))

  if [ $FILE_VIOLATIONS -gt 0 ]; then
    echo "❌ $file ($FILE_VIOLATIONS violations)"

    if [ $COLOR_COUNT -gt 0 ]; then
      echo "   🎨 Hardcoded colors: $COLOR_COUNT"
      HARDCODED_COLOR_COUNT=$((HARDCODED_COLOR_COUNT + COLOR_COUNT))
      echo "$HARDCODED_COLORS" | head -n 3 | sed 's/^/      /'
      if [ $COLOR_COUNT -gt 3 ]; then
        echo "      ... and $((COLOR_COUNT - 3)) more"
      fi
    fi

    if [ $TYPO_COUNT -gt 0 ]; then
      echo "   📝 Typography utilities: $TYPO_COUNT"
      TYPOGRAPHY_UTIL_COUNT=$((TYPOGRAPHY_UTIL_COUNT + TYPO_COUNT))
      echo "$TYPOGRAPHY_UTILS" | head -n 3 | sed 's/^/      /'
      if [ $TYPO_COUNT -gt 3 ]; then
        echo "      ... and $((TYPO_COUNT - 3)) more"
      fi
    fi

    if [ $TEXT_COUNT -gt 0 ]; then
      echo "   🌍 Hardcoded text: $TEXT_COUNT"
      HARDCODED_TEXT_COUNT=$((HARDCODED_TEXT_COUNT + TEXT_COUNT))
      echo "$HARDCODED_TEXT" | head -n 2 | sed 's/^/      /'
      if [ $TEXT_COUNT -gt 2 ]; then
        echo "      ... and $((TEXT_COUNT - 2)) more"
      fi
    fi

    echo ""
    TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + FILE_VIOLATIONS))
  fi
done

if [ $TOTAL_VIOLATIONS -eq 0 ]; then
  echo "✅ UI Quality: All checks passed (0 violations)"
  exit 0
fi

# Report summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "❌ UI Quality: $TOTAL_VIOLATIONS total violations found"
echo ""
echo "Breakdown:"
echo "  🎨 Hardcoded colors: $HARDCODED_COLOR_COUNT"
echo "  📝 Typography utilities: $TYPOGRAPHY_UTIL_COUNT"
echo "  🌍 Hardcoded text: $HARDCODED_TEXT_COUNT"
echo ""
echo "💡 Quick Fixes:"
echo ""
echo "Semantic Tokens (replace hardcoded colors):"
echo "  bg-white        → bg-background"
echo "  bg-gray-50      → bg-muted"
echo "  bg-gray-100     → bg-accent"
echo "  text-gray-600   → text-muted-foreground"
echo "  border-gray-200 → border-border"
echo "  bg-blue-500     → bg-primary"
echo "  bg-red-500      → bg-destructive"
echo "  bg-green-500    → bg-chart-2"
echo ""
echo "Semantic HTML (replace typography utilities):"
echo "  <div className=\"text-3xl font-bold\"> → <h2>"
echo "  <div className=\"text-2xl\">           → <h3>"
echo "  <div className=\"text-sm\">            → <small>"
echo "  <div className=\"font-semibold\">      → <h4>"
echo ""
echo "Internationalization (use dictionary):"
echo "  <button>Save</button>               → <button>{dictionary?.ui?.save || 'Save'}</button>"
echo "  <input placeholder=\"Enter name\" />  → <input placeholder={dictionary?.ui?.enterName || 'Enter name'} />"
echo ""
echo "📚 Documentation:"
echo "  - Semantic Tokens: /docs/semantic-tokens"
echo "  - Typography: /docs/typography"
echo "  - UI Factory: /docs/ui-factory"
echo ""
echo "🔧 Advanced Validation:"
echo "  Run '/ui-validate' for detailed analysis and auto-fix suggestions"
echo ""

exit 1
