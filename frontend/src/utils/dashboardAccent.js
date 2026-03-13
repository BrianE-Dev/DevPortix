const DASHBOARD_ACCENTS = {
  blue: {
    textClass: 'text-blue-300',
    linkClass: 'text-blue-400 hover:text-blue-300',
    primaryButtonClass: 'bg-blue-600 hover:bg-blue-500',
  },
  emerald: {
    textClass: 'text-emerald-300',
    linkClass: 'text-emerald-400 hover:text-emerald-300',
    primaryButtonClass: 'bg-emerald-600 hover:bg-emerald-500',
  },
  rose: {
    textClass: 'text-rose-300',
    linkClass: 'text-rose-400 hover:text-rose-300',
    primaryButtonClass: 'bg-rose-600 hover:bg-rose-500',
  },
  amber: {
    textClass: 'text-amber-300',
    linkClass: 'text-amber-400 hover:text-amber-300',
    primaryButtonClass: 'bg-amber-600 hover:bg-amber-500',
  },
  violet: {
    textClass: 'text-violet-300',
    linkClass: 'text-violet-400 hover:text-violet-300',
    primaryButtonClass: 'bg-violet-500 hover:bg-violet-400',
  },
};

export const getDashboardAccent = (accent = 'violet') => DASHBOARD_ACCENTS[accent] || DASHBOARD_ACCENTS.violet;
