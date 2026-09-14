import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { offlineCache } from '../services/offlineCache';
import { DailySummary, FoodEntry } from '../types';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, Trash2, Plus } from 'lucide-react';

interface DiaryPageProps {
  onOpenQuickAdd: (mealType?: string) => void;
}

const MEAL_TYPES = ['Pequeno-almoço', 'Almoço', 'Lanche', 'Jantar', 'Snacks'];

export const DiaryPage: React.FC<DiaryPageProps> = ({ onOpenQuickAdd }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<DailySummary | null>(() => offlineCache.getDiary(new Date().toISOString().split('T')[0]));
  const [loading, setLoading] = useState(!summary);
  const [openMeals, setOpenMeals] = useState<Record<string, boolean>>({
    'Pequeno-almoço': true,
    'Almoço': true,
    'Lanche': true,
    'Jantar': true,
    'Snacks': true,
  });

  const toggleMealAccordion = (mealType: string) => {
    setOpenMeals(prev => ({
      ...prev,
      [mealType]: !prev[mealType]
    }));
  };

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

      {/* Meals Sections Accordions */}
      <div className="space-y-3">
        {MEAL_TYPES.map((mealType) => {
          const entriesForMeal = summary?.entries?.filter(e => e.meal_type === mealType) || [];
          const mealCalories = entriesForMeal.reduce((acc, curr) => acc + (curr.nutrition.calories || 0), 0);
          const mealProtein = entriesForMeal.reduce((acc, curr) => acc + (curr.nutrition.protein || 0), 0);
          const mealCarbs = entriesForMeal.reduce((acc, curr) => acc + (curr.nutrition.carbs || 0), 0);
          const mealFat = entriesForMeal.reduce((acc, curr) => acc + (curr.nutrition.fat || 0), 0);
          const isOpen = openMeals[mealType] ?? true;

          return (
            <div 
              key={mealType} 
              className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden transition-colors"
            >
              {/* Meal Section Accordion Header */}
              <div 
                onClick={() => toggleMealAccordion(mealType)}
                className="flex items-center justify-between p-3.5 bg-zinc-800/40 hover:bg-zinc-800/60 cursor-pointer select-none transition-colors border-b border-zinc-800/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1 rounded-lg bg-zinc-800 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400 bg-emerald-500/10' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{mealType}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono shrink-0">
                        {entriesForMeal.length} {entriesForMeal.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                    {!isOpen && entriesForMeal.length > 0 && (
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">
                        {Math.round(mealCalories)} kcal • P: {Math.round(mealProtein * 10) / 10}g • H: {Math.round(mealCarbs * 10) / 10}g • G: {Math.round(mealFat * 10) / 10}g
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenQuickAdd(mealType);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg transition-colors active:scale-95"
                    title={`Adicionar alimento a ${mealType}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {/* Accordion Content */}
              {isOpen && (
                <div>
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
                              title="Remover item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3.5 text-center text-xs text-zinc-500">
                        Sem alimentos nesta refeição. Clica em "Adicionar" para registar.
                      </div>
                    )}
                  </div>

                  {/* Accordion Footer: Macronutrient Totals for this specific meal */}
                  {entriesForMeal.length > 0 && (
                    <div className="bg-zinc-950/80 p-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <span className="text-zinc-400 font-sans text-[11px] font-semibold uppercase tracking-wider">
                        Total {mealType}:
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <span className="text-amber-400 font-bold">
                          {Math.round(mealCalories)} <span className="text-[10px] text-zinc-500 font-normal">kcal</span>
                        </span>
                        <span className="text-blue-400 font-semibold">
                          {Math.round(mealProtein * 10) / 10}g <span className="text-[10px] text-zinc-500 font-normal">P</span>
                        </span>
                        <span className="text-emerald-400 font-semibold">
                          {Math.round(mealCarbs * 10) / 10}g <span className="text-[10px] text-zinc-500 font-normal">H</span>
                        </span>
                        <span className="text-purple-400 font-semibold">
                          {Math.round(mealFat * 10) / 10}g <span className="text-[10px] text-zinc-500 font-normal">G</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
