"use client";

import { useEffect, useState } from 'react';
import { subscribe } from '@/lib/toastBus';

export default function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = subscribe((toast) => {
      setItems((prev) => [...prev, toast]);
      const ms = toast.duration ?? 3000;
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== toast.id));
      }, ms);
    });
    return unsub;
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[1000] flex w-80 flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} className={`pointer-events-auto rounded border p-3 shadow-md transition ${
          t.type === 'success' ? 'border-emerald-800 bg-emerald-950 text-emerald-200' :
          t.type === 'error' ? 'border-red-800 bg-red-950 text-red-200' :
          'border-zinc-800 bg-zinc-900 text-zinc-100'
        }`}>
          {t.title && <div className="text-sm font-semibold">{t.title}</div>}
          <div className="text-sm">{t.message}</div>
        </div>
      ))}
    </div>
  );
}
