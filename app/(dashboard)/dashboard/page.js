export const metadata = { title: 'Dashboard' };
import { requireAuth } from '@/lib/serverAuth';
import { getDashboardMetrics } from '@/lib/metrics';

export default async function DashboardPage() {
  // Enforce auth on server and compute metrics directly (sin fetch HTTP)
  await requireAuth();
  const metrics = await getDashboardMetrics();
  return (
    <main className="py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div>
          <a href="/dashboard/clientes" className="mr-2 rounded bg-zinc-800 px-3 py-2 hover:bg-zinc-700">Clientes</a>
          <a href="/dashboard/pagos" className="mr-2 rounded bg-zinc-800 px-3 py-2 hover:bg-zinc-700">Pagos</a>
          <a href="/dashboard/asistencias" className="mr-2 rounded bg-zinc-800 px-3 py-2 hover:bg-zinc-700">Asistencias</a>
          <a href="/api/auth/logout" className="rounded bg-zinc-800 px-3 py-2 hover:bg-zinc-700">Salir</a>
        </div>
      </div>
      <p className="mt-2 text-zinc-400">Métricas y accesos rápidos a módulos clave.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Pagos recibidos (total)</div>
          <div className="text-2xl font-semibold">{'$'}{metrics.totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Inscritos en el mes</div>
          <div className="text-2xl font-semibold">{metrics.customersThisMonth}</div>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Clientes totales</div>
          <div className="text-2xl font-semibold">{metrics.totalCustomers}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Clientes activos</div>
          <div className="text-2xl font-semibold">{metrics.activeCustomers ?? '-'}</div>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Asistencias de hoy</div>
          <div className="text-2xl font-semibold">{metrics.attendancesToday ?? '-'}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <a href="/dashboard/clientes" className="rounded border border-zinc-800 p-4 hover:bg-zinc-900">Clientes</a>
        <a href="/dashboard/pagos" className="rounded border border-zinc-800 p-4 hover:bg-zinc-900">Pagos</a>
        <a href="/dashboard/asistencias" className="rounded border border-zinc-800 p-4 hover:bg-zinc-900">Asistencias</a>
      </div>
    </main>
  );
}
