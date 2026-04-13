const COLOR_MAP = {
  purple: "bg-dd-purple-100 text-dd-purple dark:bg-dd-purple-900/40 dark:text-dd-purple-light",
  blue: "bg-dd-blue-light text-dd-blue dark:bg-dd-blue/20 dark:text-blue-300",
  amber: "bg-dd-amber-light text-amber-700 dark:bg-dd-amber/20 dark:text-amber-300",
  red: "bg-dd-red-light text-dd-red dark:bg-dd-red/20 dark:text-red-300",
  green: "bg-dd-green-light text-emerald-700 dark:bg-dd-green/20 dark:text-emerald-300",
  teal: "bg-dd-teal-light text-dd-teal dark:bg-dd-teal/20 dark:text-teal-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export default function Badge({ children, color = "gray", className = "" }) {
  const colorClasses = COLOR_MAP[color] || COLOR_MAP.gray;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses} ${className}`}>
      {children}
    </span>
  );
}
