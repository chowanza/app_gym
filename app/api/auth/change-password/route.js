import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuth } from '@/lib/serverAuth';
import { ChangePasswordSchema, parseSafe } from '@/lib/validation';
import { rateLimit, formatRetryAfterSeconds } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // Throttle password change attempts per IP
    const fwd = request.headers.get('x-forwarded-for') || '';
    const ip = (fwd.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim();
    const rl = rateLimit({ key: `change-pw:${ip}`, limit: 5, windowMs: 60_000 });
    if (!rl.allowed) {
      const retry = rl.retryAfter ?? formatRetryAfterSeconds(rl.resetAt);
      return new NextResponse(JSON.stringify({ success: false, error: 'Demasiados intentos, intenta nuevamente en breve' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(retry) },
      });
    }

    const payload = requireAuth();
    const body = await request.json();
    const parsed = parseSafe(ChangePasswordSchema, body);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    const { currentPassword, newPassword } = parsed.data;

    await dbConnect();
    const user = await User.findById(payload.sub);
    if (!user) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return NextResponse.json({ success: false, error: 'Contraseña actual incorrecta' }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error al cambiar la contraseña' }, { status: 500 });
  }
}
