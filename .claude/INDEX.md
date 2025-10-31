# .claude/ Directory Index

**Complete guide to the Claude Code automation suite**

---

## 📁 Directory Structure

```
.claude/
├── README.md                    # 6.4K - Main documentation (START HERE)
├── ISSUE.md                     # 11K - Issue reporting & troubleshooting
├── OPTIMIZATION_COMPLETE.md     # 5.6K - Optimization summary
├── OPTIMIZATION_PLAN.md         # 5.6K - Original optimization plan
├── INDEX.md                     # This file - Directory guide
├── settings.json                # Main configuration
├── settings.local.json          # Local overrides (NOT committed)
├── agents/                      # 35 specialized agents
│   ├── orchestrate.md          # Master coordinator
│   ├── nextjs.md ... [34 more]
├── commands/                    # 22 workflow shortcuts
│   ├── component.md
│   ├── review.md ... [21 more]
├── skills/                      # 7 reusable capabilities
│   ├── prisma-optimizer/
│   ├── react-performance/ ... [6 more]
└── .backup/                     # Archived agents (6 files)
```

---

## 🚀 Quick Links

### For New Users
1. **Start here**: `README.md` - Full usage guide
2. **Having issues?**: `ISSUE.md` - Troubleshooting
3. **Project docs**: `../CLAUDE.md` - Complete project guide

### For Existing Users (Post-Optimization)
1. **What changed?**: `OPTIMIZATION_COMPLETE.md`
2. **Migration guide**: `README.md` (section: Migration Guide)
3. **Old agents**: `.backup/` directory

---

## 📚 Documentation Files

### README.md (6.4K) - Main Documentation
**Purpose**: Complete usage guide for Claude Code automation suite

**Contents**:
- Overview of 35 agents, 22 commands, 7 skills
- Quick start examples
- Agent selection guide
- Usage patterns
- Best practices
- Migration guide (old → new agent names)
- Troubleshooting basics
- Expected benefits

**When to read**: First time setup, learning agents, quick reference

---

### ISSUE.md (11K) - Issue Reporting
**Purpose**: Troubleshooting and issue reporting guide

**Contents**:
- Common issues and solutions
- Diagnostic commands
- Issue report template
- Error message explanations
- Debug mode instructions
- Performance troubleshooting
- Security concerns
- Feature request templates

**When to read**: Something not working, need to report issue, debugging

---

### OPTIMIZATION_COMPLETE.md (5.6K)
**Purpose**: Detailed optimization summary

**Contents**:
- Changes implemented (Phases 1-5)
- Before/after comparison
- Benefits achieved
- Migration guide
- Files modified
- Quality assurance verification
- Success metrics

**When to read**: Understanding recent optimization, migration reference

---

### OPTIMIZATION_PLAN.md (5.6K)
**Purpose**: Original optimization analysis and plan

**Contents**:
- Current state analysis
- Issues identified (duplicates, overlaps, unclear naming)
- Optimization goals
- Proposed structure
- Implementation steps
- Risk assessment

**When to read**: Understanding why optimization was done, planning further improvements

---

## 🤖 Agents Directory (35 files)

### Core
- `orchestrate.md` (6KB) - Master coordinator

### Tech Stack (7)
- `nextjs.md` - Next.js + build
- `react.md` - React 19
- `shadcn.md` - shadcn/ui
- `prisma.md` - Database (MCP)
- `typescript.md` - Type safety
- `tailwind.md` - CSS utilities
- `i18n.md` - Bilingual

### Process (7)
- `architecture.md` - Design + patterns
- `test.md` - TDD
- `security.md` - OWASP
- `auth.md` - NextAuth
- `performance.md` - Optimization
- `typography.md` - Semantic HTML
- `type-safety.md` - Enum completeness

### Workflow (5)
- `git-github.md` - Git + GitHub
- `workflow.md` - Git workflow
- `api.md` - Server actions
- `multi-tenant.md` - Tenant safety
- `database-optimizer.md` - Query optimization

### Developer Productivity (10)
- `build.md` - Build optimization
- `deps.md` - Dependency management
- `dx.md` - Developer experience
- `cli.md` - CLI tools
- `tooling.md` - Developer tools
- `docs.md` - Documentation
- `docs-manager.md` - Workflow docs
- `refactor.md` - Code refactoring
- `legacy.md` - Legacy modernization
- `mcp.md` - MCP development

### Specialized (2)
- `debug.md` - Debugging
- `react-reviewer.md` - React review

### Haiku Agents (3) - Cost Optimized
- `formatter.md` - Fast formatting
- `spellcheck.md` - Spell checking
- `simple-refactor.md` - Simple refactoring

