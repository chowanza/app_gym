import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import Customer from '@/models/Customer';
import { requireAuth } from '@/lib/serverAuth';
import { PaymentCreateSchema, parseSafe } from '@/lib/validation';
import { recomputeMembershipForCustomer } from '@/lib/recomputeMembership';

export async function POST(request) {
  try {
    const auth = await requireAuth();
    await dbConnect();
    const body = await request.json();
    const parsed = parseSafe(PaymentCreateSchema, body);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    const { customer: customerId, amount, paymentMethod, referenceNumber, membershipMonths, durationValue, durationType, paymentDate, currency, exchangeRate, amountVES } = body; // Usar body directo para campos nuevos no en schema estricto aun
    const amt = Number(amount);

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    const pay = await Payment.create({
      customer: customer._id,
      amount: amt,
      paymentMethod,
      referenceNumber,
      membershipMonths: membershipMonths || durationValue || 1, // Fallback
      durationValue: durationValue || membershipMonths || 1,
      durationType: durationType || 'months',
      paymentDate: paymentDate ? new Date(paymentDate) : undefined,
      currency: currency || 'USD',
      exchangeRate: exchangeRate || 1,
      amountVES: amountVES || undefined,
      createdBy: auth?.sub,
    });
    // Recompute entire chain to handle out-of-order paymentDate properly
    const result = await recomputeMembershipForCustomer(customer._id);
    const updatedPay = await Payment.findById(pay._id).lean();
    return NextResponse.json({ success: true, data: { payment: updatedPay, customer: { _id: customer._id, ...result } } }, { status: 201 });
  } catch (err) {
    const msg = (err && err.message) || '';
    if (msg === 'UNAUTHENTICATED') return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    if (err && err.code === 11000) {
      return NextResponse.json({ success: false, error: 'Referencia de Pago Móvil ya registrada' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error registrando pago' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await requireAuth();
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const customer = searchParams.get('customer');
    const q = (searchParams.get('q') || '').trim();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const populate = searchParams.get('populate');

    const filter = {};
    if (customer) filter.customer = customer;

    if (q) {
      const regex = new RegExp(q, 'i');
      const matches = await Customer.find({ $or: [{ name: regex }, { cedula: regex }] }, { _id: 1 }).lean();
      const ids = matches.map((m) => m._id);
      // If no customer matched, force empty result by setting impossible filter
      if (ids.length === 0) {
        filter.customer = { $in: [] };
      } else {
        filter.customer = { $in: ids };
      }
    }

    if (from || to) {
      filter.paymentDate = {};
      if (from) filter.paymentDate.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        // include whole day if date-only provided
        if (to.length <= 10) end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    }

    const [payments, total] = await Promise.all([
      (populate
        ? Payment.find(filter)
            .sort({ paymentDate: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('customer', 'name cedula')
            .lean()
        : Payment.find(filter)
            .sort({ paymentDate: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()),
      Payment.countDocuments(filter),
    ]);
    const hasMore = page * limit < total;
    return NextResponse.json({ success: true, data: payments, page, total, hasMore });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error obteniendo pagos' }, { status: 500 });
  }
}
