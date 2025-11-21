'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Error global:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h2 className="text-3xl font-bold mb-4 text-red-600">¡Algo salió mal!</h2>
      <p className="text-zinc-600 mb-8 text-center max-w-md">
        Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado (simulado).
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 transition-colors"
        >
          Intentar de nuevo
        </button>
        <a 
          href="/dashboard" 
          className="rounded border border-purple-200 bg-white px-6 py-3 font-medium text-zinc-800 hover:bg-purple-50 transition-colors"
        >
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
