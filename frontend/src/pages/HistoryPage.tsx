import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DailySummary } from '../types';
import { TrendingUp, Calendar, Flame } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [daysCount, setDaysCount] = useState<number>(7);
  const [historyData, setHistoryData] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory(daysCount);
  }, [daysCount]);

  const loadHistory = async (days: number) => {
    setLoading(true);
    const results: DailySummary[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      try {
        const sum = await api.getDiaryByDate(dateStr);
        results.push(sum);
      } catch (e) {}
    }

    setHistoryData(results);
    setLoading(false);
  };

  const avgCalories = historyData.length > 0
    ? Math.round(historyData.reduce((acc, curr) => acc + curr.total_calories, 0) / historyData.length)
    : 0;

  const avgProtein = historyData.length > 0
    ? Math.round(historyData.reduce((acc, curr) => acc + curr.total_protein, 0) / historyData.length)
    : 0;

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">Histórico de Consumo</h2>

        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs font-bold">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDaysCount(d)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                daysCount === d ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {d} dias
            </button>
          ))}
        </div>
      </div>

      {/* Averages Banner */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Média Diária Calorias</span>
          <strong className="text-2xl font-black text-amber-400 font-mono">{avgCalories} <span className="text-xs text-zinc-400 font-normal">kcal</span></strong>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Média Diária Proteína</span>
          <strong className="text-2xl font-black text-blue-400 font-mono">{avgProtein} <span className="text-xs text-zinc-400 font-normal">g</span></strong>
        </div>
      </div>

      {/* Simplified Micro-Bar Chart */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Evolução das Calorias Diárias</span>
        </h3>

        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500">A carregar histórico...</div>
        ) : (
          <div className="flex items-end justify-between gap-1.5 h-32 pt-4 border-b border-zinc-800">
            {historyData.slice(0, 14).reverse().map((day, idx) => {
              const maxCal = 2800;
              const heightPct = Math.min((day.total_calories / maxCal) * 100, 100);
              const dateLabel = new Date(day.date + 'T00:00:00').getDate();
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full bg-zinc-800 rounded-t-sm h-full flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all"
                      style={{ height: `${heightPct}%` }}
                      title={`${day.date}: ${day.total_calories} kcal`}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500">{dateLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History Log List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-300">Registo por Dia</h3>
        {historyData.map((item) => (
          <div key={item.date} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="font-bold text-white">
                {new Date(item.date + 'T00:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div className="flex gap-3 font-mono">
              <span className="text-amber-400 font-bold">{item.total_calories} kcal</span>
              <span className="text-blue-400">P: {item.total_protein}g</span>
              <span className="text-emerald-400">H: {item.total_carbs}g</span>
              <span className="text-purple-400">G: {item.total_fat}g</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
