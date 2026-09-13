import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Meal, Product } from '../types';
import { Plus, Utensils, Trash2, Check, AlertTriangle } from 'lucide-react';

export const MealsPage: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  // New Meal Form State
  const [mealName, setMealName] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ product_id: number; quantity: number; unit: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadMeals();
    loadProducts();
  }, []);

  const loadMeals = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const data = await api.getMeals();
      setMeals(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('Error loading meals:', err);
      setErrorState('Não foi possível carregar as refeições.');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const prods = await api.getProducts();
      setAvailableProducts(Array.isArray(prods) ? prods : []);
    } catch (e) {}
  };

  const handleAddMealToDiary = async (mealId: number) => {
    setAddingId(mealId);
    try {
      await api.addMealToDiary(mealId, 'Almoço');
      setSuccessId(mealId);
      setTimeout(() => {
        setSuccessId(null);
        navigate('/diary');
      }, 800);
    } catch (err) {
      alert('Erro ao adicionar refeição ao diário.');
    } finally {
      setAddingId(null);
    }
  };

  const handleDeleteMeal = async (mealId: number) => {
    if (window.confirm('Apagar esta refeição guardada?')) {
      try {
        await api.deleteMeal(mealId);
        setMeals(prev => prev.filter(m => m.id !== mealId));
      } catch (err) {
        alert('Erro ao eliminar refeição.');
      }
    }
  };

  const handleCreateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim() || selectedItems.length === 0) {
      alert('Por favor insira um nome e selecione pelo menos um ingrediente.');
      return;
    }

    try {
      const newMeal = await api.createMeal(mealName, selectedItems);
      setMeals([newMeal, ...meals]);
      setShowCreateModal(false);
      setMealName('');
      setSelectedItems([]);
    } catch (err) {
      alert('Erro ao criar refeição.');
    }
  };

  const addItemToMeal = (productId: number) => {
    const prod = availableProducts.find(p => p.id === productId);
    if (!prod) return;
    setSelectedItems([
      ...selectedItems,
      { product_id: productId, quantity: prod.serving_size || 100, unit: prod.serving_unit || 'g' }
    ]);
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Refeições Guardadas</h2>
          <p className="text-xs text-zinc-400">Combinações prontas para registo em 1 clique</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-3.5 py-2 rounded-full transition-colors shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Criar Refeição</span>
        </button>
      </div>

      {errorState && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorState}</span>
        </div>
      )}

      {/* Meals List */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : meals && meals.length > 0 ? (
        <div className="space-y-3">
          {meals.map((meal) => {
            const items = meal?.items || [];
            const nutrition = meal?.total_nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
            return (
              <div
                key={meal.id}
                className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{meal?.name || 'Refeição'}</h3>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        {items.length} ingrediente(s)
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMeal(meal.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Total Macros Pill */}
                <div className="bg-zinc-950/80 p-2.5 rounded-xl flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-bold">
                    {nutrition.calories ?? 0} <span className="text-[10px] font-normal text-zinc-400">kcal</span>
                  </span>
                  <div className="flex gap-2 text-[11px]">
                    <span className="text-blue-400">P: {nutrition.protein ?? 0}g</span>
                    <span className="text-emerald-400">H: {nutrition.carbs ?? 0}g</span>
                    <span className="text-purple-400">G: {nutrition.fat ?? 0}g</span>
                  </div>
                </div>

                {/* Ingredients List */}
                <div className="divide-y divide-zinc-800/40 text-xs text-zinc-400 pt-1">
                  {items.map((it) => (
                    <div key={it.id || Math.random()} className="py-1 flex justify-between">
                      <span className="truncate pr-2">{it?.product?.name || 'Alimento'}</span>
                      <strong className="text-zinc-200 font-mono shrink-0">{it?.quantity || 100} {it?.unit || 'g'}</strong>
                    </div>
                  ))}
                </div>

                {/* Add Meal to Diary Action */}
                <button
                  onClick={() => handleAddMealToDiary(meal.id)}
                  disabled={addingId === meal.id || successId === meal.id}
                  className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {successId === meal.id ? (
                    <>
                      <Check className="w-4 h-4" /> Refeição Adicionada!
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Adicionar Refeição ao Diário
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/40 space-y-2">
          <p className="text-xs text-zinc-400">Ainda não tens refeições guardadas.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs font-bold text-emerald-400 hover:underline inline-block"
          >
            + Criar a tua primeira refeição habitual
          </button>
        </div>
      )}

      {/* Create Meal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Nova Refeição Guardada</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateMeal} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nome da Refeição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pequeno-almoço Habitual"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Add Ingredient Picker */}
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Escolher Ingredientes Guardados</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addItemToMeal(parseInt(e.target.value, 10));
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Selecionar Alimento --</option>
                  {availableProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.brand || 'Genérico'})</option>
                  ))}
                </select>
              </div>

              {/* Selected Ingredients List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-300">Ingredientes Selecionados ({selectedItems.length})</h4>
                {selectedItems.map((item, idx) => {
                  const p = availableProducts.find(prod => prod.id === item.product_id);
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                      <span className="text-white truncate flex-1 pr-2">{p?.name || 'Alimento'}</span>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setSelectedItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                        }}
                        className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-center text-white font-mono mr-2"
                      />
                      <span className="text-zinc-400 mr-2">{item.unit}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedItems(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl transition-colors"
              >
                Guardar Refeição
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
