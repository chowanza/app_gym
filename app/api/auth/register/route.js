import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuth } from '@/lib/serverAuth';
import { RegisterSchema, parseSafe } from '@/lib/validation';
import { rateLimit, formatRetryAfterSeconds } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // Gentle rate-limit for register to avoid abuse
    const fwd = request.headers.get('x-forwarded-for') || '';
    const ip = (fwd.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim();
    const rl = rateLimit({ key: `register:${ip}`, limit: 10, windowMs: 60 * 60_000 }); // 10/hr
    if (!rl.allowed) {
      const retry = rl.retryAfter ?? formatRetryAfterSeconds(rl.resetAt);
      return new NextResponse(JSON.stringify({ success: false, error: 'Demasiadas solicitudes de registro, intenta luego.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(retry) },
      });
    }

    const body = await request.json();
    const parsed = parseSafe(RegisterSchema, body);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    const { username, password, role } = parsed.data;

    await dbConnect();

    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json({ success: false, error: 'El usuario ya existe' }, { status: 409 });
    }

    const count = await User.countDocuments();
    // si ya existe algún usuario, exigir admin
    if (count > 0) {
      try {
        const session = requireAuth({ role: 'admin' });
        if (!session) throw new Error('unauth');
      } catch {
        return NextResponse.json({ success: false, error: 'Requiere rol admin' }, { status: 403 });
      }
    }

    const finalRole = role && ['admin', 'editor'].includes(role) ? role : (count === 0 ? 'admin' : 'editor');

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed, role: finalRole });

    return NextResponse.json({ success: true, data: { id: user._id.toString(), username: user.username, role: user.role } }, { status: 201 });
  } catch (err) {
    const msg = err?.message || '';
    const isConfig = msg.includes('MONGODB_URI') || msg.includes('JWT_SECRET');
    const friendly = isConfig && process.env.NODE_ENV !== 'production'
      ? `Configuración faltante: ${msg}`
      : 'Error en el registro';
    return NextResponse.json({ success: false, error: friendly }, { status: 500 });
  }
}
