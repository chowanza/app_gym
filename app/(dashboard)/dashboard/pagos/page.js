import PagosClient from './ui/PagosClient';

export const metadata = { title: 'Pagos' };

export default function PagosPage() {
  return (
    <main className="py-6">
      <h1 className="mb-4 text-2xl font-semibold">Pagos</h1>
      <PagosClient />
    </main>
  );
}
