import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prompt, user, organization } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  console.log('🔵 GET /api/prompts - Starting request');
  try {
    const allPrompts = await db
      .select({
        id: prompt.id,
        title: prompt.title,
        content: prompt.content,
        description: prompt.description,
        isPublic: prompt.isPublic,
        userId: prompt.userId,
        organizationId: prompt.organizationId,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
      })
      .from(prompt);
    console.log('🔵 GET /api/prompts - Successfully fetched prompts:', allPrompts.length);
    return NextResponse.json(allPrompts);
  } catch (error) {
    console.error('🔵 GET /api/prompts - Error fetching prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('🔵 POST /api/prompts - Starting request');
  try {
    const body = await request.json();
    console.log('🔵 POST /api/prompts - Request body:', body);
    const { id, title, content, description, userId, organizationId } = body;

    // Validate required fields
    if (!title || !content || !userId) {
      return NextResponse.json(
        { error: 'Title, content, and userId are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.select().from(user).where(eq(user.id, userId));
    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If organizationId is provided, check if it exists
    if (organizationId) {
      const existingOrg = await db.select().from(organization).where(eq(organization.id, organizationId));
      if (existingOrg.length === 0) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }
    }

    if (id) {
      console.log('🔵 POST /api/prompts - Updating existing prompt:', id);
      // Update existing prompt
      await db
        .update(prompt)
        .set({
          title,
          content,
          description,
          updatedAt: new Date(),
        })
        .where(eq(prompt.id, id));
      console.log('🔵 POST /api/prompts - Successfully updated prompt:', id);
    } else {
      console.log('🔵 POST /api/prompts - Creating new prompt');
      // Create new prompt
      await db.insert(prompt).values({
        id: uuidv4(),
        title,
        content,
        description,
        userId,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('🔵 POST /api/prompts - Successfully created new prompt');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🔵 POST /api/prompts - Error saving prompt:', error);
    return NextResponse.json(
      { error: 'Failed to save prompt' },
      { status: 500 }
    );
  }
}
