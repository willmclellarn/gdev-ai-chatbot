import { organization, organizationMember, user } from './schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

async function seed() {
  try {
    // First, find the user with email w@general.dev
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, 'w@general.dev'));

    if (!existingUser) {
      console.error(
        'User w@general.dev not found. Please create the user first.',
      );
      process.exit(1);
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

    console.log('Successfully seeded organization and member data');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
