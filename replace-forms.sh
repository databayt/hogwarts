#!/bin/bash
#
# Script to replace old forms with optimized versions
# Run this from the project root: bash replace-forms.sh

echo "🔄 Replacing forms with optimized versions..."

# Function to replace a form
replace_form() {
  local component=$1
  local dir="src/components/platform/$component"

  echo "📝 Processing $component form..."

  if [ -f "$dir/form-optimized.tsx" ]; then
    # Backup old form
    if [ -f "$dir/form.tsx" ]; then
      mv "$dir/form.tsx" "$dir/form-old.tsx.bak"
      echo "  ✅ Backed up old form to form-old.tsx.bak"
    fi

    # Replace with optimized version
    mv "$dir/form-optimized.tsx" "$dir/form.tsx"
    echo "  ✅ Replaced with optimized version"
  else
    echo "  ⚠️  form-optimized.tsx not found, skipping"
  fi
}

# Replace all forms
replace_form "students"
replace_form "teachers"
replace_form "parents"
replace_form "subjects"
replace_form "classes"

echo ""
echo "✅ All forms replaced!"
echo ""
echo "Next steps:"
echo "1. Run: pnpm tsc --noEmit  (to check TypeScript)"
echo "2. Run: pnpm build  (to test build)"
echo "3. Test each form in development"
echo ""
echo "To rollback if needed, run:"
echo "  mv src/components/platform/*/form-old.tsx.bak form.tsx"
