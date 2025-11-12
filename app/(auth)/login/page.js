"use client";

import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Error de autenticación');
      // Cookie httpOnly es seteada por el servidor; sólo redirigimos
      window.location.href = '/dashboard';
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <img src="/logo.jpg" alt="JEY Power Gym" className="h-20 w-20 rounded-full object-cover" />
        <div className="brand-gradient-text text-lg font-semibold tracking-wide">JEY POWER GYM</div>
      </div>
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded border border-zinc-800 p-6">
        <h1 className="mb-4 text-xl font-semibold brand-gradient-text">Iniciar sesión</h1>
        <div className="mb-3 grid gap-2">
          <label className="text-sm text-zinc-300" htmlFor="username">Usuario</label>
          <input id="username" autoFocus value={username} onChange={(e)=>setUsername(e.target.value)} className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" placeholder="usuario" />
        </div>
        <div className="mb-4 grid gap-2">
          <label className="text-sm text-zinc-300" htmlFor="password">Contraseña</label>
          <input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600" placeholder="********" />
        </div>
        {error && <div className="mb-3 rounded border border-red-900 bg-red-950 p-2 text-sm text-red-300">{error}</div>}
        <button type="submit" disabled={loading} className="btn-brand btn-animated w-full">
          {loading ? 'Ingresando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
