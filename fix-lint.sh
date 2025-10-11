#!/bin/bash
# Script to fix remaining linting errors systematically

# Fix unused imports in dashboard page
sed -i 's/import { getDictionary } from/\/\/ import { getDictionary } from/' src/app/\[lang\]/\(operator\)/dashboard/page.tsx

# Fix unused variables - remove unused dictionary assignments
find src/app -name "*.tsx" -o -name "*.ts" | while read file; do
  # Comment out unused dictionary assignments but keep getDictionary calls if used elsewhere
  sed -i 's/^\(  \)const dictionary = await getDictionary/\1\/\/ const dictionary = await getDictionary/' "$file"
done

echo "Basic fixes applied"
