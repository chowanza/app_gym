import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Customer from '@/models/Customer';
import { requireAuth } from '@/lib/serverAuth';
import { CustomerUpdateSchema, parseSafe } from '@/lib/validation';

export async function GET(_request, { params }) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = params;
    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: customer });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error obteniendo cliente' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = params;
    const payload = await request.json();
    const parsed = parseSafe(CustomerUpdateSchema, payload);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    const data = parsed.data;

    const allowed = [
      'name',
      'cedula',
      'email',
      'phone',
      'dateOfBirth',
      'startDate',
      'membershipType',
      'paymentStatus',
      'membershipEndDate',
      'photoUrl',
    ];
    const update = {};
    for (const k of allowed) {
      if (k in data) update[k] = data[k];
    }

    if (update.dateOfBirth) update.dateOfBirth = new Date(update.dateOfBirth);
    if (update.startDate) update.startDate = new Date(update.startDate);
    if (update.membershipEndDate) update.membershipEndDate = new Date(update.membershipEndDate);

    // Validar unicidad de cédula si se está actualizando
    if (update.cedula) {
      const exists = await Customer.findOne({ cedula: update.cedula, _id: { $ne: id } });
      if (exists) {
        return NextResponse.json({ success: false, error: 'La cédula ya existe en otro cliente' }, { status: 409 });
      }
    }

    const customer = await Customer.findByIdAndUpdate(id, update, { new: true });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: customer });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ success: false, error: 'La cédula ya existe' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error actualizando cliente' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = params;
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error eliminando cliente' }, { status: 500 });
  }
}
