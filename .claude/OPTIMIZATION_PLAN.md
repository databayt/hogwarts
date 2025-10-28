# Claude Code Environment Optimization Plan

## Current State Analysis

### Agent Inventory
- **Total Agents**: 25 (22 new + 3 old)
- **Total Commands**: 12
- **Total Skills**: 6
- **Total Size**: 142KB

### Issues Identified

#### 1. Duplicate Agents
| Old Agent | New Agent | Issue | Solution |
|-----------|-----------|-------|----------|
| architect.md (7.8K) | architecture.md (617) | Both do architecture | Merge into enhanced architecture.md |
| - | - | - | - |

#### 2. Overlapping Agents
| Agent 1 | Agent 2 | Overlap | Solution |
|---------|---------|---------|----------|
| git.md (950) | github.md (789) | Git workflow + GitHub ops | Merge into git-github.md |
| build.md (473) | nextjs.md (2.9K) | Build is part of Next.js | Merge into nextjs.md |
| pattern.md (689) | architecture.md | Pattern enforcement is architecture | Merge into architecture.md |

#### 3. Unclear Naming
| Current | Better Name | Reason |
|---------|-------------|--------|
| bug.md | debug.md | Clearer purpose (debugging) |
| review.md | react-reviewer.md | Specifies it's React-focused |

## Optimization Goals

1. **Reduce agent count**: 25 → 18 agents (30% reduction)
2. **Eliminate duplicates**: Merge overlapping functionality
3. **Improve clarity**: Better naming and organization
4. **Maintain coverage**: Keep all essential expertise
5. **Enhance efficiency**: Faster agent selection

## Proposed Agent Structure (18 Total)

### Core Orchestration (1)
- `orchestrate.md` - Master coordinator

### Tech Stack (7 - KEEP ALL)
- `nextjs.md` - Enhanced with build content
- `react.md` - React 19 specialist
- `shadcn.md` - shadcn/ui expert
- `prisma.md` - Database expert (MCP)
- `typescript.md` - Type safety
- `tailwind.md` - CSS utilities
- `i18n.md` - Bilingual support

### Process (6 - CONSOLIDATED)
- `architecture.md` - Enhanced (architect + pattern merged)
- `test.md` - TDD specialist
- `security.md` - OWASP auditor
- `auth.md` - Authentication
- `performance.md` - Optimization
- `typography.md` - Semantic HTML

### Workflow (4 - CONSOLIDATED)
- `git-github.md` - NEW: Git + GitHub combined
- `api.md` - Server actions
- `multi-tenant.md` - Tenant safety
- `database-optimizer.md` - Query optimization (MCP)

### Specialized (2)
- `debug.md` - Renamed from bug.md
- `react-reviewer.md` - Renamed from review.md

### Removed/Merged
- ❌ `architect.md` → Merged into `architecture.md`
- ❌ `bug.md` → Renamed to `debug.md`
- ❌ `review.md` → Renamed to `react-reviewer.md`
- ❌ `git.md` → Merged into `git-github.md`
- ❌ `github.md` → Merged into `git-github.md`
- ❌ `build.md` → Merged into `nextjs.md`
- ❌ `pattern.md` → Merged into `architecture.md`
- ❌ `prettier.md` → Functionality via hooks, remove agent

## Implementation Steps

### Phase 1: Merge Duplicates
1. Enhance `architecture.md` with content from `architect.md` + `pattern.md`
2. Delete `architect.md`
3. Delete `pattern.md`

### Phase 2: Consolidate Similar
1. Create `git-github.md` combining `git.md` + `github.md`
2. Delete `git.md` and `github.md`
3. Enhance `nextjs.md` with build content from `build.md`
4. Delete `build.md`

### Phase 3: Rename for Clarity
1. Rename `bug.md` → `debug.md`
2. Rename `review.md` → `react-reviewer.md`

### Phase 4: Remove Redundant
1. Delete `prettier.md` (functionality via PostToolUse hooks)

### Phase 5: Update Documentation
1. Update CLAUDE.md with new structure
2. Update agent selection matrix
3. Add migration guide for existing usage

## Benefits

### Efficiency
- **30% fewer agents** (25 → 18) = Faster agent selection
- **Combined workflows** = Less context switching
- **Clearer naming** = Better discoverability

### Maintainability
- **No duplicates** = Single source of truth
- **Logical grouping** = Easier to understand
- **Better organization** = Scalable structure

### Performance
- **Reduced overhead** = Faster loading
- **Combined expertise** = More comprehensive responses
- **Better agent selection** = Less confusion

## Migration Guide

### Old → New Agent Mapping
```bash
# Old usage → New usage
/agents/architect → /agents/architecture
/agents/bug → /agents/debug
/agents/review → /agents/react-reviewer
/agents/git → /agents/git-github
/agents/github → /agents/git-github
/agents/pattern → /agents/architecture
# build functionality now in /agents/nextjs
# prettier functionality via hooks (automatic)
```

### Slash Commands
No changes needed - commands reference agents by purpose, not by name.

### Skills
No changes needed - skills remain independent.

## Success Metrics

- ✅ Agent count reduced from 25 to 18
- ✅ Zero duplicate functionality
- ✅ All tech stack coverage maintained
- ✅ Clear naming convention
- ✅ Documentation updated
- ✅ Migration guide provided
- ✅ Backward compatibility via mapping

## Timeline

- **Phase 1-2**: 30 minutes (merging and consolidation)
- **Phase 3**: 10 minutes (renaming)
- **Phase 4**: 5 minutes (cleanup)
- **Phase 5**: 15 minutes (documentation)
- **Total**: ~1 hour

## Risk Assessment

### Low Risk
- Tech stack agents unchanged (no disruption)
- Commands unchanged (transparent to users)
- Skills unchanged (independent modules)

### Medium Risk
- Renaming may require user adaptation
- Mitigation: Provide clear migration guide

### High Risk
- None identified

## Approval Required

Once approved, proceed with implementation in order:
1. Phase 1: Merge duplicates
2. Phase 2: Consolidate similar
3. Phase 3: Rename
4. Phase 4: Cleanup
5. Phase 5: Document

---

**Status**: READY FOR IMPLEMENTATION
**Estimated Impact**: High positive impact on usability and efficiency
**Risk Level**: Low
