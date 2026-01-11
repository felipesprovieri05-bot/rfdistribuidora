
export interface Customer {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  password?: string;
  totalSpent: number;
  ordersCount: number;
  lastVisit: number;
  type: 'normal' | 'fixed' | 'vip';
}

export interface Product {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  fixedPrice?: number;
  stock: number;
  category: 
    | 'Petiscos e Porções' 
    | 'Lanches' 
    | 'Bebidas Não Alcoólicas' 
    | 'Cervejas' 
    | 'Bebidas' 
    | 'Destilados e Drinks' 
    | 'Vinhos e Outros' 
    | 'Sobremesas' 
    | 'Combos Especiais' 
    | 'Outros';
  imageUrl?: string;
  barcode?: string; // Código de barras do produto
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  delivered?: boolean;
  deliveredAt?: number;
  deliveredBy?: string;
}

export interface Order {
  id: string;
  customerId?: string; 
  customerName: string;
  tableNumber: string;
  items: OrderItem[];
  total: number;
  status: 'pendente' | 'cozinha' | 'em_preparo' | 'pronto' | 'entregue' | 'concluido' | 'cancelado';
  paymentStatus: 'pendente' | 'pago' | 'cancelado';
  paymentMethod?: 'dinheiro' | 'cartao' | 'pix' | 'transferencia';
  timestamp: number;
  sentToKitchenAt?: number;
  completedAt?: number;
}

export interface Reservation {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  status: 'pendente' | 'presente' | 'concluido' | 'cancelado';
  notified?: boolean;
  createdAt: number;
  tableNumber?: string; // Número da mesa vinculada à reserva
  totalGasto?: number; // Total gasto na mesa (calculado automaticamente)
}

export interface Transaction {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  timestamp: number;
  category?: 'venda' | 'compra' | 'despesa' | 'salario' | 'outro';
  orderId?: string;
}

export interface LogEntry {
  id: string;
  type: 'caixa' | 'pedido' | 'reserva' | 'estoque' | 'cliente' | 'financeiro';
  action: string;
  description: string;
  userId?: string;
  timestamp: number;
  data?: any;
}

export interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  cmv: number; // Custo de Mercadoria Vendida
  stockValue: number;
  ordersCount: number;
  averageTicket: number;
}

export enum ViewMode {
  CLIENT = 'client',
  ADMIN = 'admin'
}

// Tipos de permissões disponíveis
export type PermissionType = 
  | 'caixa'           // Acesso ao PDV/Caixa
  | 'pedidos'         // Acesso à gestão de pedidos
  | 'reservas'        // Acesso à gestão de reservas
  | 'estoque'         // Acesso ao controle de estoque
  | 'clientes'        // Acesso ao cadastro de clientes
  | 'financeiro'      // Acesso ao dashboard financeiro
  | 'admins';         // Acesso à gestão de admins (apenas master)

export interface Permission {
  type: PermissionType;
  enabled: boolean;
}

export interface Admin {
  id: string;
  username: string;
  password: string; // Em produção, deve ser hash
  name: string;
  email?: string;
  role: 'master' | 'admin' | 'garcom' | 'caixa' | 'gerente'; // Tipos de cargo disponíveis
  permissions: Permission[];
  active: boolean;
  createdAt: number;
  lastLogin?: number;
  createdBy?: string; // ID do admin que criou este usuário
}

// Roles pré-definidos para facilitar
export const DEFAULT_ROLES: Record<string, Permission[]> = {
  'master': [
    { type: 'caixa', enabled: true },
    { type: 'pedidos', enabled: true },
    { type: 'reservas', enabled: true },
    { type: 'estoque', enabled: true },
    { type: 'clientes', enabled: true },
    { type: 'financeiro', enabled: true },
    { type: 'admins', enabled: true }
  ],
  'garcom': [
    { type: 'caixa', enabled: true },
    { type: 'pedidos', enabled: true },
    { type: 'reservas', enabled: true },
    { type: 'estoque', enabled: false },
    { type: 'clientes', enabled: true },
    { type: 'financeiro', enabled: false },
    { type: 'admins', enabled: false }
  ],
  'caixa': [
    { type: 'caixa', enabled: true },
    { type: 'pedidos', enabled: false },
    { type: 'reservas', enabled: false },
    { type: 'estoque', enabled: false },
    { type: 'clientes', enabled: true },
    { type: 'financeiro', enabled: false },
    { type: 'admins', enabled: false }
  ],
  'gerente': [
    { type: 'caixa', enabled: true },
    { type: 'pedidos', enabled: true },
    { type: 'reservas', enabled: true },
    { type: 'estoque', enabled: true },
    { type: 'clientes', enabled: true },
    { type: 'financeiro', enabled: true },
    { type: 'admins', enabled: false }
  ]
};
