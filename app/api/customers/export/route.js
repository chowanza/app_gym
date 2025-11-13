import dbConnect from '@/lib/dbConnect';
import Customer from '@/models/Customer';
import { toCSV } from '@/lib/csv';
import { requireAuth } from '@/lib/serverAuth';

export async function GET(request) {
  try {
    requireAuth();
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const format = (searchParams.get('format') || 'csv').toLowerCase();

    if (format !== 'csv') {
      return new Response(JSON.stringify({ success: false, error: 'Formato no soportado' }), { status: 400 });
    }

    const filter = q
      ? { $or: [ { name: { $regex: q, $options: 'i' } }, { cedula: { $regex: q, $options: 'i' } } ] }
      : {};

    const rows = await Customer.find(filter).sort({ createdAt: -1 }).lean();

    const headers = [
      { key: 'name', label: 'Nombre' },
      { key: 'cedula', label: 'Cedula' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telefono' },
      { key: 'membershipType', label: 'Membresia' },
      { label: 'Vence', accessor: (r) => r.membershipEndDate ? new Date(r.membershipEndDate).toISOString() : '' },
      { label: 'Estado', accessor: (r) => r.paymentStatus || '' },
      { label: 'Creado', accessor: (r) => r.createdAt ? new Date(r.createdAt).toISOString() : '' },
    ];

    const csv = toCSV(rows, headers);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="customers.csv"',
      },
    });
  } catch (err) {
    const msg = (err && err.message) || '';
    const status = msg === 'UNAUTHENTICATED' ? 401 : (msg === 'FORBIDDEN' ? 403 : 500);
    return new Response(JSON.stringify({ success: false, error: 'Error exportando clientes' }), { status });
  }
}
