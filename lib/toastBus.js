// Simple event-based toast bus for client components
"use client";

let listeners = [];

export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function toast(message, opts = {}) {
  const id = Math.random().toString(36).slice(2);
  const payload = { id, message, title: opts.title, type: opts.type || 'info', duration: opts.duration ?? 3000 };
  for (const l of listeners) l(payload);
}

toast.success = (message, opts={}) => toast(message, { ...opts, type: 'success' });
toast.error = (message, opts={}) => toast(message, { ...opts, type: 'error' });
toast.info = (message, opts={}) => toast(message, { ...opts, type: 'info' });
