import { NextResponse } from 'next/server';

export function middleware(req) {
  const { nextUrl, cookies } = req;
  const protectedPaths = ['/dashboard', '/api/customers', '/api/payments', '/api/attendance', '/api/dashboard', '/api/users'];
  const isProtected = protectedPaths.some((p) => nextUrl.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = cookies.get('auth_token')?.value;
  if (!token) {
    if (nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', nextUrl));
  }
  // Nota: La verificación criptográfica del token se hará en los handlers del servidor si es necesario.
  // En middleware (edge runtime) sólo verificamos presencia para no depender de libs Node.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/customers/:path*',
    '/api/payments/:path*',
    '/api/attendance/:path*',
    '/api/dashboard/:path*',
    '/api/users/:path*',
  ],
};
