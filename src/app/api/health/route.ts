import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    memory: HealthCheckResult;
    dependencies: HealthCheckResult;
  };
}

interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  details?: any;
  error?: string;
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Simple database connectivity test
    await db.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;

    return {
      status: 'pass',
      responseTime,
      details: {
        connected: true,
        responseTimeMs: responseTime
      }
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    return {
      status: 'fail',
      responseTime,
      error: error instanceof Error ? error.message : 'Database connection failed',
      details: {
        connected: false
      }
    };
  }
}

function checkMemory(): HealthCheckResult {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memory = process.memoryUsage();
    const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memory.heapTotal / 1024 / 1024);
    const memoryUsagePercent = (memory.heapUsed / memory.heapTotal) * 100;

    return {
      status: memoryUsagePercent > 90 ? 'fail' : memoryUsagePercent > 75 ? 'warn' : 'pass',
      details: {
        heapUsedMB,
        heapTotalMB,
        heapUsagePercent: Math.round(memoryUsagePercent),
        rss: Math.round(memory.rss / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024)
      }
    };
  }

  return {
    status: 'warn',
    details: {
      message: 'Memory usage information not available'
    }
  };
}

function checkDependencies(): HealthCheckResult {
  const requiredEnvVars = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'STRIPE_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  return {
    status: missingVars.length > 0 ? 'fail' : 'pass',
    details: {
      requiredEnvVars: requiredEnvVars.length,
      missingEnvVars: missingVars.length,
      missing: missingVars,
      nodeVersion: process.version,
      platform: process.platform
    }
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || 'health-check';

  try {
    // Perform health checks
    const [databaseCheck, memoryCheck, dependenciesCheck] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkDependencies())
    ]);

    // Determine overall status
    const checks = {
      database: databaseCheck,
      memory: memoryCheck,
      dependencies: dependenciesCheck
    };

    const hasFailures = Object.values(checks).some(check => check.status === 'fail');
    const hasWarnings = Object.values(checks).some(check => check.status === 'warn');

    const overallStatus: HealthCheck['status'] = hasFailures ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      uptime: process.uptime ? Math.round(process.uptime()) : 0,
      checks
    };

    const responseTime = Date.now() - startTime;

    // Log health check results
    if (overallStatus === 'healthy') {
      logger.debug('Health check completed', {
        requestId,
        action: 'health_check',
        status: overallStatus,
        responseTime
      });
    } else {
      logger.warn('Health check detected issues', {
        requestId,
        action: 'health_check',
        status: overallStatus,
        responseTime,
        failures: Object.entries(checks)
          .filter(([, check]) => check.status === 'fail')
          .map(([name]) => name),
        warnings: Object.entries(checks)
          .filter(([, check]) => check.status === 'warn')
          .map(([name]) => name)
      });
    }

    // Return appropriate HTTP status
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthCheck, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;

    logger.error('Health check failed', error instanceof Error ? error : new Error('Unknown health check error'), {
      requestId,
      action: 'health_check_error',
      responseTime
    });

    const errorHealthCheck: HealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      uptime: process.uptime ? Math.round(process.uptime()) : 0,
      checks: {
        database: { status: 'fail', error: 'Health check failed' },
        memory: { status: 'fail', error: 'Health check failed' },
        dependencies: { status: 'fail', error: 'Health check failed' }
      }
    };

    return NextResponse.json(errorHealthCheck, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}