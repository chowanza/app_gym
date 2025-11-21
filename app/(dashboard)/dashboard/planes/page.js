import PlanesClient from './PlanesClient';

export const metadata = { title: 'Planes de Membresía' };

export default function PlanesPage() {
  return (
    <main className="py-6">
      <h1 className="mb-4 text-2xl font-semibold">Planes de Membresía</h1>
      <PlanesClient />
    </main>
  );
}
