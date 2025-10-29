// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect upload and edit routes
  if (req.nextUrl.pathname.startsWith('/upload') || 
      req.nextUrl.pathname.includes('/edit')) {
    if (!session) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/upload/:path*', '/meme/:path*/edit'],
};