import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { ragFile, ragFolder } from "@/lib/db/schema";
import { eq, inArray, and, isNull } from "drizzle-orm";
import { put } from "@vercel/blob";

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
    const folderId = formData.get("folderId") as string;
    const organizationId = formData.get("organizationId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate folder access if folderId is provided
    if (folderId) {
      const [folder] = await db
        .select()
        .from(ragFolder)
        .where(eq(ragFolder.id, folderId));

      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 }
        );
      }

      if (folder.userId !== session.user.id && !folder.organizationId) {
        return NextResponse.json(
          { error: "Unauthorized to add file to this folder" },
          { status: 403 }
        );
      }
    }

    // Validate organization access if organizationId is provided
    if (organizationId) {
      const hasAccess = session.user.orgIds?.includes(organizationId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Unauthorized to add file to this organization" },
          { status: 403 }
        );
      }
    }

    // Upload file to blob storage
    const blob = await put(`rag/${file.name}`, file, {
      access: "public",
    });

    // Create file record in database
    const [fileRecord] = await db
      .insert(ragFile)
      .values({
        name: file.name,
        path: blob.url,
        type: file.type,
        size: file.size,
        userId: session.user.id,
        folderId: folderId || null,
        organizationId: organizationId || null,
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
