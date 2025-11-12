import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import Customer from '@/models/Customer';
import { requireAuth } from '@/lib/serverAuth';
import { AttendanceCreateSchema, parseSafe } from '@/lib/validation';

export async function POST(request) {
  try {
    const auth = await requireAuth();
    await dbConnect();
    const body = await request.json();
    const parsed = parseSafe(AttendanceCreateSchema, body);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    const { customer: customerId, cedula } = parsed.data;

    const customer = customerId ? await Customer.findById(customerId) : await Customer.findOne({ cedula });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    const now = new Date();
    const active = customer.paymentStatus === 'Activo' && customer.membershipEndDate && now <= new Date(customer.membershipEndDate);
    if (!active) {
      return NextResponse.json({ success: false, error: 'Membresía inactiva o vencida' }, { status: 403 });
    }

    const attendance = await Attendance.create({ customer: customer._id, createdBy: auth?.sub });
    return NextResponse.json({ success: true, data: { attendance, customer } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error registrando asistencia' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await requireAuth();
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);

    const filter = {};
    if (from || to) {
      filter.checkInTime = {};
      if (from) filter.checkInTime.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        if (to.length <= 10) end.setHours(23, 59, 59, 999);
        filter.checkInTime.$lte = end;
      }
    }

    if (q) {
      const regex = new RegExp(q, 'i');
      const matches = await Customer.find({ $or: [{ name: regex }, { cedula: regex }] }, { _id: 1 }).lean();
      const ids = matches.map((m) => m._id);
      filter.customer = ids.length ? { $in: ids } : { $in: [] };
    }

    const [attendances, total] = await Promise.all([
      Attendance.find(filter)
        .sort({ checkInTime: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('customer', 'name cedula')
        .lean(),
      Attendance.countDocuments(filter),
    ]);
    const hasMore = page * limit < total;
    return NextResponse.json({ success: true, data: attendances, page, total, hasMore });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error obteniendo asistencias' }, { status: 500 });
  }
}
