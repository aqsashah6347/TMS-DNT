// Orange "chasing dots" loader (see .tms-loader in index.css). Used as
// the real <Suspense> fallback in AppRoutes.jsx, so it's tied to actual
// page-load state — it shows whenever a lazy-loaded route's code is
// being fetched, not just for decoration.
export default function Loader({ label, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <i className="tms-loader" aria-hidden="true" />
      {label && <span className="text-sm text-white/60">{label}</span>}
    </div>
  );
}
