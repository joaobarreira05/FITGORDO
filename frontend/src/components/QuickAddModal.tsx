import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, History, Heart, Utensils, PlusCircle, X } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType?: string;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, mealType = 'Almoço' }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  const options = [
    {
      id: 'scan',
      title: 'Scan código de barras',
      subtitle: 'Usar a câmara do iPhone',
      icon: QrCode,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      action: () => handleSelect('/scanner')
    },
    {
      id: 'search',
      title: 'Pesquisar produtos',
      subtitle: 'Procurar por nome ou marca',
      icon: Search,
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      action: () => handleSelect('/products?mode=search')
    },
    {
      id: 'recent',
      title: 'Produtos recentes',
      subtitle: 'Alimentos consumidos recentemente',
      icon: History,
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      action: () => handleSelect('/products?tab=recent')
    },
    {
      id: 'favorites',
      title: 'Favoritos',
      subtitle: 'Os teus alimentos habituais',
      icon: Heart,
      color: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      action: () => handleSelect('/products?tab=favorites')
    },
    {
      id: 'meals',
      title: 'Refeições guardadas',
      subtitle: 'Adicionar refeição completa',
      icon: Utensils,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      action: () => handleSelect('/meals')
    },
    {
      id: 'custom',
      title: 'Criar alimento manualmente',
      subtitle: 'Inserir informação nutricional',
      icon: PlusCircle,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      action: () => handleSelect('/products/new')
    }
  ];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-5 pb-safe-bottom shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>+ Adicionar Alimento</span>
            </h2>
            <p className="text-xs text-zinc-400">Escolha o método mais rápido para registar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 max-h-[70vh] overflow-y-auto pr-1">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={opt.action}
                className="flex items-center p-3.5 rounded-2xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 text-left transition-all active:scale-[0.99] group"
              >
                <div className={`p-3 rounded-xl border ${opt.color} mr-3.5 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white">{opt.title}</h3>
                  <p className="text-xs text-zinc-400">{opt.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
