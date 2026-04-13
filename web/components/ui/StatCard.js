const VARIANT_STYLES = {
  purple: "border-l-dd-purple bg-gradient-to-r from-dd-purple-50 to-dd-surface dark:from-dd-purple-900/20 dark:to-dd-surface",
  green: "border-l-dd-green bg-gradient-to-r from-dd-green-light to-dd-surface dark:from-emerald-900/20 dark:to-dd-surface",
  blue: "border-l-dd-blue bg-gradient-to-r from-dd-blue-light to-dd-surface dark:from-blue-900/20 dark:to-dd-surface",
  amber: "border-l-dd-amber bg-gradient-to-r from-dd-amber-light to-dd-surface dark:from-amber-900/20 dark:to-dd-surface",
};

export default function StatCard({ label, value, variant = "purple", icon }) {
  return (
    <div className={`border border-dd-border border-l-4 rounded-xl p-4 shadow-sm ${VARIANT_STYLES[variant] || VARIANT_STYLES.purple}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-dd-text">{value}</div>
          <div className="text-xs text-dd-text-secondary mt-0.5">{label}</div>
        </div>
        {icon && <div className="text-dd-text-secondary opacity-50">{icon}</div>}
      </div>
    </div>
  );
}
