import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Customer from '@/models/Customer';
import Payment from '@/models/Payment';
import { requireAuth } from '@/lib/serverAuth';
import { CustomerCreateSchema, parseSafe } from '@/lib/validation';
import { recomputeMembershipForCustomer } from '@/lib/recomputeMembership';

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
    if (status === 'Activo') {
      filter.paymentStatus = 'Activo';
      filter.membershipEndDate = { $gte: new Date() };
    } else if (status === 'Inactivo') {
      filter.$or = [
        { paymentStatus: 'Inactivo' },
        { membershipEndDate: { $lt: new Date() } },
        { membershipEndDate: { $exists: false } }
      ];
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
    const { initialPayment } = body; // Extract optional initial payment data

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

    // Handle initial payment if provided
    if (initialPayment && initialPayment.amount > 0) {
      try {
        await Payment.create({
          customer: customer._id,
          amount: Number(initialPayment.amount),
          paymentMethod: initialPayment.paymentMethod,
          referenceNumber: initialPayment.referenceNumber,
          durationValue: initialPayment.durationValue || 1,
          durationType: initialPayment.durationType || 'months',
          paymentDate: new Date(),
          currency: initialPayment.currency || 'USD',
          exchangeRate: initialPayment.exchangeRate || 1,
          amountVES: initialPayment.amountVES,
          planName: initialPayment.planName,
          createdBy: auth?.sub,
        });
        
        // Recompute membership status
        await recomputeMembershipForCustomer(customer._id);
        
        // Fetch updated customer
        const updatedCustomer = await Customer.findById(customer._id);
        return NextResponse.json({ success: true, data: updatedCustomer }, { status: 201 });
      } catch (paymentErr) {
        console.error('Error creating initial payment:', paymentErr);
        // Return customer created but with warning about payment
        return NextResponse.json({ 
          success: true, 
          data: customer, 
          warning: 'Cliente creado pero falló el registro del pago inicial' 
        }, { status: 201 });
      }
    }

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ success: false, error: 'La cédula ya existe' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error creando cliente' }, { status: 500 });
  }
}
