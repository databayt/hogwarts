---
name: Block Close
description: Update block documentation after completing work on a feature block. Run this after finishing work to close the feedback loop.
version: 1.0.0
category: workflow
---

# /block-close -- Update documentation after completing work

After completing work on a feature block, run this skill to update all block documentation.

## Process

1. **Identify the block**: Check `git diff --name-only` to find which component directories were modified
2. **Read current docs**: Read the block's `ISSUE.md`, `README.md`, and `CLAUDE.md`
3. **Update ISSUE.md**:
   - Check off resolved items
   - Add any new issues discovered during work
   - Update completion percentage if significant progress was made
   - Update "Last Updated" date to today
4. **Update README.md**:
   - Update file structure if files were added, removed, or renamed
   - Update route table if routes changed
   - Update status/completion if changed
5. **Update CLAUDE.md**:
   - Add new "Key Decisions" if architectural decisions were made
   - Add new "Danger Zones" if fragile areas were discovered
   - Remove outdated entries that no longer apply
6. **Verify**: Run `pnpm tsc --noEmit` as final check

## Rules

- Only update docs for blocks that were actually modified
- Do not inflate completion percentages -- be honest about remaining work
- Keep CLAUDE.md under 60 lines -- it's an AI survival guide, not full documentation
- Keep ISSUE.md factual -- P0/P1/P2 priorities with clear descriptions
- Keep README.md as the architecture reference -- routes, files, capabilities
