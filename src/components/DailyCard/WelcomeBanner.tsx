export default function WelcomeBanner() {
  return (
    <div className="w-full max-w-2xl rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 px-5 py-3">
      <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
        每日三组灵感主题，一键生成专属图像，设为壁纸，换种心情。
      </p>
      <p className="text-xs text-blue-500/80 dark:text-blue-400/70 mt-1">
        开始今天的抽卡吧！
      </p>
    </div>
  );
}
