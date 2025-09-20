import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { backupService } from '@/lib/backup-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if ((session?.user as any)?.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required' },
        { status: 401 }
      );
    }

    const { action, backupId } = await request.json();

    switch (action) {
      case 'create':
        const backup = await backupService.createBackup('manual');
        return NextResponse.json({ success: true, backup });

      case 'restore':
        if (!backupId) {
          return NextResponse.json(
            { error: 'Backup ID is required for restore' },
            { status: 400 }
          );
        }
        await backupService.restoreFromBackup(backupId);
        return NextResponse.json({ success: true });

      case 'verify':
        if (!backupId) {
          return NextResponse.json(
            { error: 'Backup ID is required for verification' },
            { status: 400 }
          );
        }
        const isValid = await backupService.verifyBackup(backupId);
        return NextResponse.json({ success: true, isValid });

      case 'cleanup':
        const deletedCount = await backupService.cleanupOldBackups();
        return NextResponse.json({ success: true, deletedCount });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Backup API error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(
      { error: 'Backup operation failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if ((session?.user as any)?.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const history = await backupService.getBackupHistory(limit);
    return NextResponse.json({ history });
  } catch (error) {
    logger.error('Backup history API error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(
      { error: 'Failed to retrieve backup history' },
      { status: 500 }
    );
  }
}