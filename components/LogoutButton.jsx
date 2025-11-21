"use client";

export default function LogoutButton({ className = '' }) {
  const onClick = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/login';
  };
  return (
    <button onClick={onClick} className={`rounded border border-purple-500/30 bg-purple-900/50 px-3 py-2 text-sm font-medium text-purple-100 hover:bg-purple-800/50 hover:text-white ${className}`}>Salir</button>
  );
}