import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h2 className="text-4xl font-bold mb-4 text-zinc-800">404 - Página no encontrada</h2>
      <p className="text-zinc-600 mb-8 text-center max-w-md">
        Lo sentimos, la página que buscas no existe o ha sido movida.
      </p>
      <Link 
        href="/dashboard" 
        className="rounded bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
      >
        Volver al Dashboard
      </Link>
    </div>
  );
}
