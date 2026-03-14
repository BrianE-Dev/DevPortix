import { useState } from 'react';
import { HelpCircle, LifeBuoy, Mail } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { DASHBOARD_ACCENTS } from '../utils/dashboardAccent';
import LocalStorageService from '../services/localStorageService';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';

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

const SettingsPanel = ({ accent }) => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showSuccess } = useModal();
  const [selectedAccent, setSelectedAccent] = useState(() =>
    LocalStorageService.getDashboardAccent(user?.id)
  );

  const changeAccent = (accentKey) => {
    const nextAccent = LocalStorageService.setDashboardAccent(accentKey, user?.id);
    setSelectedAccent(nextAccent);
    showSuccess('Settings Updated', `Dashboard accent changed to ${accentKey}.`);
  };

  const changeTheme = (mode) => {
    setTheme(mode);
    showSuccess('Settings Updated', `Theme switched to ${mode} mode.`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-3">Appearance</h3>
        <p className="text-sm text-gray-300 mb-4">Choose your preferred theme mode.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => changeTheme('light')}
            className={`px-4 py-2 rounded-lg border ${theme === 'light' ? 'border-white/60 bg-white/20 text-white' : 'border-white/20 text-gray-200'}`}
          >
            Light Mode
          </button>
          <button
            type="button"
            onClick={() => changeTheme('dark')}
            className={`px-4 py-2 rounded-lg border ${theme === 'dark' ? 'border-white/60 bg-white/20 text-white' : 'border-white/20 text-gray-200'}`}
          >
            Dark Mode
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-3">Accent Options</h3>
        <p className="text-sm text-gray-300 mb-4">Set the color accent used across your dashboard.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(DASHBOARD_ACCENTS).map(([key, value]) => {
            const active = selectedAccent === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => changeAccent(key)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${active ? 'border-white/60 bg-white/15' : 'border-white/20 bg-black/20'}`}
              >
                <span className="text-sm text-white capitalize">{key}</span>
                <span className={`w-4 h-4 rounded-full ${value.chipClass}`} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-3 inline-flex items-center gap-2">
          <HelpCircle className={`w-5 h-5 ${accent?.textClass || 'text-blue-300'}`} />
          FAQs
        </h3>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className="rounded-lg border border-white/10 p-3 bg-black/10">
              <p className="text-sm font-medium text-white">{item.question}</p>
              <p className="text-sm text-gray-300 mt-1">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-3 inline-flex items-center gap-2">
          <LifeBuoy className={`w-5 h-5 ${accent?.textClass || 'text-blue-300'}`} />
          Support
        </h3>
        <p className="text-sm text-gray-300 mb-4">
          Need help? Contact support and include your role, action attempted, and any screenshot.
        </p>
        <a
          href="mailto:support@devportix.com?subject=DevPortix%20Support%20Request"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${accent?.primaryButtonClass || 'bg-blue-600 hover:bg-blue-500'}`}
        >
          <Mail className="w-4 h-4" />
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default SettingsPanel;
