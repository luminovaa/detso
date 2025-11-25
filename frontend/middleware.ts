import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = ['/', '/admin/sign-in'];
const adminPrefix = '/admin';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const pathname = request.nextUrl.pathname;

  // 1. Redirect logic tetap sama
  if (pathname === adminPrefix) {
    return NextResponse.redirect(new URL('/admin/sign-in', request.url));
  }

  if (pathname === '/admin/sign-in' && token) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // 2. Protected routes
  if (pathname.startsWith(adminPrefix) && !publicRoutes.includes(pathname)) {
    // Tidak ada token sama sekali
    if (!token && !refreshToken) {
      return NextResponse.redirect(new URL('/admin/sign-in', request.url));
    }

    // Ada refreshToken tapi tidak ada accessToken → refresh
    if (!token && refreshToken) {
      try {
        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 
            cookie: request.headers.get('cookie') || '' 
          }
        });

        if (refreshRes.ok) {
          const res = NextResponse.next();
          const setCookie = refreshRes.headers.get('set-cookie');
          if (setCookie) {
            res.headers.set('set-cookie', setCookie);
          }
          return res;
        } else {
          // Refresh gagal, logout
          return NextResponse.redirect(new URL('/admin/sign-in', request.url));
        }
      } catch (error) {
        console.error('Refresh error in middleware:', error);
        return NextResponse.redirect(new URL('/admin/sign-in', request.url));
      }
    }

    // Ada accessToken → verify dulu sebelum lanjut (PENTING!)
    if (token) {
      try {
        // Verifikasi token di middleware (optional, untuk keamanan lebih)
        const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify`, {
          method: 'GET',
          headers: { 
            cookie: `accessToken=${token}` 
          }
        });

        if (!verifyRes.ok) {
          // Token invalid, coba refresh
          if (refreshToken) {
            const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: { cookie: request.headers.get('cookie') || '' }
            });

            if (refreshRes.ok) {
              const res = NextResponse.next();
              const setCookie = refreshRes.headers.get('set-cookie');
              if (setCookie) res.headers.set('set-cookie', setCookie);
              return res;
            }
          }
          return NextResponse.redirect(new URL('/admin/sign-in', request.url));
        }
      } catch (error) {
        console.error('Token verification error:', error);
        // Network error, biarkan frontend yang handle
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};