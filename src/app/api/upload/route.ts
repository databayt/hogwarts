import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { uploadLogo, uploadAvatar } from '@/lib/file-upload';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!type || !['logo', 'avatar'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid upload type' },
        { status: 400 }
      );
    }

    let result;

    if (type === 'logo') {
      // Only allow school admins to upload logos
      if (session.user.role !== 'PRINCIPAL' && session.user.role !== 'DEVELOPER') {
        return NextResponse.json(
          { error: 'Insufficient permissions to upload logo' },
          { status: 403 }
        );
      }

      if (!session.user.schoolId) {
        return NextResponse.json(
          { error: 'No school associated with user' },
          { status: 400 }
        );
      }

      result = await uploadLogo(file, session.user.schoolId);

      if (result.success && result.url) {
        // Update school logo in database
        await db.school.update({
          where: { id: session.user.schoolId },
          data: { logoUrl: result.url },
        });

        logger.info('School logo updated', {
          action: 'school_logo_update',
          schoolId: session.user.schoolId,
          userId: session.user.id,
        });
      }
    } else if (type === 'avatar') {
      result = await uploadAvatar(file, session.user.id);

      if (result.success && result.url) {
        // Update user avatar in database
        await db.user.update({
          where: { id: session.user.id },
          data: { image: result.url },
        });

        logger.info('User avatar updated', {
          action: 'user_avatar_update',
          userId: session.user.id,
        });
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: 500 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      metadata: result.metadata,
    });
  } catch (error) {
    logger.error('Upload API error', error instanceof Error ? error : new Error('Unknown error'), {
      action: 'upload_api_error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}