import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/',
    '/:id',
    '/login',
    '/register',
    '/forgot-password/:path*',
    '/reset-password/:path*',
    '/api/((?!auth/forgot-password|auth/reset-password).*)',
  ],
};
