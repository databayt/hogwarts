---
name: git
description: Git workflow and GitHub integration for PR/issue management
model: sonnet
---

# Git & GitHub Workflow Agent

**Specialization**: Git operations, conventional commits, GitHub integration, issue management

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
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system changes
- **ci**: CI/CD changes
- **chore**: Maintenance tasks

### Commit Examples

```bash
# Feature
git commit -m "feat(auth): add multi-factor authentication

- Implement TOTP-based 2FA
- Add backup codes generation
- Update login flow with MFA check

Co-Authored-By: Claude <noreply@anthropic.com>"

# Bug fix
git commit -m "fix(students): resolve enrollment date validation

Fixes issue where future dates were accepted for enrollment

Co-Authored-By: Claude <noreply@anthropic.com>"

# Refactor
git commit -m "refactor(api): extract validation logic to middleware

- Move Zod validation to dedicated middleware
- Reduce code duplication across endpoints
- Improve error message consistency

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## GitHub Integration

### Shipping a Change (main-only)

```bash
# Confirm on main and sync
git branch --show-current        # → main
git pull --rebase origin main

# Make changes and commit
git add .
git commit -m "feat: add student report generation

- Add PDF report generation for student records
- Implement customizable report templates
- Add bulk export functionality

Closes #123

Co-Authored-By: Claude <noreply@anthropic.com>"

# Sync again, then push straight to main (Vercel auto-deploys)
git pull --rebase origin main
git push origin main
```

> The pre-commit/pre-push quality gate (tests, lint, tsc, build, prettier) is our automated reviewer — it replaces PR review. Fix any blocked check, then push again.

### Working with Issues

```bash
# List issues
gh issue list

# Create issue
gh issue create \
  --title "Bug: Student enrollment validation" \
  --body "Description of the issue" \
  --label "bug,priority:high"

# Link a commit to an issue: put "Closes #123" in the commit message
git commit -m "fix(students): resolve enrollment validation

Closes #123"
```

## Branching Strategy

> Reference only — not our workflow. We use a single branch (`main`): no `develop`, `feature/*`, `fix/*`, `hotfix/*`, or `release/*`, and no worktrees. The structure below is documented for historical context; do not create these branches.

```
main                    # The single branch — all work commits here
```

## Conflict Resolution (during `pull --rebase`)

### Resolving a rebase conflict

```bash
# Sync main with rebase
git pull --rebase origin main

# If conflicts occur
# 1. Open conflicted files
# 2. Resolve conflicts (remove markers)
# 3. Stage resolved files
git add .

# 4. Continue the rebase
git rebase --continue

# Or abort and re-try
git rebase --abort
```

### Cleaning local history before push

```bash
# Interactive rebase to tidy your local commits (before pushing)
git rebase -i HEAD~3

# If conflicts during rebase
# Fix conflicts, then:
git add .
git rebase --continue

# Or abort rebase
git rebase --abort
```

## Git Commands Reference

### Status & History

```bash
git status                      # Working directory status
git log --oneline -10          # Recent commits
git log --graph --all          # Branch visualization
git diff                       # Unstaged changes
git diff --staged              # Staged changes
```

### Stashing

```bash
git stash                      # Stash changes
git stash list                # List stashes
git stash pop                 # Apply and remove stash
git stash apply               # Apply but keep stash
```

### Undoing Changes

```bash
git reset HEAD~1              # Undo last commit (keep changes)
git reset --hard HEAD~1       # Undo last commit (discard changes)
git checkout -- file.txt      # Discard file changes
git revert <commit>          # Create inverse commit
```

### Tags

```bash
git tag v1.0.0               # Create lightweight tag
git tag -a v1.0.0 -m "msg"   # Create annotated tag
git push origin v1.0.0       # Push tag
git push origin --tags       # Push all tags
```

## GitHub Actions Integration

### Workflow Triggers

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm tests
      - run: pnpm build
```

### Status Checks

```bash
# Check workflow status
gh run list

# View specific run
gh run view <run-id>

# Re-run failed workflow
gh run rerun <run-id>
```

## Best Practices

### Commit Guidelines

- [ ] One logical change per commit
- [ ] Write clear, descriptive messages
- [ ] Reference issues when applicable
- [ ] Sign commits when required
- [ ] Keep commits atomic and focused

### Push Guidelines (main-only)

- [ ] Keep commits small, atomic, and focused
- [ ] Write comprehensive commit messages
- [ ] Add tests for new features
- [ ] `git pull --rebase origin main` before pushing
- [ ] Let the pre-commit/pre-push hook gate the push (it must pass)
- [ ] Commit early and often so concurrent sessions don't clobber `main`

> PR review guidelines (small focused PRs, request reviewers, address comments) are reference only — we don't open PRs.

### Security

- [ ] Never commit secrets
- [ ] Use .gitignore properly
- [ ] Review changes before committing
- [ ] Use signed commits when possible
