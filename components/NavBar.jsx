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
    <Link href={href} className={`rounded px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white ${active ? 'bg-white/20 text-white' : 'text-purple-100/80'}`}>
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
    <header className="sticky top-2 z-40 mx-auto w-[98%] max-w-7xl rounded-2xl border border-purple-900/20 bg-[#1a0b2e] text-white shadow-lg backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <BrandLogo size={36} />
          <span className="brand-gradient-text text-sm font-semibold tracking-wide">JEY POWER GYM</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/dashboard/clientes">Clientes</NavLink>
          <NavLink href="/dashboard/pagos">Pagos</NavLink>
          <NavLink href="/dashboard/asistencias">Asistencias</NavLink>
          <NavLink href="/dashboard/planes">Planes</NavLink>
          <NavLink href="/dashboard/cierre">Cierre</NavLink>
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
