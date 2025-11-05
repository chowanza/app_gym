import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import Customer from '@/models/Customer';
import { requireAuth } from '@/lib/serverAuth';
import { toCSV } from '@/lib/csv';

export async function GET(request) {
  try {
    requireAuth();
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const from = searchParams.get('from');
    const to = searchParams.get('to');

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

    const attendances = await Attendance.find(filter)
      .sort({ checkInTime: -1, createdAt: -1 })
      .populate('customer', 'name cedula')
      .lean();

    const headers = [
      { key: 'fecha', label: 'Fecha', accessor: (r) => new Date(r.checkInTime || r.createdAt).toISOString() },
      { key: 'nombre', label: 'Nombre', accessor: (r) => r.customer?.name || '' },
      { key: 'cedula', label: 'Cédula', accessor: (r) => r.customer?.cedula || '' },
    ];
    const csv = toCSV(attendances, headers);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance_export.csv"`,
      },
    });
  } catch (err) {
    const msg = (err && err.message) || '';
    const status = msg === 'UNAUTHENTICATED' ? 401 : (msg === 'FORBIDDEN' ? 403 : 500);
    return NextResponse.json({ success: false, error: 'Error exportando asistencias' }, { status });
  }
}
