import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import Customer from '@/models/Customer';
import { requireAuth } from '@/lib/serverAuth';

export async function GET(_request, { params }) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = params;
    const attendance = await Attendance.findById(id).populate('customer', 'name cedula').lean();
    if (!attendance) return NextResponse.json({ success: false, error: 'Asistencia no encontrada' }, { status: 404 });
    return NextResponse.json({ success: true, data: attendance });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error obteniendo asistencia' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    const current = await Attendance.findById(id);
    if (!current) return NextResponse.json({ success: false, error: 'Asistencia no encontrada' }, { status: 404 });

    let updates = {};

    let customerId = current.customer;
    if (typeof body.customer === 'string' && body.customer.trim()) {
      customerId = body.customer.trim();
    } else if (typeof body.cedula === 'string' && body.cedula.trim()) {
      const c = await Customer.findOne({ cedula: body.cedula.trim() }, { _id: 1 });
      if (!c) return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
      customerId = c._id;
    }

    let checkInTime = current.checkInTime;
    if (body.checkInTime) {
      const t = new Date(body.checkInTime);
      if (isNaN(t.getTime())) return NextResponse.json({ success: false, error: 'Fecha/hora inválida' }, { status: 400 });
      checkInTime = t;
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });

    if (!customer.membershipEndDate || checkInTime > new Date(customer.membershipEndDate)) {
      return NextResponse.json({ success: false, error: 'Cliente inactivo para la fecha indicada' }, { status: 403 });
    }

    updates.customer = customerId;
    updates.checkInTime = checkInTime;

    const updated = await Attendance.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate('customer', 'name cedula');

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error actualizando asistencia' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = params;
    const attendance = await Attendance.findById(id);
    if (!attendance) return NextResponse.json({ success: false, error: 'Asistencia no encontrada' }, { status: 404 });
    await attendance.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error eliminando asistencia' }, { status: 500 });
  }
}
