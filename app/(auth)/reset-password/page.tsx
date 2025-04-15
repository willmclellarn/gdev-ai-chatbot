'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/components/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  if (!token) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <div className="text-center">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Invalid Reset Link</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            This password reset link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (formData: FormData) => {
    if (password !== confirmPassword) {
      toast({
        type: 'error',
        description: 'Passwords do not match',
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setIsSuccessful(true);
      toast({
        type: 'success',
        description: 'Password reset successfully!',
      });

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      toast({
        type: 'error',
        description: error instanceof Error ? error.message : 'Something went wrong',
      });
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Reset Password</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your new password
          </p>
        </div>
        <form action={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
          <input type="hidden" name="token" value={token} />
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              New Password
            </Label>
            <Input
              id="password"
              name="password"
              className="bg-muted text-md md:text-sm"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="confirmPassword"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              className="bg-muted text-md md:text-sm"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <SubmitButton isSuccessful={isSuccessful}>Reset Password</SubmitButton>
        </form>
      </div>
    </div>
  );
}
