---
name: "source-command-cycle"
description: "Execute continuous development cycle for an epic"
---

# source-command-cycle

Use this skill when the user asks to run the migrated source command `cycle`.

## Command Template

# Cycle Command - Story Execution

Launch orchestrated development loop to implement all stories in an epic continuously.

## Usage

```bash
/cycle [epic-id]
```

## Process

1. **Load Epic**: Get all stories from the epic
2. **Order by Dependencies**: Topological sort for execution order
3. **For Each Story**:
   - Update status to IN_PROGRESS
   - Write tests first (TDD - RED)
   - Implement solution (GREEN)
   - Refactor code (REFACTOR)
   - Run quality checks
   - Commit changes
   - Update story status to COMPLETED
4. **Track Metrics**: Update velocity and quality metrics
5. **Generate Report**: Epic completion summary

## Examples

```bash
# Execute all stories in an epic
/cycle EPIC-001

# After planning and story generation
/plan student-attendance
/story student-attendance
/cycle EPIC-001-student-attendance

# Resume interrupted cycle
/cycle EPIC-001 --resume
```

## Execution Flow

### TDD Cycle for Each Story

```
1. Setup → 2. Write Tests → 3. Run Tests (RED) →
4. Implement → 5. Run Tests (GREEN) → 6. Refactor →
7. Quality Check → 8. Commit → 9. Next Story
```

### Story Implementation Phases

#### Phase 1: Setup

- Create directory structure
- Initialize files
- Configure routes

#### Phase 2: Test First (TDD)

- Generate comprehensive test suite
- Unit tests for components
- Integration tests for APIs
- Tests should fail initially

#### Phase 3: Implementation

- Create components
- Implement server actions
- Add validation
- Wire up UI

#### Phase 4: Test Validation

- All tests should pass
- Coverage ≥ 95%
- No regressions

#### Phase 5: Refactoring

- Improve code quality
- Remove duplication
- Optimize performance

#### Phase 6: Quality Checks

- TypeScript compilation
- ESLint validation
- Prettier formatting
- Security scan
- Multi-tenant verification

#### Phase 7: Commit

- Conventional commit message
- Reference story ID
- Update changelog

## Progress Tracking

Real-time display:

```
═══════════════════════════════════════
🔄 CYCLE PROGRESS: EPIC-001
═══════════════════════════════════════
Current: STORY-003 - API Implementation
Progress: ████████████░░░░░░░ 60%
Stories: 6/10 completed
Time: 2h 15m elapsed
ETA: 1h 30m remaining
═══════════════════════════════════════
```

## Stop Conditions

Cycle stops when:

- All stories completed ✓
- Critical error encountered ✗
- User interruption (Ctrl+C)
- Time limit reached (configurable)
- Iteration limit reached (default: 50)

## Checkpoint System

Automatic checkpoints after each story:

- Save current state
- Allow resume after interruption
- Preserve completed work

Resume interrupted cycle:

```bash
/cycle EPIC-001 --resume
```

## Quality Gates

Each story must pass:

- ✅ All tests passing
- ✅ 95%+ code coverage
- ✅ No TypeScript errors
- ✅ No ESLint violations
- ✅ Build succeeds
- ✅ Multi-tenant safe
- ✅ i18n complete

## Implementation

```typescript
// Invokes conductor and loop agents
await invokeAgent("/agents/core/conductor", {
  task: "orchestrate-epic",
  epic: epicId,
  workflow: "tdd-cycle",
})

// Conductor coordinates:
// - Story agent for status updates
// - Stack agents for implementation
// - Quality agents for validation
// - Git agent for commits
// - Loop agent for continuous execution
```

## Metrics Tracked

### Velocity Metrics

- Stories completed per hour
- Story points delivered
- Average time per story
- Blocker frequency

### Quality Metrics

- Test coverage trend
- Bug introduction rate
- Code complexity
- Build success rate

## Error Handling

### On Test Failure

1. Analyze failure
2. Fix implementation
3. Re-run tests
4. Continue cycle

### On Build Failure

1. Identify error
2. Fix issue
3. Rebuild
4. Continue cycle

### On Critical Error

1. Save checkpoint
2. Log error details
3. Pause cycle
4. Await manual intervention

## Workflow Integration

Works with:

- `/plan` - Uses planning documents
- `/story` - Executes generated stories
- `/loop` - Continuous execution engine
- `/ship` - Deploy after cycle completes

## Success Criteria

✅ All stories in epic completed
✅ All tests passing
✅ Code quality standards met
✅ Documentation updated
✅ Metrics tracked
✅ Ready for deployment

## Configuration

```json
{
  "cycle": {
    "maxIterations": 50,
    "maxDuration": "4h",
    "stopOnError": false,
    "autoCommit": true,
    "parallelTests": true,
    "notifyOnComplete": true
  }
}
```

## Tips

- Plan thoroughly before cycling
- Keep stories small and focused
- Monitor progress regularly
- Review metrics after completion
- Use checkpoints for long cycles
