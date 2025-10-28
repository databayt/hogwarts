# Issue Reporting & Troubleshooting Guide

**How to report issues with Claude Code agents, commands, or configuration**

---

## 🐛 Before Reporting an Issue

### 1. Check Common Issues

#### Agent Not Responding
**Symptoms**: Agent doesn't execute or returns no output

**Solutions**:
```bash
# 1. Verify agent exists
ls .claude/agents/<agent-name>.md

# 2. Check agent name spelling (see migration guide)
# Old names no longer work - use new names:
# architect → architecture
# bug → debug
# review → react-reviewer
# git → git-github
# github → git-github

# 3. Verify Task tool is enabled in settings.json
grep -A 5 "allow" .claude/settings.json | grep "Task"
```

#### Command Not Found
**Symptoms**: Slash command doesn't execute

**Solutions**:
```bash
# 1. Verify command exists
ls .claude/commands/<command-name>.md

# 2. Check command syntax
/component <name>     # ✓ Correct
/component            # ✗ Wrong (missing argument)

# 3. Verify command file has frontmatter
head -n 3 .claude/commands/component.md
# Should show:
# ---
# description: ...
# ---
```

#### Auto-Format Not Working
**Symptoms**: Files not auto-formatted on save

**Solutions**:
```bash
# 1. Check PostToolUse hooks in settings.json
grep -A 10 "PostToolUse" .claude/settings.json

# 2. Verify Prettier is installed
pnpm list prettier

# 3. Check Prettier config exists
ls .prettierrc.json

# 4. Test Prettier manually
npx prettier --write src/test.tsx
```

#### MCP Server Connection Failed
**Symptoms**: Database or GitHub operations fail

**Solutions**:
```bash
# 1. Check MCP config
cat .mcp.json

# 2. Verify environment variables
echo $DATABASE_URL
echo $GITHUB_TOKEN

# 3. Test PostgreSQL MCP
npx @modelcontextprotocol/server-postgres $DATABASE_URL

# 4. Check MCP logs
cat .claude/mcp.log
cat .claude/mcp-audit.log
```

---

## 📋 Issue Report Template

When reporting an issue, please include:

### Basic Information
```markdown
**Agent/Command**: /agents/nextjs (or /component, etc.)
**Environment**:
- OS: Windows 11 / macOS / Linux
- Claude Code Version:
- Node Version:
- pnpm Version:

**Issue Type**:
[ ] Agent not working
[ ] Command not executing
[ ] Auto-format issue
[ ] MCP connection failed
[ ] Configuration error
[ ] Performance issue
[ ] Other: ___________
```

### Description
```markdown
**What were you trying to do?**
(Clear description of your goal)

**What command/agent did you use?**
```bash
/agents/nextjs -p "Create student page"
```

**What happened?**
(Actual behavior)

**What did you expect?**
(Expected behavior)
```

### Reproduction Steps
```markdown
**Steps to reproduce:**
1.
2.
3.

**Reproducible?**
[ ] Always
[ ] Sometimes
[ ] Once
```

### Error Messages
```markdown
**Error output** (if any):
```
Copy exact error message here
```

**Console output**:
```
Copy relevant console output
```

**Stack trace** (if available):
```
Copy stack trace
```
```

### Configuration
```markdown
**settings.json** (relevant sections):
```json
{
  "permissions": { ... },
  "hooks": { ... }
}
```

**Environment variables** (without sensitive data):
```bash
DATABASE_URL=postgresql://localhost/...
# (replace actual credentials with ...)
```
```

### Attempted Solutions
```markdown
**What have you tried?**
- [ ] Checked agent name spelling
- [ ] Verified settings.json
- [ ] Checked environment variables
- [ ] Reviewed logs
- [ ] Restarted Claude Code
- [ ] Other: ___________

**Did anything work?**
(What you tried and what happened)
```

---

## 🔧 Diagnostic Commands

Run these to gather diagnostic information:

### Agent Configuration
```bash
# List all agents
ls -lh .claude/agents/*.md

# Count agents
ls .claude/agents/*.md | wc -l
# Should show: 20

# Check specific agent exists
ls .claude/agents/architecture.md
ls .claude/agents/git-github.md
ls .claude/agents/debug.md
```

### Settings Validation
```bash
# Check settings.json structure
cat .claude/settings.json | jq '.' 2>&1

# Verify allowed tools
cat .claude/settings.json | jq '.permissions.allow[]'

# Check hooks configuration
cat .claude/settings.json | jq '.hooks'
```

### MCP Status
```bash
# List configured MCP servers
cat .mcp.json | jq '.mcpServers | keys'

# Check MCP logs
tail -n 50 .claude/mcp.log

# Test database connection
pnpm prisma db pull --schema=prisma/schema.prisma
```

### Git Status
```bash
# Check for uncommitted changes in .claude/
git status .claude/

# Verify agents directory
du -sh .claude/agents/

# Check backup directory
ls -lh .claude/.backup/
```

---

## 🚨 Common Error Messages

### "Agent not found"
**Cause**: Using old agent name after optimization

**Solution**: Use migration guide
```bash
# Old → New
/agents/architect → /agents/architecture
/agents/bug → /agents/debug
/agents/review → /agents/react-reviewer
```

### "Permission denied"
**Cause**: Tool not in allowed list

