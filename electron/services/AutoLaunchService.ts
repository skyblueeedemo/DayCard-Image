import AutoLaunch from 'auto-launch';
import { app } from 'electron';

class AutoLaunchService {
  private launcher: AutoLaunch;

  constructor() {
    this.launcher = new AutoLaunch({
      name: '拾光匣',
      path: app.getPath('exe'),
    });
  }

  async enable(): Promise<void> {
    if (!app.isPackaged) {
      console.log('[AutoLaunch] 开发模式，跳过实际自启动注册');
      return;
    }
    try {
      await this.launcher.enable();
    } catch (err) {
      console.error('[AutoLaunch] 启用失败', err);
    }
  }

  async disable(): Promise<void> {
    if (!app.isPackaged) {
      return;
    }
    try {
      await this.launcher.disable();
    } catch (err) {
      console.error('[AutoLaunch] 禁用失败', err);
    }
  }

  async isEnabled(): Promise<boolean> {
    if (!app.isPackaged) return false;
    try {
      return await this.launcher.isEnabled();
    } catch {
      return false;
    }
  }
}

export const autoLaunchService = new AutoLaunchService();
