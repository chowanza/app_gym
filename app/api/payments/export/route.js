import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import { toCSV } from '@/lib/csv';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'csv').toLowerCase();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const customer = searchParams.get('customer');

    if (format !== 'csv') {
      return new Response(JSON.stringify({ success: false, error: 'Formato no soportado' }), { status: 400 });
    }

    const filter = {};
    if (from || to) {
      filter.paymentDate = {};
      if (from) filter.paymentDate.$gte = new Date(from);
      if (to) filter.paymentDate.$lte = new Date(to);
    }
    if (customer) filter.customer = customer;

    const rows = await Payment.find(filter)
      .populate('customer', 'name cedula')
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    const headers = [
      { label: 'Fecha', accessor: (r) => new Date(r.paymentDate || r.createdAt).toISOString() },
      { label: 'Nombre', accessor: (r) => r.customer?.name || '' },
      { label: 'Cedula', accessor: (r) => r.customer?.cedula || '' },
      { label: 'Monto', accessor: (r) => r.amount },
      { label: 'Metodo', accessor: (r) => r.paymentMethod },
      { label: 'Meses', accessor: (r) => r.membershipMonths || 1 },
      { label: 'Referencia', accessor: (r) => r.referenceNumber || '' },
    ];

    const csv = toCSV(rows, headers);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="payments.csv"',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Error exportando pagos' }), { status: 500 });
  }
}
