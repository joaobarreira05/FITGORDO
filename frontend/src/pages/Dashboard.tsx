import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DailySummary } from '../types';
import { MacroProgressBar } from '../components/MacroProgressBar';
import { Plus, Flame, Dumbbell, Wheat, Droplets, ChevronRight, QrCode } from 'lucide-react';

interface DashboardProps {
  onOpenQuickAdd: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenQuickAdd }) => {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    setLoading(true);
    try {
      const data = await api.getTodaySummary();
      setSummary(data);
    } catch (err) {
      console.warn('Could not load today summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const caloriesGoal = summary?.goal?.calories || 2200;
  const proteinGoal = summary?.goal?.protein || 180;
  const carbsGoal = summary?.goal?.carbs || 220;
  const fatGoal = summary?.goal?.fat || 70;

  const totalCal = summary?.total_calories || 0;
  const totalProt = summary?.total_protein || 0;
  const totalCarbs = summary?.total_carbs || 0;
  const totalFat = summary?.total_fat || 0;

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Date Banner & Main Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Hoje</h2>
          <p className="text-xs text-zinc-400 font-medium">
            {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-bold text-xs rounded-full shadow-lg shadow-emerald-500/25 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Adicionar</span>
        </button>
      </div>

      {/* Main Calories Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/80 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div>
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Calorias</span>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {totalCal} <span className="text-sm font-normal text-zinc-400">/ {caloriesGoal} kcal</span>
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-400">Restantes</span>
            <div className="text-lg font-bold text-amber-400 font-mono">
              {Math.max(Math.round(caloriesGoal - totalCal), 0)} <span className="text-xs text-zinc-400">kcal</span>
            </div>
          </div>
        </div>

        {/* Big Bar */}
        <div className="w-full h-3.5 bg-zinc-800/80 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(Math.round((totalCal / caloriesGoal) * 100), 100)}%` }}
          />
        </div>
      </div>

      {/* Macros Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200">Macronutrientes</h3>
          <button
            onClick={() => navigate('/settings/goals')}
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            Editar Objetivos
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          <MacroProgressBar
            label="Proteína"
            current={totalProt}
            target={proteinGoal}
            unit="g"
            colorClass="bg-blue-500"
            bgClass="bg-blue-950/40"
          />
          <MacroProgressBar
            label="Hidratos de carbono"
            current={totalCarbs}
            target={carbsGoal}
            unit="g"
            colorClass="bg-emerald-500"
            bgClass="bg-emerald-950/40"
          />
          <MacroProgressBar
            label="Gordura"
            current={totalFat}
            target={fatGoal}
            unit="g"
            colorClass="bg-purple-500"
            bgClass="bg-purple-950/40"
          />
        </div>
      </div>

      {/* Quick Scanner Launch Tile */}
      <div
        onClick={() => navigate('/scanner')}
        className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-zinc-900 border border-emerald-500/30 cursor-pointer active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20">
            <QrCode className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Digitalizar Código de Barras</h4>
            <p className="text-xs text-zinc-400">Ler embalagem para registo imediato</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-zinc-400" />
      </div>

      {/* Recent Entries Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200">Refeições de Hoje</h3>
          <button
            onClick={() => navigate('/diary')}
            className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center"
          >
            <span>Ver Diário Completo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {summary?.entries && summary.entries.length > 0 ? (
          <div className="space-y-2">
            {summary.entries.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                onClick={() => navigate(`/products/${entry.product_id}`)}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:bg-zinc-800/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {entry.product.image_url ? (
                    <img
                      src={entry.product.image_url}
                      alt={entry.product.name}
                      className="w-10 h-10 object-cover rounded-lg bg-zinc-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                      FOOD
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{entry.product.name}</h4>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {entry.meal_type} • {entry.quantity} {entry.unit}
                    </p>
                  </div>
                </div>
                <div className="text-right pl-2">
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    {entry.nutrition.calories ?? '--'} kcal
                  </span>
                  <p className="text-[10px] text-zinc-400">
                    P: {entry.nutrition.protein ?? 0}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/40 space-y-2">
            <p className="text-xs text-zinc-400">Ainda não registaste nenhum alimento hoje.</p>
            <button
              onClick={onOpenQuickAdd}
              className="text-xs font-bold text-emerald-400 hover:underline inline-block"
            >
              + Adicionar o teu primeiro alimento
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
