
import React, { useState } from 'react';
import { ViewMode, Customer } from '../types';

interface NavbarProps {
  viewMode: ViewMode;
  onAdminClick: () => void;
  onLogout: () => void;
  onViewClient: () => void;
  cartCount: number;
  loggedCustomer: Customer | null;
  onCustomerClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  viewMode, 
  onAdminClick, 
  onLogout, 
  onViewClient, 
  cartCount,
  loggedCustomer,
  onCustomerClick
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      onViewClient();
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { onViewClient(); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-black text-xl transition-transform group-hover:rotate-12">RF</div>
          <span className="text-2xl font-black tracking-tighter"><span className="text-[#FF4500]">DISTRIBUIDORA</span></span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {viewMode === ViewMode.CLIENT ? (
            <>
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-[#FF4500] transition-colors font-bold text-sm uppercase tracking-wider">Início</button>
              <button onClick={() => scrollToSection('menu')} className="hover:text-[#FF4500] transition-colors font-bold text-sm uppercase tracking-wider">Cardápio</button>
              <button onClick={() => scrollToSection('reservas')} className="hover:text-[#FF4500] transition-colors font-bold text-sm uppercase tracking-wider">Reservas</button>
              
              <div className="h-6 w-px bg-white/10"></div>

              {/* Botão de Conta Modernizado */}
              <button 
                onClick={onCustomerClick}
                className={`group relative flex items-center gap-4 px-5 py-2.5 rounded-2xl transition-all duration-300 border active:scale-95 ${
                  loggedCustomer 
                    ? 'bg-[#FF4500]/10 border-[#FF4500]/40 text-[#FF4500] shadow-lg shadow-[#FF4500]/5' 
                    : 'bg-white/5 border-white/10 text-white hover:border-[#FF4500]/50 hover:bg-white/10'
                }`}
              >
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-all duration-500 ${
                    loggedCustomer 
                      ? 'bg-[#FF4500] text-black shadow-[0_0_15px_rgba(255,69,0,0.4)]' 
                      : 'bg-white/10 text-gray-400 group-hover:text-white'
                  }`}>
                    {loggedCustomer ? loggedCustomer.name.charAt(0).toUpperCase() : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    )}
                  </div>
                  {loggedCustomer && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse"></span>
                  )}
                </div>

                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60 leading-none mb-1">
                    {loggedCustomer ? 'Comanda Digital' : 'Acesse seu Perfil'}
                  </p>
                  <p className="text-sm font-black leading-none">
                    {loggedCustomer ? `R$ ${Number(loggedCustomer.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Entrar / Registrar'}
                  </p>
                </div>
              </button>

              <div className="relative cursor-pointer group p-2 hover:bg-white/5 rounded-xl transition-all" onClick={() => scrollToSection('menu')}>
                <span className="bg-[#FF4500] text-black px-1.5 py-0.5 rounded-md text-[10px] font-black absolute -top-1 -right-1 shadow-lg shadow-[#FF4500]/30 animate-bounce">{cartCount}</span>
                <svg className="w-6 h-6 group-hover:text-[#FF4500] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              </div>
              
              <button 
                onClick={onAdminClick}
                className="text-gray-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest border-l border-white/10 pl-4"
              >
                Admin
              </button>
            </>
          ) : (
            <>
              <button onClick={onViewClient} className="hover:text-[#FF4500] transition-colors font-black text-sm uppercase">Ver Loja</button>
              <button 
                onClick={onLogout}
                className="bg-[#FF4500] text-white px-8 py-3 rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-[#FF4500]/20 text-sm uppercase tracking-widest"
              >
                Sair do Painel
              </button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-[#FF4500] p-2" onClick={() => setIsOpen(!isOpen)}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path></svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full glass p-8 flex flex-col gap-6 border-b border-white/10 animate-in slide-in-from-top-4 duration-300">
           <button onClick={() => scrollToSection('menu')} className="text-left text-xl font-black uppercase tracking-tighter">Cardápio</button>
           <button onClick={() => scrollToSection('reservas')} className="text-left text-xl font-black uppercase tracking-tighter">Reservas</button>
           <button 
            onClick={() => { setIsOpen(false); onCustomerClick(); }}
            className={`w-full py-5 rounded-2xl font-black text-center text-lg shadow-2xl transition-all active:scale-95 ${
              loggedCustomer 
                ? 'bg-[#FF4500] text-white orange-glow' 
                : 'bg-white/10 text-white border border-white/10'
            }`}
           >
             {loggedCustomer ? `COMANDA: R$ ${Number(loggedCustomer.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'ENTRAR / REGISTRAR'}
           </button>
           <button onClick={() => { setIsOpen(false); onAdminClick(); }} className="text-gray-500 font-bold text-center text-xs uppercase tracking-widest">Acesso Administrativo</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
