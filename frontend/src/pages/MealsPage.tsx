import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { offlineCache } from '../services/offlineCache';
import { Meal, Product } from '../types';
import { Plus, Utensils, Trash2, Check, AlertTriangle, Search, X, Calendar } from 'lucide-react';

const MEAL_TYPES = ['Pequeno-almoço', 'Almoço', 'Lanche', 'Jantar', 'Snacks'];

export const MealsPage: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetMealModal, setTargetMealModal] = useState<Meal | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);

  // New Meal Form State
  const [mealName, setMealName] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [searchingIngredients, setSearchingIngredients] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ product_id: number; quantity: number; unit: string }[]>([]);
  const navigate = useNavigate();

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (showCreateModal || targetMealModal) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [showCreateModal, targetMealModal]);

  useEffect(() => {
    loadMeals();
    loadProducts();
  }, []);

  // When opening create modal, refresh products to get any newly created foods
  useEffect(() => {
    if (showCreateModal) {
      loadProducts();
    }
  }, [showCreateModal]);

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
      const prods = await api.getProducts('', undefined, 100);
      const cached = offlineCache.getProducts();
      const map = new Map<number, Product>();
      cached.forEach(p => map.set(p.id, p));
      (Array.isArray(prods) ? prods : []).forEach(p => map.set(p.id, p));

      const combined = Array.from(map.values());
      // Sort custom products first so user foods are immediately accessible
      combined.sort((a, b) => {
        if (a.source === 'custom' && b.source !== 'custom') return -1;
        if (b.source === 'custom' && a.source !== 'custom') return 1;
        return a.name.localeCompare(b.name);
      });
      setAvailableProducts(combined);
    } catch (e) {
      console.warn('Error loading products for meal picker:', e);
      setAvailableProducts(offlineCache.getProducts());
    }
  };

  // Live search backend and offline cache when typing in modal
  useEffect(() => {
    if (!showCreateModal) return;
    const term = ingredientSearch.trim();
    if (!term) {
      loadProducts();
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingIngredients(true);
      try {
        const prods = await api.getProducts(term, undefined, 50);
        const termLower = term.toLowerCase();
        const cachedMatches = offlineCache.getProducts().filter(p =>
          p.name.toLowerCase().includes(termLower) ||
          (p.brand && p.brand.toLowerCase().includes(termLower)) ||
          p.barcode === term
        );
        const map = new Map<number, Product>();
        cachedMatches.forEach(p => map.set(p.id, p));
        (Array.isArray(prods) ? prods : []).forEach(p => map.set(p.id, p));

        const combined = Array.from(map.values());
        combined.sort((a, b) => {
          if (a.source === 'custom' && b.source !== 'custom') return -1;
          if (b.source === 'custom' && a.source !== 'custom') return 1;
          return a.name.localeCompare(b.name);
        });
        setAvailableProducts(combined);
      } catch (err) {
        console.warn('Error searching ingredients:', err);
      } finally {
        setSearchingIngredients(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [ingredientSearch, showCreateModal]);

  const handleConfirmAddToDiary = async (meal: Meal, mealType: string) => {
    setAddingId(meal.id);
    try {
      await api.addMealToDiary(meal.id, mealType);
      setSuccessId(meal.id);
      setTargetMealModal(null);
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
      setIngredientSearch('');
    } catch (err) {
      alert('Erro ao criar refeição.');
    }
  };

  const addItemToMeal = (product: Product) => {
    const existing = selectedItems.find(it => it.product_id === product.id);
    if (existing) {
      setSelectedItems(prev => prev.map(it => 
        it.product_id === product.id 
          ? { ...it, quantity: it.quantity + (product.serving_size || 50) } 
          : it
      ));
    } else {
      setSelectedItems([
        ...selectedItems,
        { 
          product_id: product.id, 
          quantity: product.serving_size || 100, 
          unit: product.serving_unit || 'g' 
        }
      ]);
    }
    setIngredientSearch('');
  };

  // Filter available products by search term
  const filteredProducts = useMemo(() => {
    if (!ingredientSearch.trim()) {
      return availableProducts.slice(0, 25);
    }
    const q = ingredientSearch.toLowerCase().trim();
    return availableProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      p.barcode === ingredientSearch.trim()
    ).slice(0, 35);
  }, [availableProducts, ingredientSearch]);

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Refeições Guardadas</h2>
          <p className="text-xs text-zinc-400">Combinações prontas para registo no diário</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-3.5 py-2 rounded-full transition-colors shadow-md shadow-emerald-500/20 active:scale-95"
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
                    title="Eliminar refeição"
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

                {/* Add Meal to Diary Action (Opens Slot Picker) */}
                <button
                  onClick={() => setTargetMealModal(meal)}
                  disabled={addingId === meal.id || successId === meal.id}
                  className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
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

      {/* Target Meal Slot Modal (Choose Breakfast, Lunch, Dinner...) */}
      {targetMealModal && (
        <div 
          onClick={() => setTargetMealModal(null)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Adicionar ao Diário</h3>
                <p className="text-xs text-zinc-400 truncate max-w-[240px]">{targetMealModal.name}</p>
              </div>
              <button 
                onClick={() => setTargetMealModal(null)} 
                className="p-1.5 text-zinc-400 hover:text-white rounded-full bg-zinc-800/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 font-medium">Em qual refeição pretendes registar?</p>

            <div className="grid grid-cols-1 gap-2">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleConfirmAddToDiary(targetMealModal, type)}
                  disabled={addingId === targetMealModal.id}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40 border border-zinc-700/60 text-xs font-bold text-left flex items-center justify-between transition-colors active:scale-[0.98]"
                >
                  <span>{type}</span>
                  <Plus className="w-3.5 h-3.5 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Meal Modal with Searchable Ingredients */}
      {showCreateModal && (
        <div 
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 max-h-[88vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Nova Refeição Guardada</h3>
                <p className="text-xs text-zinc-400">Junta alimentos e cria uma refeição pré-feita</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="p-1.5 text-zinc-400 hover:text-white rounded-full bg-zinc-800/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Nome da Refeição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pequeno-almoço habitual, Batido pós-treino"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Searchable Ingredient Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">Pesquisar e Adicionar Alimentos</label>
                  <button
                    type="button"
                    onClick={() => navigate('/products/new?returnTo=/meals')}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar novo alimento</span>
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome, marca ou alimento criado..."
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                  {searchingIngredients ? (
                    <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin absolute right-3 top-3" />
                  ) : ingredientSearch ? (
                    <button
                      type="button"
                      onClick={() => setIngredientSearch('')}
                      className="absolute right-3 top-3 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                {/* Filtered suggestions list */}
                <div className="max-h-48 overflow-y-auto divide-y divide-zinc-800/50 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => addItemToMeal(p)}
                        className="p-2.5 flex items-center justify-between hover:bg-zinc-800/60 cursor-pointer transition-colors text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-zinc-200 truncate">{p.name}</p>
                            {p.source === 'custom' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                                Criado por ti
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500">
                            {p.brand || 'Genérico'} • {p.calories_per_100 ?? '--'} kcal/100g
                          </p>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <p className="text-xs text-zinc-400">
                        Nenhum alimento encontrado com "{ingredientSearch}"
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(`/products/new?returnTo=/meals&name=${encodeURIComponent(ingredientSearch)}`)}
                        className="text-xs font-bold text-emerald-400 hover:underline"
                      >
                        + Criar "{ingredientSearch}" agora
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Ingredients List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-zinc-300">
                    Ingredientes Escolhidos ({selectedItems.length})
                  </h4>
                  {selectedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedItems([])}
                      className="text-[10px] text-zinc-500 hover:text-red-400"
                    >
                      Limpar todos
                    </button>
                  )}
                </div>

                {selectedItems.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic p-2 bg-zinc-950 rounded-xl border border-zinc-800/50 text-center">
                    Pesquisa e clica num alimento acima para adicionar.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {selectedItems.map((item, idx) => {
                      const p = availableProducts.find(prod => prod.id === item.product_id);
                      return (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
                        >
                          <span className="text-white truncate flex-1 pr-2 font-medium">
                            {p?.name || 'Alimento'}
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setSelectedItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                            }}
                            className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-center text-white font-mono mr-2 focus:outline-none focus:border-emerald-500"
                          />
                          <span className="text-zinc-400 mr-2 text-[11px] font-mono">{item.unit}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedItems(prev => prev.filter((_, i) => i !== idx))}
                            className="text-zinc-500 hover:text-red-400 font-bold p-1"
                            title="Remover ingrediente"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={selectedItems.length === 0 || !mealName.trim()}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs rounded-xl transition-colors shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Guardar Refeição ({selectedItems.length} ingredientes)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
