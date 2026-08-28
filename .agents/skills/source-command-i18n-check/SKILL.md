---
name: "source-command-i18n-check"
description: "Verify translation completeness"
---

# source-command-i18n-check

Use this skill when the user asks to run the migrated source command `i18n-check`.

## Command Template

Check internationalization:

1. Invoke /agents/i18n to analyze
2. Compare English and Arabic dictionaries
3. Find missing translations
4. Check RTL/LTR layouts
5. Verify font configuration

Report:

- Missing Arabic translations
- Missing English translations
- RTL layout issues
- Untranslated hardcoded strings
