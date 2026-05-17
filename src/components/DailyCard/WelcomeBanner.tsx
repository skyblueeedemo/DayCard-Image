export default function WelcomeBanner() {
  return (
    <div className="w-full max-w-2xl rounded-lg border border-border-default bg-surface-2/60 px-5 py-3">
      <p className="text-sm text-fg-primary leading-relaxed">
        每日三组灵感主题，一键生成专属图像，设为壁纸，换种心情。
      </p>
      <p className="text-xs text-fg-secondary mt-1">
        开始今天的抽卡吧！
      </p>
    </div>
  );
}
