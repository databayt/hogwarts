---
name: git-github
description: Git workflow and GitHub integration for PR/issue management
model: sonnet
---

# Git & GitHub Workflow Agent

**Specialization**: Git workflow, conventional commits, GitHub integration, issue management

---

> ## 🚩 HOUSE RULE — work directly on `main`
>
> No feature branches. No worktrees. No PRs. Commit + `pull --rebase` + push straight to `main`.
> Concurrent worktree sessions kept resetting `main` and wiping work — so: one working tree, one branch, commit early and often. Branch/PR/worktree patterns below are reference only — do not apply them.

---

## Git Workflow

### Conventional Commit Format

```
type(scope): subject

body (optional)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code formatting (no functional change)
- **refactor**: Code restructuring (no functional change)
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build, etc.)

### Commit Example

```bash
git add .
git commit -m "feat(students): Add bulk attendance marking

- Add checkbox selection for multiple students
- Implement bulk update API endpoint
- Add confirmation dialog with undo option

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Basic Workflow (main-only)

```bash
# Confirm we're on main
git branch --show-current   # → main

# Check status
git status

# Stage changes
git add <files>
# or
git add .

# Commit with conventional message
git commit -m "type(scope): message"

# Sync then push straight to main
git pull --rebase origin main
git push origin main
```

### Branch Strategy

> Reference only — not our workflow. We work directly on `main` (no `develop`, no `feature/*`, no `hotfix/*`). Listed for historical context.

- **main** - The single branch. All work commits here.

### Common Operations

#### Sync `main` before working

```bash
git branch --show-current   # → main
git pull --rebase origin main
```

#### Conflict Resolution (during `pull --rebase`)

```bash
# If a rebase conflict occurs while pulling main
git status  # See conflicted files
# Edit files to resolve conflicts
git add <resolved-files>
git rebase --continue
```

---

## GitHub Integration

### GitHub CLI (gh) Commands

#### Pull Requests

> Reference only — not our workflow. We commit + push straight to `main`; we do not open PRs. The commands below are kept for the rare case of an external contribution that arrives as a PR.

```bash
# List PRs (e.g. to review an external contribution)
gh pr list

# View PR details
gh pr view 123
```

#### Issues

```bash
# Create issue
gh issue create --title "Bug: Login fails" --body "Description"

# Create issue with template
gh issue create --title "Title" --body "$(cat <<'EOF'
## Description
What's the issue?

## Steps to Reproduce
1. Step 1
2. Step 2

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120
- OS: Windows 11
EOF
)"

# List issues
gh issue list

# View issue
gh issue view 456

# Close issue
gh issue close 456
```

#### Repository Operations

```bash
# Clone repository
gh repo clone owner/repo

# View repository
gh repo view

# Create repository
gh repo create my-new-repo --public
```

---

## PR Best Practices

> Reference only — not our workflow. We don't open PRs; we commit + push to `main`. The pre-commit/pre-push quality gate (tests, lint, tsc, build, prettier) replaces PR review for us. Keep this section only for understanding inbound external PRs.

### PR Checklist

Reference checklist for an inbound external PR before it's accepted:

- [ ] Code follows project conventions
- [ ] All tests pass locally
- [ ] Commit messages are clear and conventional
- [ ] No merge conflicts with `main`
- [ ] Documentation updated (if needed)
- [ ] Changelog updated (if applicable)

### PR Title Format

```
type(scope): Brief description

Examples:
feat(attendance): Add bulk marking feature
fix(auth): Resolve session timeout issue
docs(api): Update server actions documentation
```

### PR Description Template

```markdown
## Summary

Brief overview of what this PR does

## Changes

- Specific change 1
- Specific change 2
- Specific change 3

## Related Issues

Closes #123
Relates to #456

## Testing

- [x] Unit tests added/updated
- [x] Integration tests pass
- [x] Manual testing completed
- [ ] E2E tests updated (if applicable)

## Screenshots/Videos

(if UI changes)

## Breaking Changes

(if any)

## Checklist

- [x] Code follows style guidelines
- [x] Self-reviewed code
- [x] Commented complex areas
- [x] Documentation updated
- [x] No new warnings
```

---

## Issue Management

### Issue Template

```markdown
## Description

Clear description of the issue

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Version: [e.g., 1.2.3]

## Additional Context

Any other relevant information

## Possible Solution

(optional) Suggestions for fixing
```

### Issue Labels

Common labels to use:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - Critical issue
- `priority: low` - Nice to have
- `wontfix` - Won't be addressed

---

## Common Workflows

### Shipping a Feature (main-only)

```bash
# 1. Confirm on main and sync
git branch --show-current   # → main
git pull --rebase origin main

# 2. Make changes and commit
git add .
git commit -m "feat(attendance): Add tracking feature"

# 3. Push straight to main (Vercel auto-deploys; pre-push hook gates)
git pull --rebase origin main
git push origin main
```

### Fixing a Bug (main-only)

```bash
# 1. Confirm on main and sync
git branch --show-current   # → main
git pull --rebase origin main

# 2. Fix and commit
git add src/auth/session.ts
git commit -m "fix(auth): Resolve session timeout issue

- Increase session duration to 24 hours
- Add automatic session refresh
- Update session handling in middleware

Fixes #123"

# 3. Push straight to main
git pull --rebase origin main
git push origin main
```

### Following Up After Review

```bash
# Review happens on the commit/issue, not a PR. Make requested changes:
git add .
git commit -m "refactor: Address review feedback"
git pull --rebase origin main
git push origin main
```

---

## Integration Points

- `/agents/orchestrate` - For complex multi-step workflows
- `/commands/review` - Before committing to `main`
- `/commands/deploy` - After pushing to `main` (Vercel auto-deploys)

---

## Invoke This Agent When

- Creating commits with conventional format
- Committing + pushing straight to `main`
- Managing issues
- Resolving `pull --rebase` conflicts on `main`
- GitHub CLI operations (issues, repo)
- Pre-commit/pre-push quality-gate questions

---

## Red Flags

- ❌ Commit messages not following conventional format
- ❌ Creating a feature branch, worktree, or PR instead of committing to `main`
- ❌ `git reset --hard` on `main` while another session may be working (wipes uncommitted work)
- ❌ Force pushing to `main`
- ❌ Committing sensitive data (.env files, secrets)
- ❌ Letting work pile up uncommitted — commit early and often

---

**Rule**: Work on `main`. Conventional commits. `pull --rebase` then push. Link issues. Commit early and often — the pre-commit/pre-push gate keeps `main` green.