**Read individual agents**: For specific expertise details

---

## ⚡ Commands Directory (22 files)

Quick workflow shortcuts:
- `component.md` - Generate component
- `page.md` - Create page
- `api.md` - Create API
- `migration.md` - Generate migration
- `review.md` - Code review
- `test.md` - Run tests
- `fix-all.md` - Auto-fix all
- `security-scan.md` - Security audit
- `optimize.md` - Optimize code
- `build-changed.md` - Incremental build
- `i18n-check.md` - Check translations
- `deploy.md` - Deploy

**Read commands**: To understand what each command does

---

## 🎨 Skills Directory (7 packages)

Reusable capabilities:
- `prisma-optimizer/` - Query optimization patterns
- `react-performance/` - Component optimization
- `security-scanner/` - OWASP checklist
- `test-generator/` - TDD patterns
- `api-designer/` - RESTful patterns
- `multi-tenant-validator/` - Tenant isolation
- `dictionary-validator/` - i18n dictionary validation

**Read skills**: To understand shared capabilities used by agents

---

## 🗄️ Backup Directory (6 files)

Archived agents from optimization:
- `architect.md` - Merged into architecture.md
- `pattern.md` - Merged into architecture.md
- `git.md` - Merged into git-github.md
- `github.md` - Merged into git-github.md
- `build.md` - Merged into nextjs.md
- `prettier.md` - Removed (automated via hooks)

**Purpose**: Historical reference, rollback if needed

---

## 🔧 Configuration Files

### settings.json
**Main configuration** (committed to git, shared with team)

**Contains**:
- Tool permissions (Read, Write, Edit, Bash, Task, etc.)
- Automation hooks (PostToolUse, SessionStart, etc.)
- Project metadata
- Deny rules (rm, del, format, shutdown)

**When to edit**: Adding permissions, configuring hooks

---

### settings.local.json
**Local overrides** (NOT committed, personal settings)

**Contains**:
- Local database credentials
- Personal permissions
- Development-specific overrides

**When to edit**: Local database, personal preferences

---

## 🎯 Common Tasks

### Getting Started
1. Read `README.md`
2. Try basic agents: `/agents/nextjs`, `/agents/react`
3. Try commands: `/component`, `/review`
4. Read agent docs as needed

### Troubleshooting
1. Check `ISSUE.md` common issues section
2. Run diagnostic commands
3. Check logs: `.claude/*.log`
4. Review configuration: `settings.json`

### Learning Agents
1. Read `README.md` agent list
2. Read individual agent files in `agents/`
3. Try agents with simple tasks
4. Use orchestrator for complex tasks

### Migrating from Old Names
1. Check migration guide in `README.md`
2. Update your usage:
   - architect → architecture
   - bug → debug
   - review → react-reviewer
   - git/github → git-github
3. Build functionality now in nextjs
4. Prettier runs automatically

---

## 📊 Statistics

### File Sizes
- **Documentation**: ~30KB (4 main docs)
- **Agents**: ~140KB (35 agents)
- **Commands**: ~25KB (22 commands)
- **Skills**: ~12KB (7 skills)
- **Total**: ~210KB

### Expansion Results
- **Before**: 20 agents
- **After**: 35 agents
- **Growth**: 75% expansion
- **New capabilities**: 15 agents (10 DX/tooling + 3 Haiku + 2 workflow)
- **Commands added**: 10 new commands (22 total from 12)
- **Skills added**: 1 new skill (7 total from 6)

---

## 🔗 External References

### Project Documentation
- `../CLAUDE.md` - Complete project guide
- `../.mcp.json` - MCP server configurations
- `../package.json` - Dependencies

### Official Docs
- Claude Code: https://docs.claude.com/claude-code
- Next.js 15: https://nextjs.org/docs
- React 19: https://react.dev
- Prisma: https://prisma.io/docs

---

## ✅ Quick Reference

### Start Here
```bash
# Read main docs
cat .claude/README.md

# List all agents
ls .claude/agents/

# Try a command
/component TestComponent

# Try an agent
/agents/nextjs -p "Help with routing"
```

### Getting Help
```bash
# Troubleshooting
cat .claude/ISSUE.md

# Check what changed
cat .claude/OPTIMIZATION_COMPLETE.md

# See migration guide
grep -A 10 "Migration" .claude/README.md
```

### Check Configuration
```bash
# View settings
cat .claude/settings.json

# Check MCP servers
cat ../.mcp.json

# View logs
tail .claude/*.log
```

---

**Version**: 3.0 (Expanded)
**Last Updated**: 2025-10-31
**Total Agents**: 35
**Total Commands**: 22
**Total Skills**: 7
