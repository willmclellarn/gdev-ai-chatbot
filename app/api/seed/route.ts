import { NextResponse } from 'next/server';
import { organization, organizationMember, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export async function POST() {
  try {
    // biome-ignore lint: Forbidden non-null assertion.
    const client = postgres(process.env.POSTGRES_URL!);
    const db = drizzle(client);

    // First, find the user with email w@general.dev
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, 'w@general.dev'));

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User w@general.dev not found. Please create the user first.' },
        { status: 400 }
      );
    }

    // Create the organization
    const [generalDevOrg] = await db
      .insert(organization)
      .values({
        name: 'General Development',
      })
      .returning();

    // Add the user as owner of the organization
    await db.insert(organizationMember).values({
      organizationId: generalDevOrg.id,
      userId: existingUser.id,
      role: 'owner',
    });

    return NextResponse.json({
      message: 'Successfully seeded organization and member data',
      organization: generalDevOrg,
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: 'Failed to seed data' },
      { status: 500 }
    );
  }
}
