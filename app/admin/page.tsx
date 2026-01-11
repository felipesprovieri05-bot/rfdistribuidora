'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '../../services/storage';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Se já estiver logado, redirecionar
    const currentAdmin = storage.getCurrentAdmin();
    if (currentAdmin) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Preencha todos os campos!');
      setIsLoading(false);
      return;
    }

    // Pequeno delay para melhor UX
    await new Promise(resolve => setTimeout(resolve, 300));

    const admin = storage.authenticateAdmin(username, password);
    
    if (admin) {
      router.push('/admin/dashboard');
    } else {
      setError('Usuário ou senha incorretos!');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0a0a0a] to-black relative overflow-hidden">
      {/* Efeitos de fundo decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF4500]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF4500]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF4500]/3 rounded-full blur-3xl"></div>
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo/Título */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF4500] to-[#FF5500] mb-6 shadow-2xl shadow-[#FF4500]/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">
            Painel <span className="text-[#FF4500]">Admin</span>
          </h1>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">
            Acesso Restrito
          </p>
        </div>

        {/* Card de Login */}
        <div className="relative overflow-hidden rounded-3xl border border-white/20 backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/0 shadow-2xl hover:shadow-[0_0_50px_rgba(255,69,0,0.2)] transition-all duration-500">
          {/* Efeito glass */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#FF4500]/5 via-transparent to-transparent"></div>
          
          {/* Conteúdo do card */}
          <div className="relative p-8 sm:p-10">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-2 border-red-500/40 backdrop-blur-xl animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-400 text-sm font-bold">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Usuário */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
                  Usuário
                </label>
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF4500]/20 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Digite seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] transition-all text-white placeholder:text-gray-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF4500]/20 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
                  <input 
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] transition-all text-white placeholder:text-gray-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Botão de Login */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-[#FF4500] to-[#FF5500] text-white font-black rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-[#FF4500]/30 hover:shadow-[#FF4500]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF5500] to-[#FF6500] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 uppercase tracking-wider">
                  {isLoading ? 'Entrando...' : 'Entrar no Painel'}
                </span>
              </button>
            </form>

            {/* Informações de ajuda */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <svg className="w-5 h-5 text-[#FF4500] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
                    Credenciais Padrão
                  </p>
                  <p className="text-sm text-gray-500 font-bold">
                    Usuário: <span className="text-white">admin</span>
                  </p>
                  <p className="text-sm text-gray-500 font-bold">
                    Senha: <span className="text-white">admin123</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Link para voltar */}
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para o site
          </a>
        </div>
      </div>
    </div>
  );
}
