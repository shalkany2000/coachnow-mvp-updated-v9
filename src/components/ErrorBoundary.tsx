import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { captureError } from '../lib/monitoring';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-sm text-center">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-6">
              This page hit an unexpected error. Reloading usually fixes it — your bookings and account are saved.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
