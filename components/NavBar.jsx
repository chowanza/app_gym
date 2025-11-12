"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import LogoutButton from './LogoutButton';
import BrandLogo from './BrandLogo';

function NavLink({ href, children }) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link href={href} className={`rounded px-3 py-2 text-sm font-medium hover:bg-zinc-800/60 ${active ? 'bg-zinc-800' : ''}`}>
      {children}
    </Link>
  );
}

export default function NavBar() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const json = await res.json();
        if (mounted && res.ok && json.success) setUser(json.data);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <BrandLogo size={36} />
          <span className="brand-gradient-text text-sm font-semibold tracking-wide">JEY POWER GYM</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/dashboard/clientes">Clientes</NavLink>
          <NavLink href="/dashboard/pagos">Pagos</NavLink>
          <NavLink href="/dashboard/asistencias">Asistencias</NavLink>
          {user?.role === 'admin' && <NavLink href="/dashboard/usuarios">Usuarios</NavLink>}
          <NavLink href="/dashboard/perfil">Perfil</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden text-sm text-zinc-400 sm:inline">{user.username} · {user.role}</span>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
