import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = ['/', '/admin/sign-in'];
const adminPrefix = '/admin';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const pathname = request.nextUrl.pathname;

  // Redirect ke dashboard jika sudah login dan mengakses login page
  if (pathname === '/admin/sign-in' && token) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Jika akses route admin
  if (pathname.startsWith(adminPrefix) && !publicRoutes.includes(pathname)) {
    // Jika tidak ada access token, cek apakah ada refresh token untuk coba verifikasi
    if (!token && !refreshToken) {
      return NextResponse.redirect(new URL('/admin/sign-in', request.url));
    }

    // Jika ada refreshToken tapi tidak ada accessToken, biarkan frontend handle refresh
    // Tapi tetap izinkan request lewat ke frontend
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};