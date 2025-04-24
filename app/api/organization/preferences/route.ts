import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { organizationPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const [preferences] = await db
      .select()
      .from(organizationPreferences)
      .where(eq(organizationPreferences.organizationId, organizationId));

    if (!preferences) {
      // Create default preferences if they don't exist
      const [newPreferences] = await db
        .insert(organizationPreferences)
        .values({
          organizationId,
        })
        .returning();

      return NextResponse.json(newPreferences);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error getting organization preferences:", error);
    return NextResponse.json(
      { error: "Failed to get organization preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      organizationId,
      greetingTitle,
      greetingSubtitle,
      chatSuggestedTopics,
    } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const [existingPreferences] = await db
      .select()
      .from(organizationPreferences)
      .where(eq(organizationPreferences.organizationId, organizationId));

    let preferences;
    if (existingPreferences) {
      preferences = await db
        .update(organizationPreferences)
        .set({
          greetingTitle,
          greetingSubtitle,
          chatSuggestedTopics,
          updatedAt: new Date(),
        })
        .where(eq(organizationPreferences.organizationId, organizationId))
        .returning();
    } else {
      preferences = await db
        .insert(organizationPreferences)
        .values({
          organizationId,
          greetingTitle,
          greetingSubtitle,
          chatSuggestedTopics,
        })
        .returning();
    }

    return NextResponse.json(preferences[0]);
  } catch (error) {
    console.error("Error saving organization preferences:", error);
    return NextResponse.json(
      { error: "Failed to save organization preferences" },
      { status: 500 }
    );
  }
}
