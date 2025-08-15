import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = ['/', '/admin/sign-in'];
const adminPrefix = '/admin';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const pathname = request.nextUrl.pathname;

  // 1. Jika akses `/admin` (tepat), redirect ke `/admin/sign-in`
  if (pathname === adminPrefix) {
    return NextResponse.redirect(new URL('/admin/sign-in', request.url));
  }

  // 2. Jika akses halaman sign-in tapi sudah login, redirect ke dashboard
  if (pathname === '/admin/sign-in' && token) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  if (pathname.startsWith(adminPrefix) && !publicRoutes.includes(pathname)) {
  if (!token && !refreshToken) {
    return NextResponse.redirect(new URL('/admin/sign-in', request.url));
  }

  // Kalau tidak ada accessToken tapi ada refreshToken → refresh dulu
  if (!token && refreshToken) {
    try {
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { cookie: request.headers.get('cookie') || '' }
      });

      if (refreshRes.ok) {
        // Lanjutkan request dengan cookie baru
        const res = NextResponse.next();
        const setCookie = refreshRes.headers.get('set-cookie');
        if (setCookie) res.headers.set('set-cookie', setCookie);
        return res;
      } else {
        return NextResponse.redirect(new URL('/admin/sign-in', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/admin/sign-in', request.url));
    }
  }

  return NextResponse.next();
}


  // 3. Jika akses route admin (kecuali sign-in), cek autentikasi
  if (pathname.startsWith(adminPrefix) && !publicRoutes.includes(pathname)) {
    // Jika tidak punya token dan tidak punya refreshToken → wajib login
    if (!token && !refreshToken) {
      return NextResponse.redirect(new URL('/admin/sign-in', request.url));
    }

    // Jika hanya punya refreshToken, izinkan frontend handle refresh
    return NextResponse.next();
  }

  // 4. Untuk route non-admin, lanjutkan
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};