import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateCsvTemplate, generateExcelTemplate } from '@/lib/import-parser';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const dataType = url.searchParams.get('type') || 'students';
    const format = url.searchParams.get('format') || 'csv';

    // Validate data type
    if (!['students', 'teachers', 'classes'].includes(dataType)) {
      return NextResponse.json(
        { error: 'Invalid data type' },
        { status: 400 }
      );
    }

    // Generate template based on format
    if (format === 'excel' || format === 'xlsx') {
      try {
        const buffer = await generateExcelTemplate(dataType);

        // Convert Buffer to Uint8Array for NextResponse compatibility
        const uint8Array = new Uint8Array(buffer);

        return new NextResponse(uint8Array, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${dataType}-template.xlsx"`,
          },
        });
      } catch (error) {
        logger.error('Failed to generate Excel template', error instanceof Error ? error : new Error('Unknown error'));

        // Fallback to CSV if Excel generation fails
        const csvContent = generateCsvTemplate(dataType);

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${dataType}-template.csv"`,
          },
        });
      }
    } else {
      // Generate CSV template
      const csvContent = generateCsvTemplate(dataType);

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${dataType}-template.csv"`,
        },
      });
    }
  } catch (error) {
    logger.error('Template generation error', error instanceof Error ? error : new Error('Unknown error'));

    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}