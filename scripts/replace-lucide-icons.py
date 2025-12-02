#!/usr/bin/env python3
"""
Replace lucide-react imports with @aliimam/icons

This script processes TypeScript/TSX files and replaces:
1. Import statements from "lucide-react" to "@aliimam/icons"
2. Icon name mappings according to the provided mapping table
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Icon name mappings (lucide-react -> @aliimam/icons)
ICON_MAPPINGS = {
    "AlertCircle": "CircleAlert",
    "AlertTriangle": "TriangleAlert",
    "CheckCircle": "CircleCheck",
    "CheckCircle2": "CircleCheck",
    "XCircle": "CircleX",
    "MoreHorizontal": "Ellipsis",
    "MoreVertical": "EllipsisVertical",
    "Edit": "Pencil",
    "Loader2": "LoaderCircle",
    "Filter": "ListFilter",
    "Home": "House",
    "Unlock": "LockOpen",
}

# Directories to process
TARGET_DIRS = [
    "/Users/abdout/hogwarts/src/components/platform/students",
    "/Users/abdout/hogwarts/src/components/platform/exams",
    "/Users/abdout/hogwarts/src/components/platform/attendance",
]


def find_tsx_files(directory: str) -> List[str]:
    """Find all .tsx and .ts files in directory recursively."""
    files = []
    for root, _, filenames in os.walk(directory):
        for filename in filenames:
            if filename.endswith(('.tsx', '.ts')) and not filename.endswith('.test.tsx'):
                files.append(os.path.join(root, filename))
    return files


def extract_lucide_imports(content: str) -> Tuple[str, List[str]]:
    """
    Extract lucide-react import statement and imported icons.
    Returns (import_statement, list_of_icons)
    """
    # Pattern for multiline imports from lucide-react
    pattern = r'import\s+\{([^}]+)\}\s+from\s+["\']lucide-react["\'];?'
    match = re.search(pattern, content, re.MULTILINE | re.DOTALL)

    if not match:
        return ("", [])

    import_statement = match.group(0)
    imports_text = match.group(1)

    # Extract individual icon names
    icons = [icon.strip() for icon in imports_text.split(',') if icon.strip()]

    return (import_statement, icons)


def map_icon_names(icons: List[str]) -> List[str]:
    """Map lucide-react icon names to @aliimam/icons names."""
    mapped = []
    for icon in icons:
        # Handle renamed imports like "Calendar as CalendarIcon"
        if ' as ' in icon:
            original, alias = [p.strip() for p in icon.split(' as ')]
            mapped_name = ICON_MAPPINGS.get(original, original)
            mapped.append(f"{mapped_name} as {alias}")
        else:
            mapped_name = ICON_MAPPINGS.get(icon, icon)
            mapped.append(mapped_name)
    return mapped


def replace_icon_names_in_code(content: str, mappings: Dict[str, str]) -> str:
    """Replace icon names in JSX code (not in import statements)."""
    # Split content by import statement to avoid replacing in imports
    import_pattern = r'import\s+\{[^}]+\}\s+from\s+["\']lucide-react["\'];?'
    parts = re.split(f'({import_pattern})', content, flags=re.MULTILINE | re.DOTALL)

    # Only replace in non-import parts (odd indices after split)
    for i in range(len(parts)):
        if i % 2 == 0:  # Not an import statement
            for old_name, new_name in mappings.items():
                # Replace in JSX tags and className references
                parts[i] = re.sub(
                    r'\b' + re.escape(old_name) + r'\b',
                    new_name,
                    parts[i]
                )

    return ''.join(parts)


def process_file(filepath: str) -> bool:
    """
    Process a single file to replace lucide-react imports.
    Returns True if file was modified, False otherwise.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()

        # Check if file uses lucide-react
        if 'lucide-react' not in original_content:
            return False

        content = original_content

        # Extract current import statement and icons
        import_statement, icons = extract_lucide_imports(content)

        if not import_statement:
            return False

        # Map icon names
        mapped_icons = map_icon_names(icons)

        # Create new import statement
        if len(mapped_icons) <= 3:
            # Single line for short imports
            new_import = f'import {{ {", ".join(mapped_icons)} }} from "@aliimam/icons";'
        else:
            # Multi-line for longer imports
            icon_lines = ',\n  '.join(mapped_icons)
            new_import = f'import {{\n  {icon_lines}\n}} from "@aliimam/icons";'

        # Replace import statement
        content = content.replace(import_statement, new_import)

        # Replace icon names in code (for mappings)
        content = replace_icon_names_in_code(content, ICON_MAPPINGS)

        # Only write if content changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

        return False

    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False


def main():
    """Main execution function."""
    print("🔄 Starting icon replacement process...\n")

    total_files = 0
    modified_files = 0

    for directory in TARGET_DIRS:
        if not os.path.exists(directory):
            print(f"⚠️  Directory not found: {directory}")
            continue

        print(f"📁 Processing: {directory}")
        files = find_tsx_files(directory)

        for filepath in files:
            total_files += 1
            if process_file(filepath):
                modified_files += 1
                rel_path = os.path.relpath(filepath, '/Users/abdout/hogwarts')
                print(f"  ✅ {rel_path}")

        print()

    # Summary
    print("=" * 60)
    print(f"✨ Replacement complete!")
    print(f"📊 Total files scanned: {total_files}")
    print(f"🔧 Files modified: {modified_files}")
    print(f"📝 Files unchanged: {total_files - modified_files}")
    print("=" * 60)

    if modified_files > 0:
        print("\n✅ Icon replacements completed successfully!")
        print("\nIcon mappings applied:")
        for old, new in ICON_MAPPINGS.items():
            print(f"  • {old} → {new}")
    else:
        print("\n⚠️  No files needed modification (already using @aliimam/icons)")


if __name__ == "__main__":
    main()
