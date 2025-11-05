import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuth } from '@/lib/serverAuth';
import { RegisterSchema, parseSafe } from '@/lib/validation';

export async function POST(request) {
  try {
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
    return NextResponse.json({ success: false, error: 'Error en el registro' }, { status: 500 });
  }
}
