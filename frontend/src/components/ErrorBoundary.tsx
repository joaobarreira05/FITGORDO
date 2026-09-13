import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    // Clear cache & service worker if possible
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(r => r.unregister());
      });
    }
    localStorage.removeItem('fitgordo_cached_products');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertTriangle className="w-8 h-8 mx-auto" />
          </div>
          <h2 className="text-lg font-bold">Ocorreu um problema ao carregar a página</h2>
          <p className="text-xs text-zinc-400 max-w-xs">
            {this.state.error?.message || 'Erro temporário de renderização ou cache.'}
          </p>
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recarregar & Limpar Cache</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
