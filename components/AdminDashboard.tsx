
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Order, Reservation, Transaction, Customer, OrderItem, LogEntry, Admin } from '../types';
import { CATEGORIES } from '../constants';
import { storage } from '../services/storage';
import { sendWhatsAppMessage, createReservationMessage } from '../services/whatsapp';
import FinancialDashboard from './FinancialDashboard';
import OrderManagement from './OrderManagement';
import AdminManagement from './AdminManagement';
import dynamic from 'next/dynamic';

// Carregar BarcodeScanner apenas no cliente para evitar erros de SSR
const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), { 
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl">
      <div className="glass p-8 rounded-[3rem] border border-[#FF4500]/30">
        <p className="text-white font-black text-center">Carregando scanner...</p>
      </div>
    </div>
  )
});

interface AdminDashboardProps {
  currentAdmin: Admin;
  products: Product[];
  orders: Order[];
  reservations: Reservation[];
  transactions: Transaction[];
  customers: Customer[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateOrders: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onDeleteReservation: (id: string) => void;
  onUpdateReservations: (reservations: Reservation[]) => void;
  onAddTransaction: (t: Transaction) => void;
  onUpdateCustomers?: (customers: Customer[]) => void;
  onRefresh?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  currentAdmin,
  products, orders, reservations, transactions, customers,
  onUpdateProducts, onUpdateOrders, onDeleteOrder, onDeleteReservation, onUpdateReservations, onAddTransaction,
  onUpdateCustomers,
  onRefresh
}) => {
  type TabType = 'caixa' | 'pedidos' | 'reservas' | 'estoque' | 'clientes' | 'financeiro' | 'admins';
  
  // Função para verificar permissão
  const hasPermission = (permission: string): boolean => {
    if (!currentAdmin) return false;
    return storage.hasPermission(currentAdmin, permission);
  };

  // Definir tabs disponíveis baseado nas permissões
  const availableTabs = useMemo(() => {
    if (!currentAdmin) return [];
    const tabs: TabType[] = [];
    if (storage.hasPermission(currentAdmin, 'caixa')) tabs.push('caixa');
    if (storage.hasPermission(currentAdmin, 'pedidos')) tabs.push('pedidos');
    if (storage.hasPermission(currentAdmin, 'reservas')) tabs.push('reservas');
    if (storage.hasPermission(currentAdmin, 'estoque')) tabs.push('estoque');
    if (storage.hasPermission(currentAdmin, 'clientes')) tabs.push('clientes');
    if (storage.hasPermission(currentAdmin, 'financeiro')) tabs.push('financeiro');
    if (storage.hasPermission(currentAdmin, 'admins')) tabs.push('admins');
    return tabs;
  }, [currentAdmin]);

  // Definir tab inicial (primeira disponível)
  const [activeTab, setActiveTab] = useState<TabType>('caixa');
  const prevTabsLengthRef = useRef<number>(0);

  // Atualizar activeTab quando availableTabs mudar
  useEffect(() => {
    const tabsLength = availableTabs?.length || 0;
    
    if (tabsLength > 0 && tabsLength !== prevTabsLengthRef.current) {
      prevTabsLengthRef.current = tabsLength;
      
      if (Array.isArray(availableTabs) && availableTabs.length > 0) {
        const currentTabExists = availableTabs.includes(activeTab);
        if (!currentTabExists && availableTabs[0]) {
          setActiveTab(availableTabs[0]);
        }
      }
    }
  }, [availableTabs?.length, currentAdmin?.id]);
  const [showSuccessSale, setShowSuccessSale] = useState(false);
  const [successType, setSuccessType] = useState<'venda' | 'cozinha' | 'produto'>('venda');
  
  // PDV States
  const [caixaSearch, setCaixaSearch] = useState('');
  const [caixaCart, setCaixaCart] = useState<{product: Product, quantity: number}[]>([]);
  const [caixaTable, setCaixaTable] = useState('Balcão');

  // Estoque States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeScannerMode, setBarcodeScannerMode] = useState<'cadastro' | 'caixa'>('cadastro');
  const [lastScannedProduct, setLastScannedProduct] = useState<{name: string, barcode: string} | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: 'Outros',
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    imageUrl: '',
    barcode: ''
  });

  // Clientes States
  const [customerSearch, setCustomerSearch] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [openCustomerSettings, setOpenCustomerSettings] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    cpf: '',
    phone: '',
    totalSpent: 0,
    ordersCount: 0,
    lastVisit: Date.now(),
    type: 'normal'
  });

  // Caixa States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao' | 'pix' | 'transferencia'>('dinheiro');
  const [customerNameForOrder, setCustomerNameForOrder] = useState('');

  // Logs
  const logs = useMemo(() => storage.getLogs(), [transactions, orders, reservations, products, customers]);

  // Fechar menu de configurações ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openCustomerSettings && !target.closest('.customer-settings-menu')) {
        setOpenCustomerSettings(null);
      }
    };

    if (openCustomerSettings) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openCustomerSettings]);

  const TABLES = ['Balcão', 'Mesa 01', 'Mesa 02', 'Mesa 03', 'Mesa 04', 'Mesa 05', 'Mesa 06', 'Mesa 07', 'Mesa 08', 'Mesa 09', 'Mesa 10', 'Delivery'];

  // Cálculos Globais
  const caixaTotal = useMemo(() => caixaCart.reduce((s, i) => s + (i.product.sellPrice * i.quantity), 0), [caixaCart]);

  const stats = useMemo(() => {
    const revenue = transactions.filter(t => t.type === 'entrada').reduce((s, t) => s + t.amount, 0);
    let totalCmv = 0;
    orders.filter(o => o.status === 'concluido').forEach(order => {
      order.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) totalCmv += (prod.buyPrice * item.quantity);
      });
    });
    return { revenue, cmv: totalCmv, profit: revenue - totalCmv };
  }, [transactions, orders, products]);

  // Handlers de Produto
  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalizar código de barras (trim e garantir string)
    const normalizedBarcode = newProduct.barcode ? String(newProduct.barcode).trim() : '';
    
    // Verificar se já existe produto com o mesmo código de barras
    if (normalizedBarcode.length > 0) {
      const existingProduct = products.find(p => p.barcode && String(p.barcode).trim() === normalizedBarcode);
      if (existingProduct) {
        alert(`Já existe um produto cadastrado com o código de barras ${normalizedBarcode}.\n\nProduto: ${existingProduct.name}`);
        return;
      }
    }
    
    const product: Product = {
      id: Math.random().toString(36).slice(2, 11),
      name: newProduct.name ? String(newProduct.name).trim() : 'Novo Produto',
      category: newProduct.category as any || 'Outros',
      buyPrice: Number(newProduct.buyPrice) || 0,
      sellPrice: Number(newProduct.sellPrice) || 0,
      stock: Number(newProduct.stock) || 0,
      imageUrl: newProduct.imageUrl || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800',
      fixedPrice: Number(newProduct.sellPrice) * 0.9, // Sugestão automática de 10% off para VIP
      barcode: normalizedBarcode.length > 0 ? normalizedBarcode : undefined
    };

    onUpdateProducts([...products, product]);
    onAddTransaction({
      id: Math.random().toString(36).slice(2, 11),
      type: 'saida',
      amount: product.buyPrice * product.stock,
      description: `[COMPRA] Estoque inicial: ${product.name}`,
      timestamp: Date.now()
    });

    setIsAddingNew(false);
    setNewProduct({ name: '', category: 'Outros', buyPrice: 0, sellPrice: 0, stock: 0, imageUrl: '', barcode: '' });
    setSuccessType('produto');
    setShowSuccessSale(true);
    setTimeout(() => setShowSuccessSale(false), 2000);
  };

  const handleBarcodeScan = (barcode: string) => {
    // Normalizar código de barras recebido
    const normalizedBarcode = String(barcode).trim();
    if (normalizedBarcode.length < 8) {
      alert('Código de barras inválido! Deve ter no mínimo 8 dígitos.');
      return;
    }
    
    if (barcodeScannerMode === 'cadastro') {
      // Verificar se já existe produto com este código (comparação normalizada)
      const existingProduct = products.find(p => p.barcode && String(p.barcode).trim() === normalizedBarcode);
      if (existingProduct) {
        alert(`Produto com código de barras ${normalizedBarcode} já cadastrado:\n\n${existingProduct.name}`);
        return; // No modo cadastro, não fechar scanner para permitir tentar outro código
      }
      
      setNewProduct({ ...newProduct, barcode: normalizedBarcode });
      setShowBarcodeScanner(false);
      addLog('estoque', 'barcode_scan', `Código de barras escaneado para cadastro: ${normalizedBarcode}`, { barcode: normalizedBarcode });
    } else if (barcodeScannerMode === 'caixa') {
      // Buscar produto por código de barras no caixa (comparação normalizada)
      const product = products.find(p => p.barcode && String(p.barcode).trim() === normalizedBarcode);
      if (product) {
        // Buscar produto atualizado para verificar estoque em tempo real
        const currentProduct = products.find(p => p.id === product.id);
        const availableStock = currentProduct ? currentProduct.stock : product.stock;
        
        if (availableStock <= 0) {
          alert(`❌ Produto ${product.name} está fora de estoque!`);
          // No modo contínuo, não fechar scanner, permitir tentar outro
          return;
        }
        
        // Adicionar ao carrinho
        const existingItem = caixaCart.find(item => item.product.id === product.id);
        if (existingItem) {
          // Verificar se ainda há estoque disponível
          if (existingItem.quantity < availableStock) {
            setCaixaCart(prev => prev.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ));
            setLastScannedProduct({ name: `${product.name} (Qtd: ${existingItem.quantity + 1})`, barcode: normalizedBarcode });
            setTimeout(() => setLastScannedProduct(null), 3000);
            addLog('caixa', 'barcode_scan', `Produto adicionado via código de barras: ${product.name} (${normalizedBarcode}) - Qtd: ${existingItem.quantity + 1}`, { barcode: normalizedBarcode, productId: product.id });
            // No modo contínuo, não fechar scanner, continuar escaneando
            return;
          } else {
            alert(`⚠️ Estoque insuficiente de ${product.name}!\n\nDisponível: ${availableStock} unidades\nJá no carrinho: ${existingItem.quantity} unidades`);
            // No modo contínuo, não fechar scanner
            return;
          }
        } else {
          // Produto novo no carrinho
          setCaixaCart(prev => [...prev, { product, quantity: 1 }]);
          setLastScannedProduct({ name: `✅ ${product.name} adicionado!`, barcode: normalizedBarcode });
          setTimeout(() => setLastScannedProduct(null), 3000); // Limpar após 3 segundos
          addLog('caixa', 'barcode_scan', `Produto adicionado via código de barras: ${product.name} (${normalizedBarcode})`, { barcode: normalizedBarcode, productId: product.id });
          // No modo contínuo, não fechar scanner, continuar escaneando
          return;
        }
      } else {
        // Produto não encontrado - oferecer cadastro rápido
        const shouldAddNew = window.confirm(
          `⚠️ Produto não encontrado!\n\n` +
          `Código: ${normalizedBarcode}\n\n` +
          `Deseja cadastrar este produto agora?\n\n` +
          `(O scanner continuará aberto após o cadastro)`
        );
        if (shouldAddNew) {
          // Fechar scanner do caixa temporariamente e abrir formulário de cadastro
          setShowBarcodeScanner(false);
          setIsAddingNew(true);
          setNewProduct({ 
            name: '', 
            category: 'Outros', 
            buyPrice: 0, 
            sellPrice: 0, 
            stock: 100, // Estoque padrão
            imageUrl: '', 
            barcode: normalizedBarcode 
          });
          setBarcodeScannerMode('cadastro');
          addLog('estoque', 'barcode_scan', `Código de barras ${normalizedBarcode} não encontrado - abrindo cadastro`, { barcode: normalizedBarcode });
        }
        // Se não quiser cadastrar, continuar escaneando no modo contínuo (scanner não fecha)
      }
    }
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const updated = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    onUpdateProducts(updated);
    addLog('estoque', 'produto_atualizado', `Produto ${editingProduct.name} atualizado`, { productId: editingProduct.id });
    setEditingProduct(null);
  };

  const handleDeleteProduct = () => {
    if (!editingProduct) return;
    
    const confirmMessage = `⚠️ ATENÇÃO: Excluir Insumo\n\n` +
      `Produto: ${editingProduct.name}\n` +
      `Estoque atual: ${editingProduct.stock} unidades\n\n` +
      `Esta ação NÃO pode ser desfeita!\n\n` +
      `Tem certeza que deseja excluir este insumo?`;
    
    if (confirm(confirmMessage)) {
      try {
        const updatedProducts = products.filter(p => p.id !== editingProduct.id);
        onUpdateProducts(updatedProducts);
        addLog('estoque', 'produto_excluido', `Produto ${editingProduct.name} excluído`, { productId: editingProduct.id });
        setEditingProduct(null);
        alert(`✅ Produto "${editingProduct.name}" excluído com sucesso!`);
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('❌ Erro ao excluir produto. Por favor, tente novamente.');
      }
    }
  };

  // Handlers
  const addLog = (type: LogEntry['type'], action: string, description: string, data?: any) => {
    const log: LogEntry = {
      id: Math.random().toString(36).slice(2, 11),
      type,
      action,
      description,
      timestamp: Date.now(),
      data
    };
    storage.addLog(log);
  };

  const sendWhatsApp = (customer: Customer, message?: string) => {
    try {
      const defaultMessage = message || `Olá ${customer.name}! Estamos entrando em contato da Adega Premium para falar sobre seu último pedido.`;
      sendWhatsAppMessage(customer.phone, defaultMessage);
      addLog('cliente', 'whatsapp', `Mensagem enviada para ${customer.name}`, { customerId: customer.id });
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      alert('Erro ao enviar mensagem via WhatsApp. Por favor, tente novamente.');
    }
  };

  const handleSendToKitchen = () => {
    if (caixaCart.length === 0) return;
    
    // Validar estoque antes de enviar para cozinha
    const stockErrors: string[] = [];
    caixaCart.forEach(item => {
      const product = products.find(p => p.id === item.product.id);
      if (!product) {
        stockErrors.push(`${item.product.name}: Produto não encontrado`);
        return;
      }
      if (product.stock < item.quantity) {
        stockErrors.push(`${item.product.name}: Estoque insuficiente (Disponível: ${product.stock}, Solicitado: ${item.quantity})`);
      }
    });
    
    if (stockErrors.length > 0) {
      alert(`Erro de estoque:\n${stockErrors.join('\n')}\n\nAjuste as quantidades antes de continuar.`);
      return;
    }
    
    const orderId = Math.random().toString(36).slice(2, 11);
    const total = caixaTotal;
    const isBalcao = caixaTable === 'Balcão';
    
    // Atualizar estoque (sempre, independente de ser Balcão ou não)
    const updatedProducts = products.map(p => {
      const cartItem = caixaCart.find(ci => ci.product.id === p.id);
      return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) } : p;
    });

    onUpdateProducts(updatedProducts);
    
    // Se NÃO for Balcão, criar pedido e adicionar à lista
    if (!isBalcao) {
      const newOrder: Order = {
        id: orderId,
        customerName: 'Cliente Avulso',
        tableNumber: caixaTable,
        items: caixaCart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.sellPrice,
          delivered: false
        })),
        total,
        status: 'cozinha',
        paymentStatus: 'pendente',
        timestamp: Date.now(),
        sentToKitchenAt: Date.now()
      };
      
      onUpdateOrders(newOrder);
      addLog('pedido', 'criado', `Pedido ${orderId.slice(-6).toUpperCase()} enviado para cozinha - Mesa: ${caixaTable}`, { orderId, table: caixaTable });
    } else {
      // Se for Balcão, apenas registrar no log
      addLog('caixa', 'cozinha', `Itens enviados para cozinha (Balcão) - ${caixaCart.length} item(ns)`, { table: caixaTable, itemsCount: caixaCart.length });
    }
    
    setSuccessType('cozinha');
    setShowSuccessSale(true);
    setTimeout(() => setShowSuccessSale(false), 2000);
    setCaixaCart([]);
  };

  const handleFinishSale = () => {
    if (caixaCart.length === 0) return;
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    if (caixaCart.length === 0) return;
    
    // Validar estoque ANTES de finalizar a venda (verificação em tempo real)
    const stockErrors: string[] = [];
    caixaCart.forEach(item => {
      const product = products.find(p => p.id === item.product.id);
      if (!product) {
        stockErrors.push(`❌ ${item.product.name}: Produto não encontrado`);
        return;
      }
      if (product.stock < item.quantity) {
        stockErrors.push(`⚠️ ${item.product.name}: Estoque insuficiente (Disponível: ${product.stock}, Solicitado: ${item.quantity})`);
      }
    });
    
    if (stockErrors.length > 0) {
      alert(`Erro de estoque:\n\n${stockErrors.join('\n')}\n\nAjuste as quantidades antes de continuar.`);
      return;
    }
    
    const total = caixaTotal;
    const orderId = Math.random().toString(36).slice(2, 11);
    const isBalcao = caixaTable === 'Balcão';
    
    // Atualizar estoque (sempre, independente de ser Balcão ou não)
    const updatedProducts = products.map(p => {
      const cartItem = caixaCart.find(ci => ci.product.id === p.id);
      return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) } : p;
    });

    // Criar pedido (sempre, para contabilizar corretamente no financeiro)
    // Se for Balcão, criar pedido já concluído e entregue automaticamente
    const newOrder: Order = {
      id: orderId,
      customerName: customerNameForOrder.trim() || 'Cliente Avulso',
      tableNumber: caixaTable,
      items: caixaCart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.sellPrice,
        delivered: isBalcao ? true : false, // Balcão: entregue imediatamente
        deliveredAt: isBalcao ? Date.now() : undefined // Balcão: entregue imediatamente
      })),
      total,
      status: isBalcao ? 'concluido' : 'cozinha', // Balcão: concluído imediatamente
      paymentStatus: 'pago',
      paymentMethod,
      timestamp: Date.now(),
      sentToKitchenAt: isBalcao ? undefined : Date.now(), // Balcão: sem envio para cozinha
      completedAt: isBalcao ? Date.now() : undefined // Balcão: concluído imediatamente
    };

    // Criar transação (sempre, para registrar a venda)
    // SEMPRE vincular ao orderId para contabilizar corretamente no financeiro
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'entrada',
      amount: total,
      description: isBalcao 
        ? `[CAIXA BALCÃO] Venda direta - ${customerNameForOrder || 'Cliente Avulso'} - ${paymentMethod}`
        : `[CAIXA] Pedido ${orderId.slice(-6).toUpperCase()} - ${customerNameForOrder || 'Cliente Avulso'} - ${paymentMethod}`,
      timestamp: Date.now(),
      category: 'venda',
      orderId: orderId // Sempre vincular orderId para contabilização correta
    };

    // Sincronizar gasto do cliente com a comanda em tempo real (quando pedido é pago)
    if (customerNameForOrder && customerNameForOrder.trim() && customerNameForOrder.trim() !== 'Cliente Avulso') {
      try {
        // Buscar cliente pelo nome (normalizar para comparação)
        const normalizeName = (name: string) => name.trim().toLowerCase();
        const customerNameNormalized = normalizeName(customerNameForOrder);
        
        const existingCustomer = customers.find(c => normalizeName(c.name) === customerNameNormalized);
        
        // Atualizar apenas se o pedido já está pago/concluído (Balcão sempre paga na hora)
        if (existingCustomer && onUpdateCustomers && (isBalcao || newOrder.paymentStatus === 'pago')) {
          // Atualizar gasto e contagem de pedidos do cliente
          const updatedCustomer = {
            ...existingCustomer,
            totalSpent: existingCustomer.totalSpent + total,
            ordersCount: existingCustomer.ordersCount + 1,
            lastVisit: Date.now()
          };
          
          // Atualizar lista de clientes
          const updatedCustomers = customers.map(c => 
            c.id === existingCustomer.id ? updatedCustomer : c
          );
          
          onUpdateCustomers(updatedCustomers);
          storage.saveCustomer(updatedCustomer);
          addLog('cliente', 'atualizado', `Cliente ${existingCustomer.name}: Gasto atualizado +R$ ${total.toFixed(2)}`, { customerId: existingCustomer.id, orderId });
        }
      } catch (error) {
        console.error('Erro ao atualizar gasto do cliente:', error);
      }
    }

    // Atualizar produtos (sempre)
    onUpdateProducts(updatedProducts);
    
    // Criar pedido (sempre)
    onUpdateOrders(newOrder);
    
    // Criar transação (sempre)
    onAddTransaction(transaction);
    
    // Log apropriado
    if (isBalcao) {
      addLog('caixa', 'venda', `Venda Balcão concluída: ${customerNameForOrder || 'Cliente Avulso'} - R$ ${total.toFixed(2)}`, { orderId, table: caixaTable, paymentMethod });
    } else {
      addLog('pedido', 'criado', `Pedido ${orderId.slice(-6).toUpperCase()} enviado para cozinha`, { orderId, table: caixaTable });
    }
    
    // Se for Balcão, mostrar "Venda Concluída", senão "Pedido Enviado"
    setSuccessType(isBalcao ? 'venda' : 'cozinha');
    setShowSuccessSale(true);
    setTimeout(() => setShowSuccessSale(false), 2000);
    setCaixaCart([]);
    setShowPaymentModal(false);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.cpf || !newCustomer.phone) {
      alert('Preencha todos os campos!');
      return;
    }

    const customer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCustomer.name,
      cpf: newCustomer.cpf.replace(/\D/g, ''),
      phone: newCustomer.phone.replace(/\D/g, ''),
      totalSpent: 0,
      ordersCount: 0,
      lastVisit: Date.now(),
      type: newCustomer.type || 'normal'
    };

    if (onUpdateCustomers) {
      const existingCustomers = customers;
      // Normalizar CPF para comparação
      const normalizeCpf = (cpf: string) => cpf.replace(/\D/g, '');
      const customerCpfNormalized = normalizeCpf(customer.cpf);
      const exists = existingCustomers.find(c => {
        const existingCpfNormalized = normalizeCpf(c.cpf);
        return existingCpfNormalized === customerCpfNormalized;
      });
      if (exists) {
        alert('Cliente já cadastrado! Use o CPF: ' + exists.cpf);
        return;
      }
      
      // Garantir que o CPF do novo cliente está sem formatação
      const newCustomerWithNormalizedCpf = {
        ...customer,
        cpf: customerCpfNormalized
      };
      
      onUpdateCustomers([...existingCustomers, newCustomerWithNormalizedCpf]);
      addLog('cliente', 'cadastro', `Cliente ${customer.name} cadastrado`, { customerId: customer.id });
      setIsAddingCustomer(false);
      setNewCustomer({ name: '', cpf: '', phone: '', totalSpent: 0, ordersCount: 0, lastVisit: Date.now(), type: 'normal' });
    }
  };

  const updateCustomerType = (customer: Customer, newType: 'normal' | 'fixed' | 'vip') => {
    try {
      if (onUpdateCustomers) {
        const updated = customers.map(c => 
          c.id === customer.id ? { ...c, type: newType } : c
        );
        onUpdateCustomers(updated);
        const typeLabel = newType === 'vip' ? 'VIP' : newType === 'fixed' ? 'Fixo' : 'Normal';
        addLog('cliente', 'atualizado', `${customer.name} alterado para ${typeLabel}`, { customerId: customer.id, type: newType });
      }
    } catch (error) {
      console.error('Erro ao atualizar tipo do cliente:', error);
      alert('Erro ao atualizar tipo do cliente. Por favor, tente novamente.');
    }
  };

  const notifyReservation = (reservation: Reservation) => {
    try {
      const message = createReservationMessage(reservation.name, reservation.date, reservation.time, reservation.people);
      sendWhatsAppMessage(reservation.phone, message);
      
      const updated = reservations.map(r => 
        r.id === reservation.id ? { ...r, notified: true } : r
      );
      onUpdateReservations(updated);
      addLog('reserva', 'notificacao', `Notificação WhatsApp enviada para ${reservation.name}`, { reservationId: reservation.id });
    } catch (error) {
      console.error('Erro ao notificar reserva:', error);
      alert('Erro ao enviar notificação via WhatsApp. Por favor, tente novamente.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
      {/* Header Simplificado */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
              Painel Admin
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <div className="h-8 w-8 rounded-lg bg-[#FF4500] flex items-center justify-center">
                <span className="text-white font-black text-xs">RF</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">{currentAdmin.name}</p>
                {currentAdmin.role === 'master' && (
                  <span className="text-[10px] px-2 py-0.5 bg-[#FF4500]/20 text-[#FF4500] rounded font-black uppercase">CEO</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs Simplificadas */}
        <div className="flex flex-wrap gap-2">
          {Array.isArray(availableTabs) && availableTabs.map((tab) => {
            const tabLabels: Record<TabType, string> = {
              'caixa': 'Caixa',
              'pedidos': 'Pedidos',
              'reservas': 'Reservas',
              'estoque': 'Estoque',
              'clientes': 'Clientes',
              'financeiro': 'Financeiro',
              'admins': 'Admins'
            };
            return (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-4 py-2 rounded-lg transition-all font-bold text-sm whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-[#FF4500] text-white shadow-lg shadow-[#FF4500]/30' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ABA CAIXA */}
      {activeTab === 'caixa' && hasPermission('caixa') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="lg:col-span-8 space-y-6">
              {/* Feedback de produto adicionado via scanner */}
              {lastScannedProduct && (
                <div className="p-3 sm:p-4 bg-green-500/20 border border-green-500/50 rounded-xl sm:rounded-2xl animate-in zoom-in-95 duration-200 flex items-center gap-2 sm:gap-3 shadow-lg shadow-green-500/20">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-green-400 font-black text-xs sm:text-sm truncate">{lastScannedProduct.name}</p>
                    <p className="text-green-300 text-[9px] sm:text-[10px] font-bold mt-0.5 font-mono">Código: {lastScannedProduct.barcode}</p>
                  </div>
                  <button
                    onClick={() => setLastScannedProduct(null)}
                    className="text-green-400/70 hover:text-green-400 text-xl font-black transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input 
                  placeholder="Buscar produto ou código de barras..." 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 outline-none focus:border-[#FF4500] text-white font-bold text-sm sm:text-base backdrop-blur-sm" 
                  value={caixaSearch} 
                  onChange={e => setCaixaSearch(e.target.value)}
                  onKeyDown={e => {
                    // Se pressionar Enter e o texto for um código de barras, buscar e adicionar produto
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmedValue = String(caixaSearch).trim();
                      if (trimmedValue.length >= 8) {
                        // Buscar produto por código de barras normalizado
                        const product = products.find(p => p.barcode && String(p.barcode).trim() === trimmedValue);
                        if (product && product.stock > 0) {
                          const existingItem = caixaCart.find(item => item.product.id === product.id);
                          const currentProduct = products.find(p => p.id === product.id);
                          const availableStock = currentProduct ? currentProduct.stock : product.stock;
                          
                          if (existingItem) {
                            if (existingItem.quantity < availableStock) {
                              setCaixaCart(prev => prev.map(item =>
                                item.product.id === product.id
                                  ? { ...item, quantity: item.quantity + 1 }
                                  : item
                              ));
                              setLastScannedProduct({ name: `${product.name} (Qtd: ${existingItem.quantity + 1})`, barcode: trimmedValue });
                              setTimeout(() => setLastScannedProduct(null), 2000);
                              addLog('caixa', 'barcode_scan', `Produto adicionado via código de barras: ${product.name}`, { barcode: trimmedValue, productId: product.id });
                            } else {
                              alert(`Estoque insuficiente de ${product.name}! Disponível: ${availableStock}`);
                            }
                          } else {
                            setCaixaCart(prev => [...prev, { product, quantity: 1 }]);
                            setLastScannedProduct({ name: product.name, barcode: trimmedValue });
                            setTimeout(() => setLastScannedProduct(null), 2000);
                            addLog('caixa', 'barcode_scan', `Produto adicionado via código de barras: ${product.name}`, { barcode: trimmedValue, productId: product.id });
                          }
                          setCaixaSearch('');
                        } else if (product && product.stock <= 0) {
                          alert(`Produto ${product.name} está fora de estoque!`);
                          setCaixaSearch('');
                        } else if (trimmedValue.length >= 8) {
                          // Produto não encontrado - oferecer cadastro rápido
                          const shouldAddNew = window.confirm(`Produto com código de barras ${trimmedValue} não encontrado!\n\nDeseja cadastrar este produto agora?`);
                          if (shouldAddNew) {
                            setIsAddingNew(true);
                            setNewProduct({ 
                              name: '', 
                              category: 'Outros', 
                              buyPrice: 0, 
                              sellPrice: 0, 
                              stock: 0, 
                              imageUrl: '', 
                              barcode: trimmedValue 
                            });
                            setCaixaSearch('');
                            setBarcodeScannerMode('cadastro');
                            addLog('estoque', 'barcode_scan', `Código de barras ${trimmedValue} não encontrado - abrindo cadastro`, { barcode: trimmedValue });
                          } else {
                            setCaixaSearch('');
                          }
                        }
                      }
                    }
                  }} 
                />
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeScannerMode('caixa');
                    setShowBarcodeScanner(true);
                  }}
                  className="px-4 sm:px-6 py-3 bg-blue-500/20 border border-blue-500/50 text-blue-400 font-black rounded-xl hover:bg-blue-500/30 transition-all uppercase tracking-widest text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap"
                  title="Escanear código de barras (modo contínuo - escaneie vários produtos)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span className="hidden sm:inline">Escanear</span>
                  <span className="sm:hidden">📷</span>
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 max-h-[500px] sm:max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {products.filter(p => {
                  const searchLower = String(caixaSearch).toLowerCase().trim();
                  if (!searchLower) return true;
                  const nameMatch = String(p.name).toLowerCase().includes(searchLower);
                  const barcodeMatch = p.barcode && String(p.barcode).toLowerCase().includes(searchLower);
                  return nameMatch || barcodeMatch;
                }).map(p => (
                  <button 
                    key={p.id} 
                    disabled={p.stock <= 0} 
                    onClick={() => setCaixaCart(prev => {
                      const exist = prev.find(i => i.product.id === p.id);
                      if(exist) {
                        // Verificar se pode adicionar mais (não ultrapassar estoque)
                        const currentQuantity = exist.quantity;
                        const availableStock = p.stock;
                        if (currentQuantity < availableStock) {
                          return prev.map(i => i.product.id === p.id ? {...i, quantity: i.quantity + 1} : i);
                        }
                        return prev; // Não adiciona se já atingiu o limite
                      }
                      // Adicionar novo produto apenas se houver estoque
                      if (p.stock > 0) {
                        return [...prev, {product: p, quantity: 1}];
                      }
                      return prev;
                    })} 
                    className="relative overflow-hidden bg-white/5 border border-white/10 rounded-xl p-3 hover:border-[#FF4500] transition-all flex flex-col group disabled:opacity-30 disabled:cursor-not-allowed text-left backdrop-blur-sm"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-white/5">
                      <img 
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800'} 
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        onError={(e) => {
                          try {
                            const target = e?.target;
                            if (target && target instanceof HTMLImageElement) {
                              const fallbackUrl = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800';
                              if (target.src !== fallbackUrl) {
                                target.src = fallbackUrl;
                              }
                            }
                          } catch (error) {
                            // Silenciosamente ignorar erros no handler de erro de imagem
                            console.warn('Erro ao tratar falha de carregamento de imagem:', error);
                          }
                        }}
                        loading="lazy"
                      />
                    </div>
                    <h4 className="font-bold text-xs text-white truncate w-full mb-1">{p.name}</h4>
                    <p className="text-[#FF4500] font-black font-mono text-sm">R$ {Number(p.sellPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-1">Estoque: {p.stock}</p>
                  </button>
                ))}
              </div>
           </div>
           <div className="lg:col-span-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-4 sm:p-6 flex flex-col h-full min-h-[500px] sm:min-h-[600px] shadow-xl">
                 <h3 className="text-lg font-black mb-6 text-white text-center">Caixa PDV</h3>
                 <div className="flex-grow space-y-3 overflow-y-auto custom-scrollbar mb-6 pr-2">
                    {caixaCart.map(item => (
                      <div key={item.product.id} className="bg-white/5 p-3 rounded-xl border border-white/10 hover:border-[#FF4500]/30 transition-all backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 pr-4">
                            <p className="font-black text-[11px] text-white uppercase mb-1">{item.product.name}</p>
                            <p className="text-[10px] text-[#FF4500] font-black font-mono">R$ {Number(item.product.sellPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / un</p>
                          </div>
                          <button 
                            onClick={() => setCaixaCart(prev => prev.filter(i => i.product.id !== item.product.id))} 
                            className="text-gray-500 hover:text-red-500 font-black text-xl hover:scale-110 transition-all p-1"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-black/30 rounded-lg p-2 border border-white/10">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                setCaixaCart(prev => prev.map(i => 
                                  i.product.id === item.product.id 
                                    ? { ...i, quantity: i.quantity - 1 }
                                    : i
                                ));
                              }
                            }}
                            disabled={item.quantity <= 1}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-base flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            −
                          </button>
                          <div className="flex-1 text-center">
                            <p className="text-base font-black text-white font-mono">{item.quantity}</p>
                            <p className="text-xs font-bold text-[#FF4500]">R$ {Number((item.product.sellPrice || 0) * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            {(() => {
                              const currentProduct = products.find(prod => prod.id === item.product.id);
                              const availableStock = currentProduct ? currentProduct.stock : item.product.stock;
                              const remainingStock = availableStock - item.quantity;
                              if (remainingStock <= 3 && remainingStock >= 0) {
                                return (
                                  <p className="text-[9px] font-bold text-yellow-400 mt-1">
                                    Estoque: {remainingStock}
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          {(() => {
                            // Buscar o produto atualizado da lista de produtos para ter o estoque correto
                            const currentProduct = products.find(prod => prod.id === item.product.id);
                            const availableStock = currentProduct ? currentProduct.stock : item.product.stock;
                            const isDisabled = availableStock <= item.quantity;
                            
                            return (
                              <button
                                onClick={() => {
                                  if (availableStock > item.quantity) {
                                    setCaixaCart(prev => prev.map(i => 
                                      i.product.id === item.product.id 
                                        ? { ...i, quantity: i.quantity + 1 }
                                        : i
                                    ));
                                  }
                                }}
                                disabled={isDisabled}
                                className="w-7 h-7 rounded-lg bg-[#FF4500] hover:bg-[#FF5500] text-white font-bold text-base flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              >
                                +
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                 </div>
                 <div className="pt-6 border-t border-white/10 space-y-4 mt-auto">
                    <div className="flex justify-between items-center px-2 py-3 rounded-xl bg-white/5">
                       <span className="text-sm font-bold text-gray-400">Total</span>
                       <span className="text-2xl font-black text-[#FF4500] font-mono">R$ {Number(caixaTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="space-y-3">
                      <select
                        value={caixaTable}
                        onChange={(e) => setCaixaTable(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#FF4500] text-white font-bold text-sm"
                      >
                        {TABLES.map(table => (
                          <option key={table} value={table} className="bg-black text-white">{table}</option>
                        ))}
                      </select>
                      <button 
                        disabled={caixaCart.length === 0} 
                        onClick={handleSendToKitchen}
                        className="w-full py-3 bg-green-500/90 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Enviar para Cozinha
                      </button>
                      <button 
                        disabled={caixaCart.length === 0} 
                        onClick={handleFinishSale}
                        className="w-full py-3 bg-[#FF4500] hover:bg-[#FF5500] text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Finalizar Compra
                      </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ABA ESTOQUE (PRODUTOS + NOVOS) */}
      {activeTab === 'estoque' && hasPermission('estoque') && (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black uppercase tracking-widest">Controle de <span className="text-[#FF4500]">Insumos</span></h3>
            <button onClick={() => setIsAddingNew(true)} className="px-8 py-4 bg-[#FF4500] text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
              + Novo Insumo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(p => {
              const profitVal = p.sellPrice - p.buyPrice;
              const profitPerc = p.buyPrice > 0 ? (profitVal / p.buyPrice) * 100 : 0;
              return (
                <div key={p.id} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 hover:border-[#FF4500]/30 transition-all group">
                  <button onClick={() => setEditingProduct(p)} className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-[#FF4500] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <div className="h-24 rounded-lg overflow-hidden mb-3 bg-white/5">
                    <img 
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800'} 
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800';
                      }}
                      loading="lazy"
                    />
                  </div>
                  <h4 className="font-bold text-sm text-white truncate mb-2">{p.name}</h4>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-sm font-black font-mono ${p.stock < 10 ? 'text-red-400' : 'text-green-400'}`}>{p.stock} un</span>
                    <div className="text-right">
                       <p className="text-[#FF4500] text-xs font-bold">Lucro: {profitPerc.toFixed(0)}%</p>
                       <p className="text-[10px] text-gray-400 font-bold">R$ {profitVal.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 border-t border-white/10 pt-3">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400"><span>Custo</span><span>R$ {Number(p.buyPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-[10px] font-bold text-white"><span>Venda</span><span className="text-[#FF4500]">R$ {Number(p.sellPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA PEDIDOS */}
      {activeTab === 'pedidos' && hasPermission('pedidos') && (
        <OrderManagement
          orders={orders}
          onUpdateOrder={(order) => {
            onUpdateOrders(order);
            addLog('pedido', 'atualizado', `Pedido ${order.id.slice(-6).toUpperCase()} atualizado`, { orderId: order.id, status: order.status });
          }}
          onDeleteOrder={(id) => {
            try {
              if (window.confirm('Deseja excluir este pedido permanentemente?')) {
                onDeleteOrder(id);
                addLog('pedido', 'deletado', `Pedido ${id.slice(-6).toUpperCase()} excluído`, { orderId: id });
              }
            } catch (error) {
              console.error('Erro ao excluir pedido:', error);
              alert('Erro ao excluir pedido. Por favor, tente novamente.');
            }
          }}
        />
      )}

      {/* ABA RESERVAS */}
      {activeTab === 'reservas' && hasPermission('reservas') && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center">
            <h3 className="text-xl sm:text-2xl font-black text-white">Reservas</h3>
          </div>
          <div className="space-y-3">
            {reservations.length === 0 ? (
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
                <p className="text-gray-400 text-base font-bold">Nenhuma reserva encontrada</p>
              </div>
            ) : (
              reservations
                .sort((a, b) => b.createdAt - a.createdAt)
                .map(reservation => {
                  // Calcular gasto total da mesa baseado nos pedidos (sincronizado em tempo real)
                  const tableOrders = orders.filter(o => 
                    o && o.tableNumber === reservation.tableNumber && 
                    (o.status === 'concluido' || o.paymentStatus === 'pago' || o.status === 'pendente' || o.status === 'cozinha' || o.status === 'em_preparo')
                  );
                  const tableGasto = tableOrders.reduce((sum, order) => {
                    const orderTotal = Number(order?.total) || 0;
                    return (!isNaN(orderTotal) && isFinite(orderTotal)) ? sum + orderTotal : sum;
                  }, 0);
                  // Usar o totalGasto da reserva se existir, senão calcular pelos pedidos
                  const totalGasto = reservation.totalGasto !== undefined ? reservation.totalGasto : tableGasto;
                  
                  // Atualizar totalGasto da reserva se houver diferença (sincronização)
                  if (reservation.tableNumber && reservation.status !== 'concluido' && Math.abs((reservation.totalGasto || 0) - tableGasto) > 0.01) {
                    const updatedReservations = reservations.map(r => 
                      r.id === reservation.id 
                        ? { ...r, totalGasto: tableGasto }
                        : r
                    );
                    onUpdateReservations(updatedReservations);
                  }

                  return (
                    <div key={reservation.id} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-[#FF4500]/50 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-black text-white">{reservation.name}</h4>
                            {reservation.tableNumber && (
                              <span className="px-3 py-1 bg-[#FF4500]/20 border border-[#FF4500]/50 text-[#FF4500] font-black rounded-lg text-xs uppercase">
                                Mesa {reservation.tableNumber}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-300 font-bold">
                              📅 {new Date(reservation.date).toLocaleDateString('pt-BR')} às {reservation.time}
                            </p>
                            <p className="text-sm text-gray-300 font-bold">
                              👥 {reservation.people} pessoa{reservation.people > 1 ? 's' : ''}
                            </p>
                            {reservation.phone && (
                              <p className="text-sm text-gray-300 font-bold">
                                📱 {reservation.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                              </p>
                            )}
                            {totalGasto > 0 && (
                              <p className="text-sm font-black text-[#FF4500] mt-2">
                                💰 Total Gasto: R$ {totalGasto.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                            reservation.status === 'presente' ? 'bg-green-500/20 border border-green-500/50 text-green-400' :
                            reservation.status === 'concluido' ? 'bg-gray-500/20 border border-gray-500/50 text-gray-400' :
                            'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                          }`}>
                            {reservation.status === 'presente' ? 'Presente' : reservation.status === 'concluido' ? 'Concluído' : 'Pendente'}
                          </span>
                          {hasPermission('reservas') && (
                            <button
                              onClick={() => {
                                try {
                                  if (window.confirm('Deseja excluir esta reserva?')) {
                                    onDeleteReservation(reservation.id);
                                    addLog('reserva', 'deletada', `Reserva de ${reservation.name} excluída`, { reservationId: reservation.id });
                                  }
                                } catch (error) {
                                  console.error('Erro ao excluir reserva:', error);
                                  alert('Erro ao excluir reserva. Por favor, tente novamente.');
                                }
                              }}
                              className="text-red-400 hover:text-red-300 text-sm font-bold"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-white/10 items-center flex-wrap">
                        {!reservation.notified && hasPermission('reservas') && (
                          <button
                            onClick={() => notifyReservation(reservation)}
                            className="px-4 py-2 bg-green-500/90 hover:bg-green-500 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-all"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.672 1.433 5.66 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            Notificar
                          </button>
                        )}
                        {reservation.notified && (
                          <span className="px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 font-bold rounded-lg text-sm">
                            ✓ Notificado
                          </span>
                        )}
                        {hasPermission('reservas') && reservation.tableNumber && (reservation.status === 'presente' || reservation.status === 'pendente') && (
                          <button
                            onClick={() => {
                              try {
                                if (window.confirm(`Deseja liberar a mesa ${reservation.tableNumber}? Esta ação marcará a reserva como concluída.`)) {
                                  // Calcular gasto total final antes de liberar
                                  const finalOrders = orders.filter(o => 
                                    o && o.tableNumber === reservation.tableNumber && 
                                    (o.status === 'concluido' || o.paymentStatus === 'pago' || o.status === 'pendente' || o.status === 'cozinha' || o.status === 'em_preparo')
                                  );
                                  const finalGasto = finalOrders.reduce((sum, order) => {
                                    const orderTotal = Number(order?.total) || 0;
                                    return (!isNaN(orderTotal) && isFinite(orderTotal)) ? sum + orderTotal : sum;
                                  }, 0);

                                  const updated = reservations.map(r => 
                                    r.id === reservation.id 
                                      ? { ...r, status: 'concluido' as const, totalGasto: finalGasto }
                                      : r
                                  );
                                  onUpdateReservations(updated);
                                  addLog('reserva', 'liberada', `Mesa ${reservation.tableNumber} liberada - Total: R$ ${finalGasto.toFixed(2)}`, { reservationId: reservation.id, tableNumber: reservation.tableNumber, totalGasto: finalGasto });
                                  
                                  // Disparar evento para notificar cliente quando a mesa for liberada
                                  if (typeof window !== 'undefined' && reservation.tableNumber) {
                                    const eventData = {
                                      tableNumber: reservation.tableNumber,
                                      reservationName: reservation.name,
                                      totalGasto: finalGasto,
                                      timestamp: Date.now()
                                    };
                                    
                                    // Disparar evento customizado para a mesma aba
                                    window.dispatchEvent(new CustomEvent('tableReleased', { 
                                      detail: eventData
                                    }));
                                    
                                    // Salvar no localStorage para sincronizar entre abas
                                    try {
                                      localStorage.setItem('rf_table_released', JSON.stringify(eventData));
                                      // Remover após um tempo para não acumular
                                      setTimeout(() => {
                                        localStorage.removeItem('rf_table_released');
                                      }, 10000);
                                    } catch (error) {
                                      console.error('Erro ao salvar evento no localStorage:', error);
                                    }
                                  }
                                }
                              } catch (error) {
                                console.error('Erro ao liberar mesa:', error);
                                alert('Erro ao liberar mesa. Por favor, tente novamente.');
                              }
                            }}
                            className="px-4 py-2 bg-blue-500/90 hover:bg-blue-500 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Liberar Mesa
                          </button>
                        )}
                        {hasPermission('reservas') && (
                          <select
                            value={reservation.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as any;
                              const updated = reservations.map(r => 
                                r.id === reservation.id ? { ...r, status: newStatus } : r
                              );
                              onUpdateReservations(updated);
                              
                              // Se mudou para concluído, atualizar gasto total e disparar evento
                              if (newStatus === 'concluido' && reservation.tableNumber) {
                                const updatedReservation = updated.find(r => r.id === reservation.id);
                                // Usar totalGasto da reserva se existir, senão calcular
                                let finalGasto = reservation.totalGasto || updatedReservation?.totalGasto || 0;
                                
                                if (!finalGasto || finalGasto === 0) {
                                  // Calcular gasto total baseado nos pedidos da mesa
                                  const finalOrders = orders.filter(o => 
                                    o && o.tableNumber === reservation.tableNumber && 
                                    (o.status === 'concluido' || o.paymentStatus === 'pago' || o.status === 'pendente' || o.status === 'cozinha' || o.status === 'em_preparo')
                                  );
                                  finalGasto = finalOrders.reduce((sum, order) => {
                                    const orderTotal = Number(order?.total) || 0;
                                    return (!isNaN(orderTotal) && isFinite(orderTotal)) ? sum + orderTotal : sum;
                                  }, 0);
                                  
                                  // Atualizar reserva com o gasto calculado
                                  if (updatedReservation && finalGasto > 0) {
                                    updatedReservation.totalGasto = finalGasto;
                                    const updatedWithGasto = reservations.map(r => 
                                      r.id === reservation.id ? updatedReservation : r
                                    );
                                    onUpdateReservations(updatedWithGasto);
                                  }
                                } else {
                                  // Garantir que o gasto está salvo na reserva
                                  if (updatedReservation && updatedReservation.totalGasto !== finalGasto) {
                                    updatedReservation.totalGasto = finalGasto;
                                    const updatedWithGasto = reservations.map(r => 
                                      r.id === reservation.id ? updatedReservation : r
                                    );
                                    onUpdateReservations(updatedWithGasto);
                                  }
                                }
                                
                                // Disparar evento para notificar cliente quando a mesa for liberada
                                if (typeof window !== 'undefined' && reservation.tableNumber && finalGasto >= 0) {
                                  const eventData = {
                                    tableNumber: reservation.tableNumber,
                                    reservationName: reservation.name,
                                    totalGasto: finalGasto,
                                    timestamp: Date.now()
                                  };
                                  
                                  // Disparar evento customizado para a mesma aba
                                  window.dispatchEvent(new CustomEvent('tableReleased', { 
                                    detail: eventData
                                  }));
                                  
                                  // Salvar no localStorage para sincronizar entre abas
                                  try {
                                    localStorage.setItem('rf_table_released', JSON.stringify(eventData));
                                    // Remover após um tempo para não acumular
                                    setTimeout(() => {
                                      localStorage.removeItem('rf_table_released');
                                    }, 10000);
                                  } catch (error) {
                                    console.error('Erro ao salvar evento no localStorage:', error);
                                  }
                                }
                              }
                              
                              addLog('reserva', 'status', `Status da reserva de ${reservation.name} alterado para ${newStatus}`, { reservationId: reservation.id });
                            }}
                            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-black text-sm uppercase tracking-widest"
                          >
                            <option value="pendente" className="bg-black">Pendente</option>
                            <option value="presente" className="bg-black">Presente</option>
                            <option value="concluido" className="bg-black">Concluído (Liberar Mesa)</option>
                            <option value="cancelado" className="bg-black">Cancelado</option>
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ABA CLIENTES (CRM + WHATSAPP) */}
      {activeTab === 'clientes' && hasPermission('clientes') && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-xl sm:text-2xl font-black text-white">Clientes</h3>
              <div className="flex gap-3 w-full md:w-auto">
                <input 
                  placeholder="Buscar cliente..." 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-[#FF4500] text-white font-bold backdrop-blur-sm" 
                  value={customerSearch} 
                  onChange={e => setCustomerSearch(e.target.value)} 
                />
                <button 
                  onClick={() => setIsAddingCustomer(true)} 
                  className="px-5 py-2.5 bg-[#FF4500] text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all whitespace-nowrap text-sm"
                >
                  + Novo
                </button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.cpf.includes(customerSearch)).map(customer => (
                <div key={customer.id} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-[#FF4500]/30 transition-all flex flex-col">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FF4500] rounded-lg flex items-center justify-center text-black font-black text-lg">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-white">{customer.name}</h4>
                          <p className="text-[10px] text-gray-400 font-bold">CPF: {customer.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        customer.type === 'vip' ? 'bg-[#FF4500] text-white' :
                        customer.type === 'fixed' ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400' :
                        'bg-white/10 text-gray-400'
                      }`}>
                        {customer.type === 'vip' ? 'VIP' : customer.type === 'fixed' ? 'Fixo' : 'Normal'}
                      </span>
                   </div>

                   <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                        <p className="text-[10px] text-gray-400 font-bold mb-1">Gasto Total</p>
                        <p className="font-mono font-black text-[#FF4500] text-sm">R$ {Number(customer.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                        <p className="text-[10px] text-gray-400 font-bold mb-1">Visitas</p>
                        <p className="font-mono font-black text-white text-sm">{customer.ordersCount}</p>
                      </div>
                   </div>

                   <div className="mt-auto space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
                        {new Date(customer.lastVisit).toLocaleDateString()}
                      </div>
                      {customer.phone && (
                        <p className="text-xs text-gray-300 font-bold">
                          📱 {customer.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                        </p>
                      )}
                      <div className="flex gap-2 flex-col">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => sendWhatsApp(customer)} 
                            className="flex-1 py-2.5 bg-green-500/90 hover:bg-green-500 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-all"
                          >
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.672 1.433 5.66 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            WhatsApp
                          </button>
                        </div>
                        
                        {/* Botão de Configurações com Menu Dropdown */}
                        <div className="relative customer-settings-menu">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenCustomerSettings(openCustomerSettings === customer.id ? null : customer.id);
                            }}
                            className="w-full py-2.5 bg-gray-500/20 border border-gray-500/40 text-gray-300 font-bold rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-500/30 transition-all relative"
                            title="Configurações do cliente"
                          >
                            <svg 
                              className={`w-4 h-4 transition-transform duration-200 ${openCustomerSettings === customer.id ? 'rotate-90' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Configurações
                          </button>
                          
                          {/* Menu Dropdown */}
                          {openCustomerSettings === customer.id && (
                            <div 
                              className="absolute z-10 bottom-full left-0 right-0 mb-2 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="p-2 space-y-1">
                                <div className="px-3 py-2 text-[10px] text-gray-400 font-bold uppercase border-b border-white/10">
                                  Tipo de Cliente:
                                </div>
                                <button
                                  onClick={() => {
                                    updateCustomerType(customer, 'normal');
                                    setOpenCustomerSettings(null);
                                  }}
                                  className={`w-full px-3 py-2 text-xs font-bold rounded-lg transition-all border text-left flex items-center justify-between ${
                                    customer.type === 'normal'
                                      ? 'bg-white/20 border-white/40 text-white'
                                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                  }`}
                                >
                                  <span>Normal</span>
                                  {customer.type === 'normal' && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    updateCustomerType(customer, 'fixed');
                                    setOpenCustomerSettings(null);
                                  }}
                                  className={`w-full px-3 py-2 text-xs font-bold rounded-lg transition-all border text-left flex items-center justify-between ${
                                    customer.type === 'fixed'
                                      ? 'bg-purple-500/30 border-purple-500/50 text-purple-400'
                                      : 'bg-purple-500/10 border-purple-500/20 text-purple-400/60 hover:bg-purple-500/20'
                                  }`}
                                >
                                  <span>Fixo</span>
                                  {customer.type === 'fixed' && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    updateCustomerType(customer, 'vip');
                                    setOpenCustomerSettings(null);
                                  }}
                                  className={`w-full px-3 py-2 text-xs font-bold rounded-lg transition-all border text-left flex items-center justify-between ${
                                    customer.type === 'vip'
                                      ? 'bg-[#FF4500] border-[#FF4500] text-white'
                                      : 'bg-[#FF4500]/20 border-[#FF4500]/40 text-[#FF4500] hover:bg-[#FF4500]/30'
                                  }`}
                                >
                                  <span>VIP</span>
                                  {customer.type === 'vip' && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            try {
                              if (confirm(`Tem certeza que deseja excluir o cliente ${customer.name}? Esta ação não pode ser desfeita.`)) {
                                storage.deleteCustomer(customer.id);
                                if (onUpdateCustomers) {
                                  const updated = customers.filter(c => c.id !== customer.id);
                                  onUpdateCustomers(updated);
                                }
                                addLog('cliente', 'excluido', `Cliente ${customer.name} (CPF: ${customer.cpf}) excluído`, { customerId: customer.id });
                              }
                            } catch (error) {
                              console.error('Erro ao excluir cliente:', error);
                              alert('Erro ao excluir cliente. Por favor, tente novamente.');
                            }
                          }}
                          className="w-full py-2.5 bg-red-500/20 border border-red-500/40 text-red-400 font-bold rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-red-500/30 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Excluir
                        </button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* ABA FINANCEIRO */}
      {activeTab === 'financeiro' && hasPermission('financeiro') && (
        <FinancialDashboard 
          transactions={transactions}
          orders={orders}
          products={products}
          logs={logs}
          customers={customers}
        />
      )}

      {/* ABA ADMINS */}
      {activeTab === 'admins' && hasPermission('admins') && (
        <AdminManagement 
          currentAdmin={currentAdmin}
          onUpdate={() => {
            if (onRefresh) onRefresh();
          }}
          logs={logs}
        />
      )}

      {/* Mensagem de Acesso Negado */}
      {activeTab && !hasPermission(activeTab) && (
        <div className="relative overflow-hidden rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-12 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h3 className="text-xl font-black text-red-400 mb-2">Acesso Negado</h3>
          <p className="text-gray-300">Você não tem permissão para acessar esta área.</p>
        </div>
      )}

      {/* MODAL NOVO PRODUTO */}
      {isAddingNew && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
           <form onSubmit={handleAddNewProduct} className="glass w-full max-w-2xl p-10 rounded-[3rem] border border-[#FF4500]/30 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Novo <span className="text-[#FF4500]">Insumo</span></h3>
                <button type="button" onClick={() => setIsAddingNew(false)} className="text-gray-500 hover:text-white text-3xl font-black">×</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Nome do Produto</label>
                    <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] font-bold" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Categoria</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] font-bold appearance-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}>
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-black text-white">{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2">URL da Imagem</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] font-mono text-xs" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2 mb-2 block">Código de Barras</label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] font-mono font-black tracking-widest text-lg" 
                        value={newProduct.barcode || ''} 
                        onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} 
                        placeholder="Digite ou escaneie o código de barras"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBarcodeScannerMode('cadastro');
                          setShowBarcodeScanner(true);
                        }}
                        className="px-6 py-4 bg-blue-500/20 border border-blue-500/50 text-blue-400 font-black rounded-2xl hover:bg-blue-500/30 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Escanear
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Estoque Inicial</label>
                    <input type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] font-mono text-center font-black" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} />
                  </div>
                  <div className="bg-[#FF4500]/5 border border-[#FF4500]/10 rounded-2xl p-4 flex flex-col justify-center text-center">
                    <p className="text-[8px] font-black uppercase text-[#FF4500]">Lucro Projetado (%)</p>
                    <p className="text-xl font-black font-mono">
                      {newProduct.buyPrice && newProduct.sellPrice ? (((Number(newProduct.sellPrice) - Number(newProduct.buyPrice)) / Number(newProduct.buyPrice)) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Preço de Custo (R$)</label>
                    <input type="number" step="0.01" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-red-500 font-mono text-center font-black" value={newProduct.buyPrice} onChange={e => setNewProduct({...newProduct, buyPrice: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Preço de Venda (R$)</label>
                    <input type="number" step="0.01" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-green-500 font-mono text-center font-black" value={newProduct.sellPrice} onChange={e => setNewProduct({...newProduct, sellPrice: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="submit" className="flex-grow py-5 bg-[#FF4500] text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-sm hover:scale-[1.02] transition-all">Cadastrar Produto</button>
                <button type="button" onClick={() => setIsAddingNew(false)} className="px-10 py-5 bg-white/5 text-gray-400 font-black rounded-2xl uppercase tracking-widest text-sm">Cancelar</button>
              </div>
           </form>
        </div>
      )}

      {/* MODAL EDITAR PRODUTO */}
      {editingProduct && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
           <form onSubmit={handleUpdateProduct} className="glass w-full max-w-2xl p-10 rounded-[3rem] border border-[#FF4500]/30 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Editar <span className="text-[#FF4500]">Insumo</span></h3>
                <button type="button" onClick={() => setEditingProduct(null)} className="text-gray-500 hover:text-white text-3xl font-black">×</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                  <div><label className="text-[10px] font-black uppercase text-gray-500 ml-2">Nome</label><input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] font-bold text-white" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} /></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-500 ml-2">Estoque</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] font-mono text-center font-black text-white" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black uppercase text-gray-500 ml-2">Custo (R$)</label><input type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-red-500 font-mono text-center font-black text-white" value={editingProduct.buyPrice} onChange={e => setEditingProduct({...editingProduct, buyPrice: Number(e.target.value)})} /></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-500 ml-2">Venda (R$)</label><input type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-green-500 font-mono text-center font-black text-white" value={editingProduct.sellPrice} onChange={e => setEditingProduct({...editingProduct, sellPrice: Number(e.target.value)})} /></div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button type="submit" className="flex-1 py-5 bg-[#FF4500] text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-sm hover:scale-[1.02] transition-all">
                  Salvar Alterações
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteProduct}
                  className="px-6 sm:px-8 py-5 bg-red-500/20 border border-red-500/50 text-red-400 font-black rounded-2xl uppercase tracking-widest text-sm hover:bg-red-500/30 hover:border-red-500/70 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="hidden sm:inline">Excluir</span>
                </button>
              </div>
           </form>
        </div>
      )}

      {/* MODAL PAGAMENTO */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div className="glass w-full max-w-md p-8 rounded-[3rem] border border-[#FF4500]/30 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Forma de <span className="text-[#FF4500]">Pagamento</span></h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-white text-3xl font-black">×</button>
            </div>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center mb-4 p-4 bg-white/5 rounded-2xl">
                <span className="text-sm font-black text-gray-400 uppercase">Total</span>
                <span className="text-3xl font-black text-[#FF4500] font-mono">R$ {Number(caixaTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {['dinheiro', 'cartao', 'pix', 'transferencia'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method as any)}
                    className={`p-4 rounded-2xl border-2 transition-all font-black text-sm uppercase ${
                      paymentMethod === method
                        ? 'bg-[#FF4500] text-white border-[#FF4500]'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-[#FF4500]/50'
                    }`}
                  >
                    {method === 'dinheiro' ? '💵 Dinheiro' :
                     method === 'cartao' ? '💳 Cartão' :
                     method === 'pix' ? '📱 PIX' :
                     '🏦 Transferência'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleConfirmPayment}
                className="flex-1 py-4 bg-[#FF4500] text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-sm hover:scale-[1.02] transition-all"
              >
                Confirmar e Enviar
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-4 bg-white/5 text-gray-400 font-black rounded-2xl uppercase tracking-widest text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCANNER DE CÓDIGO DE BARRAS */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowBarcodeScanner(false)}
          title={barcodeScannerMode === 'cadastro' ? 'Escanear Código de Barras para Cadastro' : 'Escanear Código de Barras para Caixa - Modo Contínuo'}
          continuous={barcodeScannerMode === 'caixa'}
          showSuccessFeedback={barcodeScannerMode === 'caixa'}
        />
      )}

      {/* MODAL CADASTRO CLIENTE */}
      {isAddingCustomer && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <form onSubmit={handleAddCustomer} className="glass w-full max-w-2xl p-10 rounded-[3rem] border border-[#FF4500]/30 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Novo <span className="text-[#FF4500]">Cliente</span></h3>
              <button type="button" onClick={() => setIsAddingCustomer(false)} className="text-gray-500 hover:text-white text-3xl font-black">×</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Nome Completo</label>
                <input
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] font-bold text-white"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 ml-2">CPF</label>
                <input
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] font-bold text-white"
                  value={newCustomer.cpf}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '');
                    const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                    setNewCustomer({...newCustomer, cpf: formatted.length <= 14 ? formatted : newCustomer.cpf});
                  }}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Telefone / WhatsApp</label>
                <input
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] font-bold text-white"
                  value={newCustomer.phone}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '');
                    const formatted = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                    setNewCustomer({...newCustomer, phone: formatted.length <= 15 ? formatted : newCustomer.phone});
                  }}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Tipo</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#FF4500] font-bold text-white"
                  value={newCustomer.type}
                  onChange={e => setNewCustomer({...newCustomer, type: e.target.value as any})}
                >
                  <option value="normal" className="bg-black">Normal</option>
                  <option value="fixed" className="bg-black">Fixo</option>
                  <option value="vip" className="bg-black">VIP</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="flex-grow py-5 bg-[#FF4500] text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-sm hover:scale-[1.02] transition-all">
                Cadastrar Cliente
              </button>
              <button type="button" onClick={() => setIsAddingCustomer(false)} className="px-10 py-5 bg-white/5 text-gray-400 font-black rounded-2xl uppercase tracking-widest text-sm">
                Cancelar
              </button>
            </div>
           </form>
        </div>
      )}

      {/* SUCESSO ANIMADO */}
      {showSuccessSale && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="glass p-12 rounded-[4rem] border border-green-500/50 text-center animate-in zoom-in-95 duration-300">
             <div className="w-24 h-24 bg-green-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/40">
                <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M5 13l4 4L19 7"></path></svg>
             </div>
             <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">
                {successType === 'venda' ? 'Venda Concluída' : successType === 'cozinha' ? 'Pedido Enviado' : 'Insumo Cadastrado'}
             </h2>
             <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest mt-2">Sincronização Master Ativa</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
