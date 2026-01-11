
import { Product, Order, Reservation, Transaction, Customer, LogEntry, Admin, DEFAULT_ROLES } from '../types';
import { INITIAL_PRODUCTS } from '../constants';
import { initializeMockData, generateTransactions, generateLogs } from '../utils/mockData';

const KEYS = {
  PRODUCTS: 'adega_products',
  ORDERS: 'adega_orders',
  RESERVATIONS: 'adega_reservations',
  TRANSACTIONS: 'adega_transactions',
  CUSTOMERS: 'adega_customers',
  LOGS: 'adega_logs',
  ADMINS: 'adega_admins',
  CURRENT_ADMIN: 'adega_current_admin'
};

// Helper para verificar se estamos no cliente
const isClient = typeof window !== 'undefined';

// Função para disparar evento customizado quando houver mudanças no localStorage
const triggerStorageUpdate = () => {
  if (typeof window !== 'undefined' && isClient) {
    try {
      const timestamp = Date.now();
      // Disparar evento customizado para a mesma aba
      window.dispatchEvent(new CustomEvent('localStorageUpdate', { 
        detail: { timestamp } 
      }));
      // Disparar evento storage manual para outras abas (sincronização cross-tab)
      localStorage.setItem('adega_last_update', timestamp.toString());
      // Remover após um tempo para não acumular no localStorage
      setTimeout(() => {
        try {
          localStorage.removeItem('adega_last_update');
        } catch (error) {
          // Ignorar erros de limpeza
        }
      }, 100);
    } catch (error) {
      console.error('Erro ao disparar evento de atualização:', error);
    }
  }
};

// Flag para evitar múltiplas inicializações simultâneas
let isInitializing = false;
let hasInitialized = false;

// Função para inicializar dados mockados (chamada apenas uma vez quando necessário)
const initializeDataIfNeeded = () => {
  // Verificação dupla para garantir que só executa no cliente
  if (typeof window === 'undefined') return;
  if (!isClient) return;
  if (isInitializing || hasInitialized) return;
  
  try {
    // Verificar se localStorage está disponível
    if (typeof localStorage === 'undefined') return;
    
    // Verificar se já existe algum dado - se não houver nenhum, inicializar
    const hasProducts = localStorage.getItem(KEYS.PRODUCTS);
    const hasOrders = localStorage.getItem(KEYS.ORDERS);
    const hasCustomers = localStorage.getItem(KEYS.CUSTOMERS);
    const hasTransactions = localStorage.getItem(KEYS.TRANSACTIONS);
    
    // Se todos os dados já existem, marcar como inicializado e retornar
    if (hasProducts && hasOrders && hasCustomers && hasTransactions) {
      hasInitialized = true;
      return;
    }
    
    // Se não há dados, inicializar tudo de uma vez com dados simulados de 4 meses
    if (!hasProducts || !hasOrders || !hasCustomers || !hasTransactions) {
      isInitializing = true;
      const mockData = initializeMockData();
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(mockData.products));
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(mockData.orders));
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(mockData.customers));
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(mockData.transactions));
      localStorage.setItem(KEYS.LOGS, JSON.stringify(mockData.logs));
      hasInitialized = true;
      isInitializing = false;
    }
  } catch (error) {
    console.error('Erro ao inicializar dados mockados:', error);
    isInitializing = false;
    // Em caso de erro, não inicializar para evitar loops
    hasInitialized = true;
  }
};

