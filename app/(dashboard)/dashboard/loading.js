import Loader from '@/components/Loader';

export default function Loading() {
  return (
    <div className="py-10">
      <Loader label="Cargando dashboard…" />
    </div>
  );
}
