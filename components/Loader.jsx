export default function Loader({ label = 'Cargando…' }) {
  return (
    <div className="flex items-center justify-center gap-3 p-6">
      <div className="spinner-brand" aria-hidden="true" />
      <span className="brand-gradient-text font-medium">{label}</span>
    </div>
  );
}