**Solution**: Add to settings.json
```json
{
  "permissions": {
    "allow": [
      "Task",  // Required for agents
      "Read",
      "Write",
      "Edit"
    ]
  }
}
```

### "Hook failed"
**Cause**: Hook command error

**Solution**: Check hook syntax in settings.json
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_TOOL_ARGS\""
          }
        ]
      }
    ]
  }
}
```

### "MCP server connection failed"
**Cause**: Missing environment variables or server not running

**Solution**:
```bash
# 1. Check environment variables
echo $DATABASE_URL
echo $GITHUB_TOKEN

# 2. Add to .env if missing
echo "DATABASE_URL=postgresql://..." >> .env
echo "GITHUB_TOKEN=ghp_..." >> .env

# 3. Verify .mcp.json configuration
cat .mcp.json
```

---

## 🔍 Debug Mode

### Enable Verbose Logging

Add to settings.json:
```json
{
  "audit": {
    "enabled": true,
    "file": ".claude/audit.log",
    "level": "all"
  },
  "mcp": {
    "logging": {
      "level": "debug",
      "file": ".claude/mcp.log"
    }
  }
}
```

### View Logs
```bash
# Audit log
tail -f .claude/audit.log

# MCP log
tail -f .claude/mcp.log

# MCP audit log
tail -f .claude/mcp-audit.log
```

---

## 🆘 Getting Help

### 1. Check Documentation
- `.claude/README.md` - Setup and usage guide
- `CLAUDE.md` (project root) - Full project documentation
- `.claude/OPTIMIZATION_COMPLETE.md` - Recent changes

### 2. Review Agent Documentation
```bash
# Read specific agent docs
cat .claude/agents/nextjs.md
cat .claude/agents/architecture.md
cat .claude/agents/git-github.md
```

### 3. Check Migration Guide
If using old agent names:
```bash
# See migration mappings
grep -A 10 "Migration Guide" .claude/README.md
```

### 4. Search Issues
Check if your issue was already reported:
```bash
# Search in project
grep -r "your error message" .claude/
```

---

## 📊 Performance Issues

### Agent Response Slow
**Causes**: Large context, complex task, MCP latency

**Solutions**:
```bash
# 1. Use more specific agents (not orchestrate for simple tasks)
/agents/nextjs    # Instead of orchestrate for Next.js tasks

# 2. Reduce context with focused prompts
/agents/react -p "Optimize THIS component" # Clear, specific

# 3. Check MCP server performance
time npx @modelcontextprotocol/server-postgres $DATABASE_URL

# 4. Clear caches if needed
rm -rf .claude/.cache/  # If cache directory exists
```

### Build Performance Issues
```bash
# Use incremental build
/build-changed

# Check build agent (now in nextjs)
/agents/nextjs -p "Analyze build performance"

# Run build analysis
ANALYZE=true pnpm build
```

---

## 🔐 Security Concerns

### Sensitive Data in Logs
**If logs contain sensitive data:**

```bash
# 1. Clear logs
echo "" > .claude/audit.log
echo "" > .claude/mcp.log

# 2. Add to .gitignore
echo ".claude/*.log" >> .gitignore

# 3. Review settings
# Ensure settings.local.json (with secrets) is in .gitignore
cat .gitignore | grep settings.local.json
```

### Credentials Exposure
**If credentials are accidentally committed:**

```bash
# 1. Revoke compromised credentials immediately
# 2. Update .gitignore
echo "settings.local.json" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# 3. Use environment variables
# Move credentials to .env (never committed)
```

---

## 📝 Feature Requests

### Suggesting New Agents
If you need a new specialized agent:

```markdown
**Agent Name**: <name>-agent
**Specialization**: What specific domain/technology
**Why Needed**: What gap it fills
**Use Cases**:
1. Use case 1
2. Use case 2

**Alternative**: Could existing agent be enhanced instead?
- Existing agent: <name>
- Enhancement needed: <description>
```

### Suggesting New Commands
If you need a new command shortcut:

```markdown
**Command Name**: /command-name
**Purpose**: What it does (1 sentence)
**Usage**: /command-name <args>
**Workflow**:
1. Step 1
2. Step 2

**Alternative**: Could existing command be extended?
```

---

## 🎯 Known Limitations

### Current Limitations
1. **Agent count**: Limited to 20 (by design, optimized)
2. **MCP servers**: Require environment variables
3. **Hooks**: Windows may need different syntax
4. **Auto-format**: Only for .ts, .tsx, .js, .jsx files

### Planned Enhancements
- Additional specialized agents as needed
- Enhanced error messages
- Performance monitoring
- Usage analytics

---

## ✅ Resolution Checklist

Before closing an issue, verify:

- [ ] Original problem is resolved
- [ ] Solution is documented
- [ ] No regressions introduced
- [ ] Documentation updated if needed
- [ ] Migration guide updated if agent names changed

---

## 📞 Contact

For issues related to:
- **Claude Code platform**: https://github.com/anthropics/claude-code/issues
- **This project setup**: Create issue in project repository
- **Agent optimization**: Review `.claude/OPTIMIZATION_COMPLETE.md`

---

**Last Updated**: 2025-10-27
**Agent Version**: 2.0 (Optimized)
**Documentation**: See README.md for full guide
