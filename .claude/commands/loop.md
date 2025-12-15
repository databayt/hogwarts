---
description: Start continuous development loop for automated workflows
---

# Loop Command - Continuous Automation

Launch orchestrated loops for automated development workflows that run until targets are met.

## Usage

```bash
/loop [type] [target]
```

## Loop Types

### Story Loop

Execute all stories in an epic

```bash
/loop story EPIC-001
```

### Bug Loop

Fix bugs matching criteria

```bash
/loop bug priority:high
/loop bug status:open assignee:me
```

### Refactor Loop

Improve code quality to target

```bash
/loop refactor coverage:95
/loop refactor complexity:10
```

### Test Loop

Increase test coverage

```bash
/loop test 95  # Target 95% coverage
```

## Examples

```bash
# Execute all stories in epic
/loop story EPIC-001-student-attendance

# Fix all critical bugs
/loop bug priority:critical status:open

# Refactor until 95% coverage and low complexity
/loop refactor coverage:95 complexity:8

# Write tests until 95% coverage
/loop test 95

# Quality improvement loop
/loop quality all  # Runs all quality improvements
```

## Story Loop

Executes stories with full TDD cycle:

```bash
/loop story EPIC-001
```

Process:

1. Load stories from epic
2. Order by dependencies
3. For each story:
   - Write tests (TDD)
   - Implement feature
   - Validate tests pass
   - Commit changes
4. Update metrics
5. Generate report

## Bug Loop

Systematically fixes bugs:

```bash
/loop bug priority:high
```

Process:

1. Query bugs by filter
2. For each bug:
   - Create reproduction test
   - Debug with 5 Whys
   - Implement fix
   - Verify tests pass
   - Commit fix
3. Update bug tracker
4. Generate fix report

Filters:

- `priority`: critical, high, medium, low
- `status`: open, in_progress
- `assignee`: username
- `label`: bug label
- `age`: days since created

## Refactor Loop

Improves code quality:

```bash
/loop refactor coverage:95 complexity:10
```

Process:

1. Analyze code quality metrics
2. Identify improvement areas
3. For each issue:
   - Ensure test coverage
   - Apply refactoring
   - Verify tests pass
   - Measure improvement
4. Commit improvements
5. Update quality metrics

Targets:

- `coverage`: Test coverage percentage
- `complexity`: Cyclomatic complexity
- `smells`: Code smell count
- `lint`: Linting error count
- `types`: TypeScript error count

## Test Loop

Generates tests systematically:

```bash
/loop test 95
```

Process:

1. Measure current coverage
2. Find uncovered code
3. For each uncovered file:
   - Generate test cases
   - Write test implementation
   - Run tests
   - Update coverage
4. Commit new tests
5. Generate coverage report

## Progress Display

Real-time progress tracking:

```
═══════════════════════════════════════
🔄 LOOP PROGRESS
═══════════════════════════════════════
Type: Bug Fix Loop
Filter: priority:high
Progress: ████████████░░░░░░░ 60%
Bugs Fixed: 6/10
Success Rate: 100%
Time: 1h 30m elapsed
ETA: 45m remaining
═══════════════════════════════════════

Current: Fixing BUG-123 - Login validation
Status: Running tests...
```

## Stop Conditions

Loops stop when:

- Target achieved ✓
- All items processed ✓
- Max iterations reached (default: 50)
- Max duration reached (default: 4 hours)
- Error threshold exceeded (3 consecutive)
- User interruption (Ctrl+C)

## Checkpoint System

### Automatic Checkpoints

- Saved after each item
- Allows resume after interruption
- Preserves progress

### Resume Loop

```bash
/loop resume [loop-id]
```

### View Checkpoints

```bash
/loop status
```

## Configuration

### Loop Settings

```json
{
  "loop": {
    "maxIterations": 50,
    "maxDuration": "4h",
    "stopOnError": false,
    "saveCheckpoints": true,
    "delayBetweenItems": 1000,
    "parallel": false
  }
}
```

### Custom Targets

```bash
# Multiple targets
/loop refactor coverage:95 complexity:10 smells:0

# Complex bug filter
/loop bug "priority:high AND (label:security OR label:performance)"
```

## Error Recovery

### Retry Strategy

1. Transient errors: Automatic retry (3 attempts)
2. Persistent errors: Skip and continue
3. Critical errors: Pause and checkpoint

### Error Handling

```
On Error:
1. Log error details
2. Save checkpoint
3. Determine strategy
4. Apply recovery
5. Continue or pause
```

## Metrics Tracked

### Performance Metrics

- Items processed per hour
- Success rate
- Average time per item
- Error rate

### Quality Metrics

- Coverage improvement
- Bugs fixed
- Code complexity reduction
- Performance gains

## Implementation

```typescript
// Invokes the loop agent
await invokeAgent("/agents/bmad/loop", {
  type: loopType,
  target: loopTarget,
  config: {
    maxIterations: 50,
    maxDuration: 4 * 60 * 60 * 1000,
    saveCheckpoints: true,
  },
})

// Loop agent orchestrates:
// - Loading items to process
// - Executing each item
// - Tracking progress
// - Handling errors
// - Saving checkpoints
// - Generating reports
```

## Loop Combinations

### Quality Sprint

```bash
/loop quality all
# Runs sequentially:
# 1. Test loop to 95%
# 2. Refactor loop for complexity
# 3. Bug fix loop for open bugs
```

### Pre-Release

```bash
/loop release
# Runs:
# 1. Fix critical bugs
# 2. Increase test coverage
# 3. Resolve lint errors
# 4. Build verification
```

## Best Practices

### Before Starting

1. Review target metrics
2. Ensure good test coverage
3. Commit current work
4. Clear schedule (can take hours)

### During Execution

1. Monitor progress
2. Check error logs
3. Review committed changes
4. Adjust targets if needed

### After Completion

1. Review metrics report
2. Verify quality improvements
3. Run integration tests
4. Deploy if appropriate

## Success Criteria

✅ Target metrics achieved
✅ All items processed successfully
✅ Quality gates passed
✅ Changes committed
✅ Metrics improved
✅ Report generated

## Tips

- Start with realistic targets
- Use checkpoints for long loops
- Monitor resource usage
- Review changes before deploying
- Combine loops for comprehensive improvement
