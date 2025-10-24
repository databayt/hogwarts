# Deployment Procedures for Hogwarts File Upload System

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Strategies](#deployment-strategies)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Rollback Procedures](#rollback-procedures)
5. [Emergency Response](#emergency-response)
6. [Post-Deployment Validation](#post-deployment-validation)
7. [Monitoring and Alerts](#monitoring-and-alerts)

## Pre-Deployment Checklist

### Code Review
- [ ] All PRs reviewed and approved
- [ ] Security scan completed (Snyk/SonarCloud)
- [ ] Performance tests passing
- [ ] Unit tests passing (>90% coverage)
- [ ] E2E tests passing

### Infrastructure
- [ ] Database migrations tested in staging
- [ ] Terraform plan reviewed
- [ ] Backup verification completed
- [ ] CDN cache purge planned
- [ ] WAF rules updated if needed

### Communication
- [ ] Deployment window scheduled
- [ ] Stakeholders notified
- [ ] Status page updated
- [ ] Support team briefed

## Deployment Strategies

### Blue-Green Deployment (Recommended for Major Updates)

```bash
# 1. Deploy to green environment
terraform workspace select green
terraform apply -var="environment=green" -auto-approve

# 2. Run smoke tests
npm run test:smoke -- --env=green

# 3. Switch traffic (0% → 10% → 50% → 100%)
aws elbv2 modify-target-group-attributes \
  --target-group-arn $GREEN_TG_ARN \
  --attributes Key=stickiness.enabled,Value=true

# 4. Monitor for 15 minutes
datadog monitor check --id=$MONITOR_ID

# 5. If successful, promote green to production
terraform workspace select production
terraform apply -var="blue_weight=0" -var="green_weight=100"
```

### Canary Deployment (Recommended for Minor Updates)

```bash
# 1. Deploy canary version
kubectl set image deployment/hogwarts-app \
  hogwarts=registry.databayt.org/hogwarts/app:$NEW_VERSION \
  -n hogwarts-production

# 2. Scale canary to 10% of traffic
kubectl patch deployment hogwarts-app-canary \
  -p '{"spec":{"replicas":2}}' \
  -n hogwarts-production

# 3. Monitor error rates
watch -n 5 'kubectl top pods -n hogwarts-production'

# 4. Gradually increase traffic
for weight in 25 50 75 100; do
  kubectl patch virtualservice hogwarts \
    -p "{\"spec\":{\"http\":[{\"weight\":$weight}]}}" \
    -n hogwarts-production
  sleep 600  # Wait 10 minutes between increases
done
```

### Rolling Deployment (Default for Patches)

```bash
# 1. Update deployment image
kubectl set image deployment/hogwarts-app \
  hogwarts=registry.databayt.org/hogwarts/app:$NEW_VERSION \
  -n hogwarts-production

# 2. Watch rollout status
kubectl rollout status deployment/hogwarts-app \
  -n hogwarts-production --timeout=600s

# 3. Verify all pods are running
kubectl get pods -n hogwarts-production -l app=hogwarts
```

## Step-by-Step Deployment

### 1. Pre-Deployment Setup

```bash
# Set deployment variables
export DEPLOYMENT_ID=$(date +%Y%m%d-%H%M%S)
export NEW_VERSION="v1.2.3"
export BACKUP_ID="backup-$DEPLOYMENT_ID"

# Create deployment directory
mkdir -p /deployments/$DEPLOYMENT_ID
cd /deployments/$DEPLOYMENT_ID

# Log deployment start
echo "Deployment $DEPLOYMENT_ID started at $(date)" | tee deployment.log
```

### 2. Database Backup

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > db-backup-$BACKUP_ID.sql

# Verify backup
pg_restore --list db-backup-$BACKUP_ID.sql | head -10

# Upload to S3
aws s3 cp db-backup-$BACKUP_ID.sql \
  s3://hogwarts-backups/deployments/$DEPLOYMENT_ID/

# DynamoDB backup
aws dynamodb create-backup \
  --table-name hogwarts-upload-metadata \
  --backup-name $BACKUP_ID
```

### 3. Deploy Infrastructure Changes

```bash
# Terraform deployment
cd infrastructure/terraform
terraform init -upgrade
terraform plan -out=tfplan-$DEPLOYMENT_ID
terraform apply tfplan-$DEPLOYMENT_ID

# Verify infrastructure
terraform output -json > infrastructure-$DEPLOYMENT_ID.json
```

### 4. Deploy Application

```bash
# Build and push Docker image
docker build -t registry.databayt.org/hogwarts/app:$NEW_VERSION \
  -f docker/Dockerfile.production .
docker push registry.databayt.org/hogwarts/app:$NEW_VERSION

# Deploy to Kubernetes
kubectl apply -f k8s/production/ -n hogwarts-production

# Or deploy to Vercel
vercel --prod --token=$VERCEL_TOKEN
```

### 5. Run Database Migrations

```bash
# Connect to production pod
kubectl exec -it deployment/hogwarts-app \
  -n hogwarts-production -- sh

# Run migrations
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status
```

### 6. Cache Management

```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DIST_ID \
  --paths "/*"

# Clear Redis cache
redis-cli -h $REDIS_HOST FLUSHDB

# Clear application cache
kubectl exec deployment/hogwarts-app \
  -n hogwarts-production -- \
  rm -rf /app/.next/cache/*
```

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

```bash
# 1. Revert Kubernetes deployment
kubectl rollout undo deployment/hogwarts-app \
  -n hogwarts-production

# 2. Verify rollback
kubectl rollout status deployment/hogwarts-app \
  -n hogwarts-production

# 3. Check pod health
kubectl get pods -n hogwarts-production -l app=hogwarts
```

### Database Rollback

```bash
# 1. Stop application to prevent data corruption
kubectl scale deployment/hogwarts-app --replicas=0 \
  -n hogwarts-production

# 2. Restore database from backup
pg_restore --clean --if-exists \
  -d $DATABASE_URL db-backup-$BACKUP_ID.sql

# 3. Rollback migrations if needed
npx prisma migrate resolve --rolled-back $MIGRATION_ID

# 4. Restart application
kubectl scale deployment/hogwarts-app --replicas=3 \
  -n hogwarts-production
```

### Infrastructure Rollback

```bash
# 1. Terraform rollback
cd infrastructure/terraform
terraform workspace select production
terraform apply -var="version=$PREVIOUS_VERSION" \
  -auto-approve

# 2. Verify infrastructure
terraform plan  # Should show no changes needed
```

### Complete System Rollback

```bash
#!/bin/bash
# rollback.sh - Complete system rollback script

PREVIOUS_VERSION=$1
BACKUP_ID=$2

echo "Starting complete rollback to version $PREVIOUS_VERSION"

# 1. Application rollback
kubectl set image deployment/hogwarts-app \
  hogwarts=registry.databayt.org/hogwarts/app:$PREVIOUS_VERSION \
  -n hogwarts-production

# 2. Database rollback
pg_restore --clean --if-exists \
  -d $DATABASE_URL s3://hogwarts-backups/deployments/$BACKUP_ID/db-backup.sql

# 3. Infrastructure rollback
terraform apply -var="app_version=$PREVIOUS_VERSION" \
  -auto-approve

# 4. Clear caches
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DIST_ID \
  --paths "/*"

# 5. Verify system health
./scripts/health-check.sh

echo "Rollback completed at $(date)"
```

## Emergency Response

### Critical Issue Response

1. **Immediate Actions**
```bash
# Enable maintenance mode
kubectl apply -f k8s/maintenance-mode.yaml

# Scale down to minimum replicas
kubectl scale deployment/hogwarts-app --replicas=1

# Increase logging
kubectl set env deployment/hogwarts-app LOG_LEVEL=debug
```

2. **Diagnosis**
```bash
# Check recent logs
kubectl logs -f deployment/hogwarts-app --tail=100

# Check metrics
datadog metric query "avg:hogwarts.error_rate{env:production}"

# Run diagnostics
kubectl exec deployment/hogwarts-app -- npm run diagnostics
```

3. **Recovery**
```bash
# Apply hotfix
kubectl patch deployment/hogwarts-app \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"hogwarts","image":"registry.databayt.org/hogwarts/app:hotfix"}]}}}}'

# Verify fix
kubectl exec deployment/hogwarts-app -- npm run test:smoke

# Disable maintenance mode
kubectl delete -f k8s/maintenance-mode.yaml
```

## Post-Deployment Validation

### Health Checks

```bash
# 1. Application health
curl -f https://ed.databayt.org/api/health || exit 1

# 2. Upload endpoint health
curl -f https://ed.databayt.org/api/upload/health || exit 1

# 3. CDN health
curl -f https://cdn.databayt.org/health || exit 1

# 4. Database connectivity
kubectl exec deployment/hogwarts-app -- \
  npx prisma db execute --sql "SELECT 1"
```

### Synthetic Tests

```javascript
// synthetic-test.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Test login
  await page.goto('https://ed.databayt.org/login');
  await page.type('#email', 'test@school.databayt.org');
  await page.type('#password', 'TestPassword123!');
  await page.click('#login-button');
  await page.waitForNavigation();

  // Test file upload
  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile('/path/to/test-file.pdf');
  await page.click('#upload-button');
  await page.waitForSelector('.upload-success');

  await browser.close();
  console.log('All tests passed!');
})();
```

### Performance Validation

```bash
# Run k6 performance test
k6 run --out cloud tests/performance/file-upload.js

# Check response times
datadog metric query "avg:hogwarts.response_time{env:production}"

# Verify CDN cache hit rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name CacheHitRate \
  --dimensions Name=DistributionId,Value=$CLOUDFRONT_DIST_ID \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average
```

## Monitoring and Alerts

### Key Metrics to Monitor

| Metric | Warning Threshold | Critical Threshold | Action |
|--------|------------------|-------------------|--------|
| Error Rate | > 1% | > 5% | Check logs, consider rollback |
| Response Time P95 | > 3s | > 5s | Scale up, check database |
| Upload Success Rate | < 97% | < 95% | Check S3, verify permissions |
| CPU Usage | > 70% | > 90% | Scale horizontally |
| Memory Usage | > 80% | > 95% | Investigate memory leaks |
| Storage Usage | > 80% | > 90% | Implement cleanup, expand storage |
| Database Connections | > 80% | > 95% | Optimize queries, scale database |

### Alert Configuration

```yaml
# datadog-monitors.yaml
monitors:
  - name: "High Error Rate"
    query: "avg(last_5m):sum:hogwarts.errors{env:production} > 100"
    message: "@pagerduty @slack-critical High error rate detected!"
    priority: 1

  - name: "Low Upload Success Rate"
    query: "avg(last_15m):avg:hogwarts.upload.success_rate{env:production} < 0.95"
    message: "@slack-platform Upload success rate below threshold"
    priority: 2

  - name: "High Memory Usage"
    query: "avg(last_5m):avg:kubernetes.memory.usage_pct{deployment:hogwarts-app} > 90"
    message: "@slack-infra High memory usage in production pods"
    priority: 2
```

### Incident Response Matrix

| Severity | Response Time | Escalation | Communication |
|----------|--------------|------------|---------------|
| Critical | < 5 minutes | Immediate | Status page, Slack, Email |
| High | < 15 minutes | After 30 min | Slack, Email |
| Medium | < 1 hour | After 2 hours | Slack |
| Low | < 4 hours | Next business day | Ticket system |

## Deployment Checklist Summary

### Pre-Deployment
- [ ] Code review completed
- [ ] Tests passing
- [ ] Security scan completed
- [ ] Backup created
- [ ] Team notified

### During Deployment
- [ ] Maintenance mode enabled (if needed)
- [ ] Infrastructure deployed
- [ ] Application deployed
- [ ] Migrations run
- [ ] Cache cleared

### Post-Deployment
- [ ] Health checks passing
- [ ] Synthetic tests passing
- [ ] Performance validated
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team notified of completion

### Rollback (if needed)
- [ ] Issue identified
- [ ] Rollback initiated
- [ ] System restored
- [ ] Root cause analyzed
- [ ] Post-mortem scheduled

---

**Last Updated**: 2025-01-24
**Version**: 1.0.0
**Author**: DevOps Team
**Review**: Platform Engineering Lead