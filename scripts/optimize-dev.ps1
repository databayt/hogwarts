# Quick Performance Optimization Script (Windows)
# Implements Phase 1 fixes (10 minutes, 5x speedup)

Write-Host "🚀 Hogwarts Development Performance Optimizer" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Backup package.json
Write-Host "📦 Step 1/3: Updating package.json scripts..." -ForegroundColor Yellow
Copy-Item package.json package.json.backup
Write-Host "✅ Backup created: package.json.backup" -ForegroundColor Green

# Update package.json scripts
$pkg = Get-Content package.json | ConvertFrom-Json
$pkg.scripts.dev = "next dev --turbopack"
$pkg.scripts."dev:ws" = "node server.js"
$pkg.scripts."dev:full" = "node server.js"
$pkg | ConvertTo-Json -Depth 100 | Set-Content package.json

Write-Host "✅ Updated package.json:" -ForegroundColor Green
Write-Host "   - dev: next dev --turbopack (DEFAULT, 5x faster)"
Write-Host "   - dev:ws: node server.js (WebSocket when needed)"
Write-Host "   - dev:full: node server.js (alias for clarity)"
Write-Host ""

# 2. Create/update .env.local with performance settings
Write-Host "⚙️  Step 2/3: Configuring environment variables..." -ForegroundColor Yellow

if (-not (Test-Path .env.local)) {
    New-Item .env.local -ItemType File | Out-Null
}

$envContent = Get-Content .env.local -ErrorAction SilentlyContinue
$flags = @(
    "LOG_MIDDLEWARE=false",
    "LOG_WEBSOCKET_EVENTS=false",
    "VERBOSE_LOGGING=false",
    "LOG_DATABASE_QUERIES=false"
)

foreach ($flag in $flags) {
    $key = $flag.Split('=')[0]
    if ($envContent -notmatch $key) {
        Add-Content .env.local $flag
    }
}

Write-Host "✅ Updated .env.local with performance flags" -ForegroundColor Green
Write-Host ""

# 3. Create middleware optimization
Write-Host "🔧 Step 3/3: Optimizing middleware..." -ForegroundColor Yellow

# Backup middleware
Copy-Item src/middleware.ts src/middleware.ts.backup
Write-Host "✅ Backup created: src/middleware.ts.backup" -ForegroundColor Green

# Note: Conditional logging modification would require more complex PowerShell
# For now, just create the backup and document manual step
Write-Host "⚠️  Manual step required:" -ForegroundColor Yellow
Write-Host "   Wrap logger.debug calls in middleware.ts with:" -ForegroundColor Yellow
Write-Host "   if (process.env.LOG_MIDDLEWARE === 'true') { ... }" -ForegroundColor Yellow
Write-Host ""

# Summary
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✅ Optimization Complete!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Expected Performance Improvements:"
Write-Host "   • Server startup: 5-7s → 2-3s"
Write-Host "   • Initial load:   2-5s → 800ms-1.5s"
Write-Host "   • HMR:           2-3s → 400-600ms"
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart your dev server:"
Write-Host "      pnpm dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. For WebSocket features (attendance), use:"
Write-Host "      pnpm dev:ws" -ForegroundColor Cyan
Write-Host ""
Write-Host "   3. See PERFORMANCE_ANALYSIS.md for Phase 2 optimizations"
Write-Host ""
Write-Host "🔄 To revert changes:" -ForegroundColor Yellow
Write-Host "   Copy-Item package.json.backup package.json"
Write-Host "   Copy-Item src/middleware.ts.backup src/middleware.ts"
Write-Host "   Remove-Item .env.local"
Write-Host ""
