import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { ragFile, ragFolder } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// PATCH /api/rag/files/move - Move a file to a new folder
export async function PATCH(request: Request) {
  console.log("🔵 [RAG] File move route hit");

  try {
    const session = await auth();
    console.log("🔵 [RAG] Auth session:", session ? "Found" : "Not found");

    if (!session?.user?.id) {
      console.log("🔴 [RAG] Unauthorized - No user ID in session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId, folderId } = await request.json();
    console.log("🔵 [RAG] Move request data:", { fileId, folderId });

    if (!fileId) {
      console.log("🔴 [RAG] Bad request - Missing fileId");
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // First, verify the file exists and belongs to the user
    const file = await db
      .select()
      .from(ragFile)
      .where(and(eq(ragFile.id, fileId), eq(ragFile.userId, session.user.id)))
      .execute();

    console.log(
      "🔵 [RAG] File lookup result:",
      file.length ? "Found" : "Not found"
    );

    if (!file.length) {
      console.log("🔴 [RAG] File not found or access denied");
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    // If folderId is provided, verify the folder exists and belongs to the user
    if (folderId) {
      console.log("🔵 [RAG] Verifying target folder:", folderId);
      const folder = await db
        .select()
        .from(ragFolder)
        .where(
          and(eq(ragFolder.id, folderId), eq(ragFolder.userId, session.user.id))
        )
        .execute();

      console.log(
        "🔵 [RAG] Folder lookup result:",
        folder.length ? "Found" : "Not found"
      );

      if (!folder.length) {
        console.log("🔴 [RAG] Folder not found or access denied");
        return NextResponse.json(
          { error: "Folder not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Update the file's folder
    console.log("🔵 [RAG] Updating file location:", {
      fileId,
      newFolderId: folderId,
    });
    await db
      .update(ragFile)
      .set({
        folderId: folderId || null,
        updatedAt: new Date(),
      })
      .where(eq(ragFile.id, fileId))
      .execute();

    console.log("✅ [RAG] File moved successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🔴 [RAG] Error moving file:", error);
    return NextResponse.json({ error: "Failed to move file" }, { status: 500 });
  }
}
