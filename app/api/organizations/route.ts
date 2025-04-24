import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organization, user as userSchema } from "@/lib/db/schema";
import { auth } from "@/app/(auth)/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const [dbUser] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.id, session.user.id))
      .limit(1);

    if (!dbUser?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all organizations
    const organizations = await db.select().from(organization);

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
