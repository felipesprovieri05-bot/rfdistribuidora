'use client';

import React, { useState } from 'react';
import { Order, OrderItem } from '../types';

interface OrderManagementProps {
  orders: Order[];
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  userName?: string;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ 
  orders, 
  onUpdateOrder, 
  onDeleteOrder,
  userName = 'Garçom'
}) => {
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'cozinha' | 'pronto' | 'entregue'>('todos');

  const filteredOrders = orders.filter(order => {
    if (filter === 'todos') return true;
    if (filter === 'pendente') return order.status === 'pendente' || order.status === 'cozinha';
    if (filter === 'cozinha') return order.status === 'cozinha' || order.status === 'em_preparo';
    if (filter === 'pronto') return order.status === 'pronto';
    if (filter === 'entregue') return order.status === 'entregue';
    return true;
  });

  const toggleItemDelivery = (order: Order, itemIndex: number) => {
    const updatedItems = order.items.map((item, idx) => {
      if (idx === itemIndex) {
        return {
          ...item,
          delivered: !item.delivered,
          deliveredAt: !item.delivered ? Date.now() : undefined,
          deliveredBy: !item.delivered ? userName : undefined
        };
      }
      return item;
    });

    const allDelivered = updatedItems.every(item => item.delivered);
    const newStatus = allDelivered ? 'entregue' : order.status;

    onUpdateOrder({
      ...order,
      items: updatedItems,
      status: newStatus as any
    });
  };

  const markOrderAsDelivered = (order: Order) => {
    const updatedItems = order.items.map(item => ({
      ...item,
      delivered: true,
      deliveredAt: Date.now(),
      deliveredBy: userName
    }));

    onUpdateOrder({
      ...order,
      items: updatedItems,
      status: 'entregue'
    });
  };

  const markOrderAsCompleted = (order: Order) => {
    onUpdateOrder({
      ...order,
      status: 'concluido',
      completedAt: Date.now()
    });
  };

  const markOrderAsPaid = (order: Order, paymentMethod: 'dinheiro' | 'cartao' | 'pix' | 'transferencia' = 'dinheiro') => {
    onUpdateOrder({
      ...order,
      paymentStatus: 'pago',
      paymentMethod: paymentMethod
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-500/20 border-yellow-500 text-yellow-500';
      case 'cozinha': return 'bg-orange-500/20 border-orange-500 text-orange-500';
      case 'em_preparo': return 'bg-blue-500/20 border-blue-500 text-blue-500';
      case 'pronto': return 'bg-green-500/20 border-green-500 text-green-500';
      case 'entregue': return 'bg-gray-500/20 border-gray-500 text-gray-400';
      case 'concluido': return 'bg-green-600/20 border-green-600 text-green-400';
      default: return 'bg-white/10 border-white/20 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'cozinha': return 'Na Cozinha';
      case 'em_preparo': return 'Em Preparo';
      case 'pronto': return 'Pronto';
      case 'entregue': return 'Entregue';
      case 'concluido': return 'Concluído';
      default: return status;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'dinheiro': return 'Dinheiro';
      case 'cartao': return 'Cartão';
      case 'pix': return 'PIX';
      case 'transferencia': return 'Transferência';
      default: return 'Não informado';
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'pendente', label: 'Pendentes' },
          { key: 'cozinha', label: 'Cozinha' },
          { key: 'pronto', label: 'Prontos' },
          { key: 'entregue', label: 'Entregues' }
        ].map(option => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key as any)}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
              filter === option.key
                ? 'bg-[#FF4500] text-white shadow-xl'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="glass p-12 rounded-[3rem] border border-white/10 text-center">
            <p className="text-gray-500 text-lg font-black uppercase">Nenhum pedido encontrado</p>
          </div>
        ) : (
          filteredOrders
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(order => (
              <div 
                key={order.id} 
                className="glass p-6 rounded-[2.5rem] border border-white/10 hover:border-[#FF4500]/50 transition-all"
              >
                {/* Cabeçalho do Pedido */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="text-xl font-black text-white">Pedido #{order.id.slice(-6).toUpperCase()}</h4>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                        order.paymentStatus === 'pago' 
                          ? 'bg-green-500/20 border border-green-500 text-green-500' 
                          : 'bg-yellow-500/20 border border-yellow-500 text-yellow-500'
                      }`}>
                        {order.paymentStatus === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                      {order.paymentStatus === 'pago' && order.paymentMethod && (
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-blue-500/20 border border-blue-500 text-blue-400">
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      {order.customerName} • {order.tableNumber}
                    </p>
                    <p className="text-[10px] text-gray-600 font-bold mt-1">
                      {new Date(order.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[#FF4500] font-mono">R$ {Number(order.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <button
                      onClick={() => {
                        if (confirm('Deseja excluir este pedido?')) {
                          onDeleteOrder(order.id);
                        }
                      }}
                      className="mt-2 text-red-500 hover:text-red-400 text-sm font-black"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Lista de Itens */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        item.delivered
                          ? 'bg-green-500/10 border-green-500/30 opacity-60'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <button
                        onClick={() => toggleItemDelivery(order, idx)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          item.delivered
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-400 hover:border-green-500'
                        }`}
                      >
                        {item.delivered && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`font-black text-sm ${item.delivered ? 'line-through text-gray-400' : 'text-white'}`}>
                          {item.quantity}x {item.name}
                        </p>
                        {item.delivered && item.deliveredAt && (
                          <p className="text-[8px] text-green-500 font-bold mt-1">
                            Entregue por {item.deliveredBy} em {new Date(item.deliveredAt).toLocaleTimeString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <p className="text-[#FF4500] font-black font-mono">R$ {Number((item.price || 0) * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  ))}
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                  {!order.items.every(item => item.delivered) && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => markOrderAsDelivered(order)}
                        className="flex-1 px-4 py-3 bg-green-500 text-white font-black rounded-xl text-sm uppercase tracking-widest hover:bg-green-600 transition-all"
                      >
                        Marcar Tudo como Entregue
                      </button>
                      {order.status === 'pendente' && (
                        <button
                          onClick={() => onUpdateOrder({ ...order, status: 'cozinha', sentToKitchenAt: Date.now() })}
                          className="px-6 py-3 bg-[#FF4500] text-white font-black rounded-xl text-sm uppercase tracking-widest hover:bg-[#FF5500] transition-all"
                        >
                          Enviar para Cozinha
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Botões de Pagamento e Conclusão */}
                  {order.items.every(item => item.delivered) && order.status !== 'concluido' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (confirm(`Marcar pedido #${order.id.slice(-6).toUpperCase()} como concluído?`)) {
                            markOrderAsCompleted(order);
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-green-600 text-white font-black rounded-xl text-sm uppercase tracking-widest hover:bg-green-700 transition-all"
                      >
                        Marcar como Concluído
                      </button>
                    </div>
                  )}
                  
                  {order.paymentStatus !== 'pago' && (
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-bold uppercase w-full mb-1">Marcar como Pago:</span>
                      {(['dinheiro', 'cartao', 'pix', 'transferencia'] as const).map(method => (
                        <button
                          key={method}
                          onClick={() => {
                            if (confirm(`Marcar pedido #${order.id.slice(-6).toUpperCase()} como pago via ${method.toUpperCase()}?`)) {
                              markOrderAsPaid(order, method);
                            }
                          }}
                          className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 text-blue-400 font-black rounded-xl text-xs uppercase tracking-wider hover:bg-blue-500/30 transition-all"
                        >
                          {getPaymentMethodLabel(method)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
