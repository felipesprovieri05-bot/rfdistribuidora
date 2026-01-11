'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Order, Reservation, Transaction, Customer, Admin } from '../../../types';
import { storage } from '../../../services/storage';
import AdminDashboard from '../../../components/AdminDashboard';
import { collectFinancialData } from '../../../utils/financialDataCollector';
import { generateFinancialPDF } from '../../../utils/generateFinancialPDF';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loggedAdmin, setLoggedAdmin] = useState<Admin | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const refreshData = () => {
    // Buscar dados atualizados do storage
    const newProducts = storage.getProducts();
    const newOrders = storage.getOrders();
    const newReservations = storage.getReservations();
    const newTransactions = storage.getTransactions();
    const newCustomers = storage.getCustomers();

    // Atualizar estados (React otimiza automaticamente se os valores forem iguais)
    setProducts(newProducts);
    setOrders(newOrders);
    setReservations(newReservations);
    setTransactions(newTransactions);
    setCustomers(newCustomers);

    // Verificar se o admin ainda está logado
    const currentAdmin = storage.getCurrentAdmin();
    if (currentAdmin) {
      setLoggedAdmin(currentAdmin);
    } else {
      router.push('/admin');
    }
  };

  useEffect(() => {
    // Verificar se está logado
    const currentAdmin = storage.getCurrentAdmin();
    if (!currentAdmin) {
      router.push('/admin');
      return;
    }
    setLoggedAdmin(currentAdmin);
    refreshData();

    // Configurar polling automático a cada 2 segundos
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
        e.key.includes('currentAdmin') ||
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

    // Também escutar eventos customizados para atualizações na mesma aba
    const handleCustomStorageUpdate = () => {
      refreshData();
    };

    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);

    // Fechar menu ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSettingsMenu && !target.closest('.settings-menu-container')) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Limpar intervalos e listeners quando o componente desmontar
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, showSettingsMenu]);

  const handleLogout = () => {
    storage.logoutAdmin();
    router.push('/admin');
  };

  const handleGenerateFinancialPDF = () => {
    try {
      // Coletar todos os dados financeiros
      const financialData = collectFinancialData(
        transactions,
        orders,
        products,
        customers
      );
      
      // Gerar e baixar o PDF
      generateFinancialPDF(financialData);
      
      alert('✅ PDF financeiro gerado com sucesso!\n\nO PDF foi aberto para impressão/download.');
    } catch (error) {
      console.error('Erro ao gerar PDF financeiro:', error);
      alert('❌ Erro ao gerar PDF financeiro. Verifique o console para mais detalhes.');
    }
  };

  const handleResetFinancial = () => {
    const confirmMessage = `⚠️ ATENÇÃO: Esta ação irá:\n\n` +
      `✅ Zerar TODAS as transações financeiras\n` +
      `✅ Zerar TODOS os pedidos\n` +
      `✅ Zerar TODAS as reservas\n` +
      `✅ Resetar os gastos de todos os clientes\n\n` +
      `IMPORTANTE: Gere o PDF financeiro ANTES de resetar se precisar dos dados!\n\n` +
      `Esta ação NÃO pode ser desfeita!\n\n` +
      `Tem certeza que deseja continuar?`;
    
    if (confirm(confirmMessage)) {
      try {
        // Resetar dados financeiros
        storage.resetFinancialData();
        alert('✅ Dados financeiros resetados com sucesso!');
        refreshData();
      } catch (error) {
        console.error('Erro ao resetar dados financeiros:', error);
        alert('❌ Erro ao resetar dados financeiros. Verifique o console para mais detalhes.');
      }
    }
  };

  if (!loggedAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white font-bold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header com botão de logout */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center gap-3">
            <a href="/" className="text-white font-black text-lg sm:text-xl hover:text-[#FF4500] transition-colors whitespace-nowrap">
              ← Voltar para o site
            </a>
            <div className="flex gap-2 sm:gap-3 items-center">
              {loggedAdmin && loggedAdmin.role === 'master' && (
                <div className="relative settings-menu-container">
                  <button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="px-3 sm:px-4 py-2 bg-gray-500/20 border border-gray-500/40 rounded-xl text-gray-300 font-black hover:bg-gray-500/30 transition-all text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
                    title="Configurações do sistema (apenas CEO)"
                  >
                    <svg 
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform duration-200 ${showSettingsMenu ? 'rotate-90' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden sm:inline">Configurações</span>
                    <span className="sm:hidden">⚙️</span>
                  </button>
                  
                  {/* Menu dropdown */}
                  {showSettingsMenu && (
                    <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200">
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => {
                            handleGenerateFinancialPDF();
                            setShowSettingsMenu(false);
                          }}
                          className="w-full px-4 py-3 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-400 font-black hover:bg-purple-500/30 transition-all text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"
                          title="Gerar PDF financeiro com todos os dados atuais"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>PDF Financeiro</span>
                        </button>
                        <button
                          onClick={() => {
                            handleResetFinancial();
                            setShowSettingsMenu(false);
                          }}
                          className="w-full px-4 py-3 bg-orange-500/20 border border-orange-500/40 rounded-xl text-orange-400 font-black hover:bg-orange-500/30 transition-all text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"
                          title="Resetar todos os dados financeiros"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Resetar Financeiro</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-4 sm:px-6 py-2 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 font-black hover:bg-red-500/30 transition-all text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <AdminDashboard 
        currentAdmin={loggedAdmin}
        products={products}
        orders={orders}
        reservations={reservations}
        transactions={transactions}
        customers={customers}
        onUpdateProducts={(newProducts) => {
          storage.saveProducts(newProducts);
          refreshData();
        }}
        onUpdateOrders={(updatedOrder) => {
          storage.updateOrder(updatedOrder);
          
          // Sincronização em tempo real: criar/atualizar transação quando pedido é concluído ou pago
          const existingTransactions = storage.getTransactions();
          const existingTransaction = existingTransactions.find((t: Transaction) => t.orderId === updatedOrder.id);
          
          // Se o pedido está concluído ou pago, criar/atualizar transação
          if ((updatedOrder.status === 'concluido' || updatedOrder.paymentStatus === 'pago') && !existingTransaction) {
            const transaction: Transaction = {
              id: Math.random().toString(36).substr(2, 9),
              type: 'entrada',
              amount: updatedOrder.total,
              description: `[PEDIDO] ${updatedOrder.id.slice(-6).toUpperCase()} - ${updatedOrder.customerName} - ${updatedOrder.tableNumber} - ${updatedOrder.paymentMethod || 'dinheiro'}`,
              timestamp: updatedOrder.completedAt || updatedOrder.timestamp || Date.now(),
              category: 'venda',
              orderId: updatedOrder.id
            };
            
            storage.addTransaction(transaction);
            
            // Sincronizar gasto do cliente quando pedido é concluído/pago pela primeira vez
            if (updatedOrder.customerName && updatedOrder.customerName !== 'Cliente Avulso') {
              try {
                const normalizeName = (name: string) => name.trim().toLowerCase();
                const customerNameNormalized = normalizeName(updatedOrder.customerName);
                const existingCustomer = customers.find(c => normalizeName(c.name) === customerNameNormalized);
                
                if (existingCustomer) {
                  // Buscar pedido anterior para verificar se já foi contabilizado
                  const previousOrder = orders.find(o => o.id === updatedOrder.id);
                  const wasAlreadyPaid = previousOrder && (previousOrder.status === 'concluido' || previousOrder.paymentStatus === 'pago');
                  
                  // Só atualizar se o pedido não estava pago antes
                  if (!wasAlreadyPaid) {
                    const updatedCustomer = {
                      ...existingCustomer,
                      totalSpent: existingCustomer.totalSpent + updatedOrder.total,
                      ordersCount: existingCustomer.ordersCount + 1,
                      lastVisit: Date.now()
                    };
                    
                    const updatedCustomers = customers.map(c => 
                      c.id === existingCustomer.id ? updatedCustomer : c
                    );
                    
                    storage.saveCustomers(updatedCustomers);
                  }
                }
              } catch (error) {
                console.error('Erro ao atualizar gasto do cliente:', error);
              }
            }
          } else if (existingTransaction && (updatedOrder.status === 'concluido' || updatedOrder.paymentStatus === 'pago')) {
            // Atualizar transação existente se necessário
            const updatedTransactions = existingTransactions.map((t: Transaction) => {
              if (t.orderId === updatedOrder.id) {
                return {
                  ...t,
                  amount: updatedOrder.total,
                  description: `[PEDIDO] ${updatedOrder.id.slice(-6).toUpperCase()} - ${updatedOrder.customerName} - ${updatedOrder.tableNumber} - ${updatedOrder.paymentMethod || 'dinheiro'}`,
                  timestamp: updatedOrder.completedAt || updatedOrder.timestamp || t.timestamp
                };
              }
              return t;
            });
            
            localStorage.setItem('rf_transactions', JSON.stringify(updatedTransactions));
            window.dispatchEvent(new CustomEvent('localStorageUpdate'));
          }
          
          refreshData();
        }}
        onDeleteOrder={(id) => {
          if(confirm("Deseja excluir este pedido permanentemente?")) {
            try {
              // Buscar pedido antes de deletar para subtrair do cliente
              const orderToDelete = orders.find(o => o.id === id);
              
              if (orderToDelete && orderToDelete.customerName && orderToDelete.customerName !== 'Cliente Avulso') {
                // Se o pedido estava pago ou concluído, subtrair do cliente
                if (orderToDelete.status === 'concluido' || orderToDelete.paymentStatus === 'pago') {
                  const normalizeName = (name: string) => name.trim().toLowerCase();
                  const customerNameNormalized = normalizeName(orderToDelete.customerName);
                  const existingCustomer = customers.find(c => normalizeName(c.name) === customerNameNormalized);
                  
                  if (existingCustomer) {
                    const updatedCustomer = {
                      ...existingCustomer,
                      totalSpent: Math.max(0, existingCustomer.totalSpent - orderToDelete.total),
                      ordersCount: Math.max(0, existingCustomer.ordersCount - 1)
                    };
                    
                    const updatedCustomers = customers.map(c => 
                      c.id === existingCustomer.id ? updatedCustomer : c
                    );
                    
                    storage.saveCustomers(updatedCustomers);
                  }
                }
              }
              
              storage.deleteOrder(id);
              refreshData();
            } catch (error) {
              console.error('Erro ao deletar pedido e atualizar cliente:', error);
              storage.deleteOrder(id);
              refreshData();
            }
          }
        }}
        onDeleteReservation={(id) => {
          if(confirm("Deseja excluir esta reserva?")) {
            storage.deleteReservation(id);
            refreshData();
          }
        }}
        onUpdateReservations={(newList) => {
          storage.saveReservations(newList);
          refreshData();
        }}
        onAddTransaction={(t) => {
          storage.addTransaction(t);
          refreshData();
        }}
        onUpdateCustomers={(updatedList) => {
          storage.saveCustomers(updatedList);
          refreshData();
        }}
        onRefresh={() => {
          refreshData();
          const updatedAdmin = storage.getCurrentAdmin();
          if (updatedAdmin) {
            setLoggedAdmin(updatedAdmin);
          } else {
            router.push('/admin');
          }
        }}
      />
    </div>
  );
}
