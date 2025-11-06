---
name: git-github
description: Git workflow and GitHub integration for PR/issue management
model: sonnet
---

# Git & GitHub Workflow Agent

**Specialization**: Git workflow, conventional commits, GitHub integration, PR/issue management

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

### Basic Workflow
```bash
# Update local repository
git fetch

# Check status
git status

# Stage changes
git add <files>
# or
git add .

# Commit with message
git commit -m "type(scope): message"

# Push to remote
git push origin <branch>
```

### Branch Strategy
- **main** - Production-ready code
- **develop** - Development/staging code
- **feature/\*** - New features (e.g., feature/attendance-tracking)
- **fix/\*** - Bug fixes (e.g., fix/login-error)
- **hotfix/\*** - Urgent production fixes

### Common Operations

#### Create Feature Branch
```bash
git checkout -b feature/new-feature
git push -u origin feature/new-feature
```

#### Update Branch from Main
```bash
git checkout main
git pull
git checkout feature/my-feature
git rebase main
```

#### Merge Conflict Resolution
```bash
# During rebase or merge
git status  # See conflicted files
# Edit files to resolve conflicts
git add <resolved-files>
git rebase --continue
# or
git merge --continue
```

---

## GitHub Integration

### GitHub CLI (gh) Commands

#### Pull Requests
```bash
# Create PR
gh pr create --title "feat: Add attendance feature" --body "Description"

# Create PR with template
gh pr create --title "Title" --body "$(cat <<'EOF'
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Testing
- [x] Unit tests pass
- [x] Manual testing done

## Screenshots
(if UI changes)
EOF
)"

# List PRs
gh pr list

# View PR details
gh pr view 123

# Check PR status
gh pr status

# Merge PR
gh pr merge 123 --squash
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

### PR Checklist
Before creating a PR:
- [ ] Code follows project conventions
- [ ] All tests pass locally
- [ ] Commit messages are clear and conventional
- [ ] Branch is up to date with base branch
- [ ] No merge conflicts
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

### Creating a Feature PR
```bash
# 1. Create feature branch
git checkout -b feature/attendance-tracking

# 2. Make changes and commit
git add .
git commit -m "feat(attendance): Add tracking feature"

# 3. Push to GitHub
git push -u origin feature/attendance-tracking

# 4. Create PR
gh pr create --title "feat: Add attendance tracking" --body "Implements student attendance tracking with bulk operations"
```

### Fixing a Bug
```bash
# 1. Create fix branch
git checkout -b fix/login-timeout

# 2. Fix and commit
git add src/auth/session.ts
git commit -m "fix(auth): Resolve session timeout issue

- Increase session duration to 24 hours
- Add automatic session refresh
- Update session handling in middleware"

# 3. Push and create PR
git push -u origin fix/login-timeout
gh pr create --title "fix: Resolve session timeout" --body "Fixes #123"
```

### Updating PR After Review
```bash
# Make requested changes
git add .
git commit -m "refactor: Address code review feedback"

# Force push if rebased
git push origin feature/my-feature
```

---

## Integration Points

- `/agents/orchestrate` - For complex multi-step workflows
- `/commands/review` - Before creating PR
- `/commands/deploy` - After PR merge

---

## Invoke This Agent When

- Creating commits with conventional format
- Managing branches
- Creating pull requests
- Managing issues
- Resolving merge conflicts
- GitHub CLI operations
- Code review workflows

---

## Red Flags

- ❌ Commit messages not following conventional format
- ❌ Force pushing to main/master branch
- ❌ Large PRs with mixed concerns (>500 lines)
- ❌ PRs without description or testing info
- ❌ Committing sensitive data (.env files, secrets)
- ❌ Merge commits instead of rebase (if project uses rebase)

---

**Rule**: Conventional commits. Clear PR descriptions. Link issues. Request reviews. Keep PRs focused.
