---
description: Session end summary and metrics tracking
---

# Session End Hook - Summarize & Track

Generates session summary, updates metrics, and tracks productivity when Claude Code session ends.

## Execution Flow

### 1. Calculate Session Duration

```bash
# Load session data
SESSION_DATA=$(cat .bmad/sessions/current.json)
SESSION_ID=$(echo $SESSION_DATA | jq -r .id)
SESSION_START=$(echo $SESSION_DATA | jq -r .start)
SESSION_END=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Calculate duration
START_SECONDS=$(date -d "$SESSION_START" +%s)
END_SECONDS=$(date -d "$SESSION_END" +%s)
DURATION_SECONDS=$((END_SECONDS - START_SECONDS))
DURATION_HOURS=$(echo "scale=1; $DURATION_SECONDS / 3600" | bc)

echo "⏱️  Session Duration: ${DURATION_HOURS} hours"
```

### 2. Git Activity Summary

```bash
# Count commits made during session
COMMITS=$(git log --since="$SESSION_START" --oneline | wc -l)
if [ $COMMITS -gt 0 ]; then
  echo ""
  echo "📝 Commits Made: $COMMITS"
  git log --since="$SESSION_START" --oneline | head -5
fi

# Files changed
FILES_CHANGED=$(git diff --stat HEAD@{$DURATION_HOURS.hours.ago} 2>/dev/null | tail -1)
if [ -n "$FILES_CHANGED" ]; then
  echo ""
  echo "📁 Files Changed:"
  echo "  $FILES_CHANGED"
fi
```

### 3. Stories Progress

```bash
# Track story completions
echo ""
echo "📋 Story Progress:"

COMPLETED=0
IN_PROGRESS=0
BLOCKED=0

for story in .bmad/stories/stories/*.md; do
  if [ -f "$story" ]; then
    STATUS=$(grep "Status:" $story | cut -d' ' -f2)
    case $STATUS in
      COMPLETED) ((COMPLETED++)) ;;
      IN_PROGRESS) ((IN_PROGRESS++)) ;;
      BLOCKED) ((BLOCKED++)) ;;
    esac
  fi
done

echo "  ✅ Completed: $COMPLETED"
echo "  🔄 In Progress: $IN_PROGRESS"
echo "  ⚠️  Blocked: $BLOCKED"

# Calculate velocity
if [ $COMPLETED -gt 0 ]; then
  POINTS_COMPLETED=$(grep -h "Points:" .bmad/stories/stories/*.md | grep -B1 "COMPLETED" | awk '{sum+=$2} END {print sum}')
  VELOCITY=$(echo "scale=1; $POINTS_COMPLETED / $DURATION_HOURS * 8" | bc)
  echo "  📈 Velocity: $VELOCITY pts/day"
fi
```

### 4. Test & Coverage Changes

```bash
# Compare tests metrics
echo ""
echo "🧪 Test Metrics:"

if [ -f .bmad/metrics/coverage-latest.json ]; then
  COVERAGE_END=$(cat .bmad/metrics/coverage-latest.json | jq .total.lines.pct)
  COVERAGE_START=$(echo $SESSION_DATA | jq .metrics.start.coverage)
  COVERAGE_CHANGE=$(echo "$COVERAGE_END - $COVERAGE_START" | bc)

  if (( $(echo "$COVERAGE_CHANGE > 0" | bc -l) )); then
    echo "  📈 Coverage: $COVERAGE_START% → $COVERAGE_END% (+$COVERAGE_CHANGE%)"
  elif (( $(echo "$COVERAGE_CHANGE < 0" | bc -l) )); then
    echo "  📉 Coverage: $COVERAGE_START% → $COVERAGE_END% ($COVERAGE_CHANGE%)"
  else
    echo "  ➡️  Coverage: $COVERAGE_END% (unchanged)"
  fi
fi

# Test additions
NEW_TESTS=$(find src -name "*.test.*" -newermt "$SESSION_START" | wc -l)
if [ $NEW_TESTS -gt 0 ]; then
  echo "  ✅ New tests written: $NEW_TESTS"
fi
```

### 5. Quality Metrics

```bash
# Code quality changes
echo ""
echo "🎯 Quality Metrics:"

# TypeScript errors
TS_ERRORS=$(pnpm tsc --noEmit 2>&1 | grep "error TS" | wc -l)
echo "  TypeScript errors: $TS_ERRORS"

# ESLint issues
LINT_ISSUES=$(pnpm lint --format compact 2>/dev/null | wc -l)
echo "  ESLint issues: $LINT_ISSUES"

# Calculate quality score
QUALITY_SCORE=$((100 - TS_ERRORS * 5 - LINT_ISSUES * 2))
QUALITY_SCORE=$((QUALITY_SCORE < 0 ? 0 : QUALITY_SCORE))
echo "  Quality score: $QUALITY_SCORE/100"
```

### 6. Commands Used

