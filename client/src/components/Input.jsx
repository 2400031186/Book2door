export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <input
        className={`w-full min-h-11 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#141414] px-4 py-2.5 text-sm outline-none transition focus:border-[#0A0A0A] dark:focus:border-white focus:ring-2 focus:ring-neutral-400/30 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <textarea
        className={`w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#141414] px-4 py-2.5 text-sm outline-none transition focus:border-[#0A0A0A] dark:focus:border-white focus:ring-2 focus:ring-neutral-400/30 resize-none ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <select
        className={`w-full min-h-11 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#141414] px-4 py-2.5 text-sm outline-none transition focus:border-[#0A0A0A] dark:focus:border-white focus:ring-2 focus:ring-neutral-400/30 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
