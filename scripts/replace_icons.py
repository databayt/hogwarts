#!/usr/bin/env python3
import os
import re
from pathlib import Path

# Icon name mappings
ICON_MAPPINGS = {
    r'\bAlertCircle\b': 'CircleAlert',
    r'\bAlertTriangle\b': 'TriangleAlert',
    r'\bCheckCircle\b': 'CircleCheck',
    r'\bXCircle\b': 'CircleX',
    r'\bMoreHorizontal\b': 'Ellipsis',
    r'\bMoreVertical\b': 'EllipsisVertical',
    r'\bLoader2\b': 'LoaderCircle',
    r'\bUnlock\b': 'LockOpen',
}

# Modules to process
MODULES = [
    'admin', 'admission', 'announcements', 'assignments', 'billing',
    'classes', 'communication', 'events', 'facility', 'grades',
    'import', 'lab', 'lessons', 'library', 'messaging',
    'notifications', 'parent', 'parent-portal', 'parents',
    'qbank-automation', 'reports', 'settings', 'shared', 'teacher',
    'analytics', 'activity', 'config'
]

def process_file(file_path):
    """Process a single file to replace icon imports and names."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Replace import statements
        content = content.replace('from "lucide-react"', 'from "@aliimam/icons"')
        content = content.replace("from 'lucide-react'", "from '@aliimam/icons'")

        # Replace icon names
        for pattern, replacement in ICON_MAPPINGS.items():
            content = re.sub(pattern, replacement, content)

        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    base_path = Path('src/components/platform')
    module_counts = {}
    total_files = 0

    print("=" * 50)
    print("Icon Replacement Process")
    print("=" * 50)

    for module in MODULES:
        module_path = base_path / module
        if not module_path.exists():
            continue

        count = 0
        for file_path in module_path.rglob('*.tsx'):
            if process_file(file_path):
                count += 1
                total_files += 1

        for file_path in module_path.rglob('*.ts'):
            if file_path.name != 'node_modules':
                if process_file(file_path):
                    count += 1
                    total_files += 1

        if count > 0:
            module_counts[module] = count
            print(f"✓ {module:20s}: {count:3d} files updated")

    print("=" * 50)
    print(f"Total files updated: {total_files}")
    print("=" * 50)

    # Verify no old patterns remain
    print("\nVerification:")
    old_imports = 0
    old_icons = 0

    for module in MODULES:
        module_path = base_path / module
        if not module_path.exists():
            continue

        for file_path in module_path.rglob('*.tsx'):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'lucide-react' in content:
                    old_imports += 1
                for pattern in ICON_MAPPINGS.keys():
                    if re.search(pattern, content):
                        old_icons += 1
                        break

    print(f"  Files with lucide-react: {old_imports}")
    print(f"  Files with old icon names: {old_icons}")

    if old_imports == 0 and old_icons == 0:
        print("\n✓ All replacements completed successfully!")
    else:
        print("\n⚠ Some files still need manual review")

if __name__ == '__main__':
    main()
