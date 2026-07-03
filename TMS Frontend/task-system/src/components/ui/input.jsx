export function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-muted">
          {label}
          {required && <span className="text-danger-text"> *</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="bg-bg rounded-card px-3 py-2 text-sm text-dark outline-none focus:ring-2 focus:ring-primary placeholder:text-muted"
      />
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-muted">{label}</label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="bg-bg rounded-card px-3 py-2 text-sm text-dark outline-none focus:ring-2 focus:ring-primary placeholder:text-muted resize-none"
      />
    </div>
  );
}
