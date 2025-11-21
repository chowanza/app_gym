'use client';

import { useState, useEffect } from 'react';

export default function DailyClosingClient() {
  // Fecha por defecto: hoy (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async (selectedDate) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/reports/daily?date=${selectedDate}`);
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
    fetchReport(date);
  }, [date]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Cierre de Caja Diario</h1>
        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-700">Fecha:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
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
          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Total Recaudado</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(report.totalAmount)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Efectivo</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {formatCurrency(report.byMethod['Efectivo']?.total || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {report.byMethod['Efectivo']?.count || 0} transacciones
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Digital (Pago Móvil/Otro)</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {formatCurrency(
                  (report.byMethod['Pago Movil']?.total || 0) + 
                  (report.byMethod['Otro']?.total || 0)
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(report.byMethod['Pago Movil']?.count || 0) + (report.byMethod['Otro']?.count || 0)} transacciones
              </p>
            </div>
          </div>

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
                  {Object.keys(report.byMethod).length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No hay movimientos</td>
                    </tr>
                  )}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
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
                        {new Date(tx.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {tx.customer?.name || 'Cliente Eliminado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tx.paymentMethod === 'Efectivo' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
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
                        No se encontraron pagos para esta fecha.
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
