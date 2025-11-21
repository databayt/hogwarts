# PowerShell script to fix import paths

# Get all TypeScript/TypeScript JSX files
$files = Get-ChildItem -Path "src/components" -Recurse -Include "*.ts", "*.tsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Fix table/data-table/ imports
    $content = $content -replace '@/components/table/data-table/data-table-column-header', '@/components/table/data-table-column-header'
    $content = $content -replace '@/components/table/data-table/data-table-toolbar', '@/components/table/data-table-toolbar'
    $content = $content -replace '@/components/table/data-table/data-table-pagination', '@/components/table/data-table-pagination'
    $content = $content -replace '@/components/table/data-table/data-table-load-more', '@/components/table/data-table-load-more'
    $content = $content -replace '@/components/table/data-table/data-table-skeleton', '@/components/table/data-table-skeleton'
    $content = $content -replace '@/components/table/data-table/data-table', '@/components/table/data-table'

    # Fix table/hooks/ imports
    $content = $content -replace '@/components/table/hooks/use-data-table', '@/components/table/use-data-table'
    $content = $content -replace '@/components/table/hooks/use-auto-refresh', '@/components/table/use-auto-refresh'
    $content = $content -replace '@/components/table/hooks/use-callback-ref', '@/components/table/use-callback-ref'
    $content = $content -replace '@/components/table/hooks/use-debounced-callback', '@/components/table/use-debounced-callback'
    $content = $content -replace '@/components/table/hooks/use-media-query', '@/components/table/use-media-query'

    # If content changed, write it back
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Import path fixes complete!"