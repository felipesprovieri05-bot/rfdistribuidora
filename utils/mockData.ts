import { Product, Order, Transaction, Customer, LogEntry } from '../types';

// Função para gerar ID aleatório (usando slice em vez de substr que está deprecated)
const generateId = () => Math.random().toString(36).slice(2, 11);

// Função para gerar timestamp aleatório dentro de um período
const randomTimestamp = (daysAgo: number, daysRange: number = 1): number => {
  const now = Date.now();
  const start = now - (daysAgo * 24 * 60 * 60 * 1000);
  const end = start - (daysRange * 24 * 60 * 60 * 1000);
  return Math.floor(Math.random() * (start - end) + end);
};

// Produtos com estoques realistas após 4 meses de operação
export const generateProducts = (): Product[] => {
  return [
    { 
      id: '1', 
      name: 'Cerveja Artesanal IPA', 
      buyPrice: 8.50, 
      sellPrice: 18.00, 
      stock: 13, 
      category: 'Cervejas',
      imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&q=80&w=800',
      fixedPrice: 16.20
    },
    { 
      id: '2', 
      name: 'X-Burguer Especial', 
      buyPrice: 12.00, 
      sellPrice: 28.00, 
      stock: 1, 
      category: 'Lanches',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
      fixedPrice: 25.20
    },
    { 
      id: '3', 
      name: 'Vinho Tinto Malbec', 
      buyPrice: 35.00, 
      sellPrice: 75.00, 
      stock: 8, 
      category: 'Vinhos e Outros',
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800',
      fixedPrice: 67.50
    },
    { 
      id: '4', 
      name: 'Batata Frita com Queijo', 
      buyPrice: 7.00, 
      sellPrice: 22.00, 
      stock: 25, 
      category: 'Petiscos e Porções',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=800',
      fixedPrice: 19.80
    },
    { 
      id: '5', 
      name: 'Suco Natural Laranja', 
      buyPrice: 3.00, 
      sellPrice: 10.00, 
      stock: 42, 
      category: 'Bebidas Não Alcoólicas',
      imageUrl: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&q=80&w=800',
      fixedPrice: 9.00
    },
    { 
      id: '6', 
      name: 'Gin Tônica Premium', 
      buyPrice: 15.00, 
      sellPrice: 35.00, 
      stock: 18, 
      category: 'Destilados e Drinks',
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=800',
      fixedPrice: 31.50
    },
    { 
      id: '7', 
      name: 'Pudim de Leite', 
      buyPrice: 4.00, 
      sellPrice: 12.00, 
      stock: 9, 
      category: 'Sobremesas',
      imageUrl: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?auto=format&fit=crop&q=80&w=800',
      fixedPrice: 10.80
    },
    { 
      id: '8', 
      name: 'Combo Burguer + Fritas', 
      buyPrice: 18.00, 
      sellPrice: 45.00, 
      stock: 12, 
      category: 'Combos Especiais',
      imageUrl: 'https://images.unsplash.com/photo-1460306423018-2b3a9c50c059?auto=format&fit=crop&q=80&w=800',
      fixedPrice: 40.50
    },
    { 
      id: '9', 
      name: 'Caipirinha Especial', 
      buyPrice: 6.00, 
      sellPrice: 15.00, 
      stock: 35, 
      category: 'Destilados e Drinks',
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=800',
      fixedPrice: 13.50
    },
    { 
      id: '10', 
      name: 'Pizza Artesanal Margherita', 
      buyPrice: 14.00, 
      sellPrice: 38.00, 
      stock: 5, 
      category: 'Lanches',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
      fixedPrice: 34.20
    },
    { 
      id: '11', 
      name: 'Água Mineral 500ml', 
      buyPrice: 1.50, 
      sellPrice: 4.00, 
      stock: 120, 
      category: 'Bebidas Não Alcoólicas',
      imageUrl: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&q=80&w=800',
      fixedPrice: 3.60
    },
    { 
      id: '12', 
      name: 'Espetinho de Carne', 
      buyPrice: 5.00, 
      sellPrice: 14.00, 
      stock: 28, 
      category: 'Petiscos e Porções',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=800',
      fixedPrice: 12.60
    }
  ];
};

