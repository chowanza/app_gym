import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import { requireAuth } from '@/lib/serverAuth';
import { recomputeMembershipForCustomer } from '@/lib/recomputeMembership';

export async function GET(_request, { params }) {
  try {
    await requireAuth({ role: undefined });
    await dbConnect();
    const { id } = params;
    const payment = await Payment.findById(id).lean();
    if (!payment) return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, data: payment });
  } catch (err) {
    const msg = (err && err.message) || '';
    const status = msg === 'UNAUTHENTICATED' ? 401 : (msg === 'FORBIDDEN' ? 403 : 500);
    return NextResponse.json({ success: false, error: status === 500 ? 'Error obteniendo pago' : 'No autorizado' }, { status });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const auth = await requireAuth({ role: undefined });
    await dbConnect();
    const { id } = params;
    const payment = await Payment.findById(id);
    if (!payment) return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    const customerId = payment.customer;
    await payment.deleteOne();
    const result = await recomputeMembershipForCustomer(customerId);
    return NextResponse.json({ success: true, data: { customer: { _id: customerId, ...result } } });
  } catch (err) {
    const msg = (err && err.message) || '';
    const status = msg === 'UNAUTHENTICATED' ? 401 : (msg === 'FORBIDDEN' ? 403 : 500);
    return NextResponse.json({ success: false, error: status === 500 ? 'Error eliminando pago' : 'No autorizado' }, { status });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAuth({ role: undefined });
    await dbConnect();
    const { id } = params;
    const body = await request.json();
    const allowed = ['amount', 'paymentMethod', 'referenceNumber', 'membershipMonths', 'paymentDate'];
    const updates = {};
    for (const k of allowed) {
      if (k in body) updates[k] = k === 'paymentDate' ? new Date(body[k]) : body[k];
    }
    const current = await Payment.findById(id);
    if (!current) return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });

    if ('amount' in updates) {
      const amt = Number(updates.amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        return NextResponse.json({ success: false, error: 'Monto inválido' }, { status: 400 });
      }
      updates.amount = amt;
    }
    if ('membershipMonths' in updates) {
      const months = Number(updates.membershipMonths);
      if (!Number.isInteger(months) || months <= 0) {
        return NextResponse.json({ success: false, error: 'Meses inválido' }, { status: 400 });
      }
      updates.membershipMonths = months;
    }

    const finalMethod = ('paymentMethod' in updates) ? updates.paymentMethod : current.paymentMethod;
    const finalRef = ('referenceNumber' in updates) ? (updates.referenceNumber || '') : (current.referenceNumber || '');
    if (finalMethod === 'Pago Movil' && String(finalRef).trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Referencia requerida para Pago Movil' }, { status: 400 });
    }

    const payment = await Payment.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!payment) return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    const result = await recomputeMembershipForCustomer(payment.customer);
    return NextResponse.json({ success: true, data: { payment, customer: { _id: payment.customer, ...result } } });
  } catch (err) {
    const msg = (err && err.message) || '';
    if (err && err.code === 11000) {
      return NextResponse.json({ success: false, error: 'Referencia de Pago Móvil ya registrada' }, { status: 409 });
    }
    const status = msg === 'UNAUTHENTICATED' ? 401 : (msg === 'FORBIDDEN' ? 403 : 500);
    return NextResponse.json({ success: false, error: status === 500 ? 'Error actualizando pago' : 'No autorizado' }, { status });
  }
}
