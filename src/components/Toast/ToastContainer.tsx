import { useToastStore } from '../../store/toastStore';

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded-lg border text-sm shadow-lg pointer-events-auto transition-all ${
            toast.type === 'success'
              ? 'border-green-700 bg-green-900/90 text-green-200'
              : toast.type === 'error'
                ? 'border-red-700 bg-red-900/90 text-red-200'
                : 'border-blue-700 bg-blue-900/90 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-70 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
