// proxy
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  console.log('d',process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          }),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (req.nextUrl.pathname.startsWith('/upload') || req.nextUrl.pathname.includes('/edit')) {
    if (!user) {
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
