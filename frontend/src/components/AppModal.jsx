import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const modalStyles = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    confirmClass: 'bg-emerald-600 hover:bg-emerald-500',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-400',
    confirmClass: 'bg-red-600 hover:bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-400',
    confirmClass: 'bg-amber-600 hover:bg-amber-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-400',
    confirmClass: 'bg-blue-600 hover:bg-blue-500',
  },
};

const AppModal = ({
  isOpen,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
  confirmDelaySeconds = 0,
  onConfirm,
  onCancel,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isOpen || !showCancel) return undefined;

    const initial = Math.max(0, Number(confirmDelaySeconds) || 0);
    if (initial <= 0) return undefined;

    const deadline = Date.now() + initial * 1000;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [confirmDelaySeconds, isOpen, showCancel]);

  if (!isOpen) return null;

  const style = modalStyles[type] || modalStyles.info;
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        className={`relative w-full max-w-md rounded-xl p-6 shadow-2xl ${
          isDark
            ? 'border border-white/10 bg-slate-950'
            : 'border border-slate-200 bg-white text-slate-900 shadow-slate-300/50'
        }`}
      >
        <div className="flex items-start gap-3">
          <Icon className={`w-6 h-6 mt-0.5 ${style.iconClass}`} />
          <div>
            <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900'}>{title}</h3>
            <p className={isDark ? 'mt-2 text-sm text-gray-300' : 'mt-2 text-sm text-slate-600'}>{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2 rounded-lg border transition ${
                isDark
                  ? 'border-white/20 text-gray-200 hover:bg-white/10'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDelaySeconds > 0 && secondsLeft > 0}
            className={`px-4 py-2 rounded-lg text-white transition ${style.confirmClass}`}
          >
            {confirmDelaySeconds > 0 && secondsLeft > 0 ? `${confirmText} (${secondsLeft}s)` : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppModal;
