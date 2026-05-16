import { useState } from 'react';
import { useToastStore } from '../store/toastStore';

export function useWallpaper() {
  const addToast = useToastStore((s) => s.addToast);
  const [isSetting, setIsSetting] = useState(false);

  const setAsWallpaper = async (imageUrl: string) => {
    if (!window.electronAPI?.setWallpaper) {
      addToast('壁纸功能仅在桌面端可用', 'error');
      return;
    }

    setIsSetting(true);
    try {
      const res = await window.electronAPI.setWallpaper({ imagePath: imageUrl });
      if (res.status === 'ok') {
        addToast('壁纸设置成功！', 'success');
      } else {
        addToast(res.message ?? '壁纸设置失败', 'error');
      }
    } catch {
      addToast('壁纸设置失败，请重试', 'error');
    } finally {
      setIsSetting(false);
    }
  };

  return { setAsWallpaper, isSetting };
}
