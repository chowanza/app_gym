import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
  const result = { success: true, db: 'unknown', jwt: 'unknown' };
  try {
    const hasJWT = !!process.env.JWT_SECRET;
    result.jwt = hasJWT ? 'ok' : 'missing';
    try {
      await dbConnect();
      result.db = 'ok';
    } catch (e) {
      result.db = 'error';
      result.dbError = process.env.NODE_ENV !== 'production' ? String(e.message || e) : undefined;
      result.success = false;
    }
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Health check error' }, { status: 500 });
  }
}
