import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { LoginSchema, parseSafe } from '@/lib/validation';
import { rateLimit, formatRetryAfterSeconds } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // Basic rate-limit per IP (fixed window)
    const fwd = request.headers.get('x-forwarded-for') || '';
    const ip = (fwd.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim();
    const rl = rateLimit({ key: `login:${ip}`, limit: 5, windowMs: 60_000 });
    if (!rl.allowed) {
      const retry = rl.retryAfter ?? formatRetryAfterSeconds(rl.resetAt);
      return new NextResponse(JSON.stringify({ success: false, error: 'Demasiados intentos, intenta nuevamente en breve' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(retry) },
      });
    }

    const body = await request.json();
    const parsed = parseSafe(LoginSchema, body);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    const { username, password } = parsed.data;

    await dbConnect();
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = signToken({ sub: user._id.toString(), username: user.username, role: user.role });

    const res = NextResponse.json({ success: true, data: { token, user: { id: user._id.toString(), username: user.username, role: user.role } } });
    // Set HttpOnly cookie for session convenience
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (err) {
    const msg = err?.message || '';
    // En desarrollo, dar pista de configuración
    const isConfig = msg.includes('MONGODB_URI') || msg.includes('JWT_SECRET');
    const friendly = isConfig && process.env.NODE_ENV !== 'production'
      ? `Configuración faltante: ${msg}`
      : 'Error en el login';
    return NextResponse.json({ success: false, error: friendly }, { status: 500 });
  }
}
