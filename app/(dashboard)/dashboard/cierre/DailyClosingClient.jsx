'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function DailyClosingClient() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentMonthStr = today.toISOString().slice(0, 7); // YYYY-MM
  
  // Helper para obtener la semana ISO (YYYY-Www)
  const getWeekStr = (d) => {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      const week = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
  };

  const [reportType, setReportType] = useState('daily'); // daily, weekly, monthly
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedWeek, setSelectedWeek] = useState(getWeekStr(today));
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getRange = () => {
    if (reportType === 'daily') {
        return { from: selectedDate, to: selectedDate };
    }
    if (reportType === 'weekly') {
        if (!selectedWeek) return { from: todayStr, to: todayStr };
        const [year, week] = selectedWeek.split('-W');
        const simple = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        
        const from = ISOweekStart.toISOString().split('T')[0];
        const toDate = new Date(ISOweekStart);
        toDate.setDate(toDate.getDate() + 6);
        const to = toDate.toISOString().split('T')[0];
        return { from, to };
    }
    if (reportType === 'monthly') {
        if (!selectedMonth) return { from: todayStr, to: todayStr };
        const [year, month] = selectedMonth.split('-');
        const from = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const to = `${year}-${month}-${lastDay}`;
        return { from, to };
    }
    return { from: selectedDate, to: selectedDate };
  };

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const { from, to } = getRange();
      const res = await fetch(`/api/reports/daily?from=${from}&to=${to}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      } else {
        setError(data.error || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDate, selectedWeek, selectedMonth]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const downloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    const { from, to } = getRange();
    const title = reportType === 'daily' ? 'Cierre Diario' : reportType === 'weekly' ? 'Reporte Semanal' : 'Reporte Mensual';
    const dateRange = reportType === 'daily' ? from : `${from} al ${to}`;

    const generateContent = (doc, startY) => {
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text('JEY POWER GYM', 14, startY);
        
        doc.setFontSize(14);
        doc.text(title, 14, startY + 8);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Fecha/Periodo: ${dateRange}`, 14, startY + 16);
        doc.text(`Tasa Promedio del Periodo: ${report.exchangeRate ? report.exchangeRate.toFixed(2) + ' Bs/USD' : 'N/A'}`, 14, startY + 22);
        
        // Resumen
        doc.autoTable({
            startY: startY + 30,
            head: [['Concepto', 'Transacciones', 'Monto USD', 'Monto VES']],
            body: [
                ['Total Recaudado', 
                 report.transactions.length, 
                 formatCurrency(report.totalAmount), 
                 `Bs ${report.totalAmountVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                ],
                ['Efectivo', 
                 report.byMethod['Efectivo']?.count || 0, 
                 formatCurrency(report.byMethod['Efectivo']?.total || 0), 
                 `Bs ${(report.byMethod['Efectivo']?.totalVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                ],
                ['Pago Móvil', 
                 report.byMethod['Pago Movil']?.count || 0, 
                 formatCurrency(report.byMethod['Pago Movil']?.total || 0), 
                 `Bs ${(report.byMethod['Pago Movil']?.totalVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                ],
                ['Otro', 
                 report.byMethod['Otro']?.count || 0, 
                 formatCurrency(report.byMethod['Otro']?.total || 0), 
                 `Bs ${(report.byMethod['Otro']?.totalVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                ],
            ],
            theme: 'grid',
            headStyles: { fillColor: [126, 34, 206] }, // Purple brand color
        });

        let finalY = doc.lastAutoTable.finalY;

        // Desglose Diario (si no es diario)
        if (reportType !== 'daily' && report.dailyBreakdown && report.dailyBreakdown.length > 0) {
            doc.text('Desglose Diario', 14, finalY + 10);
            const dailyRows = report.dailyBreakdown.map(d => [
                d.date,
                d.count,
                d.exchangeRate ? d.exchangeRate.toFixed(2) : '-',
                formatCurrency(d.totalUSD),
                `Bs ${d.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
            ]);

            doc.autoTable({
                startY: finalY + 15,
                head: [['Fecha', 'Transacciones', 'Tasa Promedio', 'Total USD', 'Total VES']],
                body: dailyRows,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] }, // Blue
            });
            finalY = doc.lastAutoTable.finalY;
        }
        
        // Detalle
        doc.text('Detalle de Transacciones', 14, finalY + 10);
        
        const tableRows = report.transactions.map(tx => [
            new Date(tx.paymentDate).toLocaleDateString() + ' ' + new Date(tx.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            tx.customer?.name || 'Cliente Eliminado',
            tx.paymentMethod,
            tx.referenceNumber || '-',
            tx.createdBy?.username || 'Sistema',
            formatCurrency(tx.amount),
            `Bs ${(tx.amountVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
        ]);
        
        doc.autoTable({
            startY: finalY + 15,
            head: [['Fecha/Hora', 'Cliente', 'Método', 'Ref', 'Cajero', 'USD', 'VES']],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [75, 85, 99] },
        });
        
        doc.save(`reporte_${reportType}_${dateRange}.pdf`);
    };

    // Intentar cargar logo
    const img = new Image();
    img.src = '/logo.jpg';
    img.onload = () => {
        doc.addImage(img, 'JPEG', 150, 10, 40, 40); // Logo a la derecha
        generateContent(doc, 20);
    };
    img.onerror = () => {
        generateContent(doc, 20);
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Reportes y Cierre de Caja</h1>
        
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg shadow-sm border">
            {/* Selector de Tipo */}
            <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
                className="border-r pr-2 mr-2 outline-none font-medium text-gray-700 bg-transparent"
            >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
            </select>

            {/* Selectores de Fecha según Tipo */}
            {reportType === 'daily' && (
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-purple-500"
                />
            )}
            {reportType === 'weekly' && (
                <input
                    type="week"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-purple-500"
                />
            )}
            {reportType === 'monthly' && (
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-purple-500"
                />
            )}

            <button 
                onClick={downloadPDF} 
                disabled={!report || loading}
                className="ml-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                PDF
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Generando reporte...</p>
        </div>
      )}

      {!loading && report && (
        <>
          {/* Tasa del día / periodo */}
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 flex items-center justify-between">
            <span className="text-purple-800 font-medium">
                {reportType === 'daily' ? 'Tasa de Cambio Promedio (Día):' : 'Tasa Promedio del Periodo:'}
            </span>
            <span className="text-2xl font-bold text-purple-900">
              {report.exchangeRate ? `${report.exchangeRate.toFixed(2)} Bs/USD` : 'N/A'}
            </span>
          </div>

          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Total Recaudado</h3>
              <div className="mt-2">
                <p className="text-3xl font-bold text-gray-800">{formatCurrency(report.totalAmount)}</p>
                {report.totalAmountVES > 0 && (
                  <p className="text-sm text-zinc-500 font-medium">Bs {report.totalAmountVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                )}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Efectivo</h3>
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(report.byMethod['Efectivo']?.total || 0)}
                </p>
                {(report.byMethod['Efectivo']?.totalVES || 0) > 0 && (
                  <p className="text-xs text-zinc-500 font-medium">Bs {(report.byMethod['Efectivo']?.totalVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {report.byMethod['Efectivo']?.count || 0} transacciones
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Pago Móvil</h3>
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(report.byMethod['Pago Movil']?.total || 0)}
                </p>
                {(report.byMethod['Pago Movil']?.totalVES || 0) > 0 && (
                  <p className="text-xs text-zinc-500 font-medium">Bs {(report.byMethod['Pago Movil']?.totalVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {report.byMethod['Pago Movil']?.count || 0} transacciones
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Otro</h3>
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(report.byMethod['Otro']?.total || 0)}
                </p>
                {(report.byMethod['Otro']?.totalVES || 0) > 0 && (
                  <p className="text-xs text-zinc-500 font-medium">Bs {(report.byMethod['Otro']?.totalVES || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {report.byMethod['Otro']?.count || 0} transacciones
              </p>
            </div>
          </div>

          {/* Desglose Diario (Solo si no es diario) */}
          {reportType !== 'daily' && report.dailyBreakdown && report.dailyBreakdown.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="font-semibold text-gray-700">Desglose Diario</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transacciones</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa Promedio</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total USD</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total VES</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {report.dailyBreakdown.map((day) => (
                                <tr key={day.date}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{day.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{day.count}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                        {day.exchangeRate ? day.exchangeRate.toFixed(2) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">{formatCurrency(day.totalUSD)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">Bs {day.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Desglose por Método */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-700">Por Método de Pago</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transacciones</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(report.byMethod).map(([method, data]) => (
                    <tr key={method}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{method}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{data.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">{formatCurrency(data.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Desglose por Usuario (Cajero) */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-700">Por Cajero (Usuario)</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transacciones</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Recaudado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(report.byUser).map(([user, data]) => (
                    <tr key={user}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{data.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">{formatCurrency(data.total)}</td>
                    </tr>
                  ))}
                  {Object.keys(report.byUser).length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No hay movimientos</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Listado de Transacciones */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-700">Detalle de Transacciones</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cajero</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.paymentDate).toLocaleDateString()} {new Date(tx.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {tx.customer?.name || 'Cliente Eliminado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tx.paymentMethod === 'Efectivo' ? 'bg-green-100 text-green-800' : 
                          tx.paymentMethod === 'Pago Movil' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.referenceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.createdBy?.username || 'Sistema'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                  {report.transactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                        No se encontraron pagos para este periodo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
