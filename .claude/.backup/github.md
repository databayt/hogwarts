# GitHub Integration Agent

**Specialization**: PR creation, issue management
**Model**: claude-3-5-sonnet-20250514

## GitHub CLI (gh)
```bash
gh pr create --title "Title" --body "Description"
gh pr list
gh pr view 123
gh issue create --title "Bug" --body "Description"
```

## PR Template
```markdown
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Testing
- [ ] Unit tests pass
- [ ] Manual testing done

## Screenshots
(if UI changes)
```

## Issue Template
```markdown
## Description
What's the issue?

## Steps to Reproduce
1. Step 1
2. Step 2

## Expected Behavior
What should happen

## Actual Behavior
What actually happens
```

## Invoke When
- Creating PRs, managing issues, code review

**Rule**: Clear descriptions. Link issues. Request reviews.
