import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import User from '@/models/User'; // Necesario para poblar createdBy si no se ha cargado

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Si no hay fecha, usar hoy. Si hay, parsearla.
    // Nota: Es importante manejar las zonas horarias correctamente. 
    // Por simplicidad en este MVP, asumiremos que la fecha enviada 'YYYY-MM-DD' 
    // se consulta en el rango de ese día en UTC o local del servidor.
    // Para mayor precisión, el cliente debería enviar timestamps, pero 'YYYY-MM-DD' funciona para reportes simples.
    
    let startDate, endDate;

    if (dateParam) {
      const parts = dateParam.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      startDate = new Date(year, month, day, 0, 0, 0, 0);
      endDate = new Date(year, month, day, 23, 59, 59, 999);
    } else {
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
    const byMethod = {};
    const byUser = {};

    payments.forEach(payment => {
      const amount = payment.amount || 0;
      // Si no hay amountVES explícito, intentar calcularlo con la tasa histórica del pago
      const amountVES = payment.amountVES || (amount * (payment.exchangeRate || 0));
      
      totalAmount += amount;
      totalAmountVES += amountVES;

      // Agrupar por método
      const method = payment.paymentMethod || 'Desconocido';
      if (!byMethod[method]) {
        byMethod[method] = { count: 0, total: 0, totalVES: 0 };
      }
      byMethod[method].count += 1;
      byMethod[method].total += amount;
      byMethod[method].totalVES += amountVES;

      // Agrupar por usuario (cajero)
      const user = payment.createdBy ? payment.createdBy.username : 'Sistema/Desconocido';
      if (!byUser[user]) {
        byUser[user] = { count: 0, total: 0, totalVES: 0 };
      }
      byUser[user].count += 1;
      byUser[user].total += amount;
      byUser[user].totalVES += amountVES;
    });

    return NextResponse.json({
      success: true,
      data: {
        date: startDate,
        totalAmount,
        totalAmountVES,
        byMethod,
        byUser,
        transactions: payments
      }
    });

  } catch (error) {
    console.error('Error en reporte diario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar el reporte de cierre' },
      { status: 500 }
    );
  }
}
