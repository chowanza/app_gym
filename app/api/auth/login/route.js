import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { LoginSchema, parseSafe } from '@/lib/validation';

export async function POST(request) {
  try {
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
