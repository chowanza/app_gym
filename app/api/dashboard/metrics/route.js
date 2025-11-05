import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { getDashboardMetrics } from '@/lib/metrics';

export async function GET() {
  try {
    requireAuth();
    const data = await getDashboardMetrics();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const msg = (err && err.message) || '';
    const status = msg === 'UNAUTHENTICATED' ? 401 : (msg === 'FORBIDDEN' ? 403 : 500);
    const error = status === 500 ? 'Error obteniendo métricas' : 'No autorizado';
    return NextResponse.json({ success: false, error }, { status });
  }
}
