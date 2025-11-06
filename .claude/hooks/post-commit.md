---
description: Post-commit documentation and metrics updates
---

# Post-Commit Hook - Auto Documentation

Automatically updates documentation, README files, and metrics after successful commits.

## Execution Flow

### 1. Update Feature Documentation
```bash
# Detect changed features
git diff HEAD~1 --name-only | grep -E "src/components/platform/.*/(content|actions|form)\.tsx?" | while read file; do
  FEATURE=$(echo $file | sed 's/.*platform\/\([^/]*\).*/\1/')
  /docs-manager update $FEATURE
done
```

### 2. Update API Documentation
```bash
# Detect changed server actions
git diff HEAD~1 --name-only | grep -E "actions\.ts$" | while read file; do
  /docs generate-api $file
done
```

### 3. Update Changelog
```bash
# Parse commit message
COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_HASH=$(git rev-parse HEAD)
DATE=$(date +"%Y-%m-%d")

# Append to changelog
echo "## [$DATE] - $COMMIT_HASH" >> CHANGELOG.md
echo "$COMMIT_MSG" >> CHANGELOG.md
echo "" >> CHANGELOG.md
```

### 4. Update Metrics
```bash
# Track velocity
/metrics update velocity --commit $COMMIT_HASH

# Update quality metrics
/metrics update quality --loc --complexity --coverage
```

### 5. Generate Test Coverage Report
```bash
# If tests were modified
if git diff HEAD~1 --name-only | grep -q "\.test\.tsx?$"; then
  pnpm test --coverage --silent
  cp coverage/coverage-summary.json .bmad/metrics/coverage-latest.json
fi
```

### 6. Update README Badges
```bash
# Update dynamic badges
COVERAGE=$(cat .bmad/metrics/coverage-latest.json | jq .total.lines.pct)
BUILD_STATUS="passing"
TESTS_COUNT=$(find src -name "*.test.*" | wc -l)

# Update README.md badges section
sed -i "s/coverage-[0-9]*%25/coverage-${COVERAGE}%25/g" README.md
sed -i "s/tests-[0-9]*/tests-${TESTS_COUNT}/g" README.md
```

### 7. Create GitHub Issue for TODOs
```bash
# Extract TODOs from commit
git diff HEAD~1 | grep -E "^\+.*TODO:" | while read todo; do
  CLEANED=$(echo $todo | sed 's/.*TODO: *//')
  gh issue create --title "TODO: $CLEANED" --label "todo,auto-generated"
done
```

### 8. Update Project Board
```bash
# If story was completed
if echo "$COMMIT_MSG" | grep -q "STORY-[0-9]*"; then
  STORY_ID=$(echo "$COMMIT_MSG" | grep -oE "STORY-[0-9]*")
  /story update $STORY_ID --status COMPLETED
fi
```

## Configuration

```json
{
  "git": {
    "hooks": {
      "postCommit": {
        "enabled": true,
        "actions": [
          "updateDocs",
          "updateChangelog",
          "trackMetrics",
          "generateCoverage",
          "updateBadges",
          "createTodoIssues",
          "updateProjectBoard"
        ],
        "async": true
      }
    }
  }
}
```

## Features

### Smart Documentation Updates
- Only updates docs for changed components
- Preserves custom content
- Adds new sections automatically

### Metrics Tracking
```json
{
  "commit": "abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "metrics": {
    "linesAdded": 150,
    "linesRemoved": 30,
    "filesChanged": 8,
    "testsAdded": 5,
    "coverage": 96.5,
    "complexity": 8.2
  }
}
```

### Automatic Issue Creation
TODOs in code automatically become GitHub issues:
```typescript
// TODO: Add pagination to student list
// Becomes: Issue #123 - "TODO: Add pagination to student list"
```

### Story Tracking
Commits referencing stories update status:
```bash
git commit -m "feat: implement student search STORY-005"
# Automatically marks STORY-005 as COMPLETED
```

## Output Example

```
📝 Post-Commit Updates
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Documentation updated for 3 features
✅ API docs regenerated for 2 endpoints
✅ Changelog updated
✅ Metrics tracked (velocity: 13 pts/day)
✅ Coverage report generated (96.5%)
✅ README badges updated
✅ Created 2 TODO issues (#456, #457)
✅ Story STORY-005 marked as COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Time: 8.3s (async)
```

## Async Execution

Hook runs asynchronously to not block Git operations:
- Documentation updates: background
- Metrics tracking: queued
- Issue creation: webhook triggered
- Coverage generation: scheduled

## Error Handling

Non-critical - failures don't block workflow:
```bash
# Errors logged but don't stop execution
if ! /docs-manager update $FEATURE 2>/dev/null; then
  echo "⚠️  Documentation update failed for $FEATURE"
  echo "$FEATURE" >> .bmad/failed-updates.log
fi
```