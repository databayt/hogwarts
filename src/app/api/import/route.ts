import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { importStudents, importTeachers, generateStudentTemplate, generateTeacherTemplate } from '@/components/file';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow PRINCIPAL or DEVELOPER to import
    if (session.user.role !== 'PRINCIPAL' && session.user.role !== 'DEVELOPER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (!session.user.schoolId) {
      return NextResponse.json(
        { error: 'No school associated with user' },
        { status: 400 }
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

    if (!type || !['students', 'teachers'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid import type. Use "students" or "teachers"' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    let result;
    if (type === 'students') {
      result = await importStudents(content, session.user.schoolId);
    } else {
      result = await importTeachers(content, session.user.schoolId);
    }

    logger.info('CSV import completed', {
      action: 'csv_import',
      type,
      schoolId: session.user.schoolId,
      imported: result.imported,
      failed: result.failed,
      userId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('CSV import API error', error instanceof Error ? error : new Error('Unknown error'), {
      action: 'csv_import_api_error',
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to download templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || !['students', 'teachers'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid template type. Use "students" or "teachers"' },
        { status: 400 }
      );
    }

    let content: string;
    let filename: string;

    if (type === 'students') {
      content = generateStudentTemplate();
      filename = 'student_import_template.csv';
    } else {
      content = generateTeacherTemplate();
      filename = 'teacher_import_template.csv';
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error('Template download error', error instanceof Error ? error : new Error('Unknown error'), {
      action: 'template_download_error',
    });
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}