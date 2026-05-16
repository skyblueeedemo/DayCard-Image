export default function OfflineBanner() {
  return (
    <div className="w-full max-w-2xl flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth={2} />
      </svg>
      <span>当前处于离线状态，以下为本地历史图像</span>
    </div>
  );
}
