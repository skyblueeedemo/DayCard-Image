import { Component } from 'react';
import { AlertTriangle, RotateCcw, ExternalLink } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  occurredAt: string | null;
}

const GITHUB_ISSUES_URL = 'https://github.com/skyblueeedemo/DayCard-Image/issues/new';

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, occurredAt: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      occurredAt: new Date().toISOString(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, occurredAt: null });
  };

  handleReportIssue = () => {
    const { error, occurredAt } = this.state;
    const title = encodeURIComponent(`[Bug] ${error?.name ?? 'Error'}: ${error?.message?.slice(0, 80) ?? '渲染异常'}`);
    const body = encodeURIComponent(
      `## 错误信息\n\n` +
        `- 类型：${error?.name ?? 'Unknown'}\n` +
        `- 消息：${error?.message ?? '(无)'}\n` +
        `- 时间：${occurredAt ?? new Date().toISOString()}\n\n` +
        `## 重现步骤\n\n（请填写）\n\n` +
        `## 错误堆栈\n\n\`\`\`\n${error?.stack?.slice(0, 1500) ?? '(无)'}\n\`\`\`\n`,
    );
    const url = `${GITHUB_ISSUES_URL}?title=${title}&body=${body}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  render() {
    if (this.state.hasError) {
      const { error, occurredAt } = this.state;
      const errorName = error?.name ?? 'Error';
      const errorMessage = error?.message ?? '未知错误';

      return (
        <div className="flex h-screen w-screen items-center justify-center bg-surface-1 dark:bg-surface-1">
          <div className="flex flex-col items-center gap-4 text-center px-8 max-w-md">
            <AlertTriangle size={48} strokeWidth={1.25} className="text-status-warning" />
            <h1 className="text-xl font-bold text-fg-primary">出错了</h1>
            <p className="text-sm text-fg-secondary">
              应用遇到了意外错误。请尝试重新加载，如果问题持续出现，欢迎报告给我们。
            </p>

            {/* 错误概要（始终显示） */}
            <div className="w-full mt-2 p-3 rounded-lg bg-surface-2 border border-border-default text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-status-danger">{errorName}</span>
                {occurredAt && (
                  <span className="text-xs text-fg-muted">
                    {new Date(occurredAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-fg-primary font-mono break-words">{errorMessage}</p>
            </div>

            {/* 完整堆栈（仅 DEV 模式） */}
            {import.meta.env.DEV && error?.stack && (
              <div className="w-full p-3 rounded-lg bg-surface-2 border border-border-default text-left">
                <p className="text-xs text-fg-muted mb-1">堆栈（仅开发模式可见）</p>
                <pre className="text-xs text-fg-secondary font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {error.stack}
                </pre>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-brand text-sm font-medium text-brand-fg hover:bg-brand-hover transition-colors flex items-center gap-2"
              >
                <RotateCcw size={14} strokeWidth={1.75} />
                重新加载
              </button>
              <button
                onClick={this.handleReportIssue}
                className="px-4 py-2 rounded-lg border border-border-default text-sm text-fg-secondary hover:bg-surface-2 transition-colors flex items-center gap-2"
              >
                <ExternalLink size={14} strokeWidth={1.75} />
                报告问题
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
