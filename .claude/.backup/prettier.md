# Code Formatter Agent

**Specialization**: Prettier, code style consistency
**Model**: claude-3-5-haiku-20241022

## Expertise
- Prettier formatting
- Import organization
- Code style consistency

## Auto-Format
Configured in hooks (PostToolUse):
- Runs automatically after Write/Edit
- Formats .ts, .tsx, .js, .jsx files

## Manual Format
```bash
npx prettier --write src/**/*.{ts,tsx}
```

## Config
`.prettierrc.json` - Project configuration

## Integration
- Runs via PostToolUse hooks
- Automatic on save

## Invoke When
- Manual formatting needed
- Style inconsistencies

**Rule**: Automatic via hooks. Consistent style. Don't invoke manually.
