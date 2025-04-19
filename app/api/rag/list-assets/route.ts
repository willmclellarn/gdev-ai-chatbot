import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

async function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): Promise<string[]> {
  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }

  return arrayOfFiles;
}

export async function GET() {
  try {
    const assetsDir = path.join(process.cwd(), 'public', 'assets');
    const allFilePaths = await getAllFiles(assetsDir);

    const documentFiles = allFilePaths.map(filePath => {
      // Remove the public prefix from the path to make it accessible via URL
      const relativePath = filePath.split('/public')[1];
      return {
        name: path.basename(filePath),
        path: relativePath
      };
    });

    return NextResponse.json(documentFiles);
  } catch (error) {
    console.error('🔵 Error listing assets:', error);
    return NextResponse.json(
      { error: 'Failed to list assets' },
      { status: 500 }
    );
  }
}
