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
    ? 'dashboard-nav-active text-white'
    : theme === 'dark'
      ? 'dashboard-nav-active text-white'
      : 'dashboard-nav-active text-white';
  const topMenuItems = menuItems.filter((item) => item.position !== 'bottom');
  const bottomMenuItems = menuItems.filter((item) => item.position === 'bottom');

  const renderMenuItem = (item) => {
    const Icon = item.icon || Circle;
    const isActive = item.key === activeMenuKey;
    const content = (
      <>
        <span className="inline-flex min-w-0 items-center gap-3">
          <Icon className={`w-4 h-4 ${item.iconClass || accentClass}`} />
          <span className="min-w-0">
            <span className="block font-medium">{item.label}</span>
            <span className={`block text-xs ${isActive ? 'text-white/75' : 'text-gray-400'}`}>
              {item.badge || 'Workspace'}
            </span>
          </span>
        </span>
        <span className={`text-lg leading-none ${isActive ? 'text-white' : 'text-gray-500'}`}>›</span>
      </>
    );

    if (item.href) {
      return (
        <a
          key={item.label}
          href={item.href}
          target={item.target || '_self'}
          rel={item.target === '_blank' ? 'noreferrer' : undefined}
          data-active={isActive}
          className="dashboard-sidebar-item w-full flex items-center justify-between rounded-[24px] px-4 py-4 text-sm transition text-gray-200 hover:bg-white/10"
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
        data-active={isActive}
        className={`w-full flex items-center justify-between rounded-[24px] px-4 py-4 text-sm border transition ${
          isActive
            ? activeHighlightClass
            : 'dashboard-sidebar-item text-gray-200 hover:bg-white/10'
        }`}
        aria-pressed={isActive}
      >
        {content}
      </button>
    );
  };

  return (
    <div className="w-full lg:h-[calc(100vh-6rem)]">
      <div className="dashboard-platform rounded-[2rem] p-4 sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 lg:h-full">
        <aside className="dashboard-sidebar rounded-[1.75rem] p-4 min-h-[360px] lg:min-h-[calc(100vh-9rem)] lg:sticky lg:top-24 lg:self-start lg:overflow-hidden lg:flex lg:flex-col">
          <div className="dashboard-sidebar-accent rounded-[28px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-[11px] uppercase tracking-[0.34em] font-semibold ${accentClass}`}>DevPort Workspace</p>
                <h2 className="mt-5 text-3xl font-semibold text-white">{role}</h2>
                <p className="mt-4 text-sm leading-7 text-gray-400">
                  A cleaner command center for portfolio growth, learning, and day-to-day progress.
                </p>
              </div>
              <div className="shrink-0 rounded-[24px] border border-cyan-400/25 bg-cyan-400/10 p-4 text-cyan-200">
                <Circle className="h-5 w-5 fill-current" />
              </div>
            </div>
          </div>
          <nav className="mt-4 space-y-2 lg:flex-1 lg:overflow-y-auto lg:pr-1">
            {topMenuItems.map(renderMenuItem)}
          </nav>
          <div className="dashboard-sidebar-accent mt-5 rounded-[28px] p-5">
            <p className={`text-[11px] uppercase tracking-[0.34em] font-semibold ${accentClass}`}>Live Snapshot</p>
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-400">Current plan</span>
                <span className="font-semibold text-white">{currentPlan}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-400">Role</span>
                <span className="font-semibold text-white">{role}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-400">Profile</span>
                <span className={`rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold ${accentClass}`}>
                  Active
                </span>
              </div>
            </div>
          </div>
          {bottomMenuItems.length > 0 && (
            <nav className="mt-4 pt-3 border-t border-white/10 space-y-2">
              {bottomMenuItems.map(renderMenuItem)}
            </nav>
          )}
        </aside>

        <section className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-2">
          <div className="dashboard-hero rounded-[1.75rem] p-6 md:p-8 mb-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className={`dashboard-metric-chip ${accentClass}`}>
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${theme === 'dark' ? 'bg-cyan-300' : 'bg-cyan-600'}`} />
                  Report-style workspace
                </div>
                <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white">{title}</h1>
                <p className="text-gray-300 mt-3 max-w-2xl leading-7">{subtitle}</p>
              </div>

              <div className="dashboard-panel rounded-[1.5rem] p-4 flex flex-col items-end">
                <span className={`mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold ${accentClass}`}>
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
    </div>
  );
};

export default DashboardShell;
