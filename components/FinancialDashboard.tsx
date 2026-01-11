'use client';

import React, { useMemo } from 'react';
import { Transaction, Order, Product, LogEntry, OrderItem, Customer } from '../types';

interface FinancialDashboardProps {
  transactions: Transaction[];
  orders: Order[];
  products: Product[];
  logs: LogEntry[];
  customers?: Customer[];
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ 
  transactions, 
  orders, 
  products, 
  logs,
  customers = []
}) => {
  // Garantir que todas as props sejam arrays válidos e serializáveis
  const validTransactions = useMemo(() => {
    try {
      if (!Array.isArray(transactions)) return [];
      return transactions
        .filter(t => {
          if (!t || typeof t !== 'object' || Array.isArray(t)) return false;
          try {
            const proto = Object.getPrototypeOf(t);
            if (proto !== null && proto !== Object.prototype) {
              if (t instanceof Date || t instanceof RegExp || t instanceof Error) return false;
            }
          } catch {
            return false;
          }
          return true;
        })
        .map(t => {
          const result: Transaction = {
            id: String(t.id || ''),
            type: String(t.type || '') as 'entrada' | 'saida',
            amount: Number(t.amount || 0),
            description: String(t.description || ''),
            timestamp: Number(t.timestamp || 0)
          };
          if (t.category !== undefined && t.category !== null) {
            result.category = String(t.category) as Transaction['category'];
          }
          if (t.orderId !== undefined && t.orderId !== null) {
            result.orderId = String(t.orderId);
          }
          return result;
        });
    } catch {
      return [];
    }
  }, [transactions]);
  
  const validOrders = useMemo(() => {
    try {
      if (!Array.isArray(orders)) return [];
      return orders
        .filter(o => {
          if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
          try {
            const proto = Object.getPrototypeOf(o);
            if (proto !== null && proto !== Object.prototype) {
              if (o instanceof Date || o instanceof RegExp || o instanceof Error) return false;
            }
          } catch {
            return false;
          }
          return true;
        })
        .map(o => {
          const result: Order = {
            id: String(o.id || ''),
            customerName: String(o.customerName || ''),
            tableNumber: String(o.tableNumber || ''),
            items: Array.isArray(o.items) ? o.items.map(item => {
              const itemResult: OrderItem = {
                productId: String(item.productId || ''),
                name: String(item.name || ''),
                quantity: Number(item.quantity || 0),
                price: Number(item.price || 0),
                delivered: Boolean(item.delivered)
              };
              if (item.deliveredAt !== undefined && item.deliveredAt !== null) {
                itemResult.deliveredAt = Number(item.deliveredAt);
              }
              if (item.deliveredBy !== undefined && item.deliveredBy !== null) {
                itemResult.deliveredBy = String(item.deliveredBy);
              }
              return itemResult;
            }) : [],
            total: Number(o.total || 0),
            status: String(o.status || '') as Order['status'],
            paymentStatus: String(o.paymentStatus || '') as Order['paymentStatus'],
            timestamp: Number(o.timestamp || 0)
          };
          if (o.customerId !== undefined && o.customerId !== null) {
            result.customerId = String(o.customerId);
          }
          if (o.paymentMethod !== undefined && o.paymentMethod !== null) {
            result.paymentMethod = String(o.paymentMethod) as Order['paymentMethod'];
          }
          if (o.sentToKitchenAt !== undefined && o.sentToKitchenAt !== null) {
            result.sentToKitchenAt = Number(o.sentToKitchenAt);
          }
          if (o.completedAt !== undefined && o.completedAt !== null) {
            result.completedAt = Number(o.completedAt);
          }
          return result;
        });
    } catch {
      return [];
    }
  }, [orders]);
  
  const validProducts = useMemo(() => {
    try {
      if (!Array.isArray(products)) return [];
      return products
        .filter(p => {
          if (!p || typeof p !== 'object' || Array.isArray(p)) return false;
          try {
            const proto = Object.getPrototypeOf(p);
            if (proto !== null && proto !== Object.prototype) {
              if (p instanceof Date || p instanceof RegExp || p instanceof Error) return false;
            }
          } catch {
            return false;
          }
          return true;
        })
        .map(p => {
          const result: Product = {
            id: String(p.id || ''),
            name: String(p.name || ''),
            buyPrice: Number(p.buyPrice || 0),
            sellPrice: Number(p.sellPrice || 0),
            stock: Number(p.stock || 0),
            category: String(p.category || '') as Product['category']
          };
          if (p.fixedPrice !== undefined && p.fixedPrice !== null) {
            result.fixedPrice = Number(p.fixedPrice);
          }
          if (p.imageUrl !== undefined && p.imageUrl !== null) {
            result.imageUrl = String(p.imageUrl);
          }
          if (p.barcode !== undefined && p.barcode !== null && String(p.barcode).trim().length > 0) {
            result.barcode = String(p.barcode).trim();
          }
          return result;
        });
    } catch {
      return [];
    }
  }, [products]);

  const validCustomers = useMemo(() => {
    try {
      if (!Array.isArray(customers)) return [];
      return customers.filter(c => c && typeof c === 'object' && !Array.isArray(c));
    } catch {
      return [];
    }
  }, [customers]);

  // Garantir que os arrays sempre existam (mesmo que vazios)
  const safeTransactions = Array.isArray(validTransactions) ? validTransactions : [];
  const safeOrders = Array.isArray(validOrders) ? validOrders : [];
  const safeProducts = Array.isArray(validProducts) ? validProducts : [];
  const safeCustomers = Array.isArray(validCustomers) ? validCustomers : [];

  // KPIs com mudança de 30 dias
  const kpis = useMemo(() => {
    try {
      // Calcular datas para comparação de 30 dias
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);
      
      // Clientes
      const totalCustomers = safeCustomers?.length || 0;
      const customers30DaysAgo = safeCustomers?.filter(c => {
        try {
          if (!c || !c.lastVisit || typeof c.lastVisit !== 'number') return false;
          return c.lastVisit >= thirtyDaysAgo;
        } catch {
          return false;
        }
      }).length || 0;
      const customers60DaysAgo = safeCustomers?.filter(c => {
        try {
          if (!c || !c.lastVisit || typeof c.lastVisit !== 'number') return false;
          return c.lastVisit >= sixtyDaysAgo && c.lastVisit < thirtyDaysAgo;
        } catch {
          return false;
        }
      }).length || 0;
      const customersChange = customers60DaysAgo > 0 
        ? ((customers30DaysAgo - customers60DaysAgo) / customers60DaysAgo) * 100 
        : 0;

      // Pedidos
      const ordersLast30Days = safeOrders?.filter(o => {
        try {
          return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= thirtyDaysAgo;
        } catch {
          return false;
        }
      }).length || 0;
      const ordersPrevious30Days = safeOrders?.filter(o => {
        try {
          return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= sixtyDaysAgo && o.timestamp < thirtyDaysAgo;
        } catch {
          return false;
        }
      }).length || 0;
      const ordersChange = ordersPrevious30Days > 0
        ? ((ordersLast30Days - ordersPrevious30Days) / ordersPrevious30Days) * 100
        : 0;

      // Lucro - considerando vendas por comanda E caixa (sem duplicação)
      // IDs de pedidos concluídos/pagos para evitar duplicação
      const completedOrderIds = new Set(
        safeOrders
          .filter(o => {
            try {
              return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= thirtyDaysAgo && (o.status === 'concluido' || o.paymentStatus === 'pago');
            } catch {
              return false;
            }
          })
          .map(o => o.id)
      );
      
      // 1. Receita de vendas por comanda (orders concluídos/pagos) - ESTA É A FONTE PRINCIPAL
      const revenueFromOrders = safeOrders?.filter(o => {
        try {
          return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= thirtyDaysAgo && (o.status === 'concluido' || o.paymentStatus === 'pago');
        } catch {
          return false;
        }
      }).reduce((sum, o) => {
        try {
          const total = Number(o?.total) || 0;
          return (!isNaN(total) && isFinite(total)) ? sum + total : sum;
        } catch {
          return sum;
        }
      }, 0) || 0;
    
      // 2. CMV (Custo das Mercadorias Vendidas) das comandas - CALCULAR UMA VEZ POR PEDIDO
      let cmvFromOrders = 0;
      try {
        safeOrders?.filter(o => {
          try {
            return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= thirtyDaysAgo && (o.status === 'concluido' || o.paymentStatus === 'pago');
          } catch {
            return false;
          }
        }).forEach(order => {
          try {
            if (order?.items && Array.isArray(order.items)) {
              order.items.forEach(item => {
                try {
                  if (item?.productId) {
                    const product = safeProducts?.find(p => p?.id === item.productId);
                    if (product && product.buyPrice !== undefined && product.buyPrice !== null) {
                      const buyPrice = Number(product.buyPrice) || 0;
                      const quantity = Number(item.quantity) || 0;
                      if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity) && buyPrice >= 0 && quantity > 0) {
                        cmvFromOrders += buyPrice * quantity;
                      }
                    }
                  }
                } catch {
                  // Ignorar erro no item
                }
              });
            }
          } catch {
            // Ignorar erro na order
          }
        });
      } catch {
        cmvFromOrders = 0;
      }
      
      // 3. Receita de vendas diretas do caixa (transações SEM orderId ou com orderId que NÃO está nos pedidos concluídos)
      // IMPORTANTE: Se a transação tem orderId que está nos pedidos concluídos, IGNORAR para evitar duplicação
      const revenueFromTransactions = safeTransactions?.filter(t => {
        try {
          if (!t || typeof t.timestamp !== 'number' || isNaN(t.timestamp) || t.timestamp < thirtyDaysAgo) return false;
          if (t.type !== 'entrada' || t.category !== 'venda') return false;
          // Se tem orderId E esse orderId está nos pedidos concluídos, IGNORAR (já foi contado)
          if (t.orderId && t.orderId !== '' && completedOrderIds.has(t.orderId)) return false;
          // Se não tem orderId OU o orderId não está nos pedidos concluídos, CONTAR
          return true;
        } catch {
          return false;
        }
      }).reduce((sum, t) => {
        try {
          const amount = Number(t?.amount) || 0;
          return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
        } catch {
          return sum;
        }
      }, 0) || 0;
      
      // 4. CMV estimado APENAS de transações diretas do caixa (SEM orderId) - não duplicar com pedidos
      let cmvFromTransactions = 0;
      try {
        const transactionsDirectSales = safeTransactions?.filter(t => {
          try {
            return t && 
                   typeof t.timestamp === 'number' && 
                   !isNaN(t.timestamp) && 
                   t.timestamp >= thirtyDaysAgo && 
                   t.type === 'entrada' &&
                   t.category === 'venda' &&
                   (!t.orderId || t.orderId === '') && // APENAS transações SEM orderId (vendas diretas Balcão)
                   (!completedOrderIds.has(t.orderId || '')); // Garantir que não está nos pedidos
          } catch {
            return false;
          }
        });
        
        if (transactionsDirectSales && transactionsDirectSales.length > 0 && safeProducts.length > 0) {
          // Calcular proporção média de custo vs venda dos produtos
          let totalSellPrice = 0;
          let totalBuyPrice = 0;
          let productCount = 0;
          
          safeProducts.forEach(product => {
            try {
              const sellPrice = Number(product.sellPrice) || 0;
              const buyPrice = Number(product.buyPrice) || 0;
              if (!isNaN(sellPrice) && !isNaN(buyPrice) && isFinite(sellPrice) && isFinite(buyPrice) && sellPrice > 0 && buyPrice >= 0) {
                totalSellPrice += sellPrice;
                totalBuyPrice += buyPrice;
                productCount++;
              }
            } catch {
              // Ignorar produto inválido
            }
          });
          
          if (productCount > 0 && totalSellPrice > 0) {
            const avgCostRatio = totalBuyPrice / totalSellPrice;
            transactionsDirectSales.forEach(transaction => {
              try {
                const revenue = Number(transaction.amount) || 0;
                if (!isNaN(revenue) && isFinite(revenue) && revenue > 0) {
                  const estimatedCMV = revenue * avgCostRatio;
                  if (!isNaN(estimatedCMV) && isFinite(estimatedCMV) && estimatedCMV >= 0) {
                    cmvFromTransactions += estimatedCMV;
                  }
                }
              } catch {
                // Ignorar transação inválida
              }
            });
          }
        }
      } catch {
        cmvFromTransactions = 0;
      }
      
      // 5. Despesas (transações de saída) - APENAS despesas, não duplicar
      const expensesFromTransactions = safeTransactions?.filter(t => {
        try {
          return t && typeof t.timestamp === 'number' && !isNaN(t.timestamp) && t.timestamp >= thirtyDaysAgo && t.type === 'saida';
        } catch {
          return false;
        }
      }).reduce((sum, t) => {
        try {
          const amount = Number(t?.amount) || 0;
          return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
        } catch {
          return sum;
        }
      }, 0) || 0;
    
    // Lucro total = (Receita Pedidos - CMV Pedidos) + (Receita Transações Diretas - CMV Transações Diretas) - Despesas
    const totalRevenue = revenueFromOrders + revenueFromTransactions;
    const totalCMV = cmvFromOrders + cmvFromTransactions;
    const profitLast30Days = totalRevenue - totalCMV - expensesFromTransactions;
    const safeProfitLast30Days = (!isNaN(profitLast30Days) && isFinite(profitLast30Days)) ? profitLast30Days : 0;
    
      // Cálculo do período anterior para comparação (30-60 dias atrás) - MESMA LÓGICA
      const completedOrderIdsPrev = new Set(
        safeOrders
          .filter(o => {
            try {
              return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= sixtyDaysAgo && o.timestamp < thirtyDaysAgo && (o.status === 'concluido' || o.paymentStatus === 'pago');
            } catch {
              return false;
            }
          })
          .map(o => o.id)
      );
      
      // 1. Receita de pedidos do período anterior
      const revenueFromOrdersPrev = safeOrders?.filter(o => {
        try {
          return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= sixtyDaysAgo && o.timestamp < thirtyDaysAgo && (o.status === 'concluido' || o.paymentStatus === 'pago');
        } catch {
          return false;
        }
      }).reduce((sum, o) => {
        try {
          const total = Number(o?.total) || 0;
          return (!isNaN(total) && isFinite(total)) ? sum + total : sum;
        } catch {
          return sum;
        }
      }, 0) || 0;
      
      // 2. CMV de pedidos do período anterior
      let cmvFromOrdersPrev = 0;
      try {
        safeOrders?.filter(o => {
          try {
            return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= sixtyDaysAgo && o.timestamp < thirtyDaysAgo && (o.status === 'concluido' || o.paymentStatus === 'pago');
          } catch {
            return false;
          }
        }).forEach(order => {
          try {
            if (order?.items && Array.isArray(order.items)) {
              order.items.forEach(item => {
                try {
                  if (item?.productId) {
                    const product = safeProducts?.find(p => p?.id === item.productId);
                    if (product && product.buyPrice !== undefined && product.buyPrice !== null) {
                      const buyPrice = Number(product.buyPrice) || 0;
                      const quantity = Number(item.quantity) || 0;
                      if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity) && buyPrice >= 0 && quantity > 0) {
                        cmvFromOrdersPrev += buyPrice * quantity;
                      }
                    }
                  }
                } catch {
                  // Ignorar erro no item
                }
              });
            }
          } catch {
            // Ignorar erro na order
          }
        });
      } catch {
        cmvFromOrdersPrev = 0;
      }
      
      // 3. Receita de transações diretas do período anterior (SEM orderId ou com orderId que não está nos pedidos)
      const revenueFromTransactionsPrev = safeTransactions?.filter(t => {
        try {
          if (!t || typeof t.timestamp !== 'number' || isNaN(t.timestamp)) return false;
          if (t.timestamp < sixtyDaysAgo || t.timestamp >= thirtyDaysAgo) return false;
          if (t.type !== 'entrada' || t.category !== 'venda') return false;
          // Se tem orderId E esse orderId está nos pedidos concluídos, IGNORAR
          if (t.orderId && t.orderId !== '' && completedOrderIdsPrev.has(t.orderId)) return false;
          return true;
        } catch {
          return false;
        }
      }).reduce((sum, t) => {
        try {
          const amount = Number(t?.amount) || 0;
          return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
        } catch {
          return sum;
        }
      }, 0) || 0;
      
      // 4. CMV estimado de transações diretas do período anterior (APENAS sem orderId)
      let cmvFromTransactionsPrev = 0;
      try {
        const transactionsPrevDirectSales = safeTransactions?.filter(t => {
          try {
            return t && 
                   typeof t.timestamp === 'number' && 
                   !isNaN(t.timestamp) && 
                   t.timestamp >= sixtyDaysAgo && 
                   t.timestamp < thirtyDaysAgo &&
                   t.type === 'entrada' &&
                   t.category === 'venda' &&
                   (!t.orderId || t.orderId === '') &&
                   (!completedOrderIdsPrev.has(t.orderId || ''));
          } catch {
            return false;
          }
        });
        
        if (transactionsPrevDirectSales && transactionsPrevDirectSales.length > 0 && safeProducts.length > 0) {
          let totalSellPrice = 0;
          let totalBuyPrice = 0;
          let productCount = 0;
          
          safeProducts.forEach(product => {
            try {
              const sellPrice = Number(product.sellPrice) || 0;
              const buyPrice = Number(product.buyPrice) || 0;
              if (!isNaN(sellPrice) && !isNaN(buyPrice) && isFinite(sellPrice) && isFinite(buyPrice) && sellPrice > 0 && buyPrice >= 0) {
                totalSellPrice += sellPrice;
                totalBuyPrice += buyPrice;
                productCount++;
              }
            } catch {
              // Ignorar produto inválido
            }
          });
          
          if (productCount > 0 && totalSellPrice > 0) {
            const avgCostRatio = totalBuyPrice / totalSellPrice;
            transactionsPrevDirectSales.forEach(transaction => {
              try {
                const revenue = Number(transaction.amount) || 0;
                if (!isNaN(revenue) && isFinite(revenue) && revenue > 0) {
                  const estimatedCMV = revenue * avgCostRatio;
                  if (!isNaN(estimatedCMV) && isFinite(estimatedCMV) && estimatedCMV >= 0) {
                    cmvFromTransactionsPrev += estimatedCMV;
                  }
                }
              } catch {
                // Ignorar transação inválida
              }
            });
          }
        }
      } catch {
        cmvFromTransactionsPrev = 0;
      }
      
      // 5. Despesas do período anterior
      const expensesFromTransactionsPrev = safeTransactions?.filter(t => {
        try {
          return t && typeof t.timestamp === 'number' && !isNaN(t.timestamp) && t.timestamp >= sixtyDaysAgo && t.timestamp < thirtyDaysAgo && t.type === 'saida';
        } catch {
          return false;
        }
      }).reduce((sum, t) => {
        try {
          const amount = Number(t?.amount) || 0;
          return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
        } catch {
          return sum;
        }
      }, 0) || 0;
    
    // Lucro do período anterior
    const totalRevenuePrev = revenueFromOrdersPrev + revenueFromTransactionsPrev;
    const totalCMVPrev = cmvFromOrdersPrev + cmvFromTransactionsPrev;
    const profitPrevious30Days = totalRevenuePrev - totalCMVPrev - expensesFromTransactionsPrev;
    const safeProfitPrevious30Days = (!isNaN(profitPrevious30Days) && isFinite(profitPrevious30Days)) ? profitPrevious30Days : 0;
    
    // Mudança percentual do lucro (crescimento)
    let profitChange = 0;
    if (safeProfitPrevious30Days !== 0) {
      profitChange = ((safeProfitLast30Days - safeProfitPrevious30Days) / Math.abs(safeProfitPrevious30Days)) * 100;
    } else if (safeProfitLast30Days > 0) {
      profitChange = 100; // Se não havia lucro antes e agora há, considerar crescimento de 100%
    } else if (safeProfitLast30Days < 0 && safeProfitPrevious30Days === 0) {
      profitChange = -100; // Se passou de 0 para negativo, considerar queda
    }
    // Limitar entre -200% e 200%
    const safeProfitChange = (!isNaN(profitChange) && isFinite(profitChange)) 
      ? Math.max(-200, Math.min(200, profitChange)) 
      : 0;

    // Crescimento baseado em porcentagem de lucro nas vendas
    // Venda Final (Preço para o cliente) = Receita total dos últimos 30 dias
    const vendaFinalLast30Days = totalRevenue;
    const safeVendaFinalLast30Days = (!isNaN(vendaFinalLast30Days) && isFinite(vendaFinalLast30Days)) ? vendaFinalLast30Days : 0;
    
    // Gasto de Venda = CMV + Despesas
    const gastoVendaLast30Days = totalCMV + expensesFromTransactions;
    const safeGastoVendaLast30Days = (!isNaN(gastoVendaLast30Days) && isFinite(gastoVendaLast30Days)) ? gastoVendaLast30Days : 0;
    
    // Lucro Bruto = Venda Final - Gasto de Venda
    const lucroBrutoLast30Days = safeVendaFinalLast30Days - safeGastoVendaLast30Days;
    const safeLucroBrutoLast30Days = (!isNaN(lucroBrutoLast30Days) && isFinite(lucroBrutoLast30Days)) ? lucroBrutoLast30Days : 0;
    
    // Porcentagem de lucro = (Lucro Bruto / Venda Final) * 100
    const profitMarginLast30Days = safeVendaFinalLast30Days > 0
      ? (safeLucroBrutoLast30Days / safeVendaFinalLast30Days) * 100
      : 0;
    
    // Venda Final do período anterior (30-60 dias atrás)
    const vendaFinalPrevious30Days = totalRevenuePrev;
    const safeVendaFinalPrevious30Days = (!isNaN(vendaFinalPrevious30Days) && isFinite(vendaFinalPrevious30Days)) ? vendaFinalPrevious30Days : 0;
    
    // Gasto de Venda do período anterior
    const gastoVendaPrevious30Days = totalCMVPrev + expensesFromTransactionsPrev;
    const safeGastoVendaPrevious30Days = (!isNaN(gastoVendaPrevious30Days) && isFinite(gastoVendaPrevious30Days)) ? gastoVendaPrevious30Days : 0;
    
    // Lucro Bruto do período anterior
    const lucroBrutoPrevious30Days = safeVendaFinalPrevious30Days - safeGastoVendaPrevious30Days;
    const safeLucroBrutoPrevious30Days = (!isNaN(lucroBrutoPrevious30Days) && isFinite(lucroBrutoPrevious30Days)) ? lucroBrutoPrevious30Days : 0;
    
    // Porcentagem de lucro do período anterior
    const profitMarginPrevious30Days = safeVendaFinalPrevious30Days > 0
      ? (safeLucroBrutoPrevious30Days / safeVendaFinalPrevious30Days) * 100
      : 0;
    
    // Receita 90 dias atrás para cálculo do período anterior
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
    
    // Receita de transações 90 dias atrás
    const revenueTransactions90Days = safeTransactions?.filter(t => {
      try {
        return t && typeof t.timestamp === 'number' && !isNaN(t.timestamp) && t.timestamp >= ninetyDaysAgo && t.timestamp < sixtyDaysAgo && t.type === 'entrada';
      } catch {
        return false;
      }
    }).reduce((sum, t) => {
      try {
        const amount = Number(t?.amount) || 0;
        return (!isNaN(amount) && isFinite(amount)) ? sum + amount : sum;
      } catch {
        return sum;
      }
    }, 0) || 0;
    
    // Receita de orders 90 dias atrás
    const revenueOrders90Days = safeOrders?.filter(o => {
      try {
        return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= ninetyDaysAgo && o.timestamp < sixtyDaysAgo && (o.status === 'concluido' || o.paymentStatus === 'pago');
      } catch {
        return false;
      }
    }).reduce((sum, o) => {
      try {
        const total = Number(o?.total) || 0;
        return (!isNaN(total) && isFinite(total)) ? sum + total : sum;
      } catch {
        return sum;
      }
    }, 0) || 0;
    
    // CMV 90 dias atrás
    let cmvFromOrders90Days = 0;
    try {
      safeOrders?.filter(o => {
        try {
          return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= ninetyDaysAgo && o.timestamp < sixtyDaysAgo && (o.status === 'concluido' || o.paymentStatus === 'pago');
        } catch {
          return false;
        }
      }).forEach(order => {
        try {
          if (order?.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              try {
                if (item?.productId) {
                  const product = safeProducts?.find(p => p?.id === item.productId);
                  if (product?.buyPrice) {
                    const buyPrice = Number(product.buyPrice) || 0;
                    const quantity = Number(item.quantity) || 0;
                    if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity)) {
                      cmvFromOrders90Days += buyPrice * quantity;
                    }
                  }
                }
              } catch {
                // Ignorar erro no item
              }
            });
          }
        } catch {
          // Ignorar erro na order
        }
      });
    } catch {
      cmvFromOrders90Days = 0;
    }
    
    // Despesas de transações 90 dias atrás
    const expensesTransactions90Days = safeTransactions?.filter(t => {
      try {
        return t && typeof t.timestamp === 'number' && !isNaN(t.timestamp) && t.timestamp >= ninetyDaysAgo && t.timestamp < sixtyDaysAgo && t.type === 'saida';
      } catch {
        return false;
      }
    }).reduce((sum, t) => {
      try {
        const amount = Number(t?.amount) || 0;
        return (!isNaN(amount) && isFinite(amount)) ? sum + amount : sum;
      } catch {
        return sum;
      }
    }, 0) || 0;
    
    // Venda Final 90 dias atrás
    const vendaFinal90Days = revenueTransactions90Days + revenueOrders90Days;
    const safeVendaFinal90Days = (!isNaN(vendaFinal90Days) && isFinite(vendaFinal90Days)) ? vendaFinal90Days : 0;
    
    // Gasto de Venda 90 dias atrás
    const gastoVenda90Days = cmvFromOrders90Days + expensesTransactions90Days;
    const safeGastoVenda90Days = (!isNaN(gastoVenda90Days) && isFinite(gastoVenda90Days)) ? gastoVenda90Days : 0;
    
    // Lucro Bruto 90 dias atrás
    const lucroBruto90Days = safeVendaFinal90Days - safeGastoVenda90Days;
    const safeLucroBruto90Days = (!isNaN(lucroBruto90Days) && isFinite(lucroBruto90Days)) ? lucroBruto90Days : 0;
    
    // Porcentagem de lucro 90 dias atrás
    const profitMargin90Days = safeVendaFinal90Days > 0
      ? (safeLucroBruto90Days / safeVendaFinal90Days) * 100
      : 0;
    
    // Crescimento = mudança na porcentagem de lucro (margem de lucro)
    // Valor principal: porcentagem de lucro atual (margem de lucro)
    const safeProfitMarginLast30Days = (!isNaN(profitMarginLast30Days) && isFinite(profitMarginLast30Days)) ? profitMarginLast30Days : 0;
    const safeProfitMarginPrevious30Days = (!isNaN(profitMarginPrevious30Days) && isFinite(profitMarginPrevious30Days)) ? profitMarginPrevious30Days : 0;
    
    // Mudança: crescimento da margem de lucro comparado ao período anterior
    // Calcular de forma mais conservadora para evitar valores absurdos
    let growthChange = 0;
    
    // Se ambos os períodos têm margem válida, calcular diferença percentual
    if (Math.abs(safeProfitMarginPrevious30Days) > 0.01) {
      // Diferença absoluta entre margens
      const marginDifference = safeProfitMarginLast30Days - safeProfitMarginPrevious30Days;
      // Crescimento em pontos percentuais, não em porcentagem da porcentagem
      // Para evitar valores extremos, usar uma fórmula mais conservadora
      growthChange = marginDifference; // Diferença em pontos percentuais
      
      // Se a mudança for muito grande, limitar a razão
      if (Math.abs(marginDifference) > Math.abs(safeProfitMarginPrevious30Days) * 2) {
        // Se a mudança é mais que 2x a margem anterior, usar crescimento relativo limitado
        growthChange = safeProfitMarginPrevious30Days > 0 
          ? (marginDifference / safeProfitMarginPrevious30Days) * 100
          : marginDifference * 10; // Multiplicar por 10 para dar uma escala razoável
      }
    } else if (safeProfitMarginLast30Days > 0 && Math.abs(safeProfitMarginPrevious30Days) < 0.01) {
      // Se não havia margem antes e agora há, considerar crescimento positivo moderado
      growthChange = Math.min(50, safeProfitMarginLast30Days); // Limitar a 50 pontos percentuais
    } else if (safeProfitMarginLast30Days < 0 && Math.abs(safeProfitMarginPrevious30Days) < 0.01) {
      // Se não havia margem antes e agora tem margem negativa, considerar queda moderada
      growthChange = Math.max(-50, safeProfitMarginLast30Days); // Limitar a -50 pontos percentuais
    }
    
    // Limitar crescimento para valores razoáveis (entre -100% e 100% de diferença em pontos percentuais)
    const safeGrowthChange = (!isNaN(growthChange) && isFinite(growthChange)) 
      ? Math.max(-100, Math.min(100, growthChange)) 
      : 0;

      // Produtos - calcular mudança baseado em produtos com estoque
      const totalProducts = safeProducts?.length || 0;
      const productsWithStock = safeProducts?.filter(p => {
        try {
          const stock = Number(p?.stock) || 0;
          return !isNaN(stock) && isFinite(stock) && stock > 0;
        } catch {
          return false;
        }
      }).length || 0;
      const products30DaysAgo = totalProducts; // Assumir que todos os produtos existem há mais de 30 dias
      // Calcular mudança baseado em crescimento de estoque ou novos produtos
      // Como não temos data de criação, usar uma estimativa baseada em produtos ativos
      const productsChange = products30DaysAgo > 0
        ? ((productsWithStock - products30DaysAgo) / products30DaysAgo) * 100
        : 0;

      return {
        customers: {
          value: totalCustomers,
          change: (!isNaN(customersChange) && isFinite(customersChange)) ? customersChange : 0
        },
        orders: {
          value: ordersLast30Days,
          change: (!isNaN(ordersChange) && isFinite(ordersChange)) ? ordersChange : 0
        },
        profit: {
          value: safeProfitLast30Days,
          change: safeProfitChange
        },
      growth: {
        // Valor principal: porcentagem de lucro nas vendas (margem de lucro)
        value: safeProfitMarginLast30Days,
        // Mudança: crescimento da margem de lucro em relação ao período anterior
        change: safeGrowthChange
      },
        products: {
          value: totalProducts,
          change: (!isNaN(productsChange) && isFinite(productsChange)) ? productsChange : 0
        }
      };
    } catch (error) {
      // Retornar valores padrão em caso de erro
      return {
        customers: { value: 0, change: 0 },
        orders: { value: 0, change: 0 },
        profit: { value: 0, change: 0 },
        growth: { value: 0, change: 0 },
        products: { value: 0, change: 0 }
      };
    }
  }, [safeCustomers, safeOrders, safeTransactions, safeProducts]);

  // Dados mensais para gráfico de barras empilhadas
  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentDate = new Date().getDate();
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    
    return months.map((monthName, monthIndex) => {
      const monthTransactions = safeTransactions.filter(t => {
        if (!t || !t.timestamp) return false;
        try {
          const tDate = new Date(t.timestamp);
          return tDate.getFullYear() === currentYear && tDate.getMonth() === monthIndex;
        } catch {
          return false;
        }
      });

      // Receita atual do mês (APENAS vendas, sem duplicação)
      // IDs de pedidos concluídos/pagos do mês para evitar duplicação
      const monthCompletedOrderIds = new Set(
        safeOrders
          .filter(o => {
            try {
              if (!o || !o.timestamp) return false;
              const oDate = new Date(o.timestamp);
              return oDate.getFullYear() === currentYear && 
                     oDate.getMonth() === monthIndex && 
                     (o.status === 'concluido' || o.paymentStatus === 'pago');
            } catch {
              return false;
            }
          })
          .map(o => o.id)
      );
      
      // 1. Receita de pedidos do mês
      const monthRevenueOrders = safeOrders
        .filter(o => {
          try {
            if (!o || !o.timestamp) return false;
            const oDate = new Date(o.timestamp);
            return oDate.getFullYear() === currentYear && 
                   oDate.getMonth() === monthIndex && 
                   (o.status === 'concluido' || o.paymentStatus === 'pago');
          } catch {
            return false;
          }
        })
        .reduce((sum, o) => {
          const total = Number(o?.total) || 0;
          return (!isNaN(total) && isFinite(total)) ? sum + total : sum;
        }, 0);
      
      // 2. Receita de transações diretas do mês (SEM orderId ou com orderId não processado)
      const monthRevenueTransactions = monthTransactions
        .filter(t => {
          try {
            if (!t || t.type !== 'entrada' || t.category !== 'venda') return false;
            // Se tem orderId E esse orderId está nos pedidos concluídos, IGNORAR
            if (t.orderId && t.orderId !== '' && monthCompletedOrderIds.has(t.orderId)) return false;
            return true;
          } catch {
            return false;
          }
        })
        .reduce((sum, t) => {
          const amount = Number(t.amount) || 0;
          return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
        }, 0);
      
      const atuaisRevenue = monthRevenueOrders + monthRevenueTransactions;

      // Despesas do mês
      const monthExpenses = monthTransactions
        .filter(t => t && t.type === 'saida' && typeof t.amount === 'number')
        .reduce((sum, t) => {
          const amount = Number(t.amount) || 0;
          return (!isNaN(amount) && isFinite(amount)) ? sum + amount : sum;
        }, 0);

      // CMV do mês (através dos pedidos do mês)
      let monthCMV = 0;
      try {
        const monthOrders = safeOrders.filter(o => {
          try {
            if (!o || !o.timestamp) return false;
            const oDate = new Date(o.timestamp);
            return oDate.getFullYear() === currentYear && 
                   oDate.getMonth() === monthIndex && 
                   (o.status === 'concluido' || o.paymentStatus === 'pago');
          } catch {
            return false;
          }
        });

        monthOrders.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              try {
                const product = safeProducts.find(p => p && p.id === item.productId);
                if (product && product.buyPrice) {
                  const buyPrice = Number(product.buyPrice) || 0;
                  const quantity = Number(item.quantity) || 0;
                  if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity)) {
                    monthCMV += buyPrice * quantity;
                  }
                }
              } catch {
                // Ignorar item inválido
              }
            });
          }
        });

        // Adicionar CMV estimado de transações sem orderId
        const monthTransactionsWithoutOrder = monthTransactions.filter(t => 
          t && t.type === 'entrada' && t.category === 'venda' && !t.orderId
        );

        if (monthTransactionsWithoutOrder.length > 0 && safeProducts.length > 0) {
          const normalizeCpf = (cpf: string) => cpf.replace(/\D/g, '');
          let totalSellPrice = 0;
          let totalBuyPrice = 0;
          let productCount = 0;
          
          safeProducts.forEach(product => {
            try {
              const sellPrice = Number(product.sellPrice) || 0;
              const buyPrice = Number(product.buyPrice) || 0;
              if (!isNaN(sellPrice) && !isNaN(buyPrice) && isFinite(sellPrice) && isFinite(buyPrice) && sellPrice > 0 && buyPrice >= 0) {
                totalSellPrice += sellPrice;
                totalBuyPrice += buyPrice;
                productCount++;
              }
            } catch {
              // Ignorar produto inválido
            }
          });

          if (productCount > 0 && totalSellPrice > 0) {
            const avgCostRatio = totalBuyPrice / totalSellPrice;
            monthTransactionsWithoutOrder.forEach(transaction => {
              try {
                const revenue = Number(transaction.amount) || 0;
                if (!isNaN(revenue) && isFinite(revenue) && revenue > 0) {
                  const estimatedCMV = revenue * avgCostRatio;
                  if (!isNaN(estimatedCMV) && isFinite(estimatedCMV)) {
                    monthCMV += estimatedCMV;
                  }
                }
              } catch {
                // Ignorar transação inválida
              }
            });
          }
        }
      } catch {
        monthCMV = 0;
      }

      // Lucro atual do mês = Receita - Despesas - CMV
      const atuaisProfit = (atuaisRevenue || 0) - (monthExpenses || 0) - (monthCMV || 0);
      const safeAtuaisProfit = (!isNaN(atuaisProfit) && isFinite(atuaisProfit)) ? atuaisProfit : 0;

      // Calcular dias no mês e dias decorridos
      const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
      const isCurrentMonth = monthIndex === currentMonth;
      const daysElapsed = isCurrentMonth ? currentDate : daysInMonth;
      const daysRemaining = daysInMonth - daysElapsed;

      // Calcular média diária atual
      const avgDailyRevenue = daysElapsed > 0 ? (atuaisRevenue / daysElapsed) : 0;
      
      // Projeção baseada na média diária atual multiplicada pelos dias restantes + atual
      let projecoesRevenue = atuaisRevenue;
      if (isCurrentMonth && daysRemaining > 0 && avgDailyRevenue > 0) {
        // Projeção: média diária * dias restantes + atual
        projecoesRevenue = atuaisRevenue + (avgDailyRevenue * daysRemaining);
      } else if (!isCurrentMonth && atuaisRevenue > 0) {
        // Para meses passados, usar média do mês anterior com crescimento de 5%
        const previousMonthIndex = monthIndex > 0 ? monthIndex - 1 : 11;
        const previousYear = monthIndex > 0 ? currentYear : currentYear - 1;
        const previousMonthTransactions = safeTransactions.filter(t => {
          try {
            if (!t || !t.timestamp) return false;
            const tDate = new Date(t.timestamp);
            return tDate.getFullYear() === previousYear && tDate.getMonth() === previousMonthIndex;
          } catch {
            return false;
          }
        });
        // Calcular receita do mês anterior corretamente (sem duplicação)
        const prevMonthCompletedOrderIds = new Set(
          safeOrders
            .filter(o => {
              try {
                if (!o || !o.timestamp) return false;
                const oDate = new Date(o.timestamp);
                return oDate.getFullYear() === previousYear && 
                       oDate.getMonth() === previousMonthIndex && 
                       (o.status === 'concluido' || o.paymentStatus === 'pago');
              } catch {
                return false;
              }
            })
            .map(o => o.id)
        );
        
        const prevMonthRevenueOrders = safeOrders
          .filter(o => {
            try {
              if (!o || !o.timestamp) return false;
              const oDate = new Date(o.timestamp);
              return oDate.getFullYear() === previousYear && 
                     oDate.getMonth() === previousMonthIndex && 
                     (o.status === 'concluido' || o.paymentStatus === 'pago');
            } catch {
              return false;
            }
          })
          .reduce((sum, o) => {
            const total = Number(o?.total) || 0;
            return (!isNaN(total) && isFinite(total)) ? sum + total : sum;
          }, 0);
        
        const prevMonthRevenueTransactions = previousMonthTransactions
          .filter(t => {
            try {
              if (!t || t.type !== 'entrada' || t.category !== 'venda') return false;
              // Se tem orderId E esse orderId está nos pedidos concluídos, IGNORAR
              if (t.orderId && t.orderId !== '' && prevMonthCompletedOrderIds.has(t.orderId)) return false;
              return true;
            } catch {
              return false;
            }
          })
          .reduce((sum, t) => {
            const amount = Number(t.amount) || 0;
            return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
          }, 0);
        
        const previousMonthRevenue = prevMonthRevenueOrders + prevMonthRevenueTransactions;
        projecoesRevenue = previousMonthRevenue > 0 ? atuaisRevenue * 1.05 : (atuaisRevenue > 0 ? atuaisRevenue * 1.2 : 0);
      } else {
        // Para meses futuros ou sem dados, projetar baseado na média dos meses anteriores
        const pastMonthsRevenue = months.slice(0, monthIndex).reduce((sum, _, pastIndex) => {
          const pastTransactions = safeTransactions.filter(t => {
            try {
              if (!t || !t.timestamp) return false;
              const tDate = new Date(t.timestamp);
              return tDate.getFullYear() === currentYear && tDate.getMonth() === pastIndex;
            } catch {
              return false;
            }
          });
          // Calcular receita do mês passado corretamente (sem duplicação)
          const pastMonthCompletedOrderIds = new Set(
            safeOrders
              .filter(o => {
                try {
                  if (!o || !o.timestamp) return false;
                  const oDate = new Date(o.timestamp);
                  return oDate.getFullYear() === currentYear && 
                         oDate.getMonth() === pastIndex && 
                         (o.status === 'concluido' || o.paymentStatus === 'pago');
                } catch {
                  return false;
                }
              })
              .map(o => o.id)
          );
          
          const pastMonthRevenueOrders = safeOrders
            .filter(o => {
              try {
                if (!o || !o.timestamp) return false;
                const oDate = new Date(o.timestamp);
                return oDate.getFullYear() === currentYear && 
                       oDate.getMonth() === pastIndex && 
                       (o.status === 'concluido' || o.paymentStatus === 'pago');
              } catch {
                return false;
              }
            })
            .reduce((s, o) => {
              const total = Number(o?.total) || 0;
              return (!isNaN(total) && isFinite(total)) ? s + total : s;
            }, 0);
          
          const pastMonthRevenueTransactions = pastTransactions
            .filter(t => {
              try {
                if (!t || t.type !== 'entrada' || t.category !== 'venda') return false;
                // Se tem orderId E esse orderId está nos pedidos concluídos, IGNORAR
                if (t.orderId && t.orderId !== '' && pastMonthCompletedOrderIds.has(t.orderId)) return false;
                return true;
              } catch {
                return false;
              }
            })
            .reduce((s, t) => {
              const amount = Number(t.amount) || 0;
              return (!isNaN(amount) && isFinite(amount) && amount > 0) ? s + amount : s;
            }, 0);
          
          const pastRevenue = pastMonthRevenueOrders + pastMonthRevenueTransactions;
          return sum + pastRevenue;
        }, 0);
        const avgPastRevenue = monthIndex > 0 ? pastMonthsRevenue / monthIndex : 0;
        projecoesRevenue = avgPastRevenue > 0 ? avgPastRevenue * 1.1 : 0;
      }

      // Projeção de lucro baseada na margem atual
      const currentProfitMargin = atuaisRevenue > 0 ? (safeAtuaisProfit / atuaisRevenue) : 0;
      const projecoesProfit = projecoesRevenue * (currentProfitMargin || 0.3); // Usar 30% como padrão se não houver margem

      return {
        month: monthName,
        monthIndex,
        atuais: atuaisRevenue || 0,
        atuaisProfit: safeAtuaisProfit || 0,
        projecoes: projecoesRevenue || 0,
        projecoesProfit: projecoesProfit || 0,
        total: (atuaisRevenue || 0) + (projecoesRevenue || 0),
        daysElapsed,
        daysRemaining,
        avgDailyRevenue
      };
    });
  }, [safeTransactions, safeOrders, safeProducts]);

  // Dados semanais para gráfico de faturamento com cálculo de lucro por dia
  const weeklyData = useMemo(() => {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1); // Segunda-feira da semana atual
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    return days.map((dayName, dayIndex) => {
      const currentDay = new Date(currentWeekStart);
      currentDay.setDate(currentWeekStart.getDate() + dayIndex);
      const currentDayEnd = new Date(currentDay);
      currentDayEnd.setHours(23, 59, 59, 999);

      const previousDay = new Date(previousWeekStart);
      previousDay.setDate(previousWeekStart.getDate() + dayIndex);
      const previousDayEnd = new Date(previousDay);
      previousDayEnd.setHours(23, 59, 59, 999);

      // IDs de pedidos concluídos/pagos do dia atual para evitar duplicação
      const dayCompletedOrderIds = new Set(
        safeOrders
          .filter(o => {
            try {
              if (!o || !o.timestamp) return false;
              const oDate = new Date(o.timestamp);
              return oDate >= currentDay && 
                     oDate <= currentDayEnd && 
                     (o.status === 'concluido' || o.paymentStatus === 'pago');
            } catch {
              return false;
            }
          })
          .map(o => o.id)
      );
      
      // 1. Receita de pedidos do dia atual
      const dayRevenueOrders = safeOrders
        .filter(o => {
          try {
            if (!o || !o.timestamp) return false;
            const oDate = new Date(o.timestamp);
            return oDate >= currentDay && 
                   oDate <= currentDayEnd && 
                   (o.status === 'concluido' || o.paymentStatus === 'pago');
          } catch {
            return false;
          }
        })
        .reduce((sum, o) => {
          const total = Number(o?.total) || 0;
          return (!isNaN(total) && isFinite(total)) ? sum + total : sum;
        }, 0);
      
      // 2. Receita de transações diretas do dia atual (SEM orderId ou com orderId não processado)
      const dayRevenueTransactions = safeTransactions
        .filter(t => {
          try {
            if (!t || !t.timestamp || t.type !== 'entrada' || t.category !== 'venda') return false;
            const tDate = new Date(t.timestamp);
            if (tDate < currentDay || tDate > currentDayEnd) return false;
            // Se tem orderId E esse orderId está nos pedidos concluídos, IGNORAR
            if (t.orderId && t.orderId !== '' && dayCompletedOrderIds.has(t.orderId)) return false;
            return true;
          } catch {
            return false;
          }
        })
        .reduce((sum, t) => {
          const amount = Number(t.amount) || 0;
          return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
        }, 0);
      
      const currentWeekRevenue = dayRevenueOrders + dayRevenueTransactions;

      // IDs de pedidos concluídos/pagos do dia anterior para evitar duplicação
      const prevDayCompletedOrderIds = new Set(
        safeOrders
          .filter(o => {
            try {
              if (!o || !o.timestamp) return false;
              const oDate = new Date(o.timestamp);
              return oDate >= previousDay && 
                     oDate <= previousDayEnd && 
                     (o.status === 'concluido' || o.paymentStatus === 'pago');
            } catch {
              return false;
            }
          })
          .map(o => o.id)
      );
      
      // 1. Receita de pedidos do dia anterior
      const prevDayRevenueOrders = safeOrders
        .filter(o => {
          try {
            if (!o || !o.timestamp) return false;
            const oDate = new Date(o.timestamp);
            return oDate >= previousDay && 
                   oDate <= previousDayEnd && 
                   (o.status === 'concluido' || o.paymentStatus === 'pago');
          } catch {
            return false;
          }
        })
        .reduce((sum, o) => {
          const total = Number(o?.total) || 0;
          return (!isNaN(total) && isFinite(total)) ? sum + total : sum;
        }, 0);
      
      // 2. Receita de transações diretas do dia anterior (SEM orderId ou com orderId não processado)
      const prevDayRevenueTransactions = safeTransactions
        .filter(t => {
          try {
            if (!t || !t.timestamp || t.type !== 'entrada' || t.category !== 'venda') return false;
            const tDate = new Date(t.timestamp);
            if (tDate < previousDay || tDate > previousDayEnd) return false;
            // Se tem orderId E esse orderId está nos pedidos concluídos, IGNORAR
            if (t.orderId && t.orderId !== '' && prevDayCompletedOrderIds.has(t.orderId)) return false;
            return true;
          } catch {
            return false;
          }
        })
        .reduce((sum, t) => {
          const amount = Number(t.amount) || 0;
          return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
        }, 0);
      
      const previousWeekRevenue = prevDayRevenueOrders + prevDayRevenueTransactions;

      // Calcular despesas do dia atual
      const currentWeekExpenses = safeTransactions
        .filter(t => {
          if (!t || !t.timestamp || t.type !== 'saida') return false;
          try {
            const tDate = new Date(t.timestamp);
            return tDate >= currentDay && tDate <= currentDayEnd;
          } catch {
            return false;
          }
        })
        .reduce((sum, t) => {
          const amount = Number(t.amount) || 0;
          return (!isNaN(amount) && isFinite(amount)) ? sum + amount : sum;
        }, 0);

      // Calcular CMV (Custo das Mercadorias Vendidas) do dia atual
      // Inclui CMV de pedidos E transações de venda
      let currentWeekCMV = 0;
      
      try {
        // 1. CMV dos pedidos do dia (pedidos concluídos/pagos que têm items definidos)
        const currentDayOrders = safeOrders.filter(o => {
          try {
            if (!o || !o.timestamp) return false;
            const oDate = new Date(o.timestamp);
            return oDate >= currentDay && oDate <= currentDayEnd && 
                   (o.status === 'concluido' || o.paymentStatus === 'pago');
          } catch {
            return false;
          }
        });

        // Conjunto para rastrear pedidos já processados (evitar duplicação)
        const processedOrderIds = new Set<string>();

        currentDayOrders.forEach(order => {
          if (order.items && Array.isArray(order.items) && order.id) {
            processedOrderIds.add(order.id);
            order.items.forEach(item => {
              try {
                const product = safeProducts.find(p => p && p.id === item.productId);
                if (product && product.buyPrice) {
                  const buyPrice = Number(product.buyPrice) || 0;
                  const quantity = Number(item.quantity) || 0;
                  if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity) && quantity > 0) {
                    currentWeekCMV += buyPrice * quantity;
                  }
                }
              } catch {
                // Ignorar item inválido
              }
            });
          }
        });

        // 2. CMV das transações de venda do dia que NÃO têm pedido vinculado (vendas diretas do Balcão)
        // Para transações COM orderId: CMV já foi calculado acima pelos pedidos
        // Para transações SEM orderId (vendas diretas do Balcão): calcular CMV estimado
        const currentDayTransactions = safeTransactions.filter(t => {
          try {
            if (!t || !t.timestamp || t.type !== 'entrada' || t.category !== 'venda') return false;
            const tDate = new Date(t.timestamp);
            return tDate >= currentDay && tDate <= currentDayEnd;
          } catch {
            return false;
          }
        });

        // Transações sem orderId (vendas diretas do Balcão) precisam de CMV estimado
        // Filtrar apenas transações que NÃO têm orderId (vendas diretas do Balcão)
        // Transações com orderId já tiveram seu CMV calculado pelos pedidos acima
        const transactionsWithoutOrder = currentDayTransactions.filter(t => !t.orderId);
        
        if (transactionsWithoutOrder.length > 0 && safeProducts.length > 0) {
          // Calcular margem média de custo/venda dos produtos cadastrados
          let totalSellPrice = 0;
          let totalBuyPrice = 0;
          let productCount = 0;
          
          safeProducts.forEach(product => {
            try {
              const sellPrice = Number(product.sellPrice) || 0;
              const buyPrice = Number(product.buyPrice) || 0;
              if (!isNaN(sellPrice) && !isNaN(buyPrice) && isFinite(sellPrice) && isFinite(buyPrice) && sellPrice > 0 && buyPrice >= 0) {
                totalSellPrice += sellPrice;
                totalBuyPrice += buyPrice;
                productCount++;
              }
            } catch {
              // Ignorar produto inválido
            }
          });

          // Se temos produtos válidos, calcular proporção média de custo sobre venda
          if (productCount > 0 && totalSellPrice > 0) {
            const avgCostRatio = totalBuyPrice / totalSellPrice; // Razão média de custo/venda
            
            // Aplicar proporção média às vendas diretas do Balcão para estimar CMV
            transactionsWithoutOrder.forEach(transaction => {
              try {
                const revenue = Number(transaction.amount) || 0;
                if (!isNaN(revenue) && isFinite(revenue) && revenue > 0) {
                  const estimatedCMV = revenue * avgCostRatio;
                  if (!isNaN(estimatedCMV) && isFinite(estimatedCMV)) {
                    currentWeekCMV += estimatedCMV;
                  }
                }
              } catch {
                // Ignorar transação inválida
              }
            });
          }
        }
      } catch (error) {
        console.error('Erro ao calcular CMV:', error);
        currentWeekCMV = 0;
      }

      // Lucro do dia = Receita - Despesas - CMV
      const currentWeekProfit = (currentWeekRevenue || 0) - (currentWeekExpenses || 0) - (currentWeekCMV || 0);
      const safeCurrentWeekProfit = (!isNaN(currentWeekProfit) && isFinite(currentWeekProfit)) ? currentWeekProfit : 0;

      // Porcentagem de lucro do dia = (Lucro / Receita) * 100
      const currentWeekProfitMargin = (currentWeekRevenue || 0) > 0
        ? (safeCurrentWeekProfit / (currentWeekRevenue || 1)) * 100
        : 0;
      const safeCurrentWeekProfitMargin = (!isNaN(currentWeekProfitMargin) && isFinite(currentWeekProfitMargin)) 
        ? currentWeekProfitMargin 
        : 0;

      return {
        day: dayName,
        currentWeek: (!isNaN(currentWeekRevenue) && isFinite(currentWeekRevenue)) ? currentWeekRevenue : 0,
        previousWeek: (!isNaN(previousWeekRevenue) && isFinite(previousWeekRevenue)) ? previousWeekRevenue : 0,
        profit: safeCurrentWeekProfit,
        profitMargin: safeCurrentWeekProfitMargin
      };
    });
  }, [safeTransactions, safeOrders, safeProducts]);

  // Dados por categoria para gráfico de rosca
  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    const categoryCMVMap: Record<string, number> = {}; // CMV (gasto) por categoria
    
    // 1. Processar vendas de pedidos (comandas)
    safeOrders
      .filter(o => o.status === 'concluido' || o.paymentStatus === 'pago')
      .forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const product = safeProducts.find(p => p.id === item.productId);
            if (product && product.category) {
              const category = product.category;
              const value = (item.price || 0) * (item.quantity || 0);
              categoryMap[category] = (categoryMap[category] || 0) + value;
              
              // Calcular CMV da categoria
              const buyPrice = Number(product.buyPrice) || 0;
              const quantity = Number(item.quantity) || 0;
              if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity)) {
                const cmv = buyPrice * quantity;
                categoryCMVMap[category] = (categoryCMVMap[category] || 0) + cmv;
              }
            }
          });
        }
      });

    // 2. Processar vendas diretas do caixa (Balcão) através de transações
    // Para transações que têm orderId, já foram contabilizadas pelos pedidos acima
    // Então só processamos transações sem orderId (vendas diretas do Balcão)
    safeTransactions
      .filter(t => 
        t && 
        t.type === 'entrada' && 
        t.category === 'venda' &&
        (!t.orderId || t.orderId === '') && // Apenas vendas diretas sem pedido vinculado
        typeof t.amount === 'number' &&
        t.amount > 0
      )
      .forEach(transaction => {
        const amount = Number(transaction.amount) || 0;
        if (!isNaN(amount) && isFinite(amount) && amount > 0) {
          // Se a transação tem uma categoria específica (se o sistema suportar)
          // caso contrário, usar uma categoria padrão ou distribuir por produtos mais vendidos
          // Por enquanto, vamos procurar se há produtos relacionados ou usar categoria "Outros"
          // Para ser mais preciso, precisaríamos rastrear qual produto foi vendido na transação direta
          
          // Tentar encontrar categoria através de produtos relacionados se houver descrição
          let categoryFound = false;
          if (transaction.description) {
            // Tentar encontrar produto pela descrição
            const product = safeProducts.find(p => 
              p.name && transaction.description && 
              transaction.description.toLowerCase().includes(p.name.toLowerCase())
            );
            if (product && product.category) {
              categoryMap[product.category] = (categoryMap[product.category] || 0) + amount;
              
              // Calcular CMV estimado para esta categoria
              if (safeProducts.length > 0) {
                let totalSellPrice = 0;
                let totalBuyPrice = 0;
                let productCount = 0;
                
                safeProducts.forEach(p => {
                  try {
                    const sellPrice = Number(p.sellPrice) || 0;
                    const buyPrice = Number(p.buyPrice) || 0;
                    if (!isNaN(sellPrice) && !isNaN(buyPrice) && isFinite(sellPrice) && isFinite(buyPrice) && sellPrice > 0 && buyPrice >= 0) {
                      totalSellPrice += sellPrice;
                      totalBuyPrice += buyPrice;
                      productCount++;
                    }
                  } catch {
                    // Ignorar produto inválido
                  }
                });
                
                if (productCount > 0 && totalSellPrice > 0) {
                  const avgCostRatio = totalBuyPrice / totalSellPrice;
                  const estimatedCMV = amount * avgCostRatio;
                  if (!isNaN(estimatedCMV) && isFinite(estimatedCMV)) {
                    categoryCMVMap[product.category] = (categoryCMVMap[product.category] || 0) + estimatedCMV;
                  }
                }
              }
              
              categoryFound = true;
            }
          }
          
          // Se não encontrou categoria específica, categorizar como "Outros"
          if (!categoryFound) {
            categoryMap['Outros'] = (categoryMap['Outros'] || 0) + amount;
            
            // Calcular CMV estimado para "Outros"
            if (safeProducts.length > 0) {
              let totalSellPrice = 0;
              let totalBuyPrice = 0;
              let productCount = 0;
              
              safeProducts.forEach(product => {
                try {
                  const sellPrice = Number(product.sellPrice) || 0;
                  const buyPrice = Number(product.buyPrice) || 0;
                  if (!isNaN(sellPrice) && !isNaN(buyPrice) && isFinite(sellPrice) && isFinite(buyPrice) && sellPrice > 0 && buyPrice >= 0) {
                    totalSellPrice += sellPrice;
                    totalBuyPrice += buyPrice;
                    productCount++;
                  }
                } catch {
                  // Ignorar produto inválido
                }
              });
              
              if (productCount > 0 && totalSellPrice > 0) {
                const avgCostRatio = totalBuyPrice / totalSellPrice;
                const estimatedCMV = amount * avgCostRatio;
                if (!isNaN(estimatedCMV) && isFinite(estimatedCMV)) {
                  categoryCMVMap['Outros'] = (categoryCMVMap['Outros'] || 0) + estimatedCMV;
                }
              }
            }
          }
        }
      });

    // 3. Processar transações de venda que estão vinculadas a pedidos mas o pedido ainda não foi processado
    // (evitar duplicação - apenas se o pedido não foi encontrado)
    const processedOrderIds = new Set(
      safeOrders
        .filter(o => o.status === 'concluido' || o.paymentStatus === 'pago')
        .map(o => o.id)
    );

    safeTransactions
      .filter(t => 
        t && 
        t.type === 'entrada' && 
        t.category === 'venda' &&
        t.orderId && 
        t.orderId !== '' &&
        !processedOrderIds.has(t.orderId) && // Pedido ainda não foi processado
        typeof t.amount === 'number' &&
        t.amount > 0
      )
      .forEach(transaction => {
        const amount = Number(transaction.amount) || 0;
        if (!isNaN(amount) && isFinite(amount) && amount > 0) {
          // Buscar o pedido mesmo que não esteja concluído ainda
          const relatedOrder = safeOrders.find(o => o.id === transaction.orderId);
          if (relatedOrder && relatedOrder.items && Array.isArray(relatedOrder.items)) {
            // Calcular proporção de cada item no total do pedido
            const orderTotal = relatedOrder.total || 0;
            if (orderTotal > 0) {
              relatedOrder.items.forEach(item => {
                const product = safeProducts.find(p => p.id === item.productId);
                if (product && product.category) {
                  const itemValue = (item.price || 0) * (item.quantity || 0);
                  const proportion = itemValue / orderTotal;
                  const categoryAmount = amount * proportion;
                  categoryMap[product.category] = (categoryMap[product.category] || 0) + categoryAmount;
                  
                  // Calcular CMV proporcional para esta categoria
                  const buyPrice = Number(product.buyPrice) || 0;
                  const quantity = Number(item.quantity) || 0;
                  if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity)) {
                    const itemCMV = buyPrice * quantity;
                    categoryCMVMap[product.category] = (categoryCMVMap[product.category] || 0) + itemCMV;
                  }
                }
              });
            }
          } else {
            // Se não encontrou o pedido, categorizar como "Outros"
            categoryMap['Outros'] = (categoryMap['Outros'] || 0) + amount;
            
            // Calcular CMV estimado para "Outros"
            if (safeProducts.length > 0) {
              let totalSellPrice = 0;
              let totalBuyPrice = 0;
              let productCount = 0;
              
              safeProducts.forEach(product => {
                try {
                  const sellPrice = Number(product.sellPrice) || 0;
                  const buyPrice = Number(product.buyPrice) || 0;
                  if (!isNaN(sellPrice) && !isNaN(buyPrice) && isFinite(sellPrice) && isFinite(buyPrice) && sellPrice > 0 && buyPrice >= 0) {
                    totalSellPrice += sellPrice;
                    totalBuyPrice += buyPrice;
                    productCount++;
                  }
                } catch {
                  // Ignorar produto inválido
                }
              });
              
              if (productCount > 0 && totalSellPrice > 0) {
                const avgCostRatio = totalBuyPrice / totalSellPrice;
                const estimatedCMV = amount * avgCostRatio;
                if (!isNaN(estimatedCMV) && isFinite(estimatedCMV)) {
                  categoryCMVMap['Outros'] = (categoryCMVMap['Outros'] || 0) + estimatedCMV;
                }
              }
            }
          }
        }
      });

    // Calcular total com validação
    const total = Object.values(categoryMap).reduce((sum, val) => {
      const numVal = Number(val) || 0;
      return (!isNaN(numVal) && isFinite(numVal)) ? sum + numVal : sum;
    }, 0);
    
    // Converter para array e calcular porcentagens com validação
    let categories = Object.entries(categoryMap)
      .map(([category, value]) => {
        const numValue = Number(value) || 0;
        const numTotal = Number(total) || 0;
        const percentage = numTotal > 0 && !isNaN(numValue) && isFinite(numValue) 
          ? (numValue / numTotal) * 100 
          : 0;
        
        const categoryCMV = categoryCMVMap[category] || 0;
        const numCategoryCMV = Number(categoryCMV) || 0;
        const safeCategoryCMV = (!isNaN(numCategoryCMV) && isFinite(numCategoryCMV)) ? numCategoryCMV : 0;
        const categoryProfit = numValue - safeCategoryCMV;
        const safeCategoryProfit = (!isNaN(categoryProfit) && isFinite(categoryProfit)) ? categoryProfit : 0;
        
        return {
          category: String(category),
          value: (!isNaN(numValue) && isFinite(numValue)) ? numValue : 0,
          percentage: (!isNaN(percentage) && isFinite(percentage)) ? percentage : 0,
          cmv: safeCategoryCMV,
          profit: safeCategoryProfit
        };
      })
      .filter(cat => cat.value > 0) // Remover categorias com valor zero
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categorias

    // Normalizar porcentagens para somar exatamente 100%
    if (categories.length > 0) {
      const totalPercentage = categories.reduce((sum, cat) => {
        const pct = Number(cat.percentage) || 0;
        return (!isNaN(pct) && isFinite(pct)) ? sum + pct : sum;
      }, 0);
      
      if (totalPercentage > 0 && Math.abs(totalPercentage - 100) > 0.01) {
        const normalizationFactor = 100 / totalPercentage;
        categories = categories.map(cat => ({
          ...cat,
          percentage: (Number(cat.percentage) || 0) * normalizationFactor
        }));
      }
    }

    // Calcular lucro mensal geral (receita - CMV total - despesas) - MESMA LÓGICA DOS KPIs
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // IDs de pedidos concluídos/pagos para evitar duplicação (MESMO CÁLCULO DOS KPIs)
    const completedOrderIdsMonthly = new Set(
      safeOrders
        .filter(o => {
          try {
            return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= thirtyDaysAgo && (o.status === 'concluido' || o.paymentStatus === 'pago');
          } catch {
            return false;
          }
        })
        .map(o => o.id)
    );
    
    // 1. Receita de pedidos mensal (pedidos concluídos/pagos)
    const monthlyRevenueOrders = safeOrders
      .filter(o => {
        try {
          return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= thirtyDaysAgo && (o.status === 'concluido' || o.paymentStatus === 'pago');
        } catch {
          return false;
        }
      })
      .reduce((sum, o) => {
        try {
          const total = Number(o?.total) || 0;
          return (!isNaN(total) && isFinite(total)) ? sum + total : sum;
        } catch {
          return sum;
        }
      }, 0);
    
    // 2. CMV mensal de pedidos
    let monthlyCMVOrders = 0;
    try {
      safeOrders
        .filter(o => {
          try {
            return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= thirtyDaysAgo && (o.status === 'concluido' || o.paymentStatus === 'pago');
          } catch {
            return false;
          }
        })
        .forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              try {
                const product = safeProducts.find(p => p.id === item.productId);
                if (product && product.buyPrice !== undefined && product.buyPrice !== null) {
                  const buyPrice = Number(product.buyPrice) || 0;
                  const quantity = Number(item.quantity) || 0;
                  if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity) && buyPrice >= 0 && quantity > 0) {
                    monthlyCMVOrders += buyPrice * quantity;
                  }
                }
              } catch {
                // Ignorar item inválido
              }
            });
          }
        });
    } catch {
      monthlyCMVOrders = 0;
    }
    
    // 3. Receita de transações mensal (APENAS vendas diretas do caixa SEM orderId ou com orderId não processado)
    const monthlyRevenueTransactions = safeTransactions
      .filter(t => {
        try {
          if (!t || typeof t.timestamp !== 'number' || isNaN(t.timestamp) || t.timestamp < thirtyDaysAgo) return false;
          if (t.type !== 'entrada' || t.category !== 'venda') return false;
          // Se tem orderId E esse orderId está nos pedidos concluídos, IGNORAR (já foi contado)
          if (t.orderId && t.orderId !== '' && completedOrderIdsMonthly.has(t.orderId)) return false;
          return true;
        } catch {
          return false;
        }
      })
      .reduce((sum, t) => {
        try {
          const amount = Number(t?.amount) || 0;
          return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
        } catch {
          return sum;
        }
      }, 0);
    
    // 4. CMV estimado APENAS de transações diretas (SEM orderId)
    let monthlyCMVTransactions = 0;
    try {
      const monthlyTransactionsDirectSales = safeTransactions.filter(t => {
        try {
          return t && typeof t.timestamp === 'number' && !isNaN(t.timestamp) && t.timestamp >= thirtyDaysAgo && t.type === 'entrada' && t.category === 'venda' && (!t.orderId || t.orderId === '') && (!completedOrderIdsMonthly.has(t.orderId || ''));
        } catch {
          return false;
        }
      });
      
      if (monthlyTransactionsDirectSales && monthlyTransactionsDirectSales.length > 0 && safeProducts.length > 0) {
        let totalSellPrice = 0;
        let totalBuyPrice = 0;
        let productCount = 0;
        
        safeProducts.forEach(product => {
          try {
            const sellPrice = Number(product.sellPrice) || 0;
            const buyPrice = Number(product.buyPrice) || 0;
            if (!isNaN(sellPrice) && !isNaN(buyPrice) && isFinite(sellPrice) && isFinite(buyPrice) && sellPrice > 0 && buyPrice >= 0) {
              totalSellPrice += sellPrice;
              totalBuyPrice += buyPrice;
              productCount++;
            }
          } catch {
            // Ignorar produto inválido
          }
        });
        
        if (productCount > 0 && totalSellPrice > 0) {
          const avgCostRatio = totalBuyPrice / totalSellPrice;
          monthlyTransactionsDirectSales.forEach(transaction => {
            try {
              const revenue = Number(transaction.amount) || 0;
              if (!isNaN(revenue) && isFinite(revenue) && revenue > 0) {
                const estimatedCMV = revenue * avgCostRatio;
                if (!isNaN(estimatedCMV) && isFinite(estimatedCMV) && estimatedCMV >= 0) {
                  monthlyCMVTransactions += estimatedCMV;
                }
              }
            } catch {
              // Ignorar transação inválida
            }
          });
        }
      }
    } catch {
      monthlyCMVTransactions = 0;
    }
    
    const totalMonthlyRevenue = monthlyRevenueOrders + monthlyRevenueTransactions;
    const totalMonthlyCMV = monthlyCMVOrders + monthlyCMVTransactions;
    
    // 5. Despesas mensais (apenas transações de saída)
    const monthlyExpenses = safeTransactions
      .filter(t => {
        try {
          return t && typeof t.timestamp === 'number' && !isNaN(t.timestamp) && t.timestamp >= thirtyDaysAgo && t.type === 'saida';
        } catch {
          return false;
        }
      })
      .reduce((sum, t) => {
        try {
          const amount = Number(t?.amount) || 0;
          return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
        } catch {
          return sum;
        }
      }, 0);
    
    // Lucro mensal geral = Receita Total - CMV Total - Despesas
    const monthlyProfit = totalMonthlyRevenue - totalMonthlyCMV - monthlyExpenses;
    const safeMonthlyProfit = (!isNaN(monthlyProfit) && isFinite(monthlyProfit)) ? monthlyProfit : 0;
    
    return {
      categories,
      total: (!isNaN(total) && isFinite(total)) ? total : 0,
      monthlyProfit: safeMonthlyProfit,
      monthlyRevenue: (!isNaN(totalMonthlyRevenue) && isFinite(totalMonthlyRevenue)) ? totalMonthlyRevenue : 0,
      monthlyCMV: (!isNaN(totalMonthlyCMV) && isFinite(totalMonthlyCMV)) ? totalMonthlyCMV : 0,
      monthlyExpenses: (!isNaN(monthlyExpenses) && isFinite(monthlyExpenses)) ? monthlyExpenses : 0
    };
  }, [safeOrders, safeProducts, safeTransactions]);

  // Calcular totais semanais
  const weeklyTotals = useMemo(() => {
    const currentWeekTotal = weeklyData.reduce((sum, d) => sum + d.currentWeek, 0);
    const previousWeekTotal = weeklyData.reduce((sum, d) => sum + d.previousWeek, 0);
    return {
      current: currentWeekTotal,
      previous: previousWeekTotal
    };
  }, [weeklyData]);

  // Valores máximos para gráficos - escala até 1 milhão
  const maxMonthlyValue = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return 1000000;
    const maxTotal = monthlyData.reduce((max, d) => Math.max(max, d.total || 0), 0);
    // Arredondar para cima para o próximo múltiplo de 200000 (200K), mas máximo de 1 milhão
    if (maxTotal <= 0) return 1000000;
    const rounded = Math.ceil(maxTotal / 200000) * 200000;
    const result = Math.min(Math.max(rounded, 200000), 1000000); // Mínimo 200K, máximo 1M
    return isNaN(result) || !isFinite(result) ? 1000000 : result;
  }, [monthlyData]);

  const maxWeeklyValue = useMemo(() => {
    if (!weeklyData || weeklyData.length === 0) return 4000;
    const values = weeklyData.map(d => Math.max(d.currentWeek || 0, d.previousWeek || 0));
    if (values.length === 0) return 4000;
    const maxValue = Math.max(...values, 4000);
    const result = Math.ceil(maxValue / 1000) * 1000 || 4000;
    return isNaN(result) || !isFinite(result) ? 4000 : result;
  }, [weeklyData]);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Top Row: KPIs com Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Clientes */}
          <div className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-xl p-6 shadow-2xl hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <p className="text-xs font-black text-blue-400/70 uppercase mb-3 tracking-widest">Clientes</p>
              <p className="text-2xl font-black text-blue-400 mb-3 font-mono group-hover:scale-105 transition-transform duration-300 whitespace-nowrap overflow-hidden text-ellipsis">
                {kpis && kpis.customers && (!isNaN(kpis.customers.value) && isFinite(kpis.customers.value) ? kpis.customers.value : 0).toLocaleString('pt-BR')}
              </p>
              <div className="flex items-center gap-2">
                {kpis && kpis.customers && kpis.customers.change >= 0 ? (
                  <>
                    <span className="text-green-400 font-black text-sm">↑ {(!isNaN(kpis.customers.change) && isFinite(kpis.customers.change) ? Math.abs(kpis.customers.change).toFixed(2) : '0.00')}%</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-400 font-black text-sm">↓ {(!isNaN(kpis.customers.change) && isFinite(kpis.customers.change) ? Math.abs(kpis.customers.change).toFixed(2) : '0.00')}%</span>
                  </>
                )}
                <span className="text-xs text-gray-400 font-bold">Nos últimos 30 dias</span>
              </div>
            </div>
          </div>

          {/* Pedidos */}
          <div className="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-xl p-6 shadow-2xl hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <p className="text-xs font-black text-orange-400/70 uppercase mb-3 tracking-widest">Pedidos</p>
              <p className="text-2xl font-black text-orange-400 mb-3 font-mono group-hover:scale-105 transition-transform duration-300 whitespace-nowrap overflow-hidden text-ellipsis">
                {kpis && kpis.orders && (!isNaN(kpis.orders.value) && isFinite(kpis.orders.value) ? kpis.orders.value : 0).toLocaleString('pt-BR')}
              </p>
              <div className="flex items-center gap-2">
                {kpis && kpis.orders && kpis.orders.change >= 0 ? (
                  <>
                    <span className="text-green-400 font-black text-sm">↑ {(!isNaN(kpis.orders.change) && isFinite(kpis.orders.change) ? Math.abs(kpis.orders.change).toFixed(2) : '0.00')}%</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-400 font-black text-sm">↓ {(!isNaN(kpis.orders.change) && isFinite(kpis.orders.change) ? Math.abs(kpis.orders.change).toFixed(2) : '0.00')}%</span>
                  </>
                )}
                <span className="text-xs text-gray-400 font-bold">Nos últimos 30 dias</span>
              </div>
            </div>
          </div>

          {/* Lucro */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl p-6 shadow-2xl hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <p className="text-xs font-black text-gray-400/70 uppercase mb-3 tracking-widest">Lucro</p>
              <p className="text-2xl font-black text-white mb-3 font-mono group-hover:scale-105 transition-transform duration-300 whitespace-nowrap overflow-hidden text-ellipsis">
                R$ {kpis && kpis.profit && (!isNaN(kpis.profit.value) && isFinite(kpis.profit.value) ? kpis.profit.value : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2">
                {kpis && kpis.profit && kpis.profit.change >= 0 ? (
                  <>
                    <span className="text-green-400 font-black text-sm">↑ {(!isNaN(kpis.profit.change) && isFinite(kpis.profit.change) ? Math.abs(kpis.profit.change).toFixed(2) : '0.00')}%</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-400 font-black text-sm">↓ {(!isNaN(kpis.profit.change) && isFinite(kpis.profit.change) ? Math.abs(kpis.profit.change).toFixed(2) : '0.00')}%</span>
                  </>
                )}
                <span className="text-xs text-gray-400 font-bold">Nos últimos 30 dias</span>
              </div>
            </div>
          </div>

          {/* Crescimento */}
          <div className="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-xl p-6 shadow-2xl hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all duration-500 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="relative z-10">
              <p className="text-xs font-black text-orange-400/70 uppercase mb-3 tracking-widest">Crescimento</p>
              <p className="text-2xl font-black text-orange-400 mb-3 font-mono group-hover:scale-105 transition-transform duration-300 whitespace-nowrap overflow-hidden text-ellipsis">
                {kpis && kpis.growth && (!isNaN(kpis.growth.value) && isFinite(kpis.growth.value) ? kpis.growth.value : 0).toFixed(2)}%
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {kpis && kpis.growth && (() => {
                  const growthChange = (!isNaN(kpis.growth.change) && isFinite(kpis.growth.change)) ? kpis.growth.change : 0;
                  return growthChange >= 0 ? (
                    <>
                      <span className="text-green-400 font-black text-sm">↑ {Math.abs(growthChange).toFixed(2)}%</span>
                    </>
                  ) : (
                    <>
                      <span className="text-red-400 font-black text-sm">↓ {Math.abs(growthChange).toFixed(2)}%</span>
                    </>
                  );
                })()}
                <span className="text-xs text-gray-400 font-bold">Nos últimos 30 dias</span>
              </div>
            </div>
          </div>

          {/* Produtos Cadastrados */}
          <div className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-xl p-6 shadow-2xl hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <p className="text-xs font-black text-blue-400/70 uppercase mb-3 tracking-widest">Produtos Cadastrados</p>
              <p className="text-2xl font-black text-blue-400 mb-3 font-mono group-hover:scale-105 transition-transform duration-300 whitespace-nowrap overflow-hidden text-ellipsis">
                {kpis && kpis.products && (!isNaN(kpis.products.value) && isFinite(kpis.products.value) ? kpis.products.value : 0).toLocaleString('pt-BR')}
              </p>
              <div className="flex items-center gap-2">
                {kpis && kpis.products && kpis.products.change >= 0 ? (
                  <>
                    <span className="text-green-400 font-black text-sm">↑ {(!isNaN(kpis.products.change) && isFinite(kpis.products.change) ? Math.abs(kpis.products.change).toFixed(2) : '0.00')}%</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-400 font-black text-sm">↓ {(!isNaN(kpis.products.change) && isFinite(kpis.products.change) ? Math.abs(kpis.products.change).toFixed(2) : '0.00')}%</span>
                  </>
                )}
                <span className="text-xs text-gray-400 font-bold">Nos últimos 30 dias</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Gráfico de Barras Empilhadas */}
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/15 via-white/8 to-white/5 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 shadow-2xl hover:shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-all duration-500">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">PROJEÇÕES X ATUAIS</h3>
              
              {/* Indicadores de crescimento diário */}
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayEnd = new Date(today);
                todayEnd.setHours(23, 59, 59, 999);
                
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayEnd = new Date(yesterday);
                yesterdayEnd.setHours(23, 59, 59, 999);

                // Receita de hoje
                const todayRevenue = safeTransactions
                  .filter(t => {
                    if (!t || !t.timestamp || t.type !== 'entrada') return false;
                    try {
                      const tDate = new Date(t.timestamp);
                      return tDate >= today && tDate <= todayEnd;
                    } catch {
                      return false;
                    }
                  })
                  .reduce((sum, t) => {
                    const amount = Number(t.amount) || 0;
                    return (!isNaN(amount) && isFinite(amount)) ? sum + amount : sum;
                  }, 0);

                // Receita de ontem
                const yesterdayRevenue = safeTransactions
                  .filter(t => {
                    if (!t || !t.timestamp || t.type !== 'entrada') return false;
                    try {
                      const tDate = new Date(t.timestamp);
                      return tDate >= yesterday && tDate <= yesterdayEnd;
                    } catch {
                      return false;
                    }
                  })
                  .reduce((sum, t) => {
                    const amount = Number(t.amount) || 0;
                    return (!isNaN(amount) && isFinite(amount)) ? sum + amount : sum;
                  }, 0);

                // Calcular lucro de hoje
                const todayExpenses = safeTransactions
                  .filter(t => {
                    if (!t || !t.timestamp || t.type !== 'saida') return false;
                    try {
                      const tDate = new Date(t.timestamp);
                      return tDate >= today && tDate <= todayEnd;
                    } catch {
                      return false;
                    }
                  })
                  .reduce((sum, t) => {
                    const amount = Number(t.amount) || 0;
                    return (!isNaN(amount) && isFinite(amount)) ? sum + amount : sum;
                  }, 0);

                // CMV de hoje
                let todayCMV = 0;
                try {
                  const todayOrders = safeOrders.filter(o => {
                    try {
                      if (!o || !o.timestamp) return false;
                      const oDate = new Date(o.timestamp);
                      return oDate >= today && oDate <= todayEnd && 
                             (o.status === 'concluido' || o.paymentStatus === 'pago');
                    } catch {
                      return false;
                    }
                  });

                  todayOrders.forEach(order => {
                    if (order.items && Array.isArray(order.items)) {
                      order.items.forEach(item => {
                        try {
                          const product = safeProducts.find(p => p && p.id === item.productId);
                          if (product && product.buyPrice) {
                            const buyPrice = Number(product.buyPrice) || 0;
                            const quantity = Number(item.quantity) || 0;
                            if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity)) {
                              todayCMV += buyPrice * quantity;
                            }
                          }
                        } catch {
                          // Ignorar
                        }
                      });
                    }
                  });

                  // CMV estimado para transações sem orderId
                  const todayTransactionsWithoutOrder = safeTransactions.filter(t => 
                    t && t.timestamp && t.type === 'entrada' && t.category === 'venda' && !t.orderId
                  );

                  if (todayTransactionsWithoutOrder.length > 0 && safeProducts.length > 0) {
                    let totalSellPrice = 0;
                    let totalBuyPrice = 0;
                    let productCount = 0;
                    
                    safeProducts.forEach(product => {
                      try {
                        const sellPrice = Number(product.sellPrice) || 0;
                        const buyPrice = Number(product.buyPrice) || 0;
                        if (!isNaN(sellPrice) && !isNaN(buyPrice) && isFinite(sellPrice) && isFinite(buyPrice) && sellPrice > 0 && buyPrice >= 0) {
                          totalSellPrice += sellPrice;
                          totalBuyPrice += buyPrice;
                          productCount++;
                        }
                      } catch {
                        // Ignorar
                      }
                    });

                    if (productCount > 0 && totalSellPrice > 0) {
                      const avgCostRatio = totalBuyPrice / totalSellPrice;
                      todayTransactionsWithoutOrder.forEach(transaction => {
                        try {
                          const tDate = new Date(transaction.timestamp);
                          if (tDate >= today && tDate <= todayEnd) {
                            const revenue = Number(transaction.amount) || 0;
                            if (!isNaN(revenue) && isFinite(revenue) && revenue > 0) {
                              const estimatedCMV = revenue * avgCostRatio;
                              if (!isNaN(estimatedCMV) && isFinite(estimatedCMV)) {
                                todayCMV += estimatedCMV;
                              }
                            }
                          }
                        } catch {
                          // Ignorar
                        }
                      });
                    }
                  }
                } catch {
                  todayCMV = 0;
                }

                const todayProfit = (todayRevenue || 0) - (todayExpenses || 0) - (todayCMV || 0);
                const safeTodayProfit = (!isNaN(todayProfit) && isFinite(todayProfit)) ? todayProfit : 0;

                // Calcular crescimento
                const revenueGrowth = yesterdayRevenue > 0 
                  ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
                  : todayRevenue > 0 ? 100 : 0;
                const revenueGrowthAmount = todayRevenue - yesterdayRevenue;
                const safeRevenueGrowth = (!isNaN(revenueGrowth) && isFinite(revenueGrowth)) ? revenueGrowth : 0;
                const safeRevenueGrowthAmount = (!isNaN(revenueGrowthAmount) && isFinite(revenueGrowthAmount)) ? revenueGrowthAmount : 0;

                return (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="glass px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Hoje vs Ontem</p>
                      <div className="flex items-center gap-2">
                        <span className={`font-black ${safeRevenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {safeRevenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(safeRevenueGrowth).toFixed(2)}%
                        </span>
                        <span className="text-white font-mono">
                          {safeRevenueGrowthAmount >= 0 ? '+' : ''}R$ {safeRevenueGrowthAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="glass px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Lucro Hoje</p>
                      <p className={`font-black font-mono ${safeTodayProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        R$ {safeTodayProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="relative bg-black/40 rounded-2xl p-6 border border-white/10" style={{ height: '400px' }}>
              <svg viewBox="0 0 1200 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Área do gráfico */}
                <defs>
                  <clipPath id="chartArea">
                    <rect x="100" y="50" width="1000" height="300" />
                  </clipPath>
                </defs>
                
                {/* Linha de base (zero) */}
                <line
                  x1="100"
                  y1="350"
                  x2="1100"
                  y2="350"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                />
                
                {/* Grid - linhas horizontais de referência com escala igual até 1 milhão */}
                {(() => {
                  // Criar escala igual: 0, 200K, 400K, 600K, 800K, 1M
                  const gridSteps = [0, 200000, 400000, 600000, 800000, 1000000];
                  const safeMaxValue = maxMonthlyValue > 0 ? maxMonthlyValue : 1000000;
                  return gridSteps.map((value, idx) => {
                    if (value === 0) return null; // Linha zero já desenhada acima
                    const y = safeMaxValue > 0 
                      ? Math.max(50, Math.min(350, 350 - (value / safeMaxValue) * 300))
                      : 350;
                    if (y < 50 || y > 350) return null; // Só mostrar linhas dentro da área visível
                    return (
                      <g key={idx}>
                        <line
                          x1="100"
                          y1={y}
                          x2="1100"
                          y2={y}
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x="90"
                          y={y + 4}
                          textAnchor="end"
                          fill="rgba(255,255,255,0.7)"
                          fontSize="11"
                          fontWeight="700"
                          className="font-mono"
                        >
                          {value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toFixed(0)}
                        </text>
                      </g>
                    );
                  });
                })()}

              {/* Barras lado a lado - separadas para melhor visualização */}
              {monthlyData && monthlyData.length > 0 && monthlyData.map((month, idx) => {
                const atuais = Math.max(0, Number(month.atuais) || 0);
                const projecoes = Math.max(0, Number(month.projecoes) || 0);
                
                // Garantir que maxMonthlyValue seja válido
                const safeMaxValue = maxMonthlyValue > 0 ? maxMonthlyValue : 1000000;
                
                // Garantir que os valores não ultrapassem o maxMonthlyValue
                const clampedAtuais = Math.min(atuais, safeMaxValue);
                const clampedProjecoes = Math.min(projecoes, safeMaxValue);
                
                // Posição horizontal - cada mês terá duas barras lado a lado
                const dataLength = monthlyData.length > 0 ? monthlyData.length : 12;
                const barSpacing = 1000 / dataLength;
                const groupCenter = 100 + (idx * barSpacing) + (barSpacing / 2);
                const barWidth = Math.min(35, Math.max(20, barSpacing * 0.3));
                const gapBetweenBars = 8; // Espaço entre as duas barras
                
                // Posição das barras individuais
                const atuaisX = groupCenter - gapBetweenBars / 2 - barWidth / 2;
                const projecoesX = groupCenter + gapBetweenBars / 2 + barWidth / 2;
                
                // Constantes do gráfico
                const chartBase = 350; // Base do gráfico (y=350)
                const chartHeight = 300; // Altura total do gráfico (de 50 a 350)
                const chartTop = 50; // Topo do gráfico
                
                // Calcular alturas baseadas no maxMonthlyValue (proteção contra divisão por zero)
                const atuaisHeight = safeMaxValue > 0 
                  ? Math.min((clampedAtuais / safeMaxValue) * chartHeight, chartHeight)
                  : 0;
                const projecoesHeight = safeMaxValue > 0
                  ? Math.min((clampedProjecoes / safeMaxValue) * chartHeight, chartHeight)
                  : 0;
                
                // Garantir que as alturas sejam válidas
                const safeAtuaisHeight = isNaN(atuaisHeight) || !isFinite(atuaisHeight) ? 0 : Math.max(0, atuaisHeight);
                const safeProjecoesHeight = isNaN(projecoesHeight) || !isFinite(projecoesHeight) ? 0 : Math.max(0, projecoesHeight);
                
                // Posições Y (lembrando que SVG Y aumenta para baixo)
                const atuaisY = Math.max(chartTop, chartBase - safeAtuaisHeight);
                const projecoesY = Math.max(chartTop, chartBase - safeProjecoesHeight);
                
                // Calcular crescimento mensal
                const monthGrowth = idx > 0 
                  ? (monthlyData[idx - 1].atuais > 0 
                    ? ((atuais - monthlyData[idx - 1].atuais) / monthlyData[idx - 1].atuais) * 100 
                    : atuais > 0 ? 100 : 0)
                  : 0;
                const safeMonthGrowth = (!isNaN(monthGrowth) && isFinite(monthGrowth)) ? monthGrowth : 0;

                return (
                  <g key={idx} clipPath="url(#chartArea)">
                    {/* Barra Atuais (Azul) - lado esquerdo */}
                    {safeAtuaisHeight > 0.5 && (
                      <rect
                        x={atuaisX}
                        y={atuaisY}
                        width={barWidth}
                        height={safeAtuaisHeight}
                        fill="#3b82f6"
                        rx="4"
                        opacity="1"
                      />
                    )}
                    {/* Barra Projeções (Cinza) - lado direito */}
                    {safeProjecoesHeight > 0.5 && (
                      <rect
                        x={projecoesX}
                        y={projecoesY}
                        width={barWidth}
                        height={safeProjecoesHeight}
                        fill="#9ca3af"
                        rx="4"
                        opacity="0.85"
                      />
                    )}
                    {/* Label do mês */}
                    <text
                      x={groupCenter}
                      y={370}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.9)"
                      fontSize="11"
                      fontWeight="700"
                      className="uppercase"
                    >
                      {month.month || 'N/A'}
                    </text>
                    
                    {/* Valores nas barras (se houver espaço) */}
                    {safeAtuaisHeight > 20 && (
                      <text
                        x={atuaisX + barWidth / 2}
                        y={atuaisY - 5}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.8)"
                        fontSize="8"
                        fontWeight="700"
                        className="font-mono"
                      >
                        {atuais >= 1000000 ? `${(atuais / 1000000).toFixed(1)}M` : atuais >= 1000 ? `${(atuais / 1000).toFixed(0)}K` : atuais.toFixed(0)}
                      </text>
                    )}
                    
                    {safeProjecoesHeight > 20 && (
                      <text
                        x={projecoesX + barWidth / 2}
                        y={projecoesY - 5}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.6)"
                        fontSize="8"
                        fontWeight="700"
                        className="font-mono"
                      >
                        {projecoes >= 1000000 ? `${(projecoes / 1000000).toFixed(1)}M` : projecoes >= 1000 ? `${(projecoes / 1000).toFixed(0)}K` : projecoes.toFixed(0)}
                      </text>
                    )}
                    
                    {/* Indicador de crescimento mensal abaixo do mês */}
                    {idx > 0 && safeMonthGrowth !== 0 && (
                      <text
                        x={groupCenter}
                        y={385}
                        textAnchor="middle"
                        fill={safeMonthGrowth >= 0 ? "#10b981" : "#ef4444"}
                        fontSize="9"
                        fontWeight="700"
                        className="font-mono"
                      >
                        {safeMonthGrowth >= 0 ? '↑' : '↓'} {Math.abs(safeMonthGrowth).toFixed(1)}%
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Legenda - centralizada no topo superior */}
              {(() => {
                // Posicionar legenda no topo central do gráfico
                const legendY = 30; // Posição Y fixa no topo
                const legendX = 600; // Centro horizontal do gráfico (100 + 1000/2)
                
                // Espaçamento entre os itens da legenda
                const spacing = 120;
                const startX = legendX - spacing; // Começar 120px à esquerda do centro
                
                return (
                  <g>
                    {/* Item 1: Atuais (Receita) */}
                    <rect x={startX - 60} y={legendY} width="15" height="15" fill="#3b82f6" rx="2" />
                    <text x={startX - 40} y={legendY + 12} fill="rgba(255,255,255,0.9)" fontSize="11" fontWeight="600">Atuais (Receita)</text>
                    
                    {/* Item 2: Projeções (Receita) */}
                    <rect x={startX + spacing - 50} y={legendY} width="15" height="15" fill="#9ca3af" rx="2" opacity="0.85" />
                    <text x={startX + spacing - 30} y={legendY + 12} fill="rgba(255,255,255,0.9)" fontSize="11" fontWeight="600">Projeções (Receita)</text>
                  </g>
                );
              })()}
              
              {/* Tooltips com informações detalhadas - áreas interativas */}
              {monthlyData && monthlyData.length > 0 && monthlyData.map((month, idx) => {
                const atuais = Math.max(0, Number(month.atuais) || 0);
                const projecoes = Math.max(0, Number(month.projecoes) || 0);
                const atuaisProfit = Number(month.atuaisProfit) || 0;
                const projecoesProfit = Number(month.projecoesProfit) || 0;
                const safeMaxValue = maxMonthlyValue > 0 ? maxMonthlyValue : 1000000;
                const dataLength = monthlyData.length > 0 ? monthlyData.length : 12;
                const barSpacing = 1000 / dataLength;
                const groupCenter = 100 + (idx * barSpacing) + (barSpacing / 2);
                const barWidth = Math.min(35, Math.max(20, barSpacing * 0.3));
                const gapBetweenBars = 8;
                const atuaisX = groupCenter - gapBetweenBars / 2 - barWidth / 2;
                const projecoesX = groupCenter + gapBetweenBars / 2 + barWidth / 2;
                
                // Calcular alturas para posicionar tooltips
                const clampedAtuais = Math.min(atuais, safeMaxValue);
                const clampedProjecoes = Math.min(projecoes, safeMaxValue);
                const chartHeight = 300;
                const chartBase = 350;
                const atuaisHeight = safeMaxValue > 0 ? Math.min((clampedAtuais / safeMaxValue) * chartHeight, chartHeight) : 0;
                const projecoesHeight = safeMaxValue > 0 ? Math.min((clampedProjecoes / safeMaxValue) * chartHeight, chartHeight) : 0;
                const safeAtuaisHeight = isNaN(atuaisHeight) || !isFinite(atuaisHeight) ? 0 : Math.max(0, atuaisHeight);
                const safeProjecoesHeight = isNaN(projecoesHeight) || !isFinite(projecoesHeight) ? 0 : Math.max(0, projecoesHeight);
                const atuaisY = Math.max(50, chartBase - safeAtuaisHeight);
                const projecoesY = Math.max(50, chartBase - safeProjecoesHeight);
                
                // Calcular crescimento mensal
                const monthGrowth = idx > 0 
                  ? (monthlyData[idx - 1].atuais > 0 
                    ? ((atuais - monthlyData[idx - 1].atuais) / monthlyData[idx - 1].atuais) * 100 
                    : atuais > 0 ? 100 : 0)
                  : 0;
                const safeMonthGrowth = (!isNaN(monthGrowth) && isFinite(monthGrowth)) ? monthGrowth : 0;
                const monthGrowthAmount = idx > 0 ? atuais - monthlyData[idx - 1].atuais : 0;
                const safeMonthGrowthAmount = (!isNaN(monthGrowthAmount) && isFinite(monthGrowthAmount)) ? monthGrowthAmount : 0;
                
                return (
                  <g key={`interactive-${idx}`}>
                    {/* Área interativa invisível para barra Atuais */}
                    {safeAtuaisHeight > 0.5 && (
                      <rect
                        x={atuaisX}
                        y={atuaisY}
                        width={barWidth}
                        height={safeAtuaisHeight}
                        fill="transparent"
                        className="cursor-pointer"
                      >
                        <title>
                          {`ATUAIS - ${month.month.toUpperCase()}\nReceita: R$ ${atuais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nLucro: R$ ${atuaisProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n${idx > 0 ? `Crescimento: ${safeMonthGrowth >= 0 ? '+' : ''}${safeMonthGrowth.toFixed(2)}% (${safeMonthGrowthAmount >= 0 ? '+' : ''}R$ ${safeMonthGrowthAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : 'Primeiro mês'}`}
                        </title>
                      </rect>
                    )}
                    
                    {/* Área interativa invisível para barra Projeções */}
                    {safeProjecoesHeight > 0.5 && (
                      <rect
                        x={projecoesX}
                        y={projecoesY}
                        width={barWidth}
                        height={safeProjecoesHeight}
                        fill="transparent"
                        className="cursor-pointer"
                      >
                        <title>
                          {`PROJEÇÕES - ${month.month.toUpperCase()}\nReceita Projetada: R$ ${projecoes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nLucro Projetado: R$ ${projecoesProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n${month.daysRemaining > 0 ? `Dias restantes: ${month.daysRemaining}\nMédia diária: R$ ${(month.avgDailyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Mês completo'}`}
                        </title>
                      </rect>
                    )}
                  </g>
                );
              })}
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Section: Dois gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Faturamento Semanal */}
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/15 via-white/8 to-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl hover:shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-all duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-black text-white mb-4 uppercase tracking-wider">FATURAMENTO</h3>
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/60"></div>
                  <span className="text-sm text-gray-300 font-bold">Semana Atual: <strong className="text-blue-400">R$ {(!isNaN(weeklyTotals.current) && isFinite(weeklyTotals.current) ? weeklyTotals.current : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full shadow-lg shadow-orange-500/60"></div>
                  <span className="text-sm text-gray-300 font-bold">Semana Anterior: <strong className="text-orange-400">R$ {(!isNaN(weeklyTotals.previous) && isFinite(weeklyTotals.previous) ? weeklyTotals.previous : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                </div>
              </div>
              <div className="relative bg-black/40 rounded-2xl p-6 border border-white/10 overflow-hidden" style={{ minHeight: '300px', height: '100%' }}>
                <svg viewBox="0 0 800 300" className="w-full h-full max-h-[300px]" preserveAspectRatio="xMidYMid meet" style={{ maxWidth: '100%', height: 'auto' }}>
                  <defs>
                    <filter id="shadowFilter" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                      <feOffset dx="0" dy="2" result="offsetblur"/>
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3"/>
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Grid */}
                  {(() => {
                    const safeMaxWeekly = maxWeeklyValue > 0 ? maxWeeklyValue : 4000;
                    return [0, 1000, 2000, 3000, 4000].map((value, idx) => {
                      const y = safeMaxWeekly > 0 
                        ? Math.max(50, Math.min(250, 250 - (value / safeMaxWeekly) * 200))
                        : 250;
                      return (
                        <g key={idx}>
                          <line
                            x1="60"
                            y1={y}
                            x2="740"
                            y2={y}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x="50"
                            y={y + 4}
                            textAnchor="end"
                            fill="rgba(255,255,255,0.6)"
                            fontSize="11"
                            fontWeight="700"
                            className="font-mono"
                          >
                            {value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                          </text>
                        </g>
                      );
                    });
                  })()}

                {/* Área da semana anterior (laranja) */}
                {weeklyData && weeklyData.length > 0 && (() => {
                  const safeMaxWeekly = maxWeeklyValue > 0 ? maxWeeklyValue : 4000;
                  const firstY = safeMaxWeekly > 0 
                    ? Math.max(50, Math.min(250, 250 - ((weeklyData[0]?.previousWeek || 0) / safeMaxWeekly) * 200))
                    : 250;
                  const pathPoints = weeklyData.map((d, i) => {
                    const x = 100 + (i * 90);
                    const y = safeMaxWeekly > 0
                      ? Math.max(50, Math.min(250, 250 - ((d.previousWeek || 0) / safeMaxWeekly) * 200))
                      : 250;
                    return `${x},${y}`;
                  });
                  const lastX = 100 + ((weeklyData.length - 1) * 90);
                  return (
                    <path
                      d={`M 100 ${firstY} L ${pathPoints.join(' L ')} L ${lastX} 250 L 100 250 Z`}
                      fill="rgba(249, 115, 22, 0.2)"
                    />
                  );
                })()}

                {/* Linha da semana anterior (laranja) */}
                {weeklyData && weeklyData.length > 0 && (() => {
                  const safeMaxWeekly = maxWeeklyValue > 0 ? maxWeeklyValue : 4000;
                  const points = weeklyData.map((d, i) => {
                    const x = 100 + (i * 90);
                    const y = safeMaxWeekly > 0
                      ? Math.max(50, Math.min(250, 250 - ((d.previousWeek || 0) / safeMaxWeekly) * 200))
                      : 250;
                    return `${x},${y}`;
                  }).join(' ');
                  return (
                    <polyline
                      points={points}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2"
                    />
                  );
                })()}

                {/* Linha da semana atual (azul) */}
                {weeklyData && weeklyData.length > 0 && (() => {
                  const safeMaxWeekly = maxWeeklyValue > 0 ? maxWeeklyValue : 4000;
                  const points = weeklyData.map((d, i) => {
                    const x = 100 + (i * 90);
                    const y = safeMaxWeekly > 0
                      ? Math.max(50, Math.min(250, 250 - ((d.currentWeek || 0) / safeMaxWeekly) * 200))
                      : 250;
                    return `${x},${y}`;
                  }).join(' ');
                  return (
                    <polyline
                      points={points}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })()}

                {/* Pontos da semana atual com tooltips */}
                {weeklyData && weeklyData.length > 0 && (() => {
                  const safeMaxWeekly = maxWeeklyValue > 0 ? maxWeeklyValue : 4000;
                  return weeklyData.map((d, i) => {
                    const x = 100 + (i * 90);
                    const revenue = Number(d.currentWeek) || 0;
                    const profit = Number(d.profit) || 0;
                    const profitMargin = Number(d.profitMargin) || 0;
                    const y = safeMaxWeekly > 0
                      ? Math.max(50, Math.min(250, 250 - (revenue / safeMaxWeekly) * 200))
                      : 250;
                    const safeRevenue = (!isNaN(revenue) && isFinite(revenue)) ? revenue : 0;
                    const safeProfit = (!isNaN(profit) && isFinite(profit)) ? profit : 0;
                    const safeProfitMargin = (!isNaN(profitMargin) && isFinite(profitMargin)) ? profitMargin : 0;
                    
                    return (
                      <g key={i}>
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill="#2563eb"
                          stroke="white"
                          strokeWidth="2"
                          className="hover:r-[8] transition-all cursor-pointer"
                          style={{ transition: 'r 0.2s ease' }}
                        />
                        {/* Tooltip - aparece ao passar o mouse */}
                        <g opacity="0" className="hover:opacity-100" style={{ transition: 'opacity 0.2s ease', pointerEvents: 'none' }}>
                          {/* Fundo do tooltip */}
                          <rect
                            x={x - 65}
                            y={y - 60}
                            width="130"
                            height="50"
                            fill="rgba(0, 0, 0, 0.95)"
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="1.5"
                            rx="6"
                            filter="url(#shadowFilter)"
                          />
                          {/* Tooltip texto - Receita */}
                          <text
                            x={x}
                            y={y - 40}
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.95)"
                            fontSize="11"
                            fontWeight="800"
                          >
                            R$ {safeRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </text>
                          {/* Tooltip texto - Lucro e porcentagem */}
                          <text
                            x={x}
                            y={y - 25}
                            textAnchor="middle"
                            fill={safeProfit >= 0 ? "rgba(34, 197, 94, 0.95)" : "rgba(239, 68, 68, 0.95)"}
                            fontSize="10"
                            fontWeight="700"
                          >
                            Lucro: {safeProfitMargin.toFixed(1)}% (R$ {safeProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                          </text>
                        </g>
                      </g>
                    );
                  });
                })()}

                  {/* Labels dos dias e lucros */}
                  {weeklyData && weeklyData.length > 0 && weeklyData.map((d, i) => {
                    const x = 100 + (i * 90);
                    const profit = Number(d.profit) || 0;
                    const profitMargin = Number(d.profitMargin) || 0;
                    const safeProfit = (!isNaN(profit) && isFinite(profit)) ? profit : 0;
                    const safeProfitMargin = (!isNaN(profitMargin) && isFinite(profitMargin)) ? profitMargin : 0;
                    const profitColor = safeProfit >= 0 ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)";
                    
                    return (
                      <g key={i}>
                        {/* Nome do dia */}
                        <text
                          x={x}
                          y={280}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.8)"
                          fontSize="11"
                          fontWeight="700"
                          className="uppercase"
                        >
                          {d.day || 'N/A'}
                        </text>
                        {/* Porcentagem de lucro */}
                        <text
                          x={x}
                          y={295}
                          textAnchor="middle"
                          fill={profitColor}
                          fontSize="10"
                          fontWeight="800"
                        >
                          {safeProfitMargin >= 0 ? '+' : ''}{safeProfitMargin.toFixed(1)}%
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              
              {/* Tabela de valores detalhados por dia - Responsiva */}
              <div className="mt-6 overflow-x-auto">
                <div className="flex gap-4 min-w-[600px] flex-wrap lg:flex-nowrap justify-center lg:justify-start">
                  {weeklyData && weeklyData.length > 0 && weeklyData.map((d, i) => {
                    const revenue = Number(d.currentWeek) || 0;
                    const profit = Number(d.profit) || 0;
                    const profitMargin = Number(d.profitMargin) || 0;
                    const safeRevenue = (!isNaN(revenue) && isFinite(revenue)) ? revenue : 0;
                    const safeProfit = (!isNaN(profit) && isFinite(profit)) ? profit : 0;
                    const safeProfitMargin = (!isNaN(profitMargin) && isFinite(profitMargin)) ? profitMargin : 0;
                    const profitColor = safeProfit >= 0 ? 'text-green-400' : 'text-red-400';
                    
                    return (
                      <div key={i} className="glass p-4 rounded-none border border-white/10 hover:border-white/20 transition-colors flex flex-col justify-center items-center w-[144px] h-[144px] flex-shrink-0">
                        <p className="text-xs font-black text-gray-400 uppercase mb-2 text-center">{d.day || 'N/A'}</p>
                        <p className="text-sm font-black text-white text-center mb-1 leading-tight">
                          R$ {safeRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs font-black text-center ${profitColor} leading-tight`}>
                          {safeProfitMargin >= 0 ? '+' : ''}{safeProfitMargin.toFixed(1)}%
                        </p>
                        <p className="text-[10px] font-bold text-gray-500 text-center mt-1 leading-tight">
                          Lucro: R$ {safeProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Categorias (Donut) */}
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/15 via-white/8 to-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl hover:shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-all duration-500">
            <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-black text-white mb-4 uppercase tracking-wider">CATEGORIAS</h3>
            <div className="flex flex-col lg:flex-row items-start justify-start lg:justify-center gap-6 lg:gap-8 w-full">
              <div className="relative w-64 h-64 flex-shrink-0 mx-auto lg:mx-0">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                    <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9ca3af" />
                      <stop offset="100%" stopColor="#6b7280" />
                    </linearGradient>
                    <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ca8a04" />
                    </linearGradient>
                    <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a8a" />
                      <stop offset="100%" stopColor="#1e40af" />
                    </linearGradient>
                    <linearGradient id="grad7" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#87CEEB" />
                      <stop offset="100%" stopColor="#ADD8E6" />
                    </linearGradient>
                  </defs>
                  
                  {categoryData.categories.map((cat, idx) => {
                    // Função para obter cor baseada no nome da categoria
                    const getCategoryColor = (categoryName: string, index: number) => {
                      const normalizedName = categoryName.toLowerCase().trim();
                      if (normalizedName.includes('lanches')) {
                        return 'url(#grad6)'; // Azul escuro para Lanches
                      }
                      if (normalizedName.includes('outros')) {
                        return 'url(#grad7)'; // Azul bebê para Outros
                      }
                      const colors = ['url(#grad1)', 'url(#grad2)', 'url(#grad3)', 'url(#grad4)', 'url(#grad5)'];
                      return colors[index % colors.length];
                    };
                    const colors = ['url(#grad1)', 'url(#grad2)', 'url(#grad3)', 'url(#grad4)', 'url(#grad5)'];
                    const startAngle = categoryData.categories.slice(0, idx).reduce((sum, c) => sum + (c.percentage / 100) * 360, 0);
                    const angle = (cat.percentage / 100) * 360;
                    const endAngle = startAngle + angle;
                    
                    const startAngleRad = (startAngle * Math.PI) / 180;
                    const endAngleRad = (endAngle * Math.PI) / 180;
                    
                    const outerRadius = 80;
                    const innerRadius = 50;
                    const centerX = 100;
                    const centerY = 100;
                    
                    const x1 = centerX + outerRadius * Math.cos(startAngleRad);
                    const y1 = centerY + outerRadius * Math.sin(startAngleRad);
                    const x2 = centerX + outerRadius * Math.cos(endAngleRad);
                    const y2 = centerY + outerRadius * Math.sin(endAngleRad);
                    
                    const x3 = centerX + innerRadius * Math.cos(endAngleRad);
                    const y3 = centerY + innerRadius * Math.sin(endAngleRad);
                    const x4 = centerX + innerRadius * Math.cos(startAngleRad);
                    const y4 = centerY + innerRadius * Math.sin(startAngleRad);
                    
                    const largeArc = angle > 180 ? 1 : 0;
                    
                    const pathData = `
                      M ${x1} ${y1}
                      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
                      L ${x3} ${y3}
                      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
                      Z
                    `;
                    
                    return (
                      <path
                        key={idx}
                        d={pathData}
                        fill={getCategoryColor(cat.category, idx)}
                        stroke="white"
                        strokeWidth="2"
                      />
                    );
                  })}
                  
                  {/* Texto central */}
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.9)"
                    fontSize="20"
                    fontWeight="900"
                    className="uppercase"
                  >
                    Total
                  </text>
                  <text
                    x="100"
                    y="115"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.7)"
                    fontSize="14"
                    fontWeight="800"
                    className="font-mono"
                  >
                    R$ {(!isNaN(categoryData.total) && isFinite(categoryData.total) ? categoryData.total : 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </text>
                </svg>
              </div>
              <div className="flex-1 min-w-0 space-y-3 flex flex-col">
                {categoryData.categories.map((cat, idx) => {
                  // Função para obter cor baseada no nome da categoria
                  const getCategoryColorHex = (categoryName: string, index: number) => {
                    const normalizedName = categoryName.toLowerCase().trim();
                    if (normalizedName.includes('lanches')) {
                      return '#1e40af'; // Azul escuro para Lanches
                    }
                    if (normalizedName.includes('outros')) {
                      return '#87CEEB'; // Azul bebê para Outros
                    }
                    const colors = ['#3b82f6', '#f97316', '#9ca3af', '#eab308', '#60a5fa'];
                    return colors[index % colors.length];
                  };
                  const categoryColor = getCategoryColorHex(cat.category, idx);
                  const colors = ['#3b82f6', '#f97316', '#9ca3af', '#eab308', '#60a5fa'];
                  const percentage = Number(cat.percentage) || 0;
                  const isZero = percentage === 0 || isNaN(percentage) || !isFinite(percentage);
                  
                  const categoryCMV = Number(cat.cmv) || 0;
                  const categoryProfit = Number(cat.profit) || 0;
                  const safeCategoryCMV = (!isNaN(categoryCMV) && isFinite(categoryCMV)) ? categoryCMV : 0;
                  const safeCategoryProfit = (!isNaN(categoryProfit) && isFinite(categoryProfit)) ? categoryProfit : 0;
                  
                  return (
                    <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-4 h-4 rounded shadow-lg flex-shrink-0" 
                          style={{ backgroundColor: categoryColor, boxShadow: `0 0 10px ${categoryColor}40` }}
                        ></div>
                        <span className="text-sm text-gray-300 font-bold flex-1 min-w-0 truncate">
                          {cat.category.length > 25 ? `${cat.category.substring(0, 22)}...` : cat.category}
                        </span>
                        <span className="text-sm text-white font-black flex-shrink-0">
                          {isZero ? '0%' : `${percentage.toFixed(1)}%`}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 pl-7 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-semibold">Gasto:</span>
                          <span className="text-orange-400 font-bold font-mono">
                            R$ {safeCategoryCMV.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-semibold">Lucro:</span>
                          <span className={`font-bold font-mono ${safeCategoryProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            R$ {safeCategoryProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {categoryData.categories.length === 0 && (
                  <div className="text-sm text-gray-400 font-bold">Nenhuma categoria com vendas</div>
                )}
                
                {/* Lucro Mensal Geral */}
                {categoryData.categories.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 w-full">
                    <div className="flex flex-col gap-2 p-4 sm:p-5 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 w-full">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-black text-white uppercase">Lucro Mensal Geral</span>
                        <div className={`text-lg font-black font-mono ${(categoryData.monthlyProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'} flex items-baseline gap-0.5`}>
                          <span className="text-base leading-none">R$</span>
                          <span className="leading-none">{(categoryData.monthlyProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-semibold">Receita:</span>
                          <span className="text-blue-400 font-bold font-mono">
                            R$ {(categoryData.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-semibold">CMV:</span>
                          <span className="text-orange-400 font-bold font-mono">
                            R$ {(categoryData.monthlyCMV || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-semibold">Despesas:</span>
                          <span className="text-red-400 font-bold font-mono">
                            R$ {(categoryData.monthlyExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
