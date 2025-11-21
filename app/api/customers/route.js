import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Customer from '@/models/Customer';
import { requireAuth } from '@/lib/serverAuth';
import { CustomerCreateSchema, parseSafe } from '@/lib/validation';

export async function GET(request) {
  try {
    // require auth for dashboard resources
    await requireAuth();
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);

    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { cedula: { $regex: q, $options: 'i' } },
      ];
    }
    if (status && (status === 'Activo' || status === 'Inactivo')) {
      filter.paymentStatus = status;
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    const hasMore = page * limit < total;
    return NextResponse.json({ success: true, data: customers, page, total, hasMore });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error obteniendo clientes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth();
    await dbConnect();
    const body = await request.json();
    const parsed = parseSafe(CustomerCreateSchema, body);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    const { name, cedula, email, phone, dateOfBirth, startDate, membershipType, photoUrl } = parsed.data;

    const exists = await Customer.findOne({ cedula });
    if (exists) {
      return NextResponse.json({ success: false, error: 'La cédula ya existe' }, { status: 409 });
    }

    const customer = await Customer.create({
      name: String(name).trim(),
      cedula: String(cedula).trim(),
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      membershipType: membershipType || 'Gym',
      photoUrl: photoUrl || undefined,
      createdBy: auth?.sub,
    });

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ success: false, error: 'La cédula ya existe' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error creando cliente' }, { status: 500 });
  }
}
