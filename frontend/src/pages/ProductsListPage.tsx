import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Product } from '../types';
import { Search, Heart, History, Plus, Trash2, Edit, ChevronRight } from 'lucide-react';

export const ProductsListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all'; // 'all', 'recent', 'favorites'
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, [search, activeTab]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const isFav = activeTab === 'favorites' ? true : undefined;
      const data = await api.getProducts(search, isFav);
      setProducts(data);
    } catch (err) {
      console.warn('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const updated = await api.toggleFavorite(id);
      setProducts(prev => prev.map(p => p.id === id ? updated : p));
    } catch (err) {
      console.warn('Error toggling favorite:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Eliminar este produto?')) {
      try {
        await api.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        alert('Erro ao apagar produto.');
      }
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Header & Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">Produtos Guardados</h2>
        <button
          onClick={() => navigate('/products/new')}
          className="flex items-center gap-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-3 py-1.5 rounded-full transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Alimento</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Pesquisar por nome ou código de barras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Tabs Navigator */}
      <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs font-bold">
        <button
          onClick={() => setSearchParams({ tab: 'all' })}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            activeTab === 'all' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Todos ({products.length})
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'recent' })}
          className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'recent' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Recentes</span>
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'favorites' })}
          className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'favorites' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Favoritos</span>
        </button>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/products/${p.id}`)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-12 h-12 object-cover rounded-xl bg-zinc-800 border border-zinc-700/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                    SEM FOTO
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white truncate">{p.name}</h3>
                  <p className="text-[11px] text-zinc-400 truncate">{p.brand || 'Sem marca'}</p>
                  <span className="text-[10px] font-mono text-amber-400">
                    {p.calories_per_100 ?? '--'} kcal / 100g
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => toggleFavorite(e, p.id)}
                  className={`p-2 rounded-xl border transition-colors ${
                    p.favorite ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : 'text-zinc-500 border-transparent hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${p.favorite ? 'fill-pink-400' : ''}`} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, p.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/40 space-y-2">
          <p className="text-xs text-zinc-400">Nenhum produto encontrado.</p>
          <button
            onClick={() => navigate('/products/new')}
            className="text-xs font-bold text-emerald-400 hover:underline inline-block"
          >
            + Criar novo produto manualmente
          </button>
        </div>
      )}
    </div>
  );
};
