import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag as nextRevalidateTag, revalidatePath as nextRevalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Only allow authenticated users with admin roles to revalidate cache
    if (!session?.user || (session.user.role !== 'DEVELOPER' && session.user.role !== 'PRINCIPAL')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const path = searchParams.get('path');

    if (!tag && !path) {
      return NextResponse.json(
        { error: 'Either tag or path parameter is required' },
        { status: 400 }
      );
    }

    if (tag) {
      nextRevalidateTag(tag);
      logger.info('Cache tag revalidated', {
        action: 'cache_revalidate_tag',
        tag,
        userId: session.user.id,
        schoolId: session.user.schoolId,
      });
      return NextResponse.json({ revalidated: true, tag });
    }

    if (path) {
      nextRevalidatePath(path);
      logger.info('Cache path revalidated', {
        action: 'cache_revalidate_path',
        path,
        userId: session.user.id,
        schoolId: session.user.schoolId,
      });
      return NextResponse.json({ revalidated: true, path });
    }
  } catch (error) {
    logger.error('Cache revalidation error', error instanceof Error ? error : new Error('Unknown error'), {
      action: 'cache_revalidation_error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}