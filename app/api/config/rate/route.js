import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Config from '@/models/Config';
import { requireAuth } from '@/lib/serverAuth';

export async function GET() {
  try {
    await requireAuth();
    await dbConnect();
    const config = await Config.findOne({ key: 'exchange_rate' });
    return NextResponse.json({ success: true, rate: config?.value || 1 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error obteniendo tasa' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth();
    await dbConnect();
    const { rate } = await request.json();
    
    if (!rate || isNaN(rate) || rate <= 0) {
      return NextResponse.json({ success: false, error: 'Tasa inválida' }, { status: 400 });
    }

    const config = await Config.findOneAndUpdate(
      { key: 'exchange_rate' },
      { value: Number(rate), updatedBy: auth.sub },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, rate: config.value });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Error actualizando tasa' }, { status: 500 });
  }
}