export const storage = {
  // Clientes
  getCustomers: (): Customer[] => {
    if (!isClient) return [];
    initializeDataIfNeeded();
    const data = localStorage.getItem(KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },
  saveCustomer: (customer: Customer) => {
    if (!isClient) return customer;
    const customers = storage.getCustomers();
    
    // Normalizar CPF para comparação (remover formatação)
    const normalizeCpf = (cpf: string) => cpf.replace(/\D/g, '');
    const customerCpfNormalized = normalizeCpf(customer.cpf);
    
    // Verificar se já existe cliente com o mesmo CPF (comparando CPF normalizado)
    const exists = customers.find(c => {
      const existingCpfNormalized = normalizeCpf(c.cpf);
      return existingCpfNormalized === customerCpfNormalized;
    });
    
    if (exists) {
      // Se já existe, atualizar dados (exceto CPF) e retornar o cliente existente atualizado
      const updatedCustomer = {
        ...exists,
        name: customer.name || exists.name,
        phone: customer.phone || exists.phone,
        password: customer.password || exists.password,
        lastVisit: Date.now()
      };
      
      // Atualizar na lista
      const updatedCustomers = customers.map(c => {
        const existingCpfNormalized = normalizeCpf(c.cpf);
        return existingCpfNormalized === customerCpfNormalized ? updatedCustomer : c;
      });
      
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
      triggerStorageUpdate();
      return updatedCustomer;
    }
    
    // Garantir que o CPF do novo cliente está sem formatação
    const newCustomer = {
      ...customer,
      cpf: customerCpfNormalized
    };
    
    customers.push(newCustomer);
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    triggerStorageUpdate();
    return newCustomer;
  },
  saveCustomers: (customers: Customer[]) => {
    if (!isClient) return;
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    triggerStorageUpdate();
  },
  updateCustomerSpending: (cpf: string, amount: number) => {
    if (!isClient) return;
    const customers = storage.getCustomers().map(c => {
      if (c.cpf === cpf) {
        return { 
          ...c, 
          totalSpent: c.totalSpent + amount, 
          ordersCount: c.ordersCount + 1,
          lastVisit: Date.now()
        };
      }
      return c;
    });
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    triggerStorageUpdate();
  },
  deleteCustomer: (id: string) => {
    if (!isClient) return;
    const customers = storage.getCustomers().filter(c => c.id !== id);
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    triggerStorageUpdate();
  },

  // Produtos
  getProducts: (): Product[] => {
    if (!isClient) return INITIAL_PRODUCTS;
    initializeDataIfNeeded();
    const data = localStorage.getItem(KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  },
  saveProducts: (products: Product[]) => {
    if (!isClient) return;
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    triggerStorageUpdate();
  },
  
  // Pedidos
  getOrders: (): Order[] => {
    if (!isClient) return [];
    initializeDataIfNeeded();
    const data = localStorage.getItem(KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },
  saveOrder: (order: Order) => {
    if (!isClient) return;
    const orders = storage.getOrders();
    const existsIdx = orders.findIndex(o => o.id === order.id);
    if (existsIdx > -1) {
      orders[existsIdx] = order;
    } else {
      orders.push(order);
    }
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    triggerStorageUpdate();
    
    if (order.customerId && order.status === 'concluido' && existsIdx === -1) {
      storage.updateCustomerSpending(order.customerId, order.total);
    }
  },
  updateOrder: (updatedOrder: Order) => {
    if (!isClient) return;
    const orders = storage.getOrders();
    const existsIdx = orders.findIndex(o => o.id === updatedOrder.id);
    if (existsIdx > -1) {
      orders[existsIdx] = updatedOrder;
    } else {
      orders.push(updatedOrder);
    }
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    triggerStorageUpdate();
  },
  deleteOrder: (id: string) => {
    if (!isClient) return;
    const orders = storage.getOrders().filter(o => o.id !== id);
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    triggerStorageUpdate();
  },

  // Reservas
  getReservations: (): Reservation[] => {
    if (!isClient) return [];
    const data = localStorage.getItem(KEYS.RESERVATIONS);
    return data ? JSON.parse(data) : [];
  },
  saveReservation: (res: Reservation) => {
    if (!isClient) return;
    const reservations = storage.getReservations();
    reservations.push(res);
    localStorage.setItem(KEYS.RESERVATIONS, JSON.stringify(reservations));
    triggerStorageUpdate();
  },
  saveReservations: (reservations: Reservation[]) => {
    if (!isClient) return;
    localStorage.setItem(KEYS.RESERVATIONS, JSON.stringify(reservations));
    triggerStorageUpdate();
  },
  deleteReservation: (id: string) => {
    if (!isClient) return;
    const reservations = storage.getReservations().filter(r => r.id !== id);
    localStorage.setItem(KEYS.RESERVATIONS, JSON.stringify(reservations));
    triggerStorageUpdate();
  },

  // Transações
  getTransactions: (): Transaction[] => {
    if (!isClient) return [];
    initializeDataIfNeeded();
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  addTransaction: (transaction: Transaction) => {
    if (!isClient) return;
    const transactions = storage.getTransactions();
    transactions.push(transaction);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    triggerStorageUpdate();
  },

  // Logs
  getLogs: (): LogEntry[] => {
    if (!isClient) return [];
    initializeDataIfNeeded();
    const data = localStorage.getItem(KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },
  addLog: (log: LogEntry) => {
    if (!isClient) return;
    const logs = storage.getLogs();
    logs.push(log);
    // Manter apenas os últimos 1000 logs
    if (logs.length > 1000) {
      logs.shift();
    }
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
    triggerStorageUpdate();
  },
  getLogsByType: (type: LogEntry['type']): LogEntry[] => {
    return storage.getLogs().filter(log => log.type === type);
  },

  // Admins
  getAdmins: (): Admin[] => {
    if (!isClient) return [];
    const data = localStorage.getItem(KEYS.ADMINS);
    if (!data) {
      // Criar admin master padrão se não existir
      const masterAdmin: Admin = {
        id: 'master_admin_001',
        username: 'admin',
        password: 'admin123', // Em produção, deve ser hash
        name: 'Administrador CEO',
        email: '',
        role: 'master',
        permissions: DEFAULT_ROLES.master,
        active: true,
        createdAt: Date.now()
      };
      const admins = [masterAdmin];
      localStorage.setItem(KEYS.ADMINS, JSON.stringify(admins));
      return admins;
    }
    const admins = JSON.parse(data);
    // Verificar se o admin master padrão existe e está correto
    const masterAdmin = admins.find((a: Admin) => a.id === 'master_admin_001');
    if (!masterAdmin || masterAdmin.username !== 'admin' || masterAdmin.password !== 'admin123') {
      // Atualizar ou criar admin master padrão
      const masterAdminIndex = admins.findIndex((a: Admin) => a.id === 'master_admin_001');
      const updatedMasterAdmin: Admin = {
        id: 'master_admin_001',
        username: 'admin',
        password: 'admin123',
        name: 'Administrador CEO',
        email: masterAdmin?.email || '',
        role: 'master',
        permissions: DEFAULT_ROLES.master,
        active: true,
        createdAt: masterAdmin?.createdAt || Date.now(),
        lastLogin: masterAdmin?.lastLogin
      };
      if (masterAdminIndex >= 0) {
        admins[masterAdminIndex] = updatedMasterAdmin;
      } else {
        admins.unshift(updatedMasterAdmin);
      }
      localStorage.setItem(KEYS.ADMINS, JSON.stringify(admins));
      return admins;
    }
    return admins;
  },
  saveAdmin: (admin: Admin) => {
    if (!isClient) return;
    const admins = storage.getAdmins();
    const existsIdx = admins.findIndex(a => a.id === admin.id);
    if (existsIdx > -1) {
      admins[existsIdx] = admin;
    } else {
      admins.push(admin);
    }
    localStorage.setItem(KEYS.ADMINS, JSON.stringify(admins));
    triggerStorageUpdate();
    return admin;
  },
  saveAdmins: (admins: Admin[]) => {
    if (!isClient) return;
    localStorage.setItem(KEYS.ADMINS, JSON.stringify(admins));
    triggerStorageUpdate();
  },
  deleteAdmin: (id: string) => {
    if (!isClient) return;
    const admins = storage.getAdmins().filter(a => a.id !== id);
    localStorage.setItem(KEYS.ADMINS, JSON.stringify(admins));
    triggerStorageUpdate();
  },
  authenticateAdmin: (username: string, password: string): Admin | null => {
    if (!isClient) return null;
    // Limpar espaços em branco
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    
    if (!cleanUsername || !cleanPassword) return null;
    
    const admins = storage.getAdmins();
    const admin = admins.find(a => 
      a.username.toLowerCase().trim() === cleanUsername.toLowerCase() && 
      a.password.trim() === cleanPassword && 
      a.active !== false
    );
    if (admin) {
      // Atualizar último login
      admin.lastLogin = Date.now();
      storage.saveAdmin(admin);
      // Salvar sessão atual
      localStorage.setItem(KEYS.CURRENT_ADMIN, JSON.stringify(admin));
      triggerStorageUpdate();
    }
    return admin || null;
  },
  getCurrentAdmin: (): Admin | null => {
    if (!isClient) return null;
    const data = localStorage.getItem(KEYS.CURRENT_ADMIN);
    if (!data) return null;
    const admin = JSON.parse(data) as Admin;
    // Verificar se ainda está ativo
    const admins = storage.getAdmins();
    const activeAdmin = admins.find(a => a.id === admin.id && a.active);
    return activeAdmin || null;
  },
  logoutAdmin: () => {
    if (!isClient) return;
    localStorage.removeItem(KEYS.CURRENT_ADMIN);
    triggerStorageUpdate();
  },
  hasPermission: (admin: Admin | null, permission: string): boolean => {
    if (!isClient) return false;
    if (!admin || !admin.active) return false;
    if (admin.role === 'master') return true; // Master tem acesso a tudo
    if (!admin.permissions || !Array.isArray(admin.permissions)) return false;
    const perm = admin.permissions.find(p => p.type === permission);
    return perm?.enabled || false;
  },

  // Função para resetar apenas o financeiro: zerar transações, pedidos e reservas
  resetFinancialData: () => {
    if (!isClient) return;
    
    try {
      // 1. Zerar todas as transações financeiras
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
      
      // 2. Zerar todos os pedidos
      localStorage.setItem(KEYS.ORDERS, JSON.stringify([]));
      
      // 3. Zerar todas as reservas
      localStorage.setItem(KEYS.RESERVATIONS, JSON.stringify([]));
      
      // 4. Resetar gastos dos clientes (zerar totalSpent e ordersCount)
      const customers = storage.getCustomers();
      const updatedCustomers = customers.map(customer => ({
        ...customer,
        totalSpent: 0,
        ordersCount: 0
      }));
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
      
      // Disparar evento de atualização
      triggerStorageUpdate();
      
      console.log('✅ Dados financeiros resetados com sucesso: transações, pedidos e reservas zerados');
    } catch (error) {
      console.error('❌ Erro ao resetar dados financeiros:', error);
      throw error;
    }
  }
};
