import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { ragFile, ragFolder } from "@/lib/db/schema";
import { eq, inArray, and, isNull } from "drizzle-orm";

// GET /api/rag/files - Get all files for the current user and their organizations
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's personal files
    const personalFiles = await db
      .select()
      .from(ragFile)
      .where(
        and(eq(ragFile.userId, session.user.id), isNull(ragFile.organizationId))
      );

    // Get organization files
    const organizationFiles = await db
      .select()
      .from(ragFile)
      .where(
        inArray(
          ragFile.organizationId,
          session.user.orgIds?.map((id) => id) || []
        )
      );

    return NextResponse.json({
      personalFiles,
      organizationFiles,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

// POST /api/rag/files - Create a new file
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const vectorId = formData.get("vectorId") as string;

    if (!file || !name || !type || !vectorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create file record in database
    const [fileRecord] = await db
      .insert(ragFile)
      .values({
        name,
        path: `pinecone:${vectorId}`, // Store reference to Pinecone namespace
        type,
        size: file.size,
        userId: session.user.id,
        vectorId,
      })
      .returning();

    return NextResponse.json(fileRecord);
  } catch (error) {
    console.error("Error creating file:", error);
    return NextResponse.json(
      { error: "Failed to create file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Delete file record from database
    await db.delete(ragFile).where(eq(ragFile.id, fileId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
