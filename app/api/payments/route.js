import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import Customer from '@/models/Customer';
import { addMonths } from '@/lib/membership';
import { requireAuth } from '@/lib/serverAuth';
import { PaymentCreateSchema, parseSafe } from '@/lib/validation';

export async function POST(request) {
  try {
    const auth = await requireAuth();
    await dbConnect();
    const body = await request.json();
    const parsed = parseSafe(PaymentCreateSchema, body);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    const { customer: customerId, amount, paymentMethod, referenceNumber, membershipMonths = 1, paymentDate } = parsed.data;
    const amt = Number(amount);

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    const now = new Date();
    const base = customer.membershipEndDate && new Date(customer.membershipEndDate) > now
      ? new Date(customer.membershipEndDate)
      : now;
    const months = membershipMonths || 1;
    const newEnd = addMonths(base, months);

    const pay = await Payment.create({
      customer: customer._id,
      amount: amt,
      paymentMethod,
      referenceNumber,
      membershipMonths: months,
      paymentDate: paymentDate ? new Date(paymentDate) : undefined,
      membershipEndAfter: newEnd,
      createdBy: auth?.sub,
    });
    customer.membershipEndDate = newEnd;
    customer.paymentStatus = 'Activo';
    await customer.save();

  return NextResponse.json({ success: true, data: { payment: pay, customer } }, { status: 201 });
  } catch (err) {
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
