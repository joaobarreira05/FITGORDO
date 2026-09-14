import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, QrCode, Utensils, User } from 'lucide-react';

interface BottomNavProps {
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenQuickAdd }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 pb-safe-bottom">
      <div className="flex items-center justify-between h-16 px-1 max-w-md mx-auto relative">
        {/* Hoje */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex-1 min-w-0 h-full flex flex-col items-center justify-center py-1 select-none transition-colors ${
              isActive ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200 font-medium'
            }`
          }
        >
          <Home className="w-5 h-5 mb-1 shrink-0" />
          <span className="text-[11px] leading-tight tracking-tight whitespace-nowrap">Hoje</span>
        </NavLink>

        {/* Diário */}
        <NavLink
          to="/diary"
          className={({ isActive }) =>
            `flex-1 min-w-0 h-full flex flex-col items-center justify-center py-1 select-none transition-colors ${
              isActive ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200 font-medium'
            }`
          }
        >
          <Calendar className="w-5 h-5 mb-1 shrink-0" />
          <span className="text-[11px] leading-tight tracking-tight whitespace-nowrap">Diário</span>
        </NavLink>

        {/* Highlighted Scan Button */}
        <div className="w-16 shrink-0 flex flex-col items-center justify-center relative -top-3.5">
          <NavLink
            to="/scanner"
            aria-label="Scanner de Código de Barras"
            className={({ isActive }) =>
              `w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-zinc-950 shadow-lg shadow-emerald-500/25 transition-transform active:scale-95 ${
                isActive ? 'ring-4 ring-emerald-500/30' : ''
              }`
            }
          >
            <QrCode className="w-7 h-7 stroke-[2.5]" />
          </NavLink>
          <span className="text-[10px] font-bold text-emerald-400 mt-1">Scan</span>
        </div>

        {/* Refeições */}
        <NavLink
          to="/meals"
          className={({ isActive }) =>
            `flex-1 min-w-0 h-full flex flex-col items-center justify-center py-1 select-none transition-colors ${
              isActive ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200 font-medium'
            }`
          }
        >
          <Utensils className="w-5 h-5 mb-1 shrink-0" />
          <span className="text-[11px] leading-tight tracking-tight whitespace-nowrap">Refeições</span>
        </NavLink>

        {/* Perfil */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex-1 min-w-0 h-full flex flex-col items-center justify-center py-1 select-none transition-colors ${
              isActive ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200 font-medium'
            }`
          }
        >
          <User className="w-5 h-5 mb-1 shrink-0" />
          <span className="text-[11px] leading-tight tracking-tight whitespace-nowrap">Perfil</span>
        </NavLink>
      </div>
    </nav>
  );
};
