import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Save, Target } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const [calories, setCalories] = useState<number>(2200);
  const [protein, setProtein] = useState<number>(180);
  const [carbs, setCarbs] = useState<number>(220);
  const [fat, setFat] = useState<number>(70);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const g = await api.getGoals();
      setCalories(g.calories);
      setProtein(g.protein);
      setCarbs(g.carbs);
      setFat(g.fat);
    } catch (e) {
      console.warn('Failed loading goals:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateGoals({ calories, protein, carbs, fat });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2500);
    } catch (err) {
      alert('Erro ao guardar objetivos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h2 className="text-base font-bold text-white flex items-center gap-1.5">
          <Target className="w-4 h-4 text-emerald-400" />
          <span>Objetivos Nutricionais</span>
        </h2>
        <div className="w-12"></div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-bold text-center">
          Objetivos atualizados com sucesso!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-4">
          <div>
            <label className="text-xs text-amber-400 font-bold block mb-1">Calorias Diárias (kcal)</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-blue-400 font-bold block mb-1">Proteína Diária (g)</label>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-emerald-400 font-bold block mb-1">Hidratos Diários (g)</label>
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-purple-400 font-bold block mb-1">Gordura Diária (g)</label>
            <input
              type="number"
              value={fat}
              onChange={(e) => setFat(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Save className="w-5 h-5 stroke-[2.5]" />
          <span>{saving ? 'A guardar...' : 'Guardar Alterações'}</span>
        </button>
      </form>
    </div>
  );
};
