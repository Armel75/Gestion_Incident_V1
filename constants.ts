export const APP_NAME = "Tracking Incident";

// Updated styles to work in both Light and Dark modes
// We use classes that adapt (like text-slate-700 dark:text-slate-300)
// or use universal colors.
export const STATUS_STYLES = {
  OPEN: { label: "Ouvert", color: "text-slate-700 dark:text-slate-300", dot: "bg-slate-400" },
  IN_PROGRESS: { label: "En cours", color: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500 animate-pulse" },
  RESOLVED: { label: "Résolu", color: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  CLOSED: { label: "Clôturé", color: "text-slate-500 dark:text-slate-500", dot: "bg-slate-300 dark:bg-slate-600" },
  CANCELLED: { label: "Annulé", color: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
};

export const PRIORITY_STYLES = {
  LOW: { label: "Basse", iconColor: "text-slate-400 dark:text-slate-500", bgColor: "bg-slate-100 dark:bg-slate-800" },
  MEDIUM: { label: "Moyenne", iconColor: "text-amber-500 dark:text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950" },
  HIGH: { label: "Haute", iconColor: "text-orange-600 dark:text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950" },
  CRITICAL: { label: "Critique", iconColor: "text-red-600 dark:text-red-500", bgColor: "bg-red-50 dark:bg-red-950" },
};

export const MOCK_DELAY = 400; // Snappier feel