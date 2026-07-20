import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorType: 'chunk' | 'firebase' | 'runtime' | 'unknown';
}

function classifyError(error: Error): State['errorType'] {
  const msg = error.message || '';
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('dynamically imported module') ||
    msg.includes('ChunkLoadError') ||
    msg.includes('Loading chunk')
  ) return 'chunk';
  if (
    msg.includes('permission-denied') ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('firebase') ||
    msg.includes('Firebase')
  ) return 'firebase';
  if (
    msg.includes('undefined') ||
    msg.includes('null') ||
    msg.includes('is not a function') ||
    msg.includes('Cannot read properties')
  ) return 'runtime';
  return 'unknown';
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorType: 'unknown' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorType: classifyError(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const { errorType } = this.state;
    console.group(`ErrorBoundary [${errorType}]`);
    console.error('Error:', error);
    console.error('Component stack:', info.componentStack);
    console.groupEnd();

    if (errorType === 'chunk') {
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 8000) {
        sessionStorage.setItem('last_chunk_reload', now.toString());
        window.location.reload();
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorType: 'unknown' });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const { errorType, error } = this.state;

    const messages: Record<State['errorType'], { title: string; description: string }> = {
      chunk: {
        title: 'Connection issue',
        description: 'A page module failed to load. This is usually a temporary network issue.',
      },
      firebase: {
        title: 'Sync issue',
        description: 'There was a problem communicating with the server. This may resolve on its own.',
      },
      runtime: {
        title: 'Something went wrong',
        description: 'An unexpected error occurred. You can try again or refresh the page.',
      },
      unknown: {
        title: 'Something went wrong',
        description: 'An unexpected error occurred. Please try again.',
      },
    };

    const msg = messages[errorType] || messages.unknown;

    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-cream px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-espresso/5 flex items-center justify-center">
            <svg className="w-10 h-10 text-espresso/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-black text-espresso mb-2 uppercase italic tracking-tightest">{msg.title}</h2>
          <p className="text-text-muted mb-6">{msg.description}</p>
          {error && import.meta.env.DEV && (
            <pre className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left text-xs text-red-700 overflow-auto max-h-32">
              {error.name}: {error.message}
            </pre>
          )}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={this.handleRetry}
              className="px-6 py-3 bg-espresso text-cream rounded-xl hover:bg-espresso/90 transition-colors text-sm font-bold uppercase tracking-wider"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 border border-espresso/20 text-espresso rounded-xl hover:bg-espresso/5 transition-colors text-sm font-bold uppercase tracking-wider"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
