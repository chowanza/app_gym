export default function HomePage() {
  return (
    <main className="py-10">
      <h1 className="text-3xl font-bold">JEY POWER GYM F.P.</h1>
      <p className="mt-2 text-zinc-300">Sistema Digital de Entradas y Seguimiento de Clientes</p>
      <div className="mt-6 grid gap-4">
        <a href="/dashboard" className="inline-block rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 transition">Ir al Dashboard</a>
        <a href="/login" className="inline-block rounded bg-zinc-800 px-4 py-2 font-medium hover:bg-zinc-700 transition">Iniciar sesión</a>
      </div>
    </main>
  );
}
