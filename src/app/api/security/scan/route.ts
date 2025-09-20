import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { runSecurityScan } from '@/lib/security-scanner';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Only platform admins can run security scans
    if (!session?.user?.isPlatformAdmin) {
      logger.warn('Unauthorized security scan attempt', {
        userId: session?.user?.id,
        action: 'security_scan_unauthorized',
      });

      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required' },
        { status: 401 }
      );
    }

    logger.info('Running security scan', {
      userId: session.user.id,
      action: 'security_scan_initiated',
    });

    // Run the security scan
    const report = await runSecurityScan();

    // Log critical issues
    if (report.criticalIssues > 0) {
      logger.error('Critical security issues detected', new Error('Security scan found critical issues'), {
        action: 'critical_security_issues',
        criticalCount: report.criticalIssues,
        failedTests: report.results
          .filter(r => !r.passed && r.severity === 'critical')
          .map(r => r.test),
      });
    }

    return NextResponse.json({
      success: true,
      report,
      recommendations: report.results
        .filter(r => !r.passed && r.recommendation)
        .map(r => r.recommendation),
    });
  } catch (error) {
    logger.error('Security scan failed', error instanceof Error ? error : new Error('Unknown error'));

    return NextResponse.json(
      { error: 'Security scan failed' },
      { status: 500 }
    );
  }
}