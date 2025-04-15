import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { passwordResetToken } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  console.log('🔵 POST request inside forgot-password');
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('🔵 RESEND_API_KEY is not configured');
      return NextResponse.json(
        { message: 'Email service is not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const email = formData.get('email') as string;

    console.log('🔵 email inside forgot-password', email);

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    const [user] = await getUser(email);

    if (!user) {
      return NextResponse.json(
        { message: 'No account found with this email' },
        { status: 404 }
      );
    }

    // Delete any existing reset tokens for this user
    await db
      .delete(passwordResetToken)
      .where(eq(passwordResetToken.userId, user.id));

    // Create new reset token
    const token = uuidv4();
    await db.insert(passwordResetToken).values({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    });

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    try {
      await resend.emails.send({
        from: 'will@cardinalecom.com',
        to: email,
        subject: 'Reset Your Password',
        html: `
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    } catch (emailError) {
      console.error('🔵 Failed to send reset email:', emailError);
      return NextResponse.json(
        { message: 'Failed to send reset email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Reset email sent' });
  } catch (error) {
    console.error('🔵 Password reset error:', error);
    return NextResponse.json(
      { message: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
