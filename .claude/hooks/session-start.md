---
description: Session start initialization and context loading
---

# Session Start Hook - Initialize Workspace

Automatically loads project context, shows status, and prepares the development environment when Claude Code session starts.

## Execution Flow

### 1. Load Project Context

```bash
# Display project info
echo "🚀 Hogwarts School Automation Platform"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Stack: Next.js 15 + React 19 + Prisma + TypeScript"
echo "Environment: $(git branch --show-current) branch"
echo "Last commit: $(git log -1 --oneline)"
```

### 2. Git Status Check

```bash
# Show current git state
echo ""
echo "📊 Repository Status:"
git status --short
if [ $? -eq 0 ]; then
  CHANGES=$(git status --porcelain | wc -l)
  if [ $CHANGES -gt 0 ]; then
    echo "  ⚠️  $CHANGES uncommitted changes"
  else
    echo "  ✅ Working directory clean"
  fi
fi
```

### 3. Load Active Stories

```bash
# Check for in-progress stories
if [ -d .bmad/stories ]; then
  echo ""
  echo "📝 Active Stories:"
  grep -l "IN_PROGRESS" .bmad/stories/stories/*.md 2>/dev/null | while read story; do
    STORY_ID=$(basename $story .md)
    TITLE=$(grep "^## " $story | head -1 | sed 's/## //')
    echo "  🔄 $STORY_ID: $TITLE"
  done
fi
```

### 4. Check System Health

```bash
# Validate environment
echo ""
echo "🔍 System Check:"

# TypeScript
pnpm tsc --noEmit --incremental 2>/dev/null
if [ $? -eq 0 ]; then
  echo "  ✅ TypeScript: No errors"
else
  ERRORS=$(pnpm tsc --noEmit 2>&1 | grep "error TS" | wc -l)
  echo "  ❌ TypeScript: $ERRORS errors (run /fix-build)"
fi

# Tests
LAST_TEST=$(find .bmad/metrics -name "test-*.json" -mtime -1 2>/dev/null | head -1)
if [ -f "$LAST_TEST" ]; then
  PASSING=$(cat $LAST_TEST | jq .passing)
  TOTAL=$(cat $LAST_TEST | jq .total)
  echo "  ✅ Tests: $PASSING/$TOTAL passing"
else
  echo "  ⏸️  Tests: Not run recently"
fi

# Dependencies
OUTDATED=$(pnpm outdated --json 2>/dev/null | jq '. | length')
if [ "$OUTDATED" -gt 0 ]; then
  echo "  ⚠️  Dependencies: $OUTDATED outdated"
else
  echo "  ✅ Dependencies: All up to date"
fi
```

### 5. Load Session History

```bash
# Show recent sessions
if [ -f .bmad/sessions/history.json ]; then
  echo ""
  echo "📅 Recent Sessions:"
  tail -3 .bmad/sessions/history.json | jq -r '.[] |
    "  " + .date + ": " + .summary' 2>/dev/null
fi
```

### 6. Display Available Commands

```bash
# Quick reference
echo ""
echo "⚡ Quick Commands:"
echo "  /plan <feature>     - Generate PRD and architecture"
echo "  /story <feature>    - Create implementation stories"
echo "  /cycle <epic>       - Execute story loop with TDD"
echo "  /ship <env>         - Deploy with validation"
echo "  /fix                - Auto-fix all issues"
echo "  /review             - Comprehensive code review"
```

### 7. Load Metrics Dashboard

```bash
# Show key metrics
if [ -f .bmad/metrics/project-metrics.json ]; then
  echo ""
  echo "📊 Metrics:"
  VELOCITY=$(cat .bmad/metrics/velocity.json | jq .current)
  COVERAGE=$(cat .bmad/metrics/coverage-latest.json | jq .total.lines.pct)
  QUALITY=$(cat .bmad/metrics/quality.json | jq .score)

  echo "  Velocity: $VELOCITY pts/day"
  echo "  Coverage: $COVERAGE%"
  echo "  Quality: $QUALITY/100"
fi
```

### 8. Initialize Session

```bash
# Create session record
SESSION_ID=$(uuidgen)
SESSION_START=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > .bmad/sessions/current.json << EOF
{
  "id": "$SESSION_ID",
  "start": "$SESSION_START",
  "branch": "$(git branch --show-current)",
  "uncommitted": $CHANGES,
  "stories": [],
  "commits": [],
  "metrics": {
    "start": {
      "coverage": $COVERAGE,
      "quality": $QUALITY,
      "velocity": $VELOCITY
    }
  }
}
EOF

echo ""
echo "✅ Session initialized: $SESSION_ID"
```

## Configuration

```json
{
  "claude": {
    "hooks": {
      "sessionStart": {
        "enabled": true,
        "actions": [
          "loadContext",
          "checkGitStatus",
          "loadStories",
          "healthCheck",
          "loadHistory",
          "showCommands",
          "loadMetrics",
          "initSession"
        ],
        "showBanner": true,
        "compactMode": false
      }
    }
  }
}
```

## Compact Mode Output

When `compactMode: true`:

```
🚀 Hogwarts Platform | feature/search branch | 3 changes
📝 STORY-005 in progress | ✅ TS clean | 🧪 234/240 tests
⚡ /plan /story /cycle /ship /fix /review
```

## Custom Banners

```json
{
  "banner": {
    "custom": true,
    "ascii": [
      "  _   _                            _       ",
      " | | | | ___   __ ___      ____ _| |_ ___ ",
      " | |_| |/ _ \\ / _` \\ \\ /\\ / / _` | __/ __|",
      " |  _  | (_) | (_| |\\ V  V / (_| | |_\\__ \\",
      " |_| |_|\\___/ \\__, | \\_/\\_/ \\__,_|\\__|___/",
      "              |___/                        "
    ]
  }
}
```

## Error Recovery

If session initialization fails:

```bash
# Fallback to minimal mode
if [ $? -ne 0 ]; then
  echo "⚠️  Full initialization failed - minimal mode"
  echo "Branch: $(git branch --show-current)"
  echo "Status: $(git status --porcelain | wc -l) changes"
fi
```

## Integration with Claude Code

This hook automatically runs when:

- Opening project in Claude Code
- Using `claude` CLI command
- Reconnecting after timeout

## Output Example

```
🚀 Hogwarts School Automation Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stack: Next.js 15 + React 19 + Prisma + TypeScript
Environment: feature/student-search branch
Last commit: abc123 feat: add search filters

📊 Repository Status:
  M src/components/platform/students/content.tsx
  A src/components/platform/students/search.tsx
  ⚠️  2 uncommitted changes

📝 Active Stories:
  🔄 STORY-005: Implement student search

🔍 System Check:
  ✅ TypeScript: No errors
  ✅ Tests: 234/240 passing
  ⚠️  Dependencies: 3 outdated

📅 Recent Sessions:
  2024-01-14: Implemented attendance tracking
  2024-01-13: Fixed multi-tenant queries
  2024-01-12: Added payment gateway

⚡ Quick Commands:
  /plan <feature>     - Generate PRD and architecture
  /story <feature>    - Create implementation stories
  /cycle <epic>       - Execute story loop with TDD
  /ship <env>         - Deploy with validation
  /fix                - Auto-fix all issues
  /review             - Comprehensive code review

📊 Metrics:
  Velocity: 13 pts/day
  Coverage: 96.5%
  Quality: 92/100

✅ Session initialized: 550e8400-e29b-41d4-a716-446655440000
```
