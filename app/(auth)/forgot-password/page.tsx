'use client';

import { useState } from 'react';
import { toast } from '@/components/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    console.log('🟡 Form Data:', Object.fromEntries(formData.entries()));
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setIsSuccessful(true);
      toast({
        type: 'success',
        description: 'Password reset email sent! Check your inbox.',
      });
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
          <h3 className="text-xl font-semibold dark:text-zinc-50">Forgot Password</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your email to receive a password reset link
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="email"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              className="bg-muted text-md md:text-sm"
              type="email"
              placeholder="user@acme.com"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <SubmitButton isSuccessful={isSuccessful}>Send Reset Link</SubmitButton>
        </form>
      </div>
    </div>
  );
}
