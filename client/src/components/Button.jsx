const variants = {
  primary:
    'gradient-bg hover:opacity-90 shadow-sm',
  secondary:
    'bg-white dark:bg-[#141414] border border-neutral-300 dark:border-neutral-700 text-[#0A0A0A] dark:text-[#F5F5F5] hover:bg-neutral-50 dark:hover:bg-neutral-900',
  outline:
    'border-2 border-[#0A0A0A] dark:border-white text-[#0A0A0A] dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800',
};

const sizes = {
  sm: 'px-3 py-2 text-sm min-h-9',
  md: 'px-5 py-2.5 text-sm min-h-11',
  lg: 'px-6 py-3 text-base min-h-12',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
