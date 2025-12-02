#!/usr/bin/env python3
"""
Script to safely replace lucide-react icons with @aliimam/icons.
Only changes icon imports, not variable names or other libraries.
"""

import re
import os
from pathlib import Path

# Icon name mappings (lucide-react -> @aliimam/icons)
ICON_MAPPINGS = {
    "AlertCircle": "CircleAlert",
    "AlertTriangle": "TriangleAlert",
    "AlertOctagon": "OctagonAlert",
    "CheckCircle": "CircleCheck",
    "CheckCircle2": "CircleCheckBig",
    "XCircle": "CircleX",
    "MoreHorizontal": "Ellipsis",
    "MoreVertical": "EllipsisVertical",
    "Loader2": "LoaderCircle",
    "PlayCircle": "CirclePlay",
    "PauseCircle": "CirclePause",
    "StopCircle": "CircleStop",
    "PlusCircle": "CirclePlus",
    "MinusCircle": "CircleMinus",
    "HelpCircle": "CircleHelp",
    "CalendarIcon": "Calendar",
    "ArrowUpIcon": "ArrowUp",
    "ArrowDownIcon": "ArrowDown",
    "InfoIcon": "Info",
}

# Icons that exist in both lucide-react and @aliimam/icons with same name
# (these just need import source changed)
SAME_NAME_ICONS = [
    "Clock", "Calendar", "Users", "User", "Plus", "Minus", "Check", "X",
    "Search", "Eye", "EyeOff", "Mail", "Phone", "Bell", "Settings",
    "Download", "Upload", "File", "FileText", "Folder", "Trash", "Trash2",
    "Save", "Copy", "RefreshCw", "RefreshCcw", "ChevronRight", "ChevronLeft",
    "ChevronUp", "ChevronDown", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown",
    "Sun", "Moon", "Star", "Heart", "MapPin", "Building2", "TrendingUp",
    "TrendingDown", "DollarSign", "CreditCard", "Wallet", "Receipt", "BookOpen",
    "GraduationCap", "Play", "Pause", "Lock", "Key", "Send", "MessageSquare",
    "MessageCircle", "Info", "Loader", "Award", "Briefcase", "Activity",
    "Zap", "Image", "Camera", "Video", "Music", "Printer", "Share", "Link",
    "ExternalLink", "Globe", "Wifi", "Power", "Cpu", "Database", "Cloud",
    "Terminal", "Code", "Layers", "Layout", "Grid", "List", "Table",
    "Maximize", "Minimize", "Move", "Scissors", "Clipboard", "Archive",
    "Package", "ShoppingCart", "Tag", "Bookmark", "Flag", "Target", "Compass",
    "Map", "Car", "Plane", "Rocket", "Monitor", "Smartphone", "Laptop",
    "Trophy", "Crown", "Gem", "Sparkles", "Flame", "Droplet", "Leaf",
    "Lightbulb", "Wrench", "Hammer", "Palette", "Type", "Bold", "Italic",
    "AlignLeft", "AlignCenter", "AlignRight", "Undo", "Redo", "History",
    "UserPlus", "UserMinus", "UserCheck", "UserX", "Circle", "Square",
    "Triangle", "Shield", "BellRing", "BellOff", "Volume", "VolumeX",
    "Repeat", "Shuffle", "SkipBack", "SkipForward", "Filter", "Edit",
    "Pencil", "PencilLine", "Home", "House", "Building", "School",
    "ListFilter", "BarChart2", "FileCode", "FolderOpen", "FolderClosed",
]

# Icons that don't exist in @aliimam/icons (keep from lucide-react)
MISSING_ICONS = [
    "LucideIcon",  # This is a type, not an icon
    "BarChart",  # Might be from recharts
    "BarChart3",  # Might be from recharts
    "PieChart",  # Might be from recharts
    "FileBarChart",
    "GitCommit",
    "GitBranch",
    "GitFork",
    "GitPullRequest",
]


def process_file(filepath: Path) -> tuple[bool, str]:
    """Process a single file and replace lucide-react imports."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Find lucide-react import statement
    pattern = r'import\s*\{([^}]+)\}\s*from\s*["\']lucide-react["\']'
    match = re.search(pattern, content)

    if not match:
        return False, "No lucide-react import found"

    # Get the imported icons
    icons_str = match.group(1)
    icons = [i.strip() for i in icons_str.split(',')]

    # Check for missing icons that should stay with lucide-react
    missing = [i for i in icons if i in MISSING_ICONS]
    aliimam_icons = [i for i in icons if i not in MISSING_ICONS]

    if not aliimam_icons:
        return False, "All icons are missing from @aliimam/icons"

    # Apply mappings to aliimam icons
    mapped_icons = []
    for icon in aliimam_icons:
        if icon in ICON_MAPPINGS:
            mapped_icons.append(ICON_MAPPINGS[icon])
        else:
            mapped_icons.append(icon)

    # Build new import statement
    new_import = f'import {{ {", ".join(mapped_icons)} }} from "@aliimam/icons"'

    # If there are missing icons, keep a separate lucide-react import
    if missing:
        new_import += f'\nimport {{ {", ".join(missing)} }} from "lucide-react"'

    # Replace the import
    content = re.sub(pattern, new_import, content)

    # Apply icon name mappings in JSX (only for mapped icons)
    for old_name, new_name in ICON_MAPPINGS.items():
        if old_name in icons_str:
            # Only replace in JSX tags, not in strings or variable names
            content = re.sub(rf'<{old_name}(\s|/>|>)', f'<{new_name}\\1', content)
            content = re.sub(rf'</{old_name}>', f'</{new_name}>', content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, "Updated"

    return False, "No changes needed"


def main():
    platform_dir = Path('src/components/platform')

    updated = 0
    skipped = 0
    errors = []

    for filepath in platform_dir.rglob('*.tsx'):
        if '.bak' in filepath.name:
            continue
        try:
            changed, msg = process_file(filepath)
            if changed:
                updated += 1
                print(f"  Updated: {filepath}")
            else:
                skipped += 1
        except Exception as e:
            errors.append((filepath, str(e)))

    for filepath in platform_dir.rglob('*.ts'):
        if '.bak' in filepath.name:
            continue
        try:
            changed, msg = process_file(filepath)
            if changed:
                updated += 1
                print(f"  Updated: {filepath}")
            else:
                skipped += 1
        except Exception as e:
            errors.append((filepath, str(e)))

    print(f"\nSummary:")
    print(f"  Updated: {updated} files")
    print(f"  Skipped: {skipped} files")
    if errors:
        print(f"  Errors: {len(errors)}")
        for fp, err in errors:
            print(f"    {fp}: {err}")


if __name__ == "__main__":
    main()
