
import React, { useState } from 'react';
import { Reservation } from '../types';

interface ReservationsProps {
  onReserve: (res: Reservation) => void;
}

const Reservations: React.FC<ReservationsProps> = ({ onReserve }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    period: '',
    time: '',
    people: 2
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.period || !formData.time || !formData.phone) return;

    // Combina período e horário para salvar no campo time
    const timeWithPeriod = `${formData.period} - ${formData.time}`;

    onReserve({
      id: Math.random().toString(36).slice(2, 11),
      ...formData,
      time: timeWithPeriod,
      phone: formData.phone.replace(/\D/g, ''),
      status: 'pendente',
      createdAt: Date.now(),
      notified: false
    });

    setFormData({ name: '', phone: '', date: '', period: '', time: '', people: 2 });
  };

  return (
    <form onSubmit={handleSubmit} className="glass p-10 rounded-[2.5rem] border border-white/5 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-400">Nome do Responsável</label>
          <input 
            required
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#FF4500] transition-colors"
            placeholder="Ex: João Silva"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-400">Telefone / WhatsApp</label>
          <input 
            required
            type="tel"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#FF4500] transition-colors"
            placeholder="(00) 00000-0000"
            value={formData.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              const formatted = value.length <= 11 
                ? value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                : formData.phone;
              setFormData({...formData, phone: formatted});
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-400">Número de Pessoas</label>
          <input 
            required
            type="number"
            min="1"
            max="20"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#FF4500] transition-colors"
            value={formData.people}
            onChange={(e) => setFormData({...formData, people: parseInt(e.target.value)})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-400">Data</label>
          <input 
            required
            type="date"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#FF4500] transition-colors text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-400">Período</label>
          <select 
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#FF4500] transition-colors text-white"
            value={formData.period}
            onChange={(e) => setFormData({...formData, period: e.target.value})}
          >
            <option value="" className="bg-black text-white">Selecione o período</option>
            <option value="Manhã" className="bg-black text-white">Manhã</option>
            <option value="Tarde" className="bg-black text-white">Tarde</option>
            <option value="Noite" className="bg-black text-white">Noite</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-400">Horário</label>
          <input 
            required
            type="time"
            step="60"
            lang="pt-BR"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#FF4500] transition-colors text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            value={formData.time}
            onChange={(e) => setFormData({...formData, time: e.target.value})}
            style={{ 
              colorScheme: 'dark',
            }}
          />
        </div>
      </div>
      
      <button 
        type="submit"
        className="w-full py-5 bg-[#FF4500] text-white font-bold rounded-2xl hover:scale-105 transition-all text-lg orange-glow mt-4"
      >
        Confirmar Reserva de Mesa
      </button>
      <p className="text-center text-xs text-gray-500">Reservas sujeitas a confirmação via telefone.</p>
    </form>
  );
};

export default Reservations;
