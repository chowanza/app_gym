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
        <img src="/logo.jpg" alt="JEY Power Gym" className="h-24 w-24 rounded-full object-cover shadow-lg" />
        <div className="brand-gradient-text text-xl font-bold tracking-wide">JEY POWER GYM</div>
      </div>
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-purple-900/20 bg-[#1a0b2e] p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-white brand-gradient-text">Iniciar sesión</h1>
        <div className="mb-4 grid gap-2">
          <label className="text-sm font-medium text-purple-100" htmlFor="username">Usuario</label>
          <input id="username" autoFocus value={username} onChange={(e)=>setUsername(e.target.value)} 
            className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
            placeholder="usuario" />
        </div>
        <div className="mb-6 grid gap-2">
          <label className="text-sm font-medium text-purple-100" htmlFor="password">Contraseña</label>
          <input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} 
            className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-zinc-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" 
            placeholder="********" />
        </div>
        {error && <div className="mb-4 rounded border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
        <button type="submit" disabled={loading} className="btn-brand btn-animated w-full py-2.5 text-base font-semibold shadow-lg shadow-purple-500/20">
          {loading ? 'Ingresando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
