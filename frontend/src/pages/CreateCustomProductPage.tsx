import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Save } from 'lucide-react';

export const CreateCustomProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultBarcode = searchParams.get('barcode') || '';
  const defaultName = searchParams.get('name') || '';

  const [formData, setFormData] = useState({
    name: defaultName,
    brand: '',
    barcode: defaultBarcode,
    image_url: '',
    category: '',
    serving_size: 100,
    serving_unit: 'g',
    calories_per_100: '',
    protein_per_100: '',
    carbs_per_100: '',
    sugars_per_100: '',
    fat_per_100: '',
    saturated_fat_per_100: '',
    fiber_per_100: '',
    salt_per_100: '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('O nome do alimento é obrigatório.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const parseNum = (val: string) => val.trim() === '' ? null : parseFloat(val);

    try {
      const created = await api.createProduct({
        name: formData.name,
        brand: formData.brand || null,
        barcode: formData.barcode || null,
        image_url: formData.image_url || null,
        category: formData.category || null,
        serving_size: formData.serving_size,
        serving_unit: formData.serving_unit,
        calories_per_100: parseNum(formData.calories_per_100),
        protein_per_100: parseNum(formData.protein_per_100),
        carbs_per_100: parseNum(formData.carbs_per_100),
        sugars_per_100: parseNum(formData.sugars_per_100),
        fat_per_100: parseNum(formData.fat_per_100),
        saturated_fat_per_100: parseNum(formData.saturated_fat_per_100),
        fiber_per_100: parseNum(formData.fiber_per_100),
        salt_per_100: parseNum(formData.salt_per_100),
        source: 'custom',
      });

      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate(`/products/${created.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao guardar produto.');
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
        <h2 className="text-base font-bold text-white">Criar Alimento Manualmente</h2>
        <div className="w-12"></div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-emerald-400">Informação Geral</h3>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nome do Produto *</label>
            <input
              type="text"
              required
              placeholder="Ex: Peito de Peru Fumado"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Marca</label>
              <input
                type="text"
                placeholder="Ex: Nobre"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Código de Barras</label>
              <input
                type="text"
                placeholder="Opcional"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Nutritional values per 100g */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-emerald-400">Valores por 100 g / 100 ml</h3>
            <span className="text-[10px] text-zinc-500">Campos em branco = Não disponível</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-amber-400 font-bold block mb-1">Calorias (kcal)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 105"
                value={formData.calories_per_100}
                onChange={(e) => setFormData({ ...formData, calories_per_100: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-blue-400 font-bold block mb-1">Proteína (g)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 22"
                value={formData.protein_per_100}
                onChange={(e) => setFormData({ ...formData, protein_per_100: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-emerald-400 font-bold block mb-1">Hidratos (g)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 1"
                value={formData.carbs_per_100}
                onChange={(e) => setFormData({ ...formData, carbs_per_100: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-purple-400 font-bold block mb-1">Gordura (g)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 2"
                value={formData.fat_per_100}
                onChange={(e) => setFormData({ ...formData, fat_per_100: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Save className="w-5 h-5 stroke-[2.5]" />
          <span>{saving ? 'A guardar...' : 'Guardar Alimento'}</span>
        </button>
      </form>
    </div>
  );
};
