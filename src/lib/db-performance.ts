/**
 * Database performance monitoring wrapper
 * Automatically tracks query performance and logs slow queries
 */

import { PrismaClient } from '@prisma/client';
import { performanceMonitor } from './performance-monitor';
import { logger } from './logger';

// Extend Prisma client with performance monitoring
export function createPerformanceMonitoredPrisma(prisma: PrismaClient) {
  // Store original methods
  const originalMethods = new Map();

  // List of Prisma operations to monitor
  const operations = [
    'findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow',
    'findMany', 'create', 'createMany', 'update', 'updateMany',
    'upsert', 'delete', 'deleteMany', 'count', 'aggregate',
    'groupBy', 'findRaw', 'aggregateRaw'
  ];

  // Wrap each model's operations
  Object.getOwnPropertyNames(prisma).forEach(modelName => {
    const model = (prisma as any)[modelName];
    if (model && typeof model === 'object' && model.constructor.name !== 'PrismaClient') {
      operations.forEach(operation => {
        if (typeof model[operation] === 'function') {
          const originalMethod = model[operation];
          originalMethods.set(`${modelName}.${operation}`, originalMethod);

          model[operation] = async function(...args: any[]) {
            const queryName = `${modelName}.${operation}`;
            const startTime = performance.now();

            try {
              const result = await performanceMonitor.trackQuery(
                queryName,
                () => originalMethod.apply(this, args),
                {
                  model: modelName,
                  operation,
                  argsCount: args.length
                }
              );

              return result;
            } catch (error) {
              const duration = performance.now() - startTime;
              logger.error(`Database query failed: ${queryName}`, error instanceof Error ? error : new Error('Unknown DB error'), {
                action: 'db_query_error',
                queryName,
                model: modelName,
                operation,
                duration,
                argsCount: args.length
              });
              throw error;
            }
          };
        }
      });
    }
  });

  // Monitor raw queries
  if (prisma.$queryRaw) {
    const original$queryRaw = prisma.$queryRaw.bind(prisma);
    (prisma as any).$queryRaw = async function(query: any, ...args: any[]) {
      return performanceMonitor.trackQuery(
        'raw_query',
        () => original$queryRaw(query, ...args),
        {
          type: 'raw_query',
          queryType: typeof query === 'string' ? 'string' : 'template',
          argsCount: args.length
        }
      );
    };
  }

  if (prisma.$executeRaw) {
    const original$executeRaw = prisma.$executeRaw.bind(prisma);
    (prisma as any).$executeRaw = async function(query: any, ...args: any[]) {
      return performanceMonitor.trackQuery(
        'raw_execute',
        () => original$executeRaw(query, ...args),
        {
          type: 'raw_execute',
          queryType: typeof query === 'string' ? 'string' : 'template',
          argsCount: args.length
        }
      );
    };
  }

  // Add performance summary method
  (prisma as any).$performance = {
    getSummary: (timeWindow?: number) => performanceMonitor.getSummary(timeWindow),
    getSlowQueries: (threshold: number = 1000, timeWindow?: number) => {
      const summary = performanceMonitor.getSummary(timeWindow);
      return summary.metrics.filter(metric =>
        metric.name.startsWith('db_query_') && metric.value > threshold
      );
    },
    reset: () => {
      performanceMonitor.cleanup(0); // Clear all metrics
    }
  };

  return prisma;
}

// Connection pool monitoring
export function monitorConnectionPool(prisma: PrismaClient) {
  // Monitor connection events if available
  if (typeof (prisma as any).$on === 'function') {
    (prisma as any).$on('query', (event: any) => {
      performanceMonitor.recordMetric('db_connection_query', event.duration, 'ms', {
        type: 'connection_pool',
        query: event.query.substring(0, 100), // First 100 chars
        params: event.params,
        target: event.target
      });

      // Log slow queries at the connection level
      if (event.duration > 1000) {
        logger.warn('Slow query detected at connection level', {
          action: 'slow_connection_query',
          duration: event.duration,
          query: event.query.substring(0, 200),
          target: event.target
        });
      }
    });

    (prisma as any).$on('info', (event: any) => {
      logger.info('Database info event', {
        action: 'db_info',
        message: event.message,
        target: event.target
      });
    });

    (prisma as any).$on('warn', (event: any) => {
      logger.warn('Database warning event', {
        action: 'db_warning',
        message: event.message,
        target: event.target
      });
    });

    (prisma as any).$on('error', (event: any) => {
      logger.error('Database error event', new Error(event.message), {
        action: 'db_error',
        target: event.target
      });
    });
  }
}

// Query performance analyzer
export class QueryAnalyzer {
  private queryPatterns = new Map<string, { count: number; totalTime: number; maxTime: number }>();

  analyzeQuery(queryName: string, duration: number): void {
    const pattern = this.extractPattern(queryName);
    const existing = this.queryPatterns.get(pattern) || { count: 0, totalTime: 0, maxTime: 0 };

    this.queryPatterns.set(pattern, {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
      maxTime: Math.max(existing.maxTime, duration)
    });
  }

  getSlowPatterns(threshold: number = 500): Array<{
    pattern: string;
    avgTime: number;
    maxTime: number;
    count: number;
  }> {
    return Array.from(this.queryPatterns.entries())
      .map(([pattern, stats]) => ({
        pattern,
        avgTime: stats.totalTime / stats.count,
        maxTime: stats.maxTime,
        count: stats.count
      }))
      .filter(item => item.avgTime > threshold)
      .sort((a, b) => b.avgTime - a.avgTime);
  }

  getTopQueries(limit: number = 10): Array<{
    pattern: string;
    avgTime: number;
    count: number;
    totalTime: number;
  }> {
    return Array.from(this.queryPatterns.entries())
      .map(([pattern, stats]) => ({
        pattern,
        avgTime: stats.totalTime / stats.count,
        count: stats.count,
        totalTime: stats.totalTime
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit);
  }

  private extractPattern(queryName: string): string {
    // Extract the basic pattern (model.operation)
    const parts = queryName.split('_');
    if (parts.length >= 3 && parts[0] === 'db' && parts[1] === 'query') {
      return parts.slice(2).join('_');
    }
    return queryName;
  }

  reset(): void {
    this.queryPatterns.clear();
  }
}

// Export singleton analyzer
export const queryAnalyzer = new QueryAnalyzer();