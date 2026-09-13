import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { WeightEntry } from '../types';
import { Scale, Plus, Trash2, TrendingDown } from 'lucide-react';

export const WeightPage: React.FC = () => {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightInput, setWeightInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWeightEntries();
  }, []);

  const loadWeightEntries = async () => {
    setLoading(true);
    try {
      const data = await api.getWeightEntries(90);
      setEntries(data);
    } catch (err) {
      console.warn('Error loading weight entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightInput);
    if (!val || val <= 0) return;

    setSubmitting(true);
    try {
      const newEntry = await api.addWeightEntry(val);
      setEntries([...entries, newEntry]);
      setWeightInput('');
    } catch (err) {
      alert('Erro ao registar peso.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Eliminar registo de peso?')) {
      try {
        await api.deleteWeightEntry(id);
        setEntries(prev => prev.filter(e => e.id !== id));
      } catch (err) {
        alert('Erro ao eliminar registo.');
      }
    }
  };

  const latestWeight = entries.length > 0 ? entries[entries.length - 1].weight : null;
  const firstWeight = entries.length > 0 ? entries[0].weight : null;
  const diff = (latestWeight && firstWeight) ? Math.round((latestWeight - firstWeight) * 10) / 10 : 0;

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Registo de Peso Corporal</h2>
          <p className="text-xs text-zinc-400">Acompanha a tua evolução temporal</p>
        </div>
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Scale className="w-5 h-5" />
        </div>
      </div>

      {/* Add Weight Form Card */}
      <form onSubmit={handleAddWeight} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex gap-2">
        <input
          type="number"
          step="0.1"
          placeholder="Ex: 78.5 kg"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!weightInput || submitting}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registar</span>
        </button>
      </form>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Último Peso</span>
          <strong className="text-2xl font-black text-white font-mono">
            {latestWeight ?? '--'} <span className="text-xs text-zinc-400 font-normal">kg</span>
          </strong>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Variação Total</span>
          <strong className={`text-2xl font-black font-mono ${diff <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {diff > 0 ? `+${diff}` : diff} <span className="text-xs text-zinc-400 font-normal">kg</span>
          </strong>
        </div>
      </div>

      {/* Weight Log Table */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-zinc-300">Histórico de Registos</h3>

        {loading ? (
          <div className="p-6 text-center text-xs text-zinc-500">A carregar...</div>
        ) : entries.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {entries.slice().reverse().map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  {new Date(item.recorded_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-3">
                  <strong className="text-white font-mono text-sm">{item.weight} kg</strong>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-zinc-500">Ainda não registaste peso corporal.</div>
        )}
      </div>
    </div>
  );
};
