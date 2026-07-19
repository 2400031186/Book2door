export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`glass-card p-6 ${hover ? 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