// Clientes frequentes
export const generateCustomers = (): Customer[] => {
  const now = Date.now();
  const customerNames = [
    'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 
    'Carlos Ferreira', 'Juliana Lima', 'Roberto Alves', 'Fernanda Souza',
    'Rafael Martins', 'Camila Rocha', 'Lucas Barbosa', 'Patricia Gomes'
  ];
  
  return customerNames.map((name, index) => {
    const totalSpent = Math.floor(Math.random() * 1500) + 300; // R$ 300 a R$ 1800
    const ordersCount = Math.floor(totalSpent / (Math.random() * 80 + 40)); // Baseado no gasto total
    
    const isVip = totalSpent > 1000;
    const isFixed = ordersCount > 8;
    
    return {
      id: `customer_${index + 1}`,
      name,
      phone: `(11) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      cpf: `${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}`,
      totalSpent,
      ordersCount,
      lastVisit: randomTimestamp(Math.floor(Math.random() * 30) + 1, 7),
      type: isVip ? 'vip' : (isFixed ? 'fixed' : 'normal')
    };
  });
};

// Gerar pedidos históricos
export const generateOrders = (products: Product[], customers: Customer[]): Order[] => {
  const orders: Order[] = [];
  const tables = ['Balcão', 'Mesa 01', 'Mesa 02', 'Mesa 03', 'Mesa 04', 'Mesa 05', 'Mesa 06', 'Mesa 07', 'Mesa 08', 'Mesa 09', 'Mesa 10', 'Delivery'];
  const paymentMethods: Array<'dinheiro' | 'cartao' | 'pix' | 'transferencia'> = ['dinheiro', 'cartao', 'pix', 'transferencia'];
  const statuses: Array<'concluido' | 'entregue' | 'pronto'> = ['concluido', 'entregue', 'pronto'];
  
  // Gerar ~200 pedidos nos últimos 4 meses (distribuídos)
  for (let i = 0; i < 200; i++) {
    const daysAgo = Math.floor(Math.random() * 120) + 1; // 1 a 120 dias atrás
    const timestamp = randomTimestamp(daysAgo, 1);
    
    // Escolher produtos aleatórios (1 a 4 itens)
    const numItems = Math.floor(Math.random() * 4) + 1;
    const selectedProducts = products.sort(() => 0.5 - Math.random()).slice(0, numItems);
    
    const items = selectedProducts.map(p => ({
      productId: p.id,
      name: p.name,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: p.sellPrice,
      delivered: Math.random() > 0.2 // 80% entregues
    }));
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    orders.push({
      id: generateId(),
      customerId: customer.id,
      customerName: Math.random() > 0.7 ? 'Cliente Avulso' : customer.name,
      tableNumber: tables[Math.floor(Math.random() * tables.length)],
      items,
      total,
      status,
      paymentStatus: status === 'concluido' || status === 'entregue' ? 'pago' : (Math.random() > 0.3 ? 'pago' : 'pendente'),
      paymentMethod: status === 'concluido' || status === 'entregue' || Math.random() > 0.3 ? paymentMethod : undefined,
      timestamp,
      sentToKitchenAt: timestamp + (Math.random() * 5 * 60 * 1000), // 0 a 5 minutos depois
      completedAt: status === 'concluido' || status === 'entregue' ? timestamp + (Math.random() * 60 * 60 * 1000) : undefined
    });
  }
  
  return orders.sort((a, b) => b.timestamp - a.timestamp);
};

// Gerar transações históricas
export const generateTransactions = (orders: Order[], products: Product[]): Transaction[] => {
  const transactions: Transaction[] = [];
  
  // Transações de vendas (entradas) baseadas nos pedidos pagos
  orders.filter(o => o.paymentStatus === 'pago').forEach(order => {
    transactions.push({
      id: generateId(),
      type: 'entrada',
      amount: order.total,
      description: order.tableNumber === 'Balcão' 
        ? `[CAIXA BALCÃO] Venda direta - ${order.customerName} - ${order.paymentMethod || 'dinheiro'}`
        : `[CAIXA] Pedido ${order.id.slice(-6).toUpperCase()} - ${order.customerName} - ${order.paymentMethod || 'dinheiro'}`,
      timestamp: order.timestamp,
      category: 'venda',
      orderId: order.id
    });
  });
  
  // Transações de compras de estoque (saídas) - algumas ao longo dos 4 meses
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 100) + 10;
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 50) + 20;
    
    transactions.push({
      id: generateId(),
      type: 'saida',
      amount: product.buyPrice * quantity,
      description: `[COMPRA] Estoque: ${product.name} - Qtd: ${quantity}`,
      timestamp: randomTimestamp(daysAgo, 3),
      category: 'compra'
    });
  }
  
  // Algumas despesas operacionais
  const expenses = [
    { desc: 'Aluguel do estabelecimento', amount: 3500 },
    { desc: 'Conta de luz', amount: 450 },
    { desc: 'Conta de água', amount: 180 },
    { desc: 'Salário funcionários', amount: 5200 },
    { desc: 'Material de limpeza', amount: 320 },
    { desc: 'Manutenção equipamentos', amount: 650 }
  ];
  
  // 4 meses = 4 ocorrências de cada despesa recorrente
  for (let month = 0; month < 4; month++) {
    expenses.forEach(expense => {
      transactions.push({
        id: generateId(),
        type: 'saida',
        amount: expense.amount + (Math.random() * expense.amount * 0.1 - expense.amount * 0.05), // Variação de ±5%
        description: `[DESPESA] ${expense.desc}`,
        timestamp: randomTimestamp(30 * month + 15, 10), // Meio do mês, com variação
        category: 'despesa'
      });
    });
  }
  
  return transactions.sort((a, b) => b.timestamp - a.timestamp);
};

// Gerar logs históricos
export const generateLogs = (orders: Order[], transactions: Transaction[]): LogEntry[] => {
  const logs: LogEntry[] = [];
  
  // Logs de pedidos
  orders.forEach(order => {
    logs.push({
      id: generateId(),
      type: 'pedido',
      action: 'criado',
      description: `Pedido ${order.id.slice(-6).toUpperCase()} criado - ${order.tableNumber}`,
      timestamp: order.timestamp,
      data: { orderId: order.id, table: order.tableNumber }
    });
    
    if (order.sentToKitchenAt) {
      logs.push({
        id: generateId(),
        type: 'pedido',
        action: 'enviado',
        description: `Pedido ${order.id.slice(-6).toUpperCase()} enviado para cozinha`,
        timestamp: order.sentToKitchenAt,
        data: { orderId: order.id }
      });
    }
    
    if (order.completedAt) {
      logs.push({
        id: generateId(),
        type: 'pedido',
        action: 'concluido',
        description: `Pedido ${order.id.slice(-6).toUpperCase()} concluído`,
        timestamp: order.completedAt,
        data: { orderId: order.id }
      });
    }
  });
  
  // Logs de transações relevantes
  transactions.filter(t => t.amount > 1000).forEach(transaction => {
    logs.push({
      id: generateId(),
      type: 'financeiro',
      action: transaction.type === 'entrada' ? 'receita' : 'despesa',
      description: transaction.description,
      timestamp: transaction.timestamp,
      data: { transactionId: transaction.id, amount: transaction.amount }
    });
  });
  
  // Logs de caixa
  transactions.filter(t => t.category === 'venda').slice(0, 50).forEach(transaction => {
    logs.push({
      id: generateId(),
      type: 'caixa',
      action: 'venda',
      description: `Venda realizada - R$ ${transaction.amount.toFixed(2)}`,
      timestamp: transaction.timestamp,
      data: { transactionId: transaction.id }
    });
  });
  
  return logs.sort((a, b) => b.timestamp - a.timestamp);
};

// Função principal para inicializar todos os dados
export const initializeMockData = () => {
  const products = generateProducts();
  const customers = generateCustomers();
  const orders = generateOrders(products, customers);
  const transactions = generateTransactions(orders, products);
  const logs = generateLogs(orders, transactions);
  
  return {
    products,
    customers,
    orders,
    transactions,
    logs
  };
};
