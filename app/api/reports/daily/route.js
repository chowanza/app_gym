import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import User from '@/models/User'; // Necesario para poblar createdBy si no se ha cargado

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    let startDate, endDate;

    if (fromParam && toParam) {
      // Rango personalizado (UTC o local, asumimos input YYYY-MM-DD)
      const fromParts = fromParam.split('-');
      const toParts = toParam.split('-');
      
      startDate = new Date(parseInt(fromParts[0]), parseInt(fromParts[1]) - 1, parseInt(fromParts[2]), 0, 0, 0, 0);
      endDate = new Date(parseInt(toParts[0]), parseInt(toParts[1]) - 1, parseInt(toParts[2]), 23, 59, 59, 999);
    } else if (dateParam) {
      // Un solo día
      const parts = dateParam.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      startDate = new Date(year, month, day, 0, 0, 0, 0);
      endDate = new Date(year, month, day, 23, 59, 59, 999);
    } else {
      // Default: Hoy
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    // Buscar pagos en el rango
    const payments = await Payment.find({
      paymentDate: { $gte: startDate, $lte: endDate }
    })
    .populate('customer', 'name cedula')
    .populate('createdBy', 'username')
    .sort({ paymentDate: -1 });

    // Calcular métricas
    let totalAmount = 0;
    let totalAmountVES = 0;
    
    const byMethod = {
      'Efectivo': { count: 0, total: 0, totalVES: 0 },
      'Pago Movil': { count: 0, total: 0, totalVES: 0 },
      'Otro': { count: 0, total: 0, totalVES: 0 }
    };
    const byUser = {};
    const dailyStats = {}; // Mapa para desglose diario: 'YYYY-MM-DD' -> stats

    const allRates = [];

    payments.forEach(payment => {
      const amount = payment.amount || 0;
      const rate = payment.exchangeRate || 0;
      if (rate > 0) allRates.push(rate);

      const amountVES = payment.amountVES || (amount * rate);
      
      totalAmount += amount;
      totalAmountVES += amountVES;

      // Agrupar por método
      const method = payment.paymentMethod || 'Otro';
      if (!byMethod[method]) {
        byMethod[method] = { count: 0, total: 0, totalVES: 0 };
      }
      byMethod[method].count += 1;
      byMethod[method].total += amount;
      byMethod[method].totalVES += amountVES;

      // Agrupar por usuario
      const user = payment.createdBy ? payment.createdBy.username : 'Sistema/Desconocido';
      if (!byUser[user]) {
        byUser[user] = { count: 0, total: 0, totalVES: 0 };
      }
      byUser[user].count += 1;
      byUser[user].total += amount;
      byUser[user].totalVES += amountVES;

      // Agrupar por día
      const pDate = new Date(payment.paymentDate);
      const dayKey = pDate.toISOString().split('T')[0]; 

      if (!dailyStats[dayKey]) {
        dailyStats[dayKey] = { date: dayKey, totalUSD: 0, totalVES: 0, rates: [], count: 0 };
      }
      dailyStats[dayKey].totalUSD += amount;
      dailyStats[dayKey].totalVES += amountVES;
      dailyStats[dayKey].count += 1;
      if (rate > 0) dailyStats[dayKey].rates.push(rate);
    });

    // Procesar dailyBreakdown
    const dailyBreakdown = Object.values(dailyStats).map(day => ({
      date: day.date,
      totalUSD: day.totalUSD,
      totalVES: day.totalVES,
      count: day.count,
      exchangeRate: day.rates.length > 0 ? day.rates.reduce((a,b)=>a+b,0)/day.rates.length : 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Tasa promedio global del periodo
    const exchangeRate = allRates.length > 0 
      ? allRates.reduce((a, b) => a + b, 0) / allRates.length 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        startDate,
        endDate,
        totalAmount,
        totalAmountVES,
        exchangeRate,
        byMethod,
        byUser,
        transactions: payments,
        dailyBreakdown
      }
    });

  } catch (error) {
    console.error('Error en reporte:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar el reporte' },
      { status: 500 }
    );
  }
}
