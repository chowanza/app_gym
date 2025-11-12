import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuth } from '@/lib/serverAuth';

export async function PATCH(request, { params }) {
  try {
    requireAuth({ role: 'admin' });
    const { id } = params;
    const body = await request.json();
    const role = body?.role;
    if (!['admin','editor'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Rol inválido' }, { status: 400 });
    }
    await dbConnect();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });

    // Si se intenta degradar al último admin, bloquear
    const wasAdmin = user.role === 'admin';
    if (wasAdmin && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return NextResponse.json({ success: false, error: 'Debe existir al menos un admin' }, { status: 400 });
      }
    }

    user.role = role;
    await user.save();
    return NextResponse.json({ success: true, data: { id: String(user._id), username: user.username, role: user.role } });
  } catch (err) {
    const msg = (err && err.message) || '';
    const status = msg === 'UNAUTHENTICATED' ? 401 : (msg === 'FORBIDDEN' ? 403 : 500);
    return NextResponse.json({ success: false, error: status === 500 ? 'Error actualizando usuario' : 'No autorizado' }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    const payload = requireAuth({ role: 'admin' });
    const { id } = params;
    await dbConnect();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });

    if (String(user._id) === String(payload.sub)) {
      return NextResponse.json({ success: false, error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) return NextResponse.json({ success: false, error: 'Debe existir al menos un admin' }, { status: 400 });
    }

    await user.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = (err && err.message) || '';
    const status = msg === 'UNAUTHENTICATED' ? 401 : (msg === 'FORBIDDEN' ? 403 : 500);
    return NextResponse.json({ success: false, error: status === 500 ? 'Error eliminando usuario' : 'No autorizado' }, { status });
  }
}
