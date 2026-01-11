'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, Product, Order, Reservation, Transaction, Customer } from '../types';
import { storage } from '../services/storage';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Menu from '../components/Menu';
import Reservations from '../components/Reservations';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import CustomerAuthModal from '../components/CustomerAuthModal';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CLIENT);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [loggedCustomer, setLoggedCustomer] = useState<Customer | null>(null);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Estado para mensagem de agradecimento
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);
  const [thankYouData, setThankYouData] = useState<{ tableNumber: string; totalGasto: number } | null>(null);
  
  // Refs para acessar valores atuais sem dependências
  const loggedCustomerRef = useRef<Customer | null>(null);
  const activeTableRef = useRef<string | null>(null);
  
  // Atualizar refs quando os valores mudam
  useEffect(() => {
    loggedCustomerRef.current = loggedCustomer;
    activeTableRef.current = activeTable;
  }, [loggedCustomer, activeTable]);

  // Load data on mount e configurar sincronização em tempo real
  useEffect(() => {
    refreshData();

    // Configurar polling automático a cada 2 segundos (mesmo que o admin)
    const pollInterval = setInterval(() => {
      // Só atualizar se a página estiver visível
      if (!document.hidden) {
        refreshData();
      }
    }, 2000);

    // Escutar eventos de storage para atualizações em outras abas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (
        e.key.includes('products') || 
        e.key.includes('orders') || 
        e.key.includes('reservations') || 
        e.key.includes('transactions') || 
        e.key.includes('customers') ||
        e.key.includes('last_update') ||
        e.key === 'adega_last_update'
      )) {
        // Usar setTimeout para evitar múltiplas atualizações simultâneas
        setTimeout(() => {
          refreshData();
        }, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Escutar eventos customizados para atualizações na mesma aba
    const handleCustomStorageUpdate = () => {
      refreshData();
    };

    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);

    // Limpar intervalos e listeners quando o componente desmontar
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
    };
  }, []);

  // Escutar evento de mesa liberada e verificar localStorage
  useEffect(() => {
    const handleTableReleased = (event: Event) => {
      const customEvent = event as CustomEvent<{ tableNumber: string; reservationName: string; totalGasto: number }>;
      const { tableNumber: releasedTable, totalGasto } = customEvent.detail;
      
      // Verificar se o cliente logado está nesta mesa (usar refs para valores atuais)
      const currentLoggedCustomer = loggedCustomerRef.current;
      const currentActiveTable = activeTableRef.current;
      
      if (currentLoggedCustomer && currentActiveTable && currentActiveTable === releasedTable) {
        setThankYouData({ tableNumber: releasedTable, totalGasto });
        setShowThankYouMessage(true);
        
        // Deslogar cliente após 5 segundos e resetar tudo ao estado inicial
        setTimeout(() => {
          // Resetar todos os estados ao padrão inicial
          setLoggedCustomer(null);
          setActiveTable(null);
          setCart([]); // Carrinho vazio
          setShowThankYouMessage(false);
          setThankYouData(null);
          
          // Atualizar refs também
          loggedCustomerRef.current = null;
          activeTableRef.current = null;
          
          // Scroll para o topo
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          // Forçar atualização dos dados
          refreshData();
        }, 5000);
      }
    };

    // Escutar evento customizado
    window.addEventListener('tableReleased', handleTableReleased);

    // Escutar mudanças no localStorage (sincronização entre abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rf_table_released' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.tableNumber) {
            // Criar evento customizado a partir do localStorage
            window.dispatchEvent(new CustomEvent('tableReleased', { detail: data }));
          }
        } catch (error) {
          console.error('Erro ao processar evento de mesa liberada:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Verificar se já existe evento no localStorage (para caso a página foi recarregada)
    const checkExistingEvent = () => {
      try {
        const releasedTableData = localStorage.getItem('rf_table_released');
        if (releasedTableData) {
          const data = JSON.parse(releasedTableData);
          if (data.tableNumber && data.timestamp) {
            // Só processar se foi liberado nos últimos 10 segundos
            const eventAge = Date.now() - data.timestamp;
            if (eventAge < 10000) {
              window.dispatchEvent(new CustomEvent('tableReleased', { detail: data }));
            }
            // Limpar após processar
            localStorage.removeItem('rf_table_released');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar evento existente:', error);
      }
    };

    checkExistingEvent();

    return () => {
      window.removeEventListener('tableReleased', handleTableReleased);
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vazio para não recriar o listener

  const refreshData = () => {
    try {
      // Buscar dados atualizados do storage
      const newProducts = storage.getProducts();
      const newOrders = storage.getOrders();
      const newReservations = storage.getReservations();
      const newTransactions = storage.getTransactions();
      const newCustomers = storage.getCustomers();

      // Atualizar estados apenas se houver mudanças (React otimiza automaticamente)
      setProducts(newProducts);
      setOrders(newOrders);
      setReservations(newReservations);
      setTransactions(newTransactions);
      setCustomers(newCustomers);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  };


  const handleCustomerAuth = (customer: Customer) => {
    const saved = storage.saveCustomer(customer);
    setLoggedCustomer(saved);
    setIsCustomerModalOpen(false);
    refreshData();
  };

  const handleCustomerLogout = () => {
    // Resetar todos os estados ao padrão inicial
    setLoggedCustomer(null);
    setActiveTable(null);
    setCart([]); // Carrinho vazio
    setShowThankYouMessage(false);
    setThankYouData(null);
    
    // Atualizar refs também
    loggedCustomerRef.current = null;
    activeTableRef.current = null;
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Forçar atualização dos dados
    refreshData();
  };

  const addToCart = (product: Product) => {
    if (!loggedCustomer) {
      setIsCustomerModalOpen(true);
      return;
    }
    if (product.stock <= 0) {
      alert("Produto esgotado!");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const placeOrder = (customerName: string, tableNumber: string) => {
    if (cart.length === 0) return;
    
    const total = cart.reduce((sum, item) => sum + (item.product.sellPrice * item.quantity), 0);
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      customerId: loggedCustomer?.cpf,
      customerName: loggedCustomer?.name || customerName,
      tableNumber,
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.sellPrice
      })),
      total,
      status: 'pendente',
      paymentStatus: 'pendente',
      timestamp: Date.now()
    };

    const currentProducts = storage.getProducts();
    const updatedProducts = currentProducts.map(p => {
      const cartItem = cart.find(ci => ci.product.id === p.id);
      if (cartItem) {
        return { ...p, stock: p.stock - cartItem.quantity };
      }
      return p;
    });

    storage.saveProducts(updatedProducts);
    storage.saveOrder(newOrder);
    
    // Verificar se já existe reserva ativa para esta mesa
    const currentReservations = storage.getReservations();
    const existingReservation = currentReservations.find(r => 
      r.tableNumber === tableNumber && 
      (r.status === 'pendente' || r.status === 'presente')
    );
    
    // Se não existe reserva para esta mesa, criar uma automaticamente
    if (!existingReservation) {
      const today = new Date();
      const reservationDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const reservationTime = today.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
      
      const newReservation: Reservation = {
        id: Math.random().toString(36).substr(2, 9),
        name: loggedCustomer?.name || customerName,
        phone: loggedCustomer?.phone || '',
        date: reservationDate,
        time: reservationTime,
        people: 1,
        status: 'presente',
        notified: false,
        createdAt: Date.now(),
        tableNumber: tableNumber,
        totalGasto: total
      };
      
      const updatedReservations = [...currentReservations, newReservation];
      storage.saveReservations(updatedReservations);
      
      storage.addLog({
        id: Math.random().toString(36).substr(2, 9),
        type: 'reserva',
        action: 'criada',
        description: `Reserva automática criada para mesa ${tableNumber} - ${newReservation.name}`,
        timestamp: Date.now(),
        data: { reservationId: newReservation.id, tableNumber }
      });
    } else {
      // Atualizar reserva existente com novo gasto acumulado
      const updatedReservations = currentReservations.map(r => 
        r.id === existingReservation.id 
          ? { ...r, totalGasto: (r.totalGasto || 0) + total, status: 'presente' as const }
          : r
      );
      storage.saveReservations(updatedReservations);
      
      storage.addLog({
        id: Math.random().toString(36).substr(2, 9),
        type: 'reserva',
        action: 'atualizada',
        description: `Gasto atualizado para mesa ${tableNumber}: +R$ ${total.toFixed(2)}`,
        timestamp: Date.now(),
        data: { reservationId: existingReservation.id, tableNumber, totalGasto: (existingReservation.totalGasto || 0) + total }
      });
    }
    
    storage.addLog({
      id: Math.random().toString(36).substr(2, 9),
      type: 'pedido',
      action: 'criado',
      description: `Pedido criado: ${customerName} - ${tableNumber} - R$ ${total.toFixed(2)}`,
      timestamp: Date.now(),
      data: { orderId: newOrder.id }
    });
    
    setActiveTable(tableNumber);
    setCart([]);
    
    // Atualizar dados do cliente
    if (loggedCustomer) {
      const updatedCustomer = {
        ...loggedCustomer,
        totalSpent: loggedCustomer.totalSpent + total,
        ordersCount: loggedCustomer.ordersCount + 1,
        lastVisit: Date.now()
      };
      // Salvar cliente atualizado
      storage.saveCustomer(updatedCustomer);
      setLoggedCustomer(updatedCustomer);
    }
    
    // Atualizar todos os dados
    refreshData();
    
    alert("Pedido enviado para a cozinha!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar 
        viewMode={viewMode} 
        onAdminClick={() => window.location.href = '/admin'} 
        onLogout={() => {}}
        onViewClient={() => setViewMode(ViewMode.CLIENT)}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        loggedCustomer={loggedCustomer}
        onCustomerClick={() => {
          if (loggedCustomer) {
            // Resetar tudo ao padrão inicial ao deslogar manualmente
            handleCustomerLogout();
          } else {
            setIsCustomerModalOpen(true);
          }
        }}
      />

      <main className="flex-grow">
        <>
          <Hero />
            
            {loggedCustomer && (
              <div className="max-w-7xl mx-auto px-4 mt-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="glass p-8 rounded-[2.5rem] border border-[#FF4500]/30 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl shadow-[#FF4500]/5">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#FF4500] rounded-2xl flex items-center justify-center text-black font-black text-2xl">
                      {loggedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black">Olá, {loggedCustomer.name.split(' ')[0]}!</h3>
                      <p className="text-gray-500 font-mono text-xs tracking-widest">Sua comanda está ativa • CPF: {loggedCustomer.cpf}</p>
                    </div>
                  </div>
                  <div className="flex gap-8 text-center">
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total Acumulado</p>
                      <p className="text-3xl font-black text-[#FF4500] font-mono">R$ {Number(loggedCustomer.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-px h-12 bg-white/10"></div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Nº Pedidos</p>
                      <p className="text-3xl font-black text-white font-mono">{loggedCustomer.ordersCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <section id="menu" className="py-20 px-4 max-w-7xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-12 text-[#FF4500]">Nosso Cardápio</h2>
              <Menu 
                products={products} 
                onAddToCart={addToCart} 
                cart={cart} 
                onPlaceOrder={placeOrder} 
                onClearCart={() => setCart([])}
                onRemoveFromCart={(id) => setCart(prev => prev.filter(i => i.product.id !== id))}
                customerName={loggedCustomer?.name}
                persistedTable={activeTable}
                onTableChange={(table) => setActiveTable(table)}
              />
            </section>
            
            <section id="reservas" className="py-20 px-4 bg-[#0a0a0a]">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold text-center mb-12 text-[#FF4500]">Reserve sua Mesa</h2>
                <Reservations onReserve={(res) => {
                  const reservation = {
                    ...res,
                    phone: res.phone || '',
                    createdAt: Date.now(),
                    notified: false
                  };
                  storage.saveReservation(reservation);
                  storage.addLog({
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'reserva',
                    action: 'criada',
                    description: `Reserva criada: ${res.name} - ${res.date} ${res.time}`,
                    timestamp: Date.now(),
                    data: { reservationId: reservation.id }
                  });
                  refreshData();
                  alert("Mesa reservada com sucesso!");
                }} />
              </div>
            </section>
            <WhatsAppButton />
        </>
      </main>

      <Footer />

      {isCustomerModalOpen && (
        <CustomerAuthModal 
          onClose={() => setIsCustomerModalOpen(false)}
          onAuthSuccess={handleCustomerAuth}
          existingCustomers={customers}
        />
      )}

      {/* Modal de Agradecimento quando mesa é liberada */}
      {showThankYouMessage && thankYouData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="glass w-full max-w-md p-10 rounded-[3rem] border border-[#FF4500]/30 shadow-[0_0_60px_rgba(255,69,0,0.2)] animate-in zoom-in-95 duration-500 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-[#FF4500] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-white mb-4">
                Obrigado!
              </h2>
              <p className="text-xl text-gray-300 font-bold mb-2">
                Sua visita foi encerrada
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Mesa {thankYouData.tableNumber} liberada
              </p>
              {thankYouData.totalGasto > 0 && (
                <div className="bg-[#FF4500]/10 border border-[#FF4500]/30 rounded-2xl p-4 mt-4">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Gasto</p>
                  <p className="text-2xl font-black text-[#FF4500] font-mono">R$ {Number(thankYouData.totalGasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <p className="text-lg text-white font-bold">
                Esperamos você novamente em breve! 🎉
              </p>
              <p className="text-sm text-gray-400">
                Volte sempre! Estamos sempre prontos para recebê-lo.
              </p>
              
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-white/10">
                <div className="w-2 h-2 bg-[#FF4500] rounded-full animate-pulse"></div>
                <p className="text-xs text-gray-500 font-bold">Encerrando sessão...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
