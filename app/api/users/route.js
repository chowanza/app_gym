import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuth } from '@/lib/serverAuth';

export async function GET() {
  try {
    requireAuth({ role: 'admin' });
    await dbConnect();
    const users = await User.find({}, { username: 1, role: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean();
    const data = users.map(u => ({ id: String(u._id), username: u.username, role: u.role, createdAt: u.createdAt }));
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const msg = (err && err.message) || '';
    const status = msg === 'UNAUTHENTICATED' ? 401 : (msg === 'FORBIDDEN' ? 403 : 500);
    return NextResponse.json({ success: false, error: status === 500 ? 'Error obteniendo usuarios' : 'No autorizado' }, { status });
  }
}
