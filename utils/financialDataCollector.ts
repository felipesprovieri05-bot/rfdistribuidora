/**
 * Utilitário para coletar todos os dados financeiros para o PDF
 */

import { Transaction, Order, Product, Customer } from '../types';

interface FinancialDataForPDF {
  date: string;
  time: string;
  kpis: {
    customers: { value: number; change: number };
    orders: { value: number; change: number };
    profit: { value: number; change: number };
    growth: { value: number; change: number };
    products: { value: number; change: number };
  };
  monthlyData: {
    month: string;
    atuais: number;
    projecoes: number;
    atuaisProfit: number;
    projecoesProfit: number;
  }[];
  categoryData: {
    categories: {
      category: string;
      value: number;
      percentage: number;
      cmv: number;
      profit: number;
    }[];
    total: number;
    monthlyProfit: number;
    monthlyRevenue: number;
    monthlyCMV: number;
    monthlyExpenses: number;
  };
  weeklyData: {
    day: string;
    currentWeek: number;
    previousWeek: number;
    profit: number;
    profitMargin: number;
  }[];
}

export const collectFinancialData = (
  transactions: Transaction[],
  orders: Order[],
  products: Product[],
  customers: Customer[]
): FinancialDataForPDF => {
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);
  const currentDate = new Date();
  
  const date = currentDate.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  const time = currentDate.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });

  // Calcular KPIs (mesma lógica do FinancialDashboard)
  const safeCustomers = customers || [];
  const safeOrders = orders || [];
  const safeTransactions = transactions || [];
  const safeProducts = products || [];

  // Clientes
  const totalCustomers = safeCustomers.length;
  const customers30DaysAgo = safeCustomers.filter(c => {
    try {
      if (!c || !c.lastVisit || typeof c.lastVisit !== 'number') return false;
      return c.lastVisit >= thirtyDaysAgo;
    } catch {
      return false;
    }
  }).length;
  const customers60DaysAgo = safeCustomers.filter(c => {
    try {
      if (!c || !c.lastVisit || typeof c.lastVisit !== 'number') return false;
      return c.lastVisit >= sixtyDaysAgo && c.lastVisit < thirtyDaysAgo;
    } catch {
      return false;
    }
  }).length;
  const customersChange = customers60DaysAgo > 0 
    ? ((customers30DaysAgo - customers60DaysAgo) / customers60DaysAgo) * 100 
    : 0;

  // Pedidos
  const ordersLast30Days = safeOrders.filter(o => {
    try {
      return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= thirtyDaysAgo;
    } catch {
      return false;
    }
  }).length;
  const ordersPrevious30Days = safeOrders.filter(o => {
    try {
      return o && typeof o.timestamp === 'number' && !isNaN(o.timestamp) && o.timestamp >= sixtyDaysAgo && o.timestamp < thirtyDaysAgo;
    } catch {
      return false;
    }
  }).length;
  const ordersChange = ordersPrevious30Days > 0
    ? ((ordersLast30Days - ordersPrevious30Days) / ordersPrevious30Days) * 100
    : 0;

  // Lucro últimos 30 dias
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

  const revenueFromOrders = safeOrders.filter(o => {
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
  }, 0);

  let cmvFromOrders = 0;
  try {
    safeOrders.filter(o => {
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
                const product = safeProducts.find(p => p?.id === item.productId);
                if (product && product.buyPrice !== undefined && product.buyPrice !== null) {
                  const buyPrice = Number(product.buyPrice) || 0;
                  const quantity = Number(item.quantity) || 0;
                  if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity) && buyPrice >= 0 && quantity > 0) {
                    cmvFromOrders += buyPrice * quantity;
                  }
                }
              }
            } catch {
              // Ignorar erro
            }
          });
        }
      } catch {
        // Ignorar erro
      }
    });
  } catch {
    cmvFromOrders = 0;
  }

  const revenueFromTransactions = safeTransactions.filter(t => {
    try {
      if (!t || typeof t.timestamp !== 'number' || isNaN(t.timestamp) || t.timestamp < thirtyDaysAgo) return false;
      if (t.type !== 'entrada' || t.category !== 'venda') return false;
      if (t.orderId && t.orderId !== '' && completedOrderIds.has(t.orderId)) return false;
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
  }, 0);

  let cmvFromTransactions = 0;
  try {
    const transactionsDirectSales = safeTransactions.filter(t => {
      try {
        return t && typeof t.timestamp === 'number' && !isNaN(t.timestamp) && t.timestamp >= thirtyDaysAgo && t.type === 'entrada' && t.category === 'venda' && (!t.orderId || t.orderId === '') && (!completedOrderIds.has(t.orderId || ''));
      } catch {
        return false;
      }
    });

    if (transactionsDirectSales.length > 0 && safeProducts.length > 0) {
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
          // Ignorar erro
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
            // Ignorar erro
          }
        });
      }
    }
  } catch {
    cmvFromTransactions = 0;
  }

  const expensesFromTransactions = safeTransactions.filter(t => {
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
  }, 0);

  const totalRevenue = revenueFromOrders + revenueFromTransactions;
  const totalCMV = cmvFromOrders + cmvFromTransactions;
  const profitLast30Days = totalRevenue - totalCMV - expensesFromTransactions;

  // Lucro período anterior
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

  const revenueFromOrdersPrev = safeOrders.filter(o => {
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
  }, 0);

  let cmvFromOrdersPrev = 0;
  try {
    safeOrders.filter(o => {
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
                const product = safeProducts.find(p => p?.id === item.productId);
                if (product && product.buyPrice !== undefined && product.buyPrice !== null) {
                  const buyPrice = Number(product.buyPrice) || 0;
                  const quantity = Number(item.quantity) || 0;
                  if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity) && buyPrice >= 0 && quantity > 0) {
                    cmvFromOrdersPrev += buyPrice * quantity;
                  }
                }
              }
            } catch {
              // Ignorar erro
            }
          });
        }
      } catch {
        // Ignorar erro
      }
    });
  } catch {
    cmvFromOrdersPrev = 0;
  }

  const revenueFromTransactionsPrev = safeTransactions.filter(t => {
    try {
      if (!t || typeof t.timestamp !== 'number' || isNaN(t.timestamp)) return false;
      if (t.timestamp < sixtyDaysAgo || t.timestamp >= thirtyDaysAgo) return false;
      if (t.type !== 'entrada' || t.category !== 'venda') return false;
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
  }, 0);

  let cmvFromTransactionsPrev = 0;
  try {
    const transactionsPrevDirectSales = safeTransactions.filter(t => {
      try {
        return t && typeof t.timestamp === 'number' && !isNaN(t.timestamp) && t.timestamp >= sixtyDaysAgo && t.timestamp < thirtyDaysAgo && t.type === 'entrada' && t.category === 'venda' && (!t.orderId || t.orderId === '') && (!completedOrderIdsPrev.has(t.orderId || ''));
      } catch {
        return false;
      }
    });

    if (transactionsPrevDirectSales.length > 0 && safeProducts.length > 0) {
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
          // Ignorar erro
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
            // Ignorar erro
          }
        });
      }
    }
  } catch {
    cmvFromTransactionsPrev = 0;
  }

  const expensesFromTransactionsPrev = safeTransactions.filter(t => {
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
  }, 0);

  const totalRevenuePrev = revenueFromOrdersPrev + revenueFromTransactionsPrev;
  const totalCMVPrev = cmvFromOrdersPrev + cmvFromTransactionsPrev;
  const profitPrevious30Days = totalRevenuePrev - totalCMVPrev - expensesFromTransactionsPrev;

  let profitChange = 0;
  if (profitPrevious30Days !== 0) {
    profitChange = ((profitLast30Days - profitPrevious30Days) / Math.abs(profitPrevious30Days)) * 100;
  } else if (profitLast30Days > 0) {
    profitChange = 100;
  } else if (profitLast30Days < 0 && profitPrevious30Days === 0) {
    profitChange = -100;
  }
  const safeProfitChange = (!isNaN(profitChange) && isFinite(profitChange)) 
    ? Math.max(-200, Math.min(200, profitChange)) 
    : 0;

  // Crescimento (margem de lucro)
  const vendaFinalLast30Days = totalRevenue;
  const gastoVendaLast30Days = totalCMV + expensesFromTransactions;
  const lucroBrutoLast30Days = vendaFinalLast30Days - gastoVendaLast30Days;
  const profitMarginLast30Days = vendaFinalLast30Days > 0
    ? (lucroBrutoLast30Days / vendaFinalLast30Days) * 100
    : 0;

  const vendaFinalPrevious30Days = totalRevenuePrev;
  const gastoVendaPrevious30Days = totalCMVPrev + expensesFromTransactionsPrev;
  const lucroBrutoPrevious30Days = vendaFinalPrevious30Days - gastoVendaPrevious30Days;
  const profitMarginPrevious30Days = vendaFinalPrevious30Days > 0
    ? (lucroBrutoPrevious30Days / vendaFinalPrevious30Days) * 100
    : 0;

  let growthChange = 0;
  if (Math.abs(profitMarginPrevious30Days) > 0.01) {
    const marginDifference = profitMarginLast30Days - profitMarginPrevious30Days;
    growthChange = marginDifference;
    if (Math.abs(marginDifference) > Math.abs(profitMarginPrevious30Days) * 2) {
      growthChange = profitMarginPrevious30Days > 0 
        ? (marginDifference / profitMarginPrevious30Days) * 100
        : marginDifference * 10;
    }
  } else if (profitMarginLast30Days > 0 && Math.abs(profitMarginPrevious30Days) < 0.01) {
    growthChange = Math.min(50, profitMarginLast30Days);
  } else if (profitMarginLast30Days < 0 && Math.abs(profitMarginPrevious30Days) < 0.01) {
    growthChange = Math.max(-50, profitMarginLast30Days);
  }
  const safeGrowthChange = (!isNaN(growthChange) && isFinite(growthChange)) 
    ? Math.max(-100, Math.min(100, growthChange)) 
    : 0;

  // Produtos
  const totalProducts = safeProducts.length;
  const productsWithStock = safeProducts.filter(p => {
    try {
      const stock = Number(p?.stock) || 0;
      return !isNaN(stock) && isFinite(stock) && stock > 0;
    } catch {
      return false;
    }
  }).length;
  const products30DaysAgo = totalProducts;
  const productsChange = products30DaysAgo > 0
    ? ((productsWithStock - products30DaysAgo) / products30DaysAgo) * 100
    : 0;

  // Dados mensais
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  
  const monthlyData = months.map((monthName, monthIndex) => {
    const monthTransactions = safeTransactions.filter(t => {
      if (!t || !t.timestamp) return false;
      try {
        const tDate = new Date(t.timestamp);
        return tDate.getFullYear() === currentYear && tDate.getMonth() === monthIndex;
      } catch {
        return false;
      }
    });

    const completedOrderIdsMonthly = new Set(
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
        try {
          const total = Number(o?.total) || 0;
          return (!isNaN(total) && isFinite(total)) ? sum + total : sum;
        } catch {
          return sum;
        }
      }, 0);

    const monthRevenueTransactions = monthTransactions
      .filter(t => {
        try {
          if (!t || t.type !== 'entrada' || t.category !== 'venda') return false;
          if (t.orderId && t.orderId !== '' && completedOrderIdsMonthly.has(t.orderId)) return false;
          return true;
        } catch {
          return false;
        }
      })
      .reduce((sum, t) => {
        try {
          const amount = Number(t.amount) || 0;
          return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
        } catch {
          return sum;
        }
      }, 0);

    const atuaisRevenue = monthRevenueOrders + monthRevenueTransactions;

    let monthCMVOrders = 0;
    try {
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
        .forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              try {
                const product = safeProducts.find(p => p.id === item.productId);
                if (product && product.buyPrice !== undefined && product.buyPrice !== null) {
                  const buyPrice = Number(product.buyPrice) || 0;
                  const quantity = Number(item.quantity) || 0;
                  if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity) && buyPrice >= 0 && quantity > 0) {
                    monthCMVOrders += buyPrice * quantity;
                  }
                }
              } catch {
                // Ignorar erro
              }
            });
          }
        });
    } catch {
      monthCMVOrders = 0;
    }

    let monthCMVTransactions = 0;
    try {
      const monthlyTransactionsDirectSales = monthTransactions.filter(t => {
        try {
          return t && typeof t.timestamp === 'number' && !isNaN(t.timestamp) && t.type === 'entrada' && t.category === 'venda' && (!t.orderId || t.orderId === '') && (!completedOrderIdsMonthly.has(t.orderId || ''));
        } catch {
          return false;
        }
      });

      if (monthlyTransactionsDirectSales.length > 0 && safeProducts.length > 0) {
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
            // Ignorar erro
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
                  monthCMVTransactions += estimatedCMV;
                }
              }
            } catch {
              // Ignorar erro
            }
          });
        }
      }
    } catch {
      monthCMVTransactions = 0;
    }

    const monthExpenses = monthTransactions
      .filter(t => {
        try {
          return t && typeof t.timestamp === 'number' && !isNaN(t.timestamp) && t.type === 'saida';
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

    const monthCMV = monthCMVOrders + monthCMVTransactions;
    const atuaisProfit = atuaisRevenue - monthCMV - monthExpenses;

    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
    const isCurrentMonth = monthIndex === currentMonth;
    const currentDateNum = currentDate.getDate();
    const daysElapsed = isCurrentMonth ? currentDateNum : daysInMonth;
    const daysRemaining = daysInMonth - daysElapsed;
    const avgDailyRevenue = daysElapsed > 0 ? (atuaisRevenue / daysElapsed) : 0;
    
    let projecoesRevenue = atuaisRevenue;
    if (isCurrentMonth && daysRemaining > 0 && avgDailyRevenue > 0) {
      projecoesRevenue = atuaisRevenue + (avgDailyRevenue * daysRemaining);
    } else if (!isCurrentMonth && atuaisRevenue > 0) {
      projecoesRevenue = atuaisRevenue * 1.05;
    }

    const currentProfitMargin = atuaisRevenue > 0 ? (atuaisProfit / atuaisRevenue) : 0;
    const projecoesProfit = projecoesRevenue * (currentProfitMargin || 0.3);

    return {
      month: monthName,
      atuais: atuaisRevenue,
      projecoes: projecoesRevenue,
      atuaisProfit,
      projecoesProfit
    };
  });

  // Categorias (simplificado para o PDF)
  const categoryMap = new Map<string, { value: number; cmv: number }>();
  
  safeOrders.filter(o => {
    try {
      if (!o || !o.timestamp) return false;
      const oDate = new Date(o.timestamp);
      return oDate.getTime() >= thirtyDaysAgo && (o.status === 'concluido' || o.paymentStatus === 'pago');
    } catch {
      return false;
    }
  }).forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        try {
          const product = safeProducts.find(p => p.id === item.productId);
          if (product) {
            const category = product.category || 'Outros';
            const revenue = Number(item.price) * Number(item.quantity);
            const cmv = Number(product.buyPrice || 0) * Number(item.quantity);
            
            const existing = categoryMap.get(category) || { value: 0, cmv: 0 };
            categoryMap.set(category, {
              value: existing.value + revenue,
              cmv: existing.cmv + cmv
            });
          }
        } catch {
          // Ignorar erro
        }
      });
    }
  });

  safeTransactions.filter(t => {
    try {
      if (!t || typeof t.timestamp !== 'number' || isNaN(t.timestamp) || t.timestamp < thirtyDaysAgo) return false;
      if (t.type !== 'entrada' || t.category !== 'venda') return false;
      if (t.orderId && t.orderId !== '' && completedOrderIds.has(t.orderId)) return false;
      return true;
    } catch {
      return false;
    }
  }).forEach(transaction => {
    try {
      const amount = Number(transaction.amount) || 0;
      if (amount > 0) {
        // Estimativa de CMV para transações diretas
        let avgCostRatio = 0.5; // Padrão 50%
        if (safeProducts.length > 0) {
          let totalSellPrice = 0;
          let totalBuyPrice = 0;
          safeProducts.forEach(p => {
            totalSellPrice += Number(p.sellPrice) || 0;
            totalBuyPrice += Number(p.buyPrice) || 0;
          });
          if (totalSellPrice > 0) {
            avgCostRatio = totalBuyPrice / totalSellPrice;
          }
        }
        
        const category = 'Outros'; // Transações diretas vão para Outros
        const existing = categoryMap.get(category) || { value: 0, cmv: 0 };
        categoryMap.set(category, {
          value: existing.value + amount,
          cmv: existing.cmv + (amount * avgCostRatio)
        });
      }
    } catch {
      // Ignorar erro
    }
  });

  const totalCategoryValue = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.value, 0);
  
  const categories = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      value: data.value,
      percentage: totalCategoryValue > 0 ? (data.value / totalCategoryValue) * 100 : 0,
      cmv: data.cmv,
      profit: data.value - data.cmv
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Dados semanais
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const currentWeekStart = new Date(currentDate);
  currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  currentWeekStart.setHours(0, 0, 0, 0);
  
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  const weeklyData = days.map((dayName, dayIndex) => {
    const currentDay = new Date(currentWeekStart);
    currentDay.setDate(currentWeekStart.getDate() + dayIndex);
    const currentDayEnd = new Date(currentDay);
    currentDayEnd.setHours(23, 59, 59, 999);

    const previousDay = new Date(previousWeekStart);
    previousDay.setDate(previousWeekStart.getDate() + dayIndex);
    const previousDayEnd = new Date(previousDay);
    previousDayEnd.setHours(23, 59, 59, 999);

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
        try {
          const total = Number(o?.total) || 0;
          return (!isNaN(total) && isFinite(total)) ? sum + total : sum;
        } catch {
          return sum;
        }
      }, 0);

    const dayRevenueTransactions = safeTransactions
      .filter(t => {
        try {
          if (!t || !t.timestamp || t.type !== 'entrada' || t.category !== 'venda') return false;
          const tDate = new Date(t.timestamp);
          if (tDate < currentDay || tDate > currentDayEnd) return false;
          if (t.orderId && t.orderId !== '' && dayCompletedOrderIds.has(t.orderId)) return false;
          return true;
        } catch {
          return false;
        }
      })
      .reduce((sum, t) => {
        try {
          const amount = Number(t.amount) || 0;
          return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
        } catch {
          return sum;
        }
      }, 0);

    const currentWeekRevenue = dayRevenueOrders + dayRevenueTransactions;

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
        try {
          const total = Number(o?.total) || 0;
          return (!isNaN(total) && isFinite(total)) ? sum + total : sum;
        } catch {
          return sum;
        }
      }, 0);

    const prevDayRevenueTransactions = safeTransactions
      .filter(t => {
        try {
          if (!t || !t.timestamp || t.type !== 'entrada' || t.category !== 'venda') return false;
          const tDate = new Date(t.timestamp);
          if (tDate < previousDay || tDate > previousDayEnd) return false;
          if (t.orderId && t.orderId !== '' && prevDayCompletedOrderIds.has(t.orderId)) return false;
          return true;
        } catch {
          return false;
        }
      })
      .reduce((sum, t) => {
        try {
          const amount = Number(t.amount) || 0;
          return (!isNaN(amount) && isFinite(amount) && amount > 0) ? sum + amount : sum;
        } catch {
          return sum;
        }
      }, 0);

    const previousWeekRevenue = prevDayRevenueOrders + prevDayRevenueTransactions;

    // Estimativa de lucro diário
    let dayProfit = 0;
    let dayCMV = 0;
    try {
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
        .forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              try {
                const product = safeProducts.find(p => p.id === item.productId);
                if (product && product.buyPrice !== undefined && product.buyPrice !== null) {
                  const buyPrice = Number(product.buyPrice) || 0;
                  const quantity = Number(item.quantity) || 0;
                  if (!isNaN(buyPrice) && !isNaN(quantity) && isFinite(buyPrice) && isFinite(quantity) && buyPrice >= 0 && quantity > 0) {
                    dayCMV += buyPrice * quantity;
                  }
                }
              } catch {
                // Ignorar erro
              }
            });
          }
        });

      if (dayRevenueTransactions > 0 && safeProducts.length > 0) {
        let totalSellPrice = 0;
        let totalBuyPrice = 0;
        safeProducts.forEach(p => {
          totalSellPrice += Number(p.sellPrice) || 0;
          totalBuyPrice += Number(p.buyPrice) || 0;
        });
        if (totalSellPrice > 0) {
          const avgCostRatio = totalBuyPrice / totalSellPrice;
          dayCMV += dayRevenueTransactions * avgCostRatio;
        }
      }

      const dayExpenses = safeTransactions
        .filter(t => {
          try {
            if (!t || !t.timestamp) return false;
            const tDate = new Date(t.timestamp);
            return tDate >= currentDay && tDate <= currentDayEnd && t.type === 'saida';
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

      dayProfit = currentWeekRevenue - dayCMV - dayExpenses;
    } catch {
      dayProfit = 0;
    }

    const profitMargin = currentWeekRevenue > 0 ? (dayProfit / currentWeekRevenue) * 100 : 0;

    return {
      day: dayName,
      currentWeek: currentWeekRevenue,
      previousWeek: previousWeekRevenue,
      profit: dayProfit,
      profitMargin
    };
  });

  // Dados mensais do categoryData
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
              // Ignorar erro
            }
          });
        }
      });
  } catch {
    monthlyCMVOrders = 0;
  }

  const monthlyRevenueTransactions = safeTransactions
    .filter(t => {
      try {
        if (!t || typeof t.timestamp !== 'number' || isNaN(t.timestamp) || t.timestamp < thirtyDaysAgo) return false;
        if (t.type !== 'entrada' || t.category !== 'venda') return false;
        if (t.orderId && t.orderId !== '' && completedOrderIds.has(t.orderId)) return false;
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

  let monthlyCMVTransactions = 0;
  try {
    const monthlyTransactionsDirectSales = safeTransactions.filter(t => {
      try {
        return t && typeof t.timestamp === 'number' && !isNaN(t.timestamp) && t.timestamp >= thirtyDaysAgo && t.type === 'entrada' && t.category === 'venda' && (!t.orderId || t.orderId === '') && (!completedOrderIds.has(t.orderId || ''));
      } catch {
        return false;
      }
    });

    if (monthlyTransactionsDirectSales.length > 0 && safeProducts.length > 0) {
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
          // Ignorar erro
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
            // Ignorar erro
          }
        });
      }
    }
  } catch {
    monthlyCMVTransactions = 0;
  }

  const totalMonthlyRevenue = monthlyRevenueOrders + monthlyRevenueTransactions;
  const totalMonthlyCMV = monthlyCMVOrders + monthlyCMVTransactions;

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

  const monthlyProfit = totalMonthlyRevenue - totalMonthlyCMV - monthlyExpenses;

  return {
    date,
    time,
    kpis: {
      customers: { value: totalCustomers, change: customersChange },
      orders: { value: ordersLast30Days, change: ordersChange },
      profit: { value: profitLast30Days, change: safeProfitChange },
      growth: { value: profitMarginLast30Days, change: safeGrowthChange },
      products: { value: totalProducts, change: productsChange }
    },
    monthlyData,
    categoryData: {
      categories,
      total: totalCategoryValue,
      monthlyProfit,
      monthlyRevenue: totalMonthlyRevenue,
      monthlyCMV: totalMonthlyCMV,
      monthlyExpenses
    },
    weeklyData
  };
};
