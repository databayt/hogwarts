#!/bin/bash
# Quick Performance Optimization Script
# Implements Phase 1 fixes (10 minutes, 5x speedup)

set -e

echo "🚀 Hogwarts Development Performance Optimizer"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backup package.json
echo "📦 Step 1/3: Updating package.json scripts..."
cp package.json package.json.backup
echo -e "${GREEN}✅ Backup created: package.json.backup${NC}"

# Update package.json scripts using Node.js
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.dev = 'next dev --turbopack';
pkg.scripts['dev:ws'] = 'node server.js';
pkg.scripts['dev:full'] = 'node server.js';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo -e "${GREEN}✅ Updated package.json:${NC}"
echo "   - dev: next dev --turbopack (DEFAULT, 5x faster)"
echo "   - dev:ws: node server.js (WebSocket when needed)"
echo "   - dev:full: node server.js (alias for clarity)"
echo ""

# 2. Create/update .env.local with performance settings
echo "⚙️  Step 2/3: Configuring environment variables..."

if [ ! -f .env.local ]; then
  touch .env.local
fi

# Add performance flags if not present
grep -q "LOG_MIDDLEWARE" .env.local 2>/dev/null || echo "LOG_MIDDLEWARE=false" >> .env.local
grep -q "LOG_WEBSOCKET_EVENTS" .env.local 2>/dev/null || echo "LOG_WEBSOCKET_EVENTS=false" >> .env.local
grep -q "VERBOSE_LOGGING" .env.local 2>/dev/null || echo "VERBOSE_LOGGING=false" >> .env.local
grep -q "LOG_DATABASE_QUERIES" .env.local 2>/dev/null || echo "LOG_DATABASE_QUERIES=false" >> .env.local

echo -e "${GREEN}✅ Updated .env.local with performance flags${NC}"
echo ""

# 3. Create middleware optimization
echo "🔧 Step 3/3: Optimizing middleware..."

# Backup middleware
cp src/middleware.ts src/middleware.ts.backup
echo -e "${GREEN}✅ Backup created: src/middleware.ts.backup${NC}"

# Add conditional logging check
sed -i.tmp '/logger.debug/s/^/if (process.env.LOG_MIDDLEWARE === '\''true'\'') /' src/middleware.ts
sed -i.tmp '/logger.info.*MIDDLEWARE/s/^/if (process.env.LOG_MIDDLEWARE === '\''true'\'') /' src/middleware.ts
rm -f src/middleware.ts.tmp

echo -e "${GREEN}✅ Middleware logging is now conditional${NC}"
echo ""

# Summary
echo "=============================================="
echo -e "${GREEN}✅ Optimization Complete!${NC}"
echo "=============================================="
echo ""
echo "📊 Expected Performance Improvements:"
echo "   • Server startup: 5-7s → 2-3s"
echo "   • Initial load:   2-5s → 800ms-1.5s"
echo "   • HMR:           2-3s → 400-600ms"
echo ""
echo "🎯 Next Steps:"
echo "   1. Restart your dev server:"
echo "      ${YELLOW}pnpm dev${NC}"
echo ""
echo "   2. For WebSocket features (attendance), use:"
echo "      ${YELLOW}pnpm dev:ws${NC}"
echo ""
echo "   3. See PERFORMANCE_ANALYSIS.md for Phase 2 optimizations"
echo ""
echo "🔄 To revert changes:"
echo "   mv package.json.backup package.json"
echo "   mv src/middleware.ts.backup src/middleware.ts"
echo "   rm .env.local"
echo ""
