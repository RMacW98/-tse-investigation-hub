export default function Card({ children, className = "", title, action }) {
  return (
    <div className={`bg-dd-surface border border-dd-border rounded-xl shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-dd-border">
          <h2 className="text-sm font-semibold text-dd-text">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
