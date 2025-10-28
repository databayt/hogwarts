---
description: Deploy to environment (staging/production)
requiresArgs: true
---

Deploy to $1:

Pre-deployment checks:
1. Run: pnpm test
2. Run: pnpm lint
3. Run: pnpm tsc --noEmit
4. Run: pnpm build

If all pass:
1. Verify environment variables configured
2. Check database migrations ready
3. Push to branch: git push origin $1
4. Monitor deployment on Vercel
5. Run smoke tests

If deploying to production, EXTRA caution:
- Backup database
- Notify team
- Have rollback plan ready
