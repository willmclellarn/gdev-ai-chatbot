import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { ragFolder } from "@/lib/db/schema";
import { eq, inArray, isNull, and, or } from "drizzle-orm";

// GET /api/rag/folders - Get all folders for the current user and their organizations
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's personal folders
    const personalFolders = await db
      .select()
      .from(ragFolder)
      .where(
        and(
          eq(ragFolder.userId, session.user.id),
          isNull(ragFolder.organizationId)
        )
      );

    // Get organization folders
    const organizationFolders = await db
      .select()
      .from(ragFolder)
      .where(
        inArray(
          ragFolder.organizationId,
          session.user.orgIds?.map((id) => id) || []
        )
      );

    return NextResponse.json({
      personalFolders,
      organizationFolders,
    });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}

// POST /api/rag/folders - Create a new folder
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, organizationId } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Validate organization access if organizationId is provided
    if (organizationId) {
      const hasAccess = session.user.orgIds?.includes(organizationId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Unauthorized to create folder in this organization" },
          { status: 403 }
        );
      }
    }

    const [folder] = await db
      .insert(ragFolder)
      .values({
        name,
        userId: session.user.id,
        organizationId: organizationId || null,
      })
      .returning();

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}

// DELETE /api/rag/folders - Delete a folder
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await request.json();

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    // Check if folder exists and user has access
    const [folder] = await db
      .select()
      .from(ragFolder)
      .where(
        and(
          eq(ragFolder.id, folderId),
          or(
            eq(ragFolder.userId, session.user.id),
            inArray(
              ragFolder.organizationId,
              session.user.orgIds?.map((id) => id) || []
            )
          )
        )
      );

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the folder
    await db.delete(ragFolder).where(eq(ragFolder.id, folderId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}
