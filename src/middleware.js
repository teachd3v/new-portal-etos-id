import { NextResponse } from 'next/server';
import { verifyJwt, getDashboardPathByRole } from '@/lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');

  // Determine token from cookie or Authorization header
  let token = request.cookies.get('auth_token')?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Verify token
  const payload = token ? await verifyJwt(token) : null;
  const role = payload?.role ? String(payload.role).toUpperCase() : null;

  // 0. Instant Cold-Start Routing for PWA Home ('/') & '/login'
  if (pathname === '/') {
    if (payload && role) {
      return NextResponse.redirect(new URL(getDashboardPathByRole(role), request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login') {
    if (payload && role) {
      const requestedRedirect = request.nextUrl.searchParams.get('redirect');
      const defaultDashboard = getDashboardPathByRole(role);
      if (
        requestedRedirect &&
        requestedRedirect.startsWith('/') &&
        !requestedRedirect.startsWith('//') &&
        requestedRedirect !== '/login'
      ) {
        return NextResponse.redirect(new URL(requestedRedirect, request.url));
      }
      return NextResponse.redirect(new URL(defaultDashboard, request.url));
    }
    return NextResponse.next();
  }

  // 1. Protection for API Routes
  if (isApiRoute) {
    if (pathname.startsWith('/api/admin')) {
      if (!payload) {
        return NextResponse.json({ error: 'Unauthorized: Silakan login terlebih dahulu' }, { status: 401 });
      }
      if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Akses hanya untuk Admin' }, { status: 403 });
      }
    } else if (pathname.startsWith('/api/fasil')) {
      if (!payload) {
        return NextResponse.json({ error: 'Unauthorized: Silakan login terlebih dahulu' }, { status: 401 });
      }
      if (!role.includes('FASIL') && role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Akses hanya untuk Fasilitator' }, { status: 403 });
      }
    } else if (pathname.startsWith('/api/etoser')) {
      if (!payload) {
        return NextResponse.json({ error: 'Unauthorized: Silakan login terlebih dahulu' }, { status: 401 });
      }
      if (role !== 'PM' && role !== 'ETOSER' && role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Akses hanya untuk Etoser' }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  // 2. Protection for UI Page Routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/fasil') || pathname.startsWith('/etoser')) {
    if (!payload || !role) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      if (role.includes('FASIL')) {
        return NextResponse.redirect(new URL('/fasil', request.url));
      }
      return NextResponse.redirect(new URL('/etoser', request.url));
    }

    if (pathname.startsWith('/fasil') && !role.includes('FASIL') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/etoser', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/admin/:path*',
    '/fasil/:path*',
    '/etoser/:path*',
    '/api/admin/:path*',
    '/api/fasil/:path*',
    '/api/etoser/:path*',
  ],
};

