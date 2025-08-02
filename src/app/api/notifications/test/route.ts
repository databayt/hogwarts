import { NextResponse } from 'next/server';
import { testBotConfiguration } from '@/components/notifications/test-bot';
import { auth } from '../../../../../auth';

export async function GET() {
  try {
    // Only allow admins to test
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MEMBERSHIP'].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await testBotConfiguration();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing bot configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 