import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { offlineCache } from '../services/offlineCache';
import { DailySummary, FoodEntry } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2, Plus } from 'lucide-react';

interface DiaryPageProps {
  onOpenQuickAdd: (mealType?: string) => void;
}

const MEAL_TYPES = ['Pequeno-almoço', 'Almoço', 'Lanche', 'Jantar', 'Snacks'];

export const DiaryPage: React.FC<DiaryPageProps> = ({ onOpenQuickAdd }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<DailySummary | null>(() => offlineCache.getDiary(new Date().toISOString().split('T')[0]));
  const [loading, setLoading] = useState(!summary);

  useEffect(() => {
    loadDiaryData(selectedDate);
  }, [selectedDate]);

  const loadDiaryData = async (dateStr: string) => {
    try {
      const data = await api.getDiaryByDate(dateStr);
      setSummary(data);
    } catch (err) {
      console.warn('Error loading diary data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (offsetDays: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offsetDays);
    const nextDate = d.toISOString().split('T')[0];
    const cached = offlineCache.getDiary(nextDate);
    if (cached) setSummary(cached);
    setSelectedDate(nextDate);
  };

  const handleDeleteEntry = async (id: number) => {
    if (window.confirm('Remover este alimento do diário?')) {
      try {
        await api.deleteFoodEntry(id);
        loadDiaryData(selectedDate);
      } catch (err) {
        alert('Erro ao eliminar item.');
      }
    }
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Date Navigator Header */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-2.5 rounded-2xl">
        <button
          onClick={() => handleDateChange(-1)}
          className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-white">
            {isToday ? 'Hoje, ' : ''}
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-PT', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>

        <button
          onClick={() => handleDateChange(1)}
          className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Daily Overview Sticky Mini Card */}
      {summary ? (
        <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-2xl flex items-center justify-between text-xs min-h-[72px]">
          <div>
            <span className="text-zinc-400 block">Total do Dia</span>
            <strong className="text-amber-400 text-base font-mono font-bold">
              {summary.total_calories} <span className="text-xs text-zinc-400 font-normal">kcal</span>
            </strong>
          </div>
          <div className="flex items-center gap-3 text-zinc-300 font-mono text-right">
            <div>
              <span className="text-[10px] text-zinc-500 block">PROT</span>
              <strong className="text-blue-400">{summary.total_protein}g</strong>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">HIDR</span>
              <strong className="text-emerald-400">{summary.total_carbs}g</strong>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">GORD</span>
              <strong className="text-purple-400">{summary.total_fat}g</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between text-xs min-h-[72px] animate-pulse">
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-zinc-800 rounded"></div>
            <div className="h-5 w-24 bg-zinc-800 rounded"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-7 w-10 bg-zinc-800 rounded"></div>
            <div className="h-7 w-10 bg-zinc-800 rounded"></div>
            <div className="h-7 w-10 bg-zinc-800 rounded"></div>
          </div>
        </div>
      )}

      {/* Meals Sections */}
      <div className="space-y-4">
        {MEAL_TYPES.map((mealType) => {
          const entriesForMeal = summary?.entries?.filter(e => e.meal_type === mealType) || [];
          const mealCalories = entriesForMeal.reduce((acc, curr) => acc + (curr.nutrition.calories || 0), 0);
          const mealProtein = entriesForMeal.reduce((acc, curr) => acc + (curr.nutrition.protein || 0), 0);
          const mealCarbs = entriesForMeal.reduce((acc, curr) => acc + (curr.nutrition.carbs || 0), 0);
          const mealFat = entriesForMeal.reduce((acc, curr) => acc + (curr.nutrition.fat || 0), 0);

          return (
            <div key={mealType} className="bg-zinc-900/70 border border-zinc-800/70 rounded-2xl overflow-hidden">
              {/* Meal Section Header */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-800/40 border-b border-zinc-800/60">
                <div>
                  <h3 className="text-sm font-bold text-white">{mealType}</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {Math.round(mealCalories)} kcal • P: {Math.round(mealProtein)}g • H: {Math.round(mealCarbs)}g • G: {Math.round(mealFat)}g
                  </p>
                </div>
                <button
                  onClick={() => onOpenQuickAdd(mealType)}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-zinc-800/40">
                {entriesForMeal.length > 0 ? (
                  entriesForMeal.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 hover:bg-zinc-800/30 transition-colors">
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="text-xs font-semibold text-zinc-100 truncate">{entry.product.name}</h4>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          {entry.quantity} {entry.unit} • {entry.nutrition.calories ?? '--'} kcal
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-[11px] font-mono text-zinc-400">
                          <span className="text-blue-400 font-bold">{entry.nutrition.protein ?? 0}g</span> P
                        </div>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-zinc-500">
                    Sem alimentos nesta refeição.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
