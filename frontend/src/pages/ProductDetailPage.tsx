import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Product } from '../types';
import { ArrowLeft, Heart, Plus, Check, Info } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState<string>('g');
  const [selectedMeal, setSelectedMeal] = useState<string>('Pequeno-almoço');
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isBread = /p[aã]o|forma|fatia|tosta|broa|baguete|toast/i.test(product?.name || '');
  const sliceWeight = (product?.serving_size && product.serving_size >= 10 && product.serving_size <= 80)
    ? product.serving_size
    : 28;

  useEffect(() => {
    if (id && id !== 'new') {
      loadProduct(parseInt(id, 10));
    }
  }, [id]);

  const loadProduct = async (productId: number) => {
    setLoading(true);
    try {
      const data = await api.getProductById(productId);
      setProduct(data);
      const isBreadProduct = /p[aã]o|forma|fatia|tosta|broa|baguete|toast/i.test(data.name || '');
      if (isBreadProduct) {
        setUnit('fatias');
        setQuantity(2);
      } else if (data.serving_unit) {
        setUnit(data.serving_unit);
        if (data.serving_size) setQuantity(data.serving_size);
      } else if (data.serving_size) {
        setQuantity(data.serving_size);
      }
    } catch (err) {
      console.warn('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!product) return;
    try {
      const updated = await api.toggleFavorite(product.id);
      setProduct(updated);
    } catch (err) {
      console.warn('Error toggling favorite:', err);
    }
  };

  const handleAddToDiary = async () => {
    if (!product) return;
    setAdding(true);
    setErrorMessage(null);
    try {
      await api.addFoodEntry(selectedMeal, product.id, quantity, unit);
      setAddedSuccess(true);
      setTimeout(() => {
        navigate('/diary');
      }, 800);
    } catch (err: any) {
      console.error('Error adding to diary:', err);
      const msg = err?.message || 'Erro ao adicionar alimento ao diário.';
      setErrorMessage(msg);
    } finally {
      setAdding(false);
    }
  };

  // Recalculate nutrients based on quantity & unit
  const calcNutrient = (valPer100: number | null | undefined): string => {
    if (valPer100 === null || valPer100 === undefined) return 'Não disponível';
    let factor = quantity / 100.0;
    if (unit === 'fatia' || unit === 'fatias') {
      factor = (quantity * sliceWeight) / 100.0;
    } else if (unit === 'unit') {
      const serving = product?.serving_size || 100.0;
      factor = (quantity * serving) / 100.0;
    }
    return (Math.round(valPer100 * factor * 10) / 10).toString();
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-zinc-400">A carregar detalhes do produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-sm text-red-400 font-semibold">Produto não encontrado.</p>
        <button
          onClick={() => navigate('/products')}
          className="text-xs font-bold text-emerald-400 hover:underline"
        >
          Voltar aos produtos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-28 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <button
          onClick={toggleFavorite}
          className={`p-2 rounded-full border transition-colors ${
            product.favorite
              ? 'bg-pink-500/20 text-pink-400 border-pink-500/30'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
          }`}
        >
          <Heart className={`w-5 h-5 ${product.favorite ? 'fill-pink-400' : ''}`} />
        </button>
      </div>

      {/* Product Hero Info */}
      <div className="flex items-start gap-4 p-4 rounded-3xl bg-zinc-900 border border-zinc-800">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-20 h-20 object-cover rounded-2xl bg-zinc-800 shrink-0 border border-zinc-700/50"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
            SEM FOTO
          </div>
        )}

        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
            {product.brand || 'Marca genérica'}
          </span>
          <h2 className="text-lg font-black text-white leading-snug">{product.name}</h2>
          {product.barcode && (
            <p className="text-[11px] font-mono text-zinc-400 mt-1">EAN: {product.barcode}</p>
          )}
        </div>
      </div>

      {/* Quantity & Unit Calculator Controls */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-300">Quantidade Consumida</label>
          {(unit === 'fatias' || unit === 'fatia' || isBread) && (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              1 fatia ≈ {sliceWeight}g
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(parseFloat(e.target.value) || 0, 0))}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-bold font-mono text-white text-center focus:outline-none focus:border-emerald-500"
          />
          <select
            value={unit}
            onChange={(e) => {
              const newUnit = e.target.value;
              setUnit(newUnit);
              if ((newUnit === 'fatias' || newUnit === 'fatia') && quantity > 10) {
                setQuantity(2);
              } else if ((newUnit === 'g' || newUnit === 'ml') && quantity <= 10) {
                setQuantity(100);
              }
            }}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-xs font-bold text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="g">gramas (g)</option>
            <option value="ml">mililitros (ml)</option>
            <option value="fatias">fatias ({sliceWeight}g cada)</option>
            <option value="unit">unidades</option>
          </select>
        </div>

        {/* Quick Quantity Chips */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto">
          {unit === 'fatias' || unit === 'fatia' ? (
            <>
              {[1, 2, 3, 4, 6].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                    quantity === q
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700/50 hover:text-white'
                  }`}
                >
                  {q} {q === 1 ? 'fatia' : 'fatias'}
                </button>
              ))}
              <span className="text-[11px] text-zinc-500 ml-1 whitespace-nowrap">
                (≈{Math.round(quantity * sliceWeight)}g)
              </span>
            </>
          ) : (
            [50, 100, 150, 200, 250].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuantity(q)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                  quantity === q
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700/50 hover:text-white'
                }`}
              >
                {q}{unit === 'ml' ? 'ml' : 'g'}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Visual Macro Breakdown Card */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-zinc-300">Informação Nutricional por porção ({quantity} {unit})</h3>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] text-amber-400 font-bold block uppercase">Calorias</span>
            <strong className="text-xl font-mono font-black text-amber-400">
              {calcNutrient(product.calories_per_100)} <span className="text-xs font-normal">kcal</span>
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-[10px] text-blue-400 font-bold block uppercase">Proteína</span>
            <strong className="text-xl font-mono font-black text-blue-400">
              {calcNutrient(product.protein_per_100)} <span className="text-xs font-normal">g</span>
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-400 font-bold block uppercase">Hidratos</span>
            <strong className="text-xl font-mono font-black text-emerald-400">
              {calcNutrient(product.carbs_per_100)} <span className="text-xs font-normal">g</span>
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <span className="text-[10px] text-purple-400 font-bold block uppercase">Gordura</span>
            <strong className="text-xl font-mono font-black text-purple-400">
              {calcNutrient(product.fat_per_100)} <span className="text-xs font-normal">g</span>
            </strong>
          </div>
        </div>

        {/* Detailed Micronutrients Table */}
        <div className="pt-2 divide-y divide-zinc-800 text-xs">
          <div className="flex justify-between py-1.5 text-zinc-400">
            <span>Dos quais Açúcares:</span>
            <strong className="text-zinc-200">{calcNutrient(product.sugars_per_100)} {product.sugars_per_100 !== null ? 'g' : ''}</strong>
          </div>
          <div className="flex justify-between py-1.5 text-zinc-400">
            <span>Gordura Saturada:</span>
            <strong className="text-zinc-200">{calcNutrient(product.saturated_fat_per_100)} {product.saturated_fat_per_100 !== null ? 'g' : ''}</strong>
          </div>
          <div className="flex justify-between py-1.5 text-zinc-400">
            <span>Fibra Alimentar:</span>
            <strong className="text-zinc-200">{calcNutrient(product.fiber_per_100)} {product.fiber_per_100 !== null ? 'g' : ''}</strong>
          </div>
          <div className="flex justify-between py-1.5 text-zinc-400">
            <span>Sal:</span>
            <strong className="text-zinc-200">{calcNutrient(product.salt_per_100)} {product.salt_per_100 !== null ? 'g' : ''}</strong>
          </div>
        </div>
      </div>

      {/* Select Meal & Add Button */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold text-zinc-300 block">Adicionar à Refeição</label>
        
        <div className="grid grid-cols-3 gap-2">
          {['Pequeno-almoço', 'Almoço', 'Lanche', 'Jantar', 'Snacks'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMeal(m)}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                selectedMeal === m
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          onClick={handleAddToDiary}
          disabled={adding || addedSuccess}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          {addedSuccess ? (
            <>
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Adicionado ao Diário!</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Adicionar ao {selectedMeal}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
