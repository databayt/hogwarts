## Form — Centralized Multi-Step Form System

### Overview

Centralized form system for building consistent multi-step and single-step forms across the Hogwarts platform. Provides reusable field atoms, wizard navigation, layout templates, and bridge hooks for integrating with different hosting contexts (modals, routes, apply flows).

### File Structure

```
src/components/form/
├── index.ts                        # Main exports
├── types.ts                        # TypeScript types
├── actions.ts                      # Server actions
├── use-form.ts / use-form.tsx      # Form hook variants
├── atoms/                          # Field primitives
│   ├── input.tsx                   # Text input
│   ├── select.tsx                  # Select dropdown
│   ├── textarea.tsx                # Textarea
│   ├── checkbox.tsx                # Checkbox
│   ├── date.tsx                    # Date picker
│   ├── number.tsx                  # Number input
│   ├── radio-group.tsx             # Radio group
│   ├── switch.tsx                  # Switch toggle
│   ├── combobox.tsx                # Combobox with search
│   ├── file-upload.tsx             # File upload
│   ├── country.tsx                 # Country selector
│   ├── phone.tsx                   # Phone number input
│   └── index.ts                    # Barrel export
├── template/                       # Layout and UI templates
│   ├── provider.tsx                # Multi-step form provider
│   ├── container.tsx               # Step container
│   ├── header.tsx                  # Step header
│   ├── heading.tsx                 # Form heading
│   ├── navigation.tsx              # Back/Next buttons
│   ├── progress.tsx                # Progress indicator
│   ├── layout.tsx                  # Form layout wrapper
│   ├── modal.tsx                   # Modal wrapper
│   ├── success.tsx                 # Success celebration
│   ├── field-array.tsx             # Dynamic field arrays
│   ├── phone-field.tsx             # Phone field template
│   ├── password-field.tsx          # Password field template
│   ├── wizard-validation-context.tsx
│   └── index.ts                    # Barrel export
├── wizard/                         # Wizard-specific logic
│   ├── wizard-provider.tsx         # Wizard state management
│   ├── wizard-step.tsx             # Step renderer
│   ├── wizard-tabs.tsx             # Tab navigation
│   ├── wizard-layout.tsx           # Wizard layout
│   ├── config.ts                   # Wizard configuration
│   └── index.ts                    # Barrel export
├── bridges/                        # Context-specific integrations
│   ├── use-apply-bridge.ts         # Application flow bridge
│   ├── use-host-bridge.ts          # Host/onboarding bridge
│   ├── use-modal-bridge.ts         # Modal form bridge
│   └── index.ts                    # Barrel export
├── container.tsx                   # Legacy step container
├── header.tsx                      # Legacy header
├── heading.tsx                     # Legacy heading
├── navigation.tsx                  # Legacy navigation
├── progress.tsx                    # Legacy progress
├── success.tsx                     # Legacy success
├── layout.tsx                      # Legacy layout
├── modal.tsx                       # Legacy modal
├── footer.tsx                      # Form footer
├── provider.tsx                    # Legacy provider
├── text.tsx                        # Legacy text field
├── number.tsx                      # Legacy number field
├── select.tsx                      # Legacy select field
├── textarea.tsx                    # Legacy textarea field
├── checkbox.tsx                    # Legacy checkbox field
└── date.tsx                        # Legacy date field
```

### Status

**Completion:** 90% | **Blockers:** None

Legacy root-level field files coexist with the newer `atoms/` and `template/` directories. Migration to atoms/template pattern is ongoing.

### Integration Points

- **Onboarding Wizard**: `src/components/onboarding/` uses wizard provider and bridges
- **Application Flow**: `src/components/school-marketing/application/` uses apply bridge
- **CRUD Forms**: Feature-specific forms import atoms and templates
- **Validation**: Zod schemas from feature-level `validation.ts` files
