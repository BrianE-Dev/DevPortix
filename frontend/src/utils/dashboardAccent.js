export const DASHBOARD_ACCENTS = {
  blue: {
    textClass: 'text-blue-300',
    linkClass: 'text-blue-400 hover:text-blue-300',
    primaryButtonClass: 'bg-blue-600 hover:bg-blue-500',
    ringClass: 'ring-blue-400',
    focusRingClass: 'focus:ring-blue-500',
    borderClass: 'border-blue-400',
    chipClass: 'bg-blue-500',
  },
  emerald: {
    textClass: 'text-emerald-300',
    linkClass: 'text-emerald-400 hover:text-emerald-300',
    primaryButtonClass: 'bg-emerald-600 hover:bg-emerald-500',
    ringClass: 'ring-emerald-400',
    focusRingClass: 'focus:ring-emerald-500',
    borderClass: 'border-emerald-400',
    chipClass: 'bg-emerald-500',
  },
  rose: {
    textClass: 'text-rose-300',
    linkClass: 'text-rose-400 hover:text-rose-300',
    primaryButtonClass: 'bg-rose-600 hover:bg-rose-500',
    ringClass: 'ring-rose-400',
    focusRingClass: 'focus:ring-rose-500',
    borderClass: 'border-rose-400',
    chipClass: 'bg-rose-500',
  },
  amber: {
    textClass: 'text-amber-300',
    linkClass: 'text-amber-400 hover:text-amber-300',
    primaryButtonClass: 'bg-amber-600 hover:bg-amber-500',
    ringClass: 'ring-amber-400',
    focusRingClass: 'focus:ring-amber-500',
    borderClass: 'border-amber-400',
    chipClass: 'bg-amber-500',
  },
  violet: {
    textClass: 'text-violet-300',
    linkClass: 'text-violet-400 hover:text-violet-300',
    primaryButtonClass: 'bg-violet-600 hover:bg-violet-500',
    ringClass: 'ring-violet-400',
    focusRingClass: 'focus:ring-violet-500',
    borderClass: 'border-violet-400',
    chipClass: 'bg-violet-500',
  },
};

export const DEFAULT_DASHBOARD_ACCENT = 'blue';

export const getDashboardAccent = (accent = DEFAULT_DASHBOARD_ACCENT) =>
  DASHBOARD_ACCENTS[accent] || DASHBOARD_ACCENTS[DEFAULT_DASHBOARD_ACCENT];
