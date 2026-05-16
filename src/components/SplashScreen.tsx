import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 触发淡入
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      // 等淡出动画完成后通知父组件
      setTimeout(onDone, 700);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 transition-opacity duration-700 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* 图标 */}
      <div
        className={`mb-8 transition-all duration-700 delay-200 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <svg
          viewBox="0 0 80 80"
          className="w-20 h-20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {/* 外圈镜头 */}
          <circle cx="40" cy="40" r="36" className="text-blue-400" />
          <circle cx="40" cy="40" r="30" className="text-blue-500" />
          {/* 光圈 */}
          <circle cx="40" cy="40" r="14" className="text-blue-300" fill="currentColor" fillOpacity="0.1" />
          {/* 快门 */}
          <path d="M 40 20 L 40 8" className="text-blue-400" strokeWidth="2" />
          <path d="M 60 40 L 72 40" className="text-blue-400" strokeWidth="2" />
          <path d="M 40 60 L 40 72" className="text-blue-400" strokeWidth="2" />
          <path d="M 20 40 L 8 40" className="text-blue-400" strokeWidth="2" />
          {/* 对角 */}
          <path d="M 54 26 L 62 18" className="text-blue-400" strokeWidth="1.5" />
          <path d="M 54 54 L 62 62" className="text-blue-400" strokeWidth="1.5" />
          <path d="M 26 26 L 18 18" className="text-blue-400" strokeWidth="1.5" />
          <path d="M 26 54 L 18 62" className="text-blue-400" strokeWidth="1.5" />
          {/* 中心圆点 */}
          <circle cx="40" cy="40" r="5" className="text-blue-300" />
        </svg>
      </div>

      {/* 中文名 */}
      <h1
        className={`text-3xl font-bold text-white mb-2 tracking-widest transition-all duration-700 delay-400 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        拾光匣
      </h1>

      {/* 英文名 */}
      <p
        className={`text-sm text-gray-400 tracking-wide mb-8 transition-all duration-700 delay-500 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        DayCard-Image
      </p>

      {/* 口号 */}
      <p
        className={`text-base text-blue-400/80 italic tracking-wider transition-all duration-700 delay-600 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        每日一帧，拾起时光
      </p>

      {/* 进度点 */}
      <div className="absolute bottom-12 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-500/60 animate-pulse"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  );
}
