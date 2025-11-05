import CustomersClient from './CustomersClient';

export const metadata = { title: 'Clientes' };

export default function ClientesPage() {
  return (
    <main className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
      </div>
      <CustomersClient />
    </main>
  );
}
