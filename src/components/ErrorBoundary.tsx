import { Component } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
          <div className="flex flex-col items-center gap-4 text-center px-8 max-w-md">
            <span className="text-5xl">⚠</span>
            <h1 className="text-xl font-bold text-white">出错了</h1>
            <p className="text-sm text-gray-400">
              应用遇到了意外错误。请尝试重新加载。
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="w-full mt-2 p-3 rounded bg-gray-900 border border-gray-800 text-left">
                <p className="text-xs text-red-400 font-mono mb-1">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="mt-4 px-6 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
