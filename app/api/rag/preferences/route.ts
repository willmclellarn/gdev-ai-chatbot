import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { saveUserPreferences, getUserPreferences } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chunkingStrategy, chunkSize, chunkOverlap } = await request.json();

    await saveUserPreferences(
      session.user.id,
      chunkingStrategy,
      chunkSize,
      chunkOverlap,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await getUserPreferences(session.user.id);
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error getting preferences:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}
