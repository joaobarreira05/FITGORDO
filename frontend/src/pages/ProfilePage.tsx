import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, clearToken } from '../services/api';
import { User } from '../types';
import { User as UserIcon, Share, Smartphone, Target, Scale, History, LogOut, Lock, Mail, RefreshCw } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) {
      api.getMe().then(setUser).catch(() => setUser(null));
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      if (authMode === 'register') {
        const res = await api.register(email, password);
        setUser(res.user);
      } else {
        await api.login(email, password);
        const me = await api.getMe();
        setUser(me);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
  };

  const handleClearCacheAndReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const k of keys) await caches.delete(k);
      }
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }
    window.location.reload();
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Perfil & Definições</h2>
        <p className="text-xs text-zinc-400 font-medium">Conta, objetivos e manutenção da app</p>
      </div>

      {/* iPhone PWA Installation Instruction Banner */}
      <div className="bg-gradient-to-br from-emerald-950/80 to-zinc-900 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
          <h3 className="text-xs font-bold text-white">Instalar no iPhone (PWA Standalone)</h3>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Para utilizar o FITGORDO como aplicação nativa sem barra do browser:
        </p>
        <div className="bg-zinc-950/80 p-3 rounded-xl border border-emerald-500/20 text-xs font-semibold text-emerald-300 flex items-center gap-2">
          <Share className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Safari → Partilhar → Adicionar ao ecrã principal.</span>
        </div>
      </div>

      {/* Account Info or Login Form */}
      {user ? (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                {user.email.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Sessão Ativa</span>
                <strong className="text-xs text-white">{user.email}</strong>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-400 hover:text-red-400 rounded-xl hover:bg-zinc-800 transition-colors"
              title="Terminar Sessão"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-bold text-white">
              {authMode === 'login' ? 'Iniciar Sessão' : 'Criar Conta'}
            </h3>
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              {authMode === 'login' ? 'Criar conta' : 'Já tenho conta'}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 font-semibold">{errorMsg}</p>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="utilizador@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Palavra-passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl transition-colors"
            >
              {loading ? 'A processar...' : authMode === 'login' ? 'Entrar' : 'Registar Conta'}
            </button>
          </form>
        </div>
      )}

      {/* Shortcut Links */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800 text-xs font-semibold">
        <button
          onClick={() => navigate('/settings/goals')}
          className="w-full p-3.5 text-left text-zinc-200 hover:bg-zinc-800/60 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Objetivos Nutricionais</span>
          </div>
          <span className="text-zinc-500 font-normal">Calorias & Macros</span>
        </button>

        <button
          onClick={() => navigate('/history')}
          className="w-full p-3.5 text-left text-zinc-200 hover:bg-zinc-800/60 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-sky-400" />
            <span>Histórico & Estatísticas</span>
          </div>
          <span className="text-zinc-500 font-normal">7 / 30 / 90 dias</span>
        </button>

        <button
          onClick={() => navigate('/weight')}
          className="w-full p-3.5 text-left text-zinc-200 hover:bg-zinc-800/60 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-purple-400" />
            <span>Registo de Peso Corporal</span>
          </div>
          <span className="text-zinc-500 font-normal">Evolução</span>
        </button>
      </div>

      {/* App Cache & Update Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleClearCacheAndReload}
          className="w-full py-3 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-emerald-400 border border-zinc-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-98"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Verificar Atualizações & Limpar Cache</span>
        </button>
        <p className="text-[10px] text-zinc-500 text-center mt-1.5">
          FITGORDO v1.2 • Clica se notares conteúdo em cache antigo
        </p>
      </div>
    </div>
  );
};
