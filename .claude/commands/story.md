---
description: Generate implementation stories from planning documents
---

# Story Command - Story Generation

Transform PRDs and architecture documents into detailed, implementable stories with clear acceptance criteria.

## Usage

```bash
/story [feature-name]
```

## Process

1. **Load Planning Documents**: Read PRD and architecture from `.bmad/planning/`
2. **Analyze Requirements**: Extract components, APIs, and database changes
3. **Generate Stories**: Create detailed story files with dependencies
4. **Map Dependencies**: Build dependency graph for execution order
5. **Create Tracking**: Setup velocity and progress metrics

## Examples

```bash
# Generate stories for a planned feature
/story student-attendance

# Generate stories after planning
/plan payment-gateway
/story payment-gateway

# Generate stories for existing PRD
/story existing-feature
```

## Story Types Generated

### 1. Setup Story

- Directory structure creation
- Base file scaffolding
- Route configuration
- Navigation updates

### 2. Database Story

- Prisma schema changes
- Migration generation
- Index optimization
- Seed data

### 3. API Stories

- Server actions
- CRUD operations
- Validation schemas
- Error handling

### 4. Component Stories

- UI components
- Forms and tables
- Client interactions
- Responsive layouts

### 5. Testing Story

- Unit tests (95% coverage)
- Integration tests
- E2E test scenarios
- Manual test plans

### 6. Documentation Story

- Component README
- API documentation
- User guides
- Changelog updates

## Outputs

Creates files in `.bmad/stories/`:

### Epic File

```
.bmad/stories/epics/EPIC-001-[feature].md
```

### Story Files

```
.bmad/stories/stories/
├── STORY-001-setup.md
├── STORY-002-database.md
├── STORY-003-api-create.md
├── STORY-004-api-read.md
├── STORY-005-ui-list.md
├── STORY-006-ui-form.md
├── STORY-007-testing.md
└── STORY-008-documentation.md
```

## Story Structure

Each story includes:

- **Context**: Why the story exists
- **Requirements**: Clear, testable requirements
- **Technical Design**: Implementation approach
- **Implementation Guide**: Step-by-step instructions
- **Testing Strategy**: What tests to write
- **Acceptance Criteria**: Definition of done
- **Multi-tenant Considerations**: schoolId scoping
- **i18n Requirements**: Translation needs

## Story Lifecycle

```
TODO → IN_PROGRESS → REVIEW → COMPLETED
         ↓              ↓
      BLOCKED      REJECTED → TODO
```

## Dependencies

Stories include dependency mapping:

```markdown
Dependencies:

- [ ] STORY-001: Must complete setup first
- [ ] STORY-002: Database schema required
```

## Story Points

Automatic estimation based on:

- Component complexity
- Database changes
- API endpoints
- Testing requirements
- Documentation needs

## Implementation

```typescript
// Invokes the story agent
await invokeAgent("/agents/bmad/story", {
  feature: featureName,
  planning: {
    prd: loadDocument(`prd-${feature}.md`),
    architecture: loadDocument(`architecture-${feature}.md`),
  },
})

// Generates:
// - Epic with overview
// - Individual story files
// - Dependency graph
// - Initial velocity metrics
```

## Workflow Integration

After stories are generated:

1. Review and adjust story details if needed
2. Use `/cycle` to execute stories automatically
3. Track progress with `/loop story EPIC-001`
4. Update status as work progresses

## Success Criteria

✅ All requirements mapped to stories
✅ Dependencies clearly identified
✅ Acceptance criteria specific and testable
✅ Story points estimated
✅ Technical approach documented
✅ Testing strategy defined

## Tips

- Keep stories small (1-13 points)
- One deliverable per story
- Clear acceptance criteria
- Include test requirements
- Document decisions in stories
