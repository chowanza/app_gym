import AsistenciasClient from './ui/AsistenciasClient';

export const metadata = { title: 'Asistencias' };

export default function AsistenciasPage() {
  return (
    <main className="py-6">
      <h1 className="mb-4 text-2xl font-semibold">Registro de asistencias</h1>
      <AsistenciasClient />
    </main>
  );
}