```bash
# Track which commands were used
echo ""
echo "⚡ Commands Used:"

if [ -f .bmad/sessions/commands.log ]; then
  cat .bmad/sessions/commands.log | sort | uniq -c | sort -rn | head -5
fi
```

### 7. Generate Summary

```bash
# Create session summary
SUMMARY="Worked on $(git branch --show-current) for ${DURATION_HOURS}h. Made $COMMITS commits, completed $COMPLETED stories, coverage at $COVERAGE_END%"

cat > .bmad/sessions/session-$SESSION_ID.json << EOF
{
  "id": "$SESSION_ID",
  "start": "$SESSION_START",
  "end": "$SESSION_END",
  "duration": $DURATION_SECONDS,
  "branch": "$(git branch --show-current)",
  "summary": "$SUMMARY",
  "metrics": {
    "commits": $COMMITS,
    "stories": {
      "completed": $COMPLETED,
      "inProgress": $IN_PROGRESS,
      "blocked": $BLOCKED
    },
    "coverage": {
      "start": $COVERAGE_START,
      "end": $COVERAGE_END,
      "change": $COVERAGE_CHANGE
    },
    "quality": {
      "score": $QUALITY_SCORE,
      "tsErrors": $TS_ERRORS,
      "lintIssues": $LINT_ISSUES
    },
    "velocity": $VELOCITY,
    "filesChanged": "$(git diff --shortstat HEAD@{$DURATION_HOURS.hours.ago} 2>/dev/null)"
  }
}
EOF
```

### 8. Update History

```bash
# Append to history
echo "{\"date\": \"$(date +%Y-%m-%d)\", \"summary\": \"$SUMMARY\"}" >> .bmad/sessions/history.json
```

### 9. Recommendations

```bash
echo ""
echo "💡 Recommendations:"

# Based on metrics
if [ $TS_ERRORS -gt 0 ]; then
  echo "  🔧 Run /fix-build to resolve TypeScript errors"
fi

if [ $COVERAGE_CHANGE -lt 0 ]; then
  echo "  🧪 Coverage decreased - consider adding tests"
fi

if [ $BLOCKED -gt 0 ]; then
  echo "  ⚠️  Review blocked stories and unblock"
fi

if [ $COMMITS -eq 0 ] && [ $DURATION_HOURS -gt 2 ]; then
  echo "  💾 No commits made - consider saving your work"
fi
```

### 10. Cleanup

```bash
# Clean temporary files
rm -f .bmad/sessions/current.json
rm -f .bmad/sessions/commands.log
```

## Configuration

```json
{
  "claude": {
    "hooks": {
      "sessionEnd": {
        "enabled": true,
        "generateSummary": true,
        "trackMetrics": true,
        "showRecommendations": true,
        "saveHistory": true,
        "cleanup": true
      }
    }
  }
}
```

## Output Example

```
═══════════════════════════════════════
📊 SESSION SUMMARY
═══════════════════════════════════════
⏱️  Session Duration: 3.5 hours

📝 Commits Made: 5
  abc123 feat: add student search
  def456 test: add search component tests
  ghi789 fix: multi-tenant query scope
  jkl012 refactor: extract search logic
  mno345 docs: update search API docs

📁 Files Changed:
  12 files changed, 450 insertions(+), 87 deletions(-)

📋 Story Progress:
  ✅ Completed: 2
  🔄 In Progress: 1
  ⚠️  Blocked: 0
  📈 Velocity: 13.7 pts/day

🧪 Test Metrics:
  📈 Coverage: 94.2% → 96.5% (+2.3%)
  ✅ New tests written: 8

🎯 Quality Metrics:
  TypeScript errors: 0
  ESLint issues: 3
  Quality score: 94/100

⚡ Commands Used:
  12 /test
   8 /fix
   5 /review
   3 /build
   2 /ship

💡 Recommendations:
  🧪 Great coverage improvement! Keep it up
  🎯 Quality score is high - ready for deployment

═══════════════════════════════════════
Session saved: 550e8400-e29b-41d4-a716-446655440000
Thank you for using Claude Code! 🚀
═══════════════════════════════════════
```

## Metrics Aggregation

Weekly/monthly reports generated from session data:

```javascript
{
  "week": {
    "sessions": 15,
    "totalHours": 52.5,
    "commits": 67,
    "storiesCompleted": 12,
    "averageVelocity": 14.3,
    "coverageTrend": "+5.2%"
  }
}
```

## Integration Points

- Automatically triggered on:
  - Claude Code window close
  - Session timeout
  - Manual `/exit` command
  - System shutdown

## Error Handling

```bash
# Graceful failure
trap cleanup EXIT
cleanup() {
  if [ -f .bmad/sessions/current.json ]; then
    echo "⚠️  Session ended unexpectedly"
    # Still save partial data
    mv .bmad/sessions/current.json .bmad/sessions/incomplete-$(date +%s).json
  fi
}
```
