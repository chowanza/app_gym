import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MembershipPlan from '@/models/MembershipPlan';
import { requireAuth } from '@/lib/serverAuth';

export async function PUT(request, { params }) {
  try {
    await requireAuth({ role: 'admin' });
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    const plan = await MembershipPlan.findByIdAndUpdate(id, body, { new: true });
    if (!plan) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });

    return NextResponse.json({ success: true, data: plan });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error actualizando plan' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAuth({ role: 'admin' });
    await dbConnect();
    const { id } = params;
    
    // Soft delete preferred, but hard delete for now as requested in MVP
    const plan = await MembershipPlan.findByIdAndDelete(id);
    if (!plan) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error eliminando plan' }, { status: 500 });
  }
}
