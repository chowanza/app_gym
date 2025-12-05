"use client";

import { useRouter } from 'next/navigation';

export default function BackButton({ className = "" }) {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()} 
      className={`inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors ${className}`}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
      Volver
    </button>
  );
}
