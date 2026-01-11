
import React, { useState } from 'react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (username: string, password: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Preencha todos os campos!');
      return;
    }
    onLogin(username, password);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-8 rounded-[2rem] border border-white/20 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Acesso Restrito</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <p className="text-gray-400 text-sm mb-6">Digite seu usuário e senha para acessar o painel administrativo.</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-sm font-bold">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</label>
            <input 
              autoFocus
              type="text"
              placeholder="nomeusuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FF4500] transition-colors text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Senha</label>
            <input 
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FF4500] transition-colors text-white text-center text-xl tracking-[0.5em]"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-4 bg-[#FF4500] text-white font-bold rounded-xl hover:scale-[1.02] transition-all orange-glow shadow-lg shadow-[#FF4500]/20"
          >
            Entrar no Painel
          </button>
        </form>
        
        <p className="text-center text-[10px] text-gray-600 mt-6 italic">Usuário padrão: admin | Senha: admin123</p>
      </div>
    </div>
  );
};

export default LoginModal;
