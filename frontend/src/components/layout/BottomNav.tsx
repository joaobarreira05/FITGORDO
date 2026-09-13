import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, QrCode, UtensilsCrossed, User } from 'lucide-react';

interface BottomNavProps {
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenQuickAdd }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 pb-safe-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto relative">
        {/* Hoje */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-14 h-full text-xs font-medium transition-colors ${
              isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`
          }
        >
          <Home className="w-5 h-5 mb-1" />
          <span>Hoje</span>
        </NavLink>

        {/* Diário */}
        <NavLink
          to="/diary"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-14 h-full text-xs font-medium transition-colors ${
              isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`
          }
        >
          <Calendar className="w-5 h-5 mb-1" />
          <span>Diário</span>
        </NavLink>

        {/* Highlighted Scan Button */}
        <div className="flex flex-col items-center justify-center relative -top-4">
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
          <span className="text-[10px] font-semibold text-emerald-400 mt-1">Scan</span>
        </div>

        {/* Refeições */}
        <NavLink
          to="/meals"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-14 h-full text-xs font-medium transition-colors ${
              isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`
          }
        >
          <UtensilsCrossed className="w-5 h-5 mb-1" />
          <span>Refeições</span>
        </NavLink>

        {/* Perfil */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-14 h-full text-xs font-medium transition-colors ${
              isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`
          }
        >
          <User className="w-5 h-5 mb-1" />
          <span>Perfil</span>
        </NavLink>
      </div>
    </nav>
  );
};
