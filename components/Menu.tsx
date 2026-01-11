
import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { CATEGORIES } from '../constants';

interface MenuProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  cart: { product: Product; quantity: number }[];
  onPlaceOrder: (name: string, table: string) => void;
  customerName?: string;
  persistedTable?: string | null;
  onTableChange?: (table: string | null) => void;
}

interface FlyingIcon {
  id: number;
  startX: number;
  startY: number;
}

const Menu: React.FC<MenuProps> = ({ 
  products, 
  onAddToCart, 
  onRemoveFromCart, 
  onClearCart, 
  cart, 
  onPlaceOrder, 
  customerName,
  persistedTable,
  onTableChange
}) => {
  const [filter, setFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputCustomerName, setInputCustomerName] = useState(customerName || '');
  const [tableNumber, setTableNumber] = useState(persistedTable || '');
  const [isChangingTable, setIsChangingTable] = useState(!persistedTable);
  const [isTableLocked, setIsTableLocked] = useState(!!persistedTable);
  const [flyingIcons, setFlyingIcons] = useState<FlyingIcon[]>([]);
  
  const cartHeaderRef = useRef<HTMLHeadingElement>(null);

  const filteredProducts = products.filter(p => {
    const matchesCategory = filter === 'Todos' || p.category === filter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.sellPrice * item.quantity), 0);

  // Sincroniza dados persistidos
  useEffect(() => {
    if (customerName) {
      setInputCustomerName(customerName);
    } else {
      // Resetar nome quando cliente for deslogado
      setInputCustomerName('');
    }
  }, [customerName]);

  useEffect(() => {
    // Mesa fixa só funciona se o cliente estiver logado
    if (persistedTable && customerName) {
      setTableNumber(persistedTable);
      setIsChangingTable(false);
      setIsTableLocked(true); // Bloquear mesa quando persistida e cliente logado
    } else {
      // Resetar mesa quando não há mesa persistida ou cliente não está logado
      setTableNumber('');
      setIsChangingTable(true);
      setIsTableLocked(false);
      
      // Se não tem cliente logado, não pode fixar mesa
      if (!customerName && persistedTable) {
        if (onTableChange) onTableChange(null);
      }
    }
  }, [persistedTable, customerName]);

  const handleTableReset = () => {
    // Só permite trocar mesa se não estiver bloqueada E cliente estiver logado
    if (!isTableLocked && customerName) {
      setTableNumber('');
      setIsChangingTable(true);
      if (onTableChange) onTableChange(null);
    }
  };

  // Quando o cliente escolhe uma mesa pela primeira vez, ela fica fixa (apenas se logado)
  const handleTableChange = (value: string) => {
    // Só permite fixar mesa se o cliente estiver logado
    if (!customerName) {
      // Se não está logado, apenas atualiza o número da mesa mas não fixa
      setTableNumber(value);
      return;
    }
    
    // Se cliente está logado, permite fixar mesa
    if (!isTableLocked) {
      setTableNumber(value);
      if (value.trim()) {
        setIsTableLocked(true); // Bloquear mesa após primeira escolha (só se logado)
        setIsChangingTable(false);
        if (onTableChange) onTableChange(value);
      }
    }
  };

  const handleAddToCartWithAnimation = (e: React.MouseEvent<HTMLButtonElement>, product: Product) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const newIcon: FlyingIcon = {
      id: Date.now(),
      startX: x,
      startY: y
    };

    setFlyingIcons(prev => [...prev, newIcon]);
    onAddToCart(product);

    // Remove icon after animation duration
    setTimeout(() => {
      setFlyingIcons(prev => prev.filter(icon => icon.id !== newIcon.id));
    }, 800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
      {/* Flying Icons Layer */}
      {flyingIcons.map(icon => (
        <div
          key={icon.id}
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: icon.startX,
            top: icon.startY,
            animation: 'flyToCart 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
          }}
        >
          <div className="w-6 h-6 bg-[#FF4500] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,69,0,0.6)] border-2 border-white">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes flyToCart {
          0% {
            transform: scale(1) translate(0, 0);
            opacity: 1;
          }
          20% {
            transform: scale(1.5) translate(0, -20px);
            opacity: 1;
          }
          100% {
            left: ${cartHeaderRef.current ? cartHeaderRef.current.getBoundingClientRect().left + 20 : '90%'};
            top: ${cartHeaderRef.current ? cartHeaderRef.current.getBoundingClientRect().top + 20 : '10%'};
            transform: scale(0.2) translate(0, 0);
            opacity: 0;
          }
        }
      `}</style>

      <div className="lg:col-span-2">
        {/* Search Field */}
        <div className="mb-8 relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-500 group-focus-within:text-[#FF4500] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="O que você está procurando hoje? (Ex: Burger, IPA, Vinho...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-14 pr-6 py-5 outline-none focus:border-[#FF4500] focus:bg-white/[0.08] transition-all text-lg font-medium placeholder:text-gray-600 shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-6 flex items-center text-gray-500 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex gap-4 mb-10 overflow-x-auto pb-4 custom-scrollbar no-scrollbar scroll-smooth">
          <button
            onClick={() => setFilter('Todos')}
            className={`px-8 py-3 rounded-2xl whitespace-nowrap transition-all border shrink-0 font-bold ${
              filter === 'Todos' 
                ? 'bg-[#FF4500] border-[#FF4500] text-white shadow-xl shadow-[#FF4500]/20 scale-105' 
                : 'glass border-white/10 hover:border-[#FF4500]/50 text-gray-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-8 py-3 rounded-2xl whitespace-nowrap transition-all border shrink-0 font-bold ${
                filter === cat 
                  ? 'bg-[#FF4500] border-[#FF4500] text-white shadow-xl shadow-[#FF4500]/20 scale-105' 
                  : 'glass border-white/10 hover:border-[#FF4500]/50 text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <div key={product.id} className="glass rounded-[2.5rem] overflow-hidden flex flex-col hover:translate-y-[-8px] transition-all duration-500 border border-white/5 hover:border-[#FF4500]/40 group shadow-2xl">
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800'} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 glass px-4 py-1.5 rounded-full text-[#FF4500] font-black shadow-lg">
                    R$ {Number(product.sellPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-8 flex-grow flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4500] mb-2">{product.category}</span>
                  <h3 className="text-2xl font-bold mb-4 text-white line-clamp-1">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-8">
                    <span className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-xs text-gray-500 font-medium">{product.stock} un. disponíveis</span>
                  </div>
                  <button
                    disabled={product.stock <= 0}
                    onClick={(e) => handleAddToCartWithAnimation(e, product)}
                    className="w-full py-4 rounded-2xl font-black bg-white/5 hover:bg-[#FF4500] hover:text-white border border-white/10 transition-all active:scale-95"
                  >
                    {product.stock > 0 ? 'ADICIONAR AO PEDIDO' : 'INDISPONÍVEL'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass rounded-[3rem] border-dashed border-2 border-white/5">
              <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 italic text-xl">Ops! Nenhum produto encontrado com esse nome.</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 text-[#FF4500] font-bold underline"
              >
                Limpar busca
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="lg:sticky lg:top-24 h-fit">
        <div className="glass rounded-[3rem] p-10 border-[#FF4500]/30 border-2 shadow-2xl relative overflow-hidden">
          <h3 ref={cartHeaderRef} className="text-3xl font-black mb-10 flex items-center gap-3">
            Carrinho
            <span className="bg-[#FF4500] text-black px-3 py-0.5 rounded-full text-sm font-black">{cart.length}</span>
          </h3>

          <div className="space-y-6 mb-10">
            <div className="max-h-[350px] overflow-y-auto pr-3 custom-scrollbar space-y-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex gap-4 items-center bg-white/5 p-3 rounded-2xl border border-white/5 group transition-colors hover:bg-white/10">
                  {/* Miniatura da Imagem no Carrinho */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                    <img 
                      src={item.product.imageUrl || 'https://via.placeholder.com/100'} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-grow">
                    <p className="font-bold text-sm text-white line-clamp-1">{item.product.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-[10px] font-bold uppercase">{item.quantity}x</span>
                      <p className="text-[#FF4500] text-xs font-black font-mono">R$ {Number(item.product.sellPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => onRemoveFromCart(item.product.id)} 
                    className="text-gray-600 hover:text-red-500 p-2 text-xl transition-colors"
                    title="Remover do carrinho"
                  >
                    ×
                  </button>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-10 opacity-30 italic text-sm">Carrinho vazio</div>
              )}
            </div>
            
            <div className="border-t border-white/10 pt-6 flex justify-between items-end">
              <div>
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Total Geral</p>
                <p className="text-4xl font-black text-[#FF4500] font-mono tracking-tighter">R$ {Number(cartTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 pt-6 border-t border-white/10">
            {/* Campo Nome (Bloqueado se logado) */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] ml-2">Responsável</label>
              <input 
                disabled={!!customerName}
                type="text" 
                placeholder="Seu Nome"
                value={inputCustomerName}
                onChange={(e) => setInputCustomerName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] transition-all font-bold disabled:opacity-50"
              />
            </div>

            {/* Gestão de Mesa Inteligente */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] ml-2">Local de Entrega</label>
              
              {/* Mesa Fixa só aparece se cliente estiver logado */}
              {customerName && isTableLocked && !isChangingTable ? (
                <div className="flex items-center justify-between bg-[#FF4500]/10 border border-[#FF4500]/30 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#FF4500] rounded-lg flex items-center justify-center text-black font-black">
                      {tableNumber}
                    </div>
                    <span className="text-sm font-black text-white uppercase tracking-wider">Mesa Fixa</span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-500">Fixo</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    placeholder={customerName ? "Nº da Mesa" : "Faça login para fixar mesa"}
                    value={tableNumber}
                    onChange={(e) => handleTableChange(e.target.value)}
                    disabled={!customerName && !tableNumber} // Desabilitar input se não estiver logado e não tiver mesa digitada
                    className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] transition-all font-black text-[#FF4500] placeholder:text-gray-700 ${
                      !customerName ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                  {!customerName && (
                    <div className="flex items-center justify-center px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
                      <span className="text-[9px] font-black text-yellow-400 uppercase whitespace-nowrap">Login necessário</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              disabled={cart.length === 0 || !inputCustomerName.trim() || !tableNumber.trim()}
              onClick={() => {
                onPlaceOrder(inputCustomerName.trim(), tableNumber.trim());
              }}
              className="w-full py-5 rounded-[1.5rem] font-black bg-[#FF4500] text-white hover:scale-[1.02] shadow-xl shadow-[#FF4500]/30 disabled:opacity-50 transition-all text-lg active:scale-95"
            >
              FINALIZAR PEDIDO
            </button>
            
            {customerName && (
              <p className="text-[10px] text-center text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                Pedido vinculado à sua comanda digital<br/>
                <span className="text-[#FF4500]/60">Sessão Segura</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
