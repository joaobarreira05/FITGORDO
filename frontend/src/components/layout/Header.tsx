import React, { useState, useEffect } from 'react';
import { WifiOff, Plus } from 'lucide-react';

interface HeaderProps {
  title?: string;
  onOpenQuickAdd?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title = 'FITGORDO', onOpenQuickAdd }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60 pt-safe-top">
      <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">FIT</span>
            <span>GORDO</span>
          </h1>
          {!isOnline && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
        </div>

        {onOpenQuickAdd && (
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-3 py-1.5 rounded-full transition-all active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar</span>
          </button>
        )}
      </div>
    </header>
  );
};
