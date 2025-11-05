"use client";

export default function LogoutButton({ className = '' }) {
  const onClick = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/login';
  };
  return (
    <button onClick={onClick} className={`rounded bg-zinc-800 px-3 py-2 hover:bg-zinc-700 ${className}`}>Salir</button>
  );
}