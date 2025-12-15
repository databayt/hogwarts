---
name: git
description: Git workflow and GitHub integration for PR/issue management
model: sonnet
---

# Git & GitHub Workflow Agent

**Specialization**: Git operations, conventional commits, GitHub integration, PR/issue management

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

### Creating Pull Requests

```bash
# Create feature branch
git checkout -b feature/student-reports

# Make changes and commit
git add .
git commit -m "feat: add student report generation"

# Push branch
git push -u origin feature/student-reports

# Create PR with gh CLI
gh pr create \
  --title "Add student report generation" \
  --body "$(cat <<'EOF'
## Summary
- Added PDF report generation for student records
- Implemented customizable report templates
- Added bulk export functionality

## Changes
- New report generation service
- PDF template system
- Bulk export API endpoint

## Testing
- [ ] Unit tests for report service
- [ ] E2E tests for export flow
- [ ] Manual testing of PDF generation

## Screenshots
[Add if applicable]

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### PR Template

```markdown
## Summary

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made

- Bullet point list
- Of specific changes

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Multi-tenant safety verified
- [ ] i18n keys added

## Related Issues

Closes #123
```

### Working with Issues

```bash
# List issues
gh issue list

# Create issue
gh issue create \
  --title "Bug: Student enrollment validation" \
  --body "Description of the issue" \
  --label "bug,priority:high"

# Link PR to issue
gh pr create --body "Fixes #123"
```

## Branching Strategy

### Branch Types

```
main                    # Production code
├── develop            # Integration branch
├── feature/*          # New features
├── fix/*             # Bug fixes
├── hotfix/*          # Urgent production fixes
└── release/*         # Release preparation
```

### Branch Naming

```
feature/add-payment-gateway
fix/student-enrollment-validation
hotfix/security-patch
release/v2.1.0
```

### Branch Commands

```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# List all branches
git branch -a

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Merge branch
git checkout main
git merge feature/new-feature
```

## Conflict Resolution

### Merge Conflicts

```bash
# Pull latest changes
git pull origin main

# If conflicts occur
# 1. Open conflicted files
# 2. Resolve conflicts (remove markers)
# 3. Stage resolved files
git add .

# 4. Complete merge
git commit

# Or abort merge
git merge --abort
```

### Rebase Workflow

```bash
# Rebase feature branch on main
git checkout feature/my-feature
git rebase main

# Interactive rebase to clean history
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
      - run: pnpm test
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

### PR Guidelines

- [ ] Keep PRs small and focused
- [ ] Write comprehensive descriptions
- [ ] Add tests for new features
- [ ] Request reviews from relevant people
- [ ] Address all review comments
- [ ] Ensure CI passes before merging

### Security

- [ ] Never commit secrets
- [ ] Use .gitignore properly
- [ ] Review changes before committing
- [ ] Verify branch protection rules
- [ ] Use signed commits when possible
