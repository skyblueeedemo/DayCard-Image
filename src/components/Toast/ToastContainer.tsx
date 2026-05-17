import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

const ICON_PROPS = { size: 16, strokeWidth: 1.75 } as const;

function ToastIcon({ type }: { type: 'success' | 'error' | 'info' }) {
  if (type === 'success') return <CheckCircle2 {...ICON_PROPS} className="flex-shrink-0" />;
  if (type === 'error') return <XCircle {...ICON_PROPS} className="flex-shrink-0" />;
  return <Info {...ICON_PROPS} className="flex-shrink-0" />;
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded-lg border text-sm shadow-lg pointer-events-auto animate-toast-in ${
            toast.type === 'success'
              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/90 text-green-700 dark:text-green-200'
              : toast.type === 'error'
                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/90 text-red-700 dark:text-red-200'
                : 'border-border-default dark:border-border-default bg-surface-2 dark:bg-surface-2 text-fg-primary dark:text-fg-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <ToastIcon type={toast.type} />
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
              aria-label="关闭"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
