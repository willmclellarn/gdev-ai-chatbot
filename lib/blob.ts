import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

// Define allowed file types
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];

// Define maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Define the response type for successful uploads
export interface UploadResponse {
  url: string;
  name: string;
  size: number;
  type: string;
}

// Define the error response type
export interface ErrorResponse {
  error: string;
  status: number;
}

/**
 * Uploads a file to Vercel Blob storage
 * @param file - The file to upload
 * @param fileName - The name of the file
 * @returns Promise<UploadResponse | ErrorResponse>
 */
export async function uploadFile(
  file: File,
  fileName: string
): Promise<UploadResponse | ErrorResponse> {
  try {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        error: "File type not allowed",
        status: 400,
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        error: "File size exceeds limit",
        status: 400,
      };
    }

    // Upload to blob storage
    const blob = await put(fileName, file, {
      access: "public",
    });

    return {
      url: blob.url,
      name: fileName,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      error: "Failed to upload file",
      status: 500,
    };
  }
}
