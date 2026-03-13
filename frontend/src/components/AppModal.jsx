import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

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
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const style = modalStyles[type] || modalStyles.info;
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <Icon className={`w-6 h-6 mt-0.5 ${style.iconClass}`} />
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm text-gray-300">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-white/20 text-gray-200 hover:bg-white/10 transition"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white transition ${style.confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppModal;
