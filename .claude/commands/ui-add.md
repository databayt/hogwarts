---
description: Add component from shadcn registry
requiresArgs: true
---

Add shadcn/ui component(s): $@

## Process

1. **Validate** registry configuration exists
   - Check `components.json` is configured
   - Verify shadcn MCP server is active

2. **Add component(s)** from registry
   ```bash
   npx shadcn@latest add $@
   ```

3. **Post-installation validation**
   - Verify component added to `src/components/ui/`
   - Check imports are correct
   - Validate semantic token usage

4. **Quality check**
   - Run `/ui-validate` on new component
   - Fix any violations automatically
   - Report status

## Examples

```bash
# Single component
/ui-add button

# Multiple components
/ui-add button card input form

# From custom registry
/ui-add @custom/header

# With options
/ui-add dialog --overwrite
```

## Registry Sources

- `@shadcn` - Official shadcn/ui registry (default)
- `@custom` - Custom registry (if configured in components.json)

## Success Criteria

Component successfully added when:
- ✅ Files created in `src/components/ui/`
- ✅ Dependencies installed
- ✅ Imports work correctly
- ✅ Passes `/ui-validate` check
- ✅ No console errors on build

## Troubleshooting

**Issue**: "components.json not found"
**Fix**: Run `npx shadcn@latest init` first

**Issue**: "Registry not responding"
**Fix**: Check internet connection, verify registry URL

**Issue**: "Component already exists"
**Fix**: Use `--overwrite` flag or rename existing

**Issue**: "Validation fails after install"
**Fix**: Component may have hardcoded colors - report to registry maintainer
