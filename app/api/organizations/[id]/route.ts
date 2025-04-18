import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organization } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // console.log('🔵 GET /api/organizations/[id] - Starting request for orgId:', id);
  try {
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, id))
      .limit(1);

    if (!org) {
      console.log('🔴 GET /api/organizations/[id] - Organization not found for id:', id);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // console.log('🔵 GET /api/organizations/[id] - Successfully fetched organization:', org);
    return NextResponse.json(org);
  } catch (error) {
    console.error('🔵 GET /api/organizations/[id] - Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}
