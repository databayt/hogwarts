# Claude Code Automation Suite

**Optimized AI-powered development environment for maximum productivity**

---

## 📖 Overview

This directory contains a comprehensive Claude Code automation system with:
- **20 specialized AI agents** (optimized from 25)
- **12 workflow commands** (shortcuts for common tasks)
- **6 reusable skills** (shared capabilities)
- **Full automation** (formatting, testing, hooks)
- **MCP integration** (PostgreSQL, GitHub, 8+ servers)

**Expected Impact**: 10x development velocity with zero manual formatting and automated quality gates.

---

## 🚀 Quick Start

### Using Agents

Agents are specialized AI assistants for specific domains:

```bash
# Complex multi-step features
/agents/orchestrate -p "Create attendance tracking feature"

# Next.js pages and routing
/agents/nextjs -p "Create student dashboard page"

# React components
/agents/react -p "Optimize StudentCard component"

# Database queries
/agents/prisma -p "Optimize student enrollment queries"

# Git + GitHub operations
/agents/git-github -p "Create PR for attendance feature"
```

### Using Commands

Commands are quick shortcuts:

```bash
/component StudentCard        # Generate component with tests
/page /dashboard/students     # Create Next.js page
/review                       # Comprehensive code review
/security-scan                # Full security audit
/deploy staging               # Deploy to staging
```

---

## 🤖 Available Agents (20)

### Core Orchestration (1)
- **orchestrate** - Master coordinator for complex tasks

### Tech Stack (7)
- **nextjs** - Next.js 15, build optimization
- **react** - React 19, performance
- **shadcn** - shadcn/ui components
- **prisma** - Database, migrations (MCP)
- **typescript** - Type safety
- **tailwind** - CSS utilities
- **i18n** - Arabic/English bilingual

### Process (6)
- **architecture** - Design, pattern enforcement
- **test** - TDD, 95%+ coverage
- **security** - OWASP Top 10
- **auth** - NextAuth v5
- **performance** - Optimization
- **typography** - Semantic HTML

### Workflow (4)
- **git-github** - Git + GitHub
- **api** - Server actions
- **multi-tenant** - Tenant safety
- **database-optimizer** - Query optimization (MCP)

### Specialized (2)
- **debug** - Systematic debugging
- **react-reviewer** - React code review

---

## ⚡ Workflow Commands (12)

**Component & Page**:
- `/component <name>` - Generate component
- `/page <path>` - Create page
- `/api <method> <path>` - Create API

**Database**:
- `/migration <name>` - Generate migration

**Quality**:
- `/review` - Code review
- `/test <file>` - Run tests
- `/fix-all` - Auto-fix all
- `/security-scan` - Security audit

**Performance**:
- `/optimize <file>` - Optimize
- `/build-changed` - Incremental build

**i18n**:
- `/i18n-check` - Check translations

**Deploy**:
- `/deploy <env>` - Deploy

---

## 🎨 Reusable Skills (6)

- **prisma-optimizer** - Query optimization
- **react-performance** - Component optimization
- **security-scanner** - OWASP checklist
- **test-generator** - TDD patterns
- **api-designer** - RESTful patterns
- **multi-tenant-validator** - Tenant isolation

---

## 🔧 Configuration Files

### Main
- **settings.json** - Main config (automation, hooks, MCP)
- **settings.local.json** - Local overrides (NOT committed)

### MCP
- **../.mcp.json** - MCP server configurations

### Directories
- **agents/** - 20 agent definitions
- **commands/** - 12 command shortcuts
- **skills/** - 6 skill packages
- **.backup/** - Archived agents

---

## 🎯 Usage Patterns

### New Feature
```bash
/agents/orchestrate -p "Create attendance tracking with calendar, bulk actions, tests"
```

### Quick Component
```bash
/component AttendanceCalendar
```

### Code Review
```bash
/review
```

### Database Migration
```bash
/migration add_attendance_tracking
```

### Debugging
```bash
/agents/debug -p "TypeError in processAttendance"
```

---

## 📊 Agent Selection Guide

| Task | Agent | Why |
|------|-------|-----|
| Pages/Build | nextjs | App Router + build |
| Components | react | Performance |
| UI | shadcn | Component library |
| Database | prisma | ORM |
| Types | typescript | Type system |
| Styling | tailwind | CSS utilities |
| i18n | i18n | RTL/LTR |
| Architecture | architecture | Design + patterns |
| Tests | test | TDD |
| Security | security | OWASP |
| Performance | performance | Optimization |
| Git/GitHub | git-github | All Git ops |
| Debugging | debug | Systematic |
| React review | react-reviewer | Code review |
| Complex | orchestrate | Multi-agent |

---

## 🔄 Migration Guide

Old → New agent names:

```bash
/agents/architect → /agents/architecture
/agents/bug → /agents/debug
/agents/review → /agents/react-reviewer
/agents/git → /agents/git-github
/agents/github → /agents/git-github
/agents/pattern → /agents/architecture
build → /agents/nextjs (merged)
prettier → Automatic via hooks
```

---

## 🌟 Best Practices

1. **Complex tasks** → Use orchestrator
2. **Quick tasks** → Use commands
3. **Before commit** → Run /review
4. **After auth/API** → Run /security-scan
5. **i18n changes** → Run /i18n-check
6. **DB changes** → Use /agents/multi-tenant

---

## 🐛 Troubleshooting

**Agent not working**:
- Check agent name (see list above)
- Verify Task tool in settings.json
- See migration guide

**Command not found**:
- Check commands/ directory
- Verify command syntax

**Auto-format not working**:
- Check PostToolUse hooks
- Verify Prettier installed
- Check .prettierrc.json

**MCP connection failed**:
- Check .mcp.json config
- Verify environment variables
- Test MCP server

See **ISSUE.md** for reporting issues.

---

## 📈 Expected Benefits

- **10x faster** feature development
- **Zero manual formatting**
- **95%+ test coverage**
- **Zero security vulnerabilities**
- **20% fewer agents** (better selection)
- **Clearer naming** (easier to use)

---

## 📚 Resources

- Project `../CLAUDE.md` - Full guide
- `agents/*.md` - Agent docs
- `commands/*.md` - Command definitions
- `skills/*/SKILL.md` - Skill docs

---

**Version**: 2.0 (Optimized)
**Agent Count**: 20 (from 25)
**Optimization**: 20% reduction, 0% loss
**Status**: Production-ready
