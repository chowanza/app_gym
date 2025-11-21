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
        <div key={t.id} className={`pointer-events-auto rounded-lg border p-4 shadow-lg backdrop-blur-sm transition ${
          t.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
          t.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
          'border-purple-200 bg-white text-zinc-800'
        }`}>
          {t.title && <div className="text-sm font-semibold">{t.title}</div>}
          <div className="text-sm">{t.message}</div>
        </div>
      ))}
    </div>
  );
}
