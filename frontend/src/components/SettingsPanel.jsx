import { useMemo, useState } from 'react';
import { HelpCircle, LifeBuoy, LogOut, Mail, MoonStar, Settings2, SunMedium, UserCircle2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { DASHBOARD_ACCENTS } from '../utils/dashboardAccent';
import LocalStorageService from '../services/localStorageService';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import { resolveMediaUrl } from '../utils/api';

const FAQ_ITEMS = [
  {
    question: 'How do I change my dashboard color accent?',
    answer: 'Use Accent Options below. Your choice is saved automatically for your account.',
  },
  {
    question: 'How do I switch between light and dark mode?',
    answer: 'Use Appearance options below to switch themes instantly.',
  },
  {
    question: 'Where can I get help when something fails?',
    answer: 'Use the support actions below to contact the team with details and screenshots.',
  },
];

const SettingsPanel = ({ accent, onOpenProfile }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showSuccess, confirm } = useModal();
  const [selectedAccent, setSelectedAccent] = useState(() => LocalStorageService.getDashboardAccent(user?.id));

  const avatarSrc = useMemo(() => {
    const avatar = String(user?.avatar || '').trim();
    if (!avatar) return '';
    return resolveMediaUrl(avatar);
  }, [user?.avatar]);

  const initials = useMemo(() => {
    const fullName = String(user?.fullName || '').trim();
    if (!fullName) return 'U';
    return fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';
  }, [user?.fullName]);

  const currentPlan = useMemo(() => {
    const normalized = String(user?.subscription || 'free').trim().toLowerCase();
    return normalized ? normalized.toUpperCase() : 'FREE';
  }, [user?.subscription]);

  const changeAccent = (accentKey) => {
    LocalStorageService.setDashboardAccentIntent(accentKey, user?.id);
    const nextAccent = LocalStorageService.setDashboardAccent(accentKey, user?.id);
    setSelectedAccent(nextAccent);
    showSuccess('Settings Updated', `Dashboard accent changed to ${accentKey}.`);
  };

  const changeTheme = (mode) => {
    setTheme(mode);
    showSuccess('Settings Updated', `Theme switched to ${mode} mode.`);
  };

  const handleLogout = async () => {
    const approved = await confirm({
      type: 'warning',
      title: 'Log Out?',
      message: 'Do you want to sign out of your DevPortix workspace now?',
      confirmText: 'Log Out',
      cancelText: 'Stay',
    });
    if (!approved) return;
    logout();
    showSuccess('Signed Out', 'You have been logged out successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={`${user?.fullName || 'User'} avatar`}
                className="h-16 w-16 rounded-2xl border border-white/15 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg font-semibold text-white">
                {initials}
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Workspace Settings</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{user?.fullName || user?.username || 'DevPortix User'}</h3>
              <p className="mt-1 text-sm text-gray-300">{user?.email || 'No email available'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onOpenProfile?.()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              <UserCircle2 className={`h-4 w-4 ${accent?.textClass || 'text-blue-300'}`} />
              Profile
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Current Plan</p>
            <p className="mt-3 text-lg font-semibold text-white">{currentPlan}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Role</p>
            <p className="mt-3 text-lg font-semibold capitalize text-white">{String(user?.role || 'user').replaceAll('_', ' ')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Theme</p>
            <p className="mt-3 text-lg font-semibold capitalize text-white">{theme} mode</p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="mb-3 text-xl font-semibold text-white">Appearance</h3>
        <p className="mb-4 text-sm text-gray-300">Choose your preferred theme mode from the controls below.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => changeTheme('light')}
            className={`flex items-center justify-between rounded-2xl border px-4 py-4 transition ${theme === 'light' ? 'border-white/60 bg-white/20 text-white' : 'border-white/20 text-gray-200 hover:bg-white/10'}`}
          >
            <span>
              <span className="block text-sm font-semibold">Light Mode</span>
              <span className="mt-1 block text-xs text-gray-300">Brighter workspace for daytime focus.</span>
            </span>
            <SunMedium className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => changeTheme('dark')}
            className={`flex items-center justify-between rounded-2xl border px-4 py-4 transition ${theme === 'dark' ? 'border-white/60 bg-white/20 text-white' : 'border-white/20 text-gray-200 hover:bg-white/10'}`}
          >
            <span>
              <span className="block text-sm font-semibold">Dark Mode</span>
              <span className="mt-1 block text-xs text-gray-300">Lower glare with a deeper interface mood.</span>
            </span>
            <MoonStar className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="mb-3 inline-flex items-center gap-2 text-xl font-semibold text-white">
          <Settings2 className={`h-5 w-5 ${accent?.textClass || 'text-blue-300'}`} />
          Accent Options
        </h3>
        <p className="mb-4 text-sm text-gray-300">Set the color accent used across your dashboard.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(DASHBOARD_ACCENTS).map(([key, value]) => {
            const active = selectedAccent === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => changeAccent(key)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${active ? 'border-white/60 bg-white/15' : 'border-white/20 bg-black/20'}`}
              >
                <span className="text-sm capitalize text-white">{key}</span>
                <span className={`h-4 w-4 rounded-full ${value.chipClass}`} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="mb-3 inline-flex items-center gap-2 text-xl font-semibold text-white">
          <HelpCircle className={`h-5 w-5 ${accent?.textClass || 'text-blue-300'}`} />
          FAQs
        </h3>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className="rounded-lg border border-white/10 bg-black/10 p-3">
              <p className="text-sm font-medium text-white">{item.question}</p>
              <p className="mt-1 text-sm text-gray-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="mb-3 inline-flex items-center gap-2 text-xl font-semibold text-white">
          <LifeBuoy className={`h-5 w-5 ${accent?.textClass || 'text-blue-300'}`} />
          Support
        </h3>
        <p className="mb-4 text-sm text-gray-300">
          Need help? Contact support and include your role, action attempted, and any screenshot.
        </p>
        <a
          href="mailto:support@devportix.com?subject=DevPortix%20Support%20Request"
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white ${accent?.primaryButtonClass || 'bg-blue-600 hover:bg-blue-500'}`}
        >
          <Mail className="h-4 w-4" />
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default SettingsPanel;
