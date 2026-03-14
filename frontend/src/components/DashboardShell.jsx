import React, { useMemo } from 'react';
import { Circle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

const DashboardShell = ({
  role,
  title,
  subtitle,
  accentClass = 'text-blue-300',
  activeTabClass = '',
  menuItems = [],
  activeMenuKey,
  onMenuSelect,
  children,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';
  const avatarSrc = useMemo(() => {
    const avatar = String(user?.avatar || '').trim();
    if (!avatar) return '';
    if (avatar.startsWith('data:') || avatar.startsWith('http')) return avatar;
    return `${API_BASE_URL}${avatar}`;
  }, [API_BASE_URL, user?.avatar]);

  const initials = useMemo(() => {
    const fullName = String(user?.fullName || '').trim();
    if (!fullName) return 'U';
    const parts = fullName.split(/\s+/).filter(Boolean).slice(0, 2);
    const chars = parts.map((part) => part[0]?.toUpperCase()).join('');
    return chars || 'U';
  }, [user?.fullName]);
  const currentPlan = useMemo(() => {
    const normalized = String(user?.subscription || 'free').trim().toLowerCase();
    if (!normalized) return 'FREE';
    return normalized.toUpperCase();
  }, [user?.subscription]);

  const activeHighlightClass = activeTabClass
    ? `${activeTabClass} border-transparent text-white`
    : theme === 'dark'
      ? 'bg-violet-500 border-violet-400 text-white'
      : 'bg-violet-500 border-violet-400 text-white';
  const topMenuItems = menuItems.filter((item) => item.position !== 'bottom');
  const bottomMenuItems = menuItems.filter((item) => item.position === 'bottom');

  const renderMenuItem = (item) => {
    const Icon = item.icon || Circle;
    const isActive = item.key === activeMenuKey;
    const content = (
      <>
        <span className="inline-flex items-center gap-2">
          <Icon className={`w-4 h-4 ${item.iconClass || accentClass}`} />
          {item.label}
        </span>
        <span className={`text-[11px] ${isActive ? 'text-white' : 'text-gray-400'}`}>
          {item.badge || 'Menu'}
        </span>
      </>
    );

    if (item.href) {
      return (
        <a
          key={item.label}
          href={item.href}
          target={item.target || '_self'}
          rel={item.target === '_blank' ? 'noreferrer' : undefined}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition border-white/10 text-gray-200 hover:bg-white/10"
        >
          {content}
        </a>
      );
    }

    return (
      <button
        key={item.label}
        type="button"
        onClick={() => onMenuSelect?.(item.key)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition ${
          isActive
            ? activeHighlightClass
            : 'border-white/10 text-gray-200 hover:bg-white/10'
        }`}
        aria-pressed={isActive}
      >
        {content}
      </button>
    );
  };

  return (
    <div className="w-full lg:h-[calc(100vh-6rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6 lg:h-full">
        <aside className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 min-h-[360px] lg:min-h-[calc(100vh-8rem)] lg:sticky lg:top-24 lg:self-start lg:overflow-hidden lg:flex lg:flex-col">
          <p className={`text-xs uppercase tracking-wide font-semibold ${accentClass}`}>{role} Menu</p>
          <nav className="mt-3 space-y-2 lg:flex-1 lg:overflow-y-auto lg:pr-1">
            {topMenuItems.map(renderMenuItem)}
          </nav>
          {bottomMenuItems.length > 0 && (
            <nav className="mt-4 pt-3 border-t border-white/10 space-y-2">
              {bottomMenuItems.map(renderMenuItem)}
            </nav>
          )}
        </aside>

        <section className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-2">
          <div className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{title}</h1>
                <p className="text-gray-300 mt-2">{subtitle}</p>
              </div>

              <div className="flex flex-col items-end">
                <span className={`mb-2 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold ${accentClass}`}>
                  Current Plan: {currentPlan}
                </span>
                <div className="group relative rounded-full border border-white/20">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={`${user?.fullName || 'User'} profile`}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                      {initials}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">Edit profile in the Profile menu.</p>
              </div>
            </div>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
};

export default DashboardShell;
