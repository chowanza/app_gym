"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toastBus';
import PaymentEditModal from '@/app/(dashboard)/dashboard/pagos/ui/PaymentEditModal.jsx';

export default function PaymentActions({ payment, onChanged }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  const onDelete = async () => {
    if (!confirm('¿Eliminar este pago? Se recalculará la membresía del cliente.')) return;
    try {
      const res = await fetch(`/api/payments/${payment._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'No se pudo eliminar');
      const vence = json?.data?.customer?.membershipEndDate ? new Date(json.data.customer.membershipEndDate).toLocaleDateString() : null;
      toast.success(vence ? `Pago eliminado · Nuevo vence: ${vence}` : 'Pago eliminado');
      try { router.refresh(); } catch {}
      onChanged?.();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setEditing(true)}
        className="rounded border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-900"
      >Editar</button>
      <button onClick={onDelete} className="rounded border border-red-800 bg-red-950 px-2 py-1 text-xs text-red-300 hover:bg-red-900/30">Eliminar</button>
      <PaymentEditModal
        open={editing}
        onClose={()=>setEditing(false)}
        payment={payment}
        onSaved={()=>{ setEditing(false); try { router.refresh(); } catch {}; onChanged?.(); }}
      />
    </div>
  );
}
