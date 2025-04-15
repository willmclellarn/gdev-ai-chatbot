import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { passwordResetToken, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { genSaltSync, hashSync } from 'bcrypt-ts';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;

    console.log('🔵 token inside reset-password', token);
    console.log('🔵 password inside reset-password', password);

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Find the reset token
    const [resetToken] = await db
      .select()
      .from(passwordResetToken)
      .where(eq(passwordResetToken.token, token));

    if (!resetToken) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      await db
        .delete(passwordResetToken)
        .where(eq(passwordResetToken.id, resetToken.id));
      return NextResponse.json(
        { message: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Hash the new password
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);

    // Update user's password
    await db
      .update(user)
      .set({ password: hash })
      .where(eq(user.id, resetToken.userId));

    // Delete the used token
    await db
      .delete(passwordResetToken)
      .where(eq(passwordResetToken.id, resetToken.id));

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
