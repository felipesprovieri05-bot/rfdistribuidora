
import React, { useState, useMemo } from 'react';
import { Customer } from '../types';

interface CustomerAuthModalProps {
  onClose: () => void;
  onAuthSuccess: (customer: Customer) => void;
  existingCustomers: Customer[];
}

const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({ onClose, onAuthSuccess, existingCustomers }) => {
  const [isLogin, setIsLogin] = useState(existingCustomers.length > 0);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '', // Novo campo brutos
    password: ''
  });
  const [error, setError] = useState('');

  const formatCpfDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  };

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14);
    }
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const isFormValid = useMemo(() => {
    const cpfDigits = formData.cpf.replace(/\D/g, '');
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const isCpfOk = cpfDigits.length === 11;
    const isPhoneOk = phoneDigits.length >= 10;
    const isPasswordOk = formData.password.length >= 4;
    const isNameOk = formData.name.trim().length >= 3;
    
    if (isLogin) {
      return isCpfOk && isPasswordOk && isNameOk;
    } else {
      return isCpfOk && isPasswordOk && isNameOk && isPhoneOk;
    }
  }, [formData, isLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanCpf = formData.cpf.replace(/\D/g, '');
    const cleanPhone = formData.phone.replace(/\D/g, '');
    
    if (!isFormValid) return;

    if (isLogin) {
      // Validar nome antes de fazer login
      if (!formData.name.trim() || formData.name.trim().length < 3) {
        setError("Nome completo é obrigatório (mínimo 3 caracteres).");
        return;
      }
      
      // Normalizar CPF para comparação
      const normalizeCpf = (cpf: string) => cpf.replace(/\D/g, '');
      
      // Procurar cliente pelo CPF normalizado
      const customer = existingCustomers.find(c => {
        const existingCpfNormalized = normalizeCpf(c.cpf);
        return existingCpfNormalized === cleanCpf;
      });
      
      if (customer) {
        if (customer.password === formData.password) {
          // Atualizar nome do cliente se foi alterado
          const updatedCustomer = { ...customer, name: formData.name.trim(), lastVisit: Date.now() };
          onAuthSuccess(updatedCustomer);
        } else {
          setError("Senha incorreta.");
        }
      } else {
        setError("CPF não encontrado.");
      }
    } else {
      // Validar nome antes de criar cadastro
      if (!formData.name.trim() || formData.name.trim().length < 3) {
        setError("Nome completo é obrigatório (mínimo 3 caracteres).");
        return;
      }
      
      // Normalizar CPF para comparação
      const normalizeCpf = (cpf: string) => cpf.replace(/\D/g, '');
      
      // Verificar se CPF já existe (comparando CPF normalizado)
      const cpfExists = existingCustomers.some(c => {
        const existingCpfNormalized = normalizeCpf(c.cpf);
        return existingCpfNormalized === cleanCpf;
      });
      
      if (cpfExists) {
        setError("CPF já cadastrado. Use a opção de entrar.");
        return;
      }

      const newCustomer: Customer = {
        id: Math.random().toString(36).slice(2, 11),
        name: formData.name.trim(),
        cpf: cleanCpf, // CPF já está limpo (sem formatação)
        phone: cleanPhone,
        password: formData.password,
        totalSpent: 0,
        ordersCount: 0,
        lastVisit: Date.now(),
        type: 'normal'
      };
      onAuthSuccess(newCustomer);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-black/95 backdrop-blur-2xl">
      <div className="glass w-full max-w-md p-10 rounded-[3rem] border border-[#FF4500]/30 shadow-[0_0_60px_rgba(255,69,0,0.2)] animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black tracking-tighter text-white">
            {isLogin ? 'Acessar' : 'Cadastrar'}
          </h2>
          <p className="text-gray-500 text-sm mt-2">Identifique-se para gerenciar seus pedidos.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-center text-red-400 text-xs font-bold bg-red-500/10 rounded-xl border border-red-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
            <svg className="w-4 h-4 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">
              Nome Completo {!formData.name.trim() || formData.name.trim().length < 3 ? <span className="text-red-500">*</span> : ''}
            </label>
            <input 
              type="text"
              required
              minLength={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#FF4500] text-white font-bold"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Digite seu nome completo"
            />
            {!isLogin && (!formData.name.trim() || formData.name.trim().length < 3) && (
              <p className="text-[9px] text-red-500 font-bold ml-2">Nome deve ter no mínimo 3 caracteres</p>
            )}
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">
              CPF {formData.cpf.replace(/\D/g, '').length !== 11 ? <span className="text-red-500">*</span> : ''}
            </label>
            <input 
              type="text"
              required
              maxLength={14}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#FF4500] text-white font-mono font-black tracking-widest"
              value={formatCpfDisplay(formData.cpf)}
              onChange={e => setFormData({...formData, cpf: e.target.value})}
              placeholder="000.000.000-00"
            />
            {formData.cpf && formData.cpf.replace(/\D/g, '').length !== 11 && (
              <p className="text-[9px] text-red-500 font-bold ml-2">CPF deve ter 11 dígitos</p>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">
                WhatsApp / Celular {formData.phone.replace(/\D/g, '').length < 10 ? <span className="text-red-500">*</span> : ''}
              </label>
              <input 
                type="text"
                required
                maxLength={15}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#FF4500] text-white font-mono font-black tracking-widest"
                value={formatPhoneDisplay(formData.phone)}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="(00) 00000-0000"
              />
              {formData.phone && formData.phone.replace(/\D/g, '').length < 10 && (
                <p className="text-[9px] text-red-500 font-bold ml-2">Telefone deve ter no mínimo 10 dígitos</p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">
              Senha {formData.password.length < 4 ? <span className="text-red-500">*</span> : ''}
            </label>
            <input 
              type="password"
              required
              minLength={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#FF4500] text-white font-black tracking-widest"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="Mínimo 4 caracteres"
            />
            {formData.password && formData.password.length < 4 && (
              <p className="text-[9px] text-red-500 font-bold ml-2">Senha deve ter no mínimo 4 caracteres</p>
            )}
          </div>

          <button 
            type="submit"
            disabled={!isFormValid}
            className="w-full py-5 bg-[#FF4500] text-white font-black rounded-2xl transition-all shadow-xl disabled:opacity-30 uppercase tracking-widest text-sm mt-4"
          >
            {isLogin ? 'Entrar Agora' : 'Finalizar Cadastro'}
          </button>
        </form>

        <button 
          onClick={() => { 
            setIsLogin(!isLogin); 
            setError('');
            // Limpar formulário ao trocar de modo
            setFormData({
              name: '',
              cpf: '',
              phone: '',
              password: ''
            });
          }}
          className="w-full mt-6 text-gray-500 text-xs font-bold hover:text-white transition-colors"
        >
          {isLogin ? 'Ainda não tem conta? Clique para criar' : 'Já tem conta? Clique para entrar'}
        </button>
        <button onClick={onClose} className="w-full mt-4 text-[10px] text-gray-700 font-black uppercase tracking-widest">Voltar</button>
      </div>
    </div>
  );
};

export default CustomerAuthModal;
