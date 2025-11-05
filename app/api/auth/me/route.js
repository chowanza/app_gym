import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuth } from '@/lib/serverAuth';

export async function GET() {
  try {
    const payload = requireAuth();
    await dbConnect();
    const user = await User.findById(payload.sub).lean();
    if (!user) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, data: { id: String(user._id), username: user.username, role: user.role } });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }
}
