import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ImageGrid from '@/components/ImageGrid/ImageGrid';

export default function App() {
  const [activePage, setActivePage] = useState<'daily' | 'history' | 'providers' | 'settings'>('daily');

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto p-6">
        {activePage === 'daily' && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <h2 className="text-2xl font-bold text-white">今日抽卡</h2>
            <p className="text-gray-400">输入 Prompt，生成你的今日图像卡片</p>
            <ImageGrid />
          </div>
        )}
        {activePage === 'history' && (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold text-white">历史记录</h2>
            <p className="text-gray-400 mt-2">浏览已生成的图像</p>
          </div>
        )}
        {activePage === 'providers' && (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold text-white">Provider 管理</h2>
            <p className="text-gray-400 mt-2">查看和切换 AI 图像生成后端</p>
          </div>
        )}
        {activePage === 'settings' && (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold text-white">设置</h2>
            <p className="text-gray-400 mt-2">API Key、生成参数、主题</p>
          </div>
        )}
      </main>
    </div>
  );
}
