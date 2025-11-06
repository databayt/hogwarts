---
description: Generate scale-adaptive planning documents (PRD and architecture)
---

# Plan Command - Scale-Adaptive Planning

Generate Product Requirements Documents (PRD) and Architecture documents that adapt to project complexity.

## Usage

```bash
/plan [feature-name] [complexity-level]
```

## Options

- **feature-name**: Name of the feature to plan (required)
- **complexity-level**: Optional override for complexity detection
  - `quick` (Level 0): Tech spec only for bug fixes
  - `simple` (Level 1): Basic PRD for small features
  - `standard` (Level 2): Full PRD + Architecture (default)
  - `complex` (Level 3): Comprehensive planning suite
  - `enterprise` (Level 4): Complete documentation + ADRs

## Process

1. **Analyze Request**: Detect complexity level automatically
2. **Gather Context**: Examine existing codebase and patterns
3. **Generate Documents**: Create appropriate planning documents
4. **Create Story Outline**: Break down into implementable stories
5. **Update Metrics**: Track planning time and estimates

## Examples

```bash
# Auto-detect complexity
/plan student-attendance

# Force quick planning for simple fix
/plan fix-login-button quick

# Standard feature planning
/plan payment-gateway standard

# Enterprise-level planning
/plan multi-tenant-architecture enterprise
```

## Outputs

Creates documents in `.bmad/planning/`:
- `prd-[feature].md` - Product requirements
- `architecture-[feature].md` - Technical architecture
- `tech-spec-[feature].md` - Quick technical spec (Level 0)
- `stories-[feature].md` - Initial story breakdown

## Complexity Levels

| Level | Documentation | Timeline | Use Case |
|-------|--------------|----------|-----------|
| 0 - Quick | Tech spec only | Hours | Bug fixes, typos |
| 1 - Simple | Basic PRD | Days | Small features |
| 2 - Standard | PRD + Architecture | 1-2 weeks | Most features |
| 3 - Complex | Full suite | 2-4 weeks | Large features |
| 4 - Enterprise | Complete + ADRs | Months | System changes |

## Workflow Integration

After planning completes:
1. Use `/story` to generate detailed implementation stories
2. Use `/cycle` to execute stories continuously
3. Track progress in `.bmad/metrics/`

## Implementation

```typescript
// Invokes the plan agent
await invokeAgent('/agents/bmad/plan', {
  feature: featureName,
  level: complexityLevel || 'auto',
  context: {
    existingComponents: findRelatedComponents(),
    patterns: getCurrentPatterns(),
    constraints: getProjectConstraints()
  }
})

// Generates:
// - PRD with requirements
// - Architecture with technical design
// - Story breakdown
// - Time and effort estimates
```

## Success Criteria

✅ Requirements are clear and testable
✅ Architecture follows project patterns
✅ Multi-tenant safety addressed
✅ Performance targets defined
✅ i18n requirements specified
✅ Stories created with dependencies

## Tips

- Let complexity auto-detection work for you
- Don't over-plan simple tasks
- Include acceptance criteria in requirements
- Consider multi-tenant implications early
- Plan for both Arabic and English from start