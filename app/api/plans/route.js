import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MembershipPlan from '@/models/MembershipPlan';
import { requireAuth } from '@/lib/serverAuth';

export async function GET(request) {
  try {
    await requireAuth(); // Any authenticated user can list plans
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    const filter = activeOnly ? { active: true } : {};
    const plans = await MembershipPlan.find(filter).sort({ price: 1, name: 1 }).lean();
    
    return NextResponse.json({ success: true, data: plans });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error cargando planes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth({ role: 'admin' }); // Only admin can create
    await dbConnect();
    const body = await request.json();
    
    // Basic validation
    if (!body.name || body.price === undefined || !body.durationMonths) {
      return NextResponse.json({ success: false, error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const plan = await MembershipPlan.create({
      ...body,
      createdBy: auth.sub
    });

    return NextResponse.json({ success: true, data: plan }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error creando plan' }, { status: 500 });
  }
}
