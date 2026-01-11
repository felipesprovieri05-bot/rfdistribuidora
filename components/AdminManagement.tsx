'use client';

import React, { useState, useMemo } from 'react';
import { Admin, PermissionType, DEFAULT_ROLES, LogEntry } from '../types';
import { storage } from '../services/storage';

interface AdminManagementProps {
  currentAdmin: Admin;
  onUpdate: () => void;
  logs: LogEntry[];
}

const AdminManagement: React.FC<AdminManagementProps> = ({ currentAdmin, onUpdate, logs }) => {
  const [admins, setAdmins] = useState<Admin[]>(storage.getAdmins());
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newAdmin, setNewAdmin] = useState<Partial<Admin>>({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'admin',
    permissions: DEFAULT_ROLES.garcom,
    active: true
  });

  const filteredAdmins = useMemo(() => {
    if (!searchTerm) return admins;
    const term = searchTerm.toLowerCase();
    return admins.filter(a => 
      a.name.toLowerCase().includes(term) ||
      a.username.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term)
    );
  }, [admins, searchTerm]);

  const handleSave = () => {
    if (!newAdmin.username || !newAdmin.password || !newAdmin.name) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    // Verificar se username já existe (exceto se estiver editando)
    const usernameExists = admins.some(a => 
      a.username.toLowerCase() === newAdmin.username!.toLowerCase() && 
      a.id !== editingId
    );
    if (usernameExists) {
      alert('Username já existe!');
      return;
    }

    if (editingId) {
      // Editar admin existente
      const updated = admins.map(a => 
        a.id === editingId 
          ? { ...a, ...newAdmin, id: a.id } as Admin
          : a
      );
      setAdmins(updated);
      storage.saveAdmins(updated);
      
      storage.addLog({
        id: Math.random().toString(36).slice(2, 11),
        type: 'caixa',
        action: 'admin_editado',
        description: `Admin editado: ${newAdmin.name} (${newAdmin.username})`,
        userId: currentAdmin.id,
        timestamp: Date.now()
      });
    } else {
      // Criar novo admin
      const admin: Admin = {
        id: Math.random().toString(36).slice(2, 11),
        username: newAdmin.username!,
        password: newAdmin.password!,
        name: newAdmin.name!,
        email: newAdmin.email || '',
        role: newAdmin.role || 'admin',
        permissions: newAdmin.permissions || DEFAULT_ROLES.garcom,
        active: newAdmin.active !== false,
        createdAt: Date.now(),
        createdBy: currentAdmin.id
      };
      const updated = [...admins, admin];
      setAdmins(updated);
      storage.saveAdmins(updated);
      
      storage.addLog({
        id: Math.random().toString(36).slice(2, 11),
        type: 'caixa',
        action: 'admin_criado',
        description: `Novo admin criado: ${admin.name} (${admin.username})`,
        userId: currentAdmin.id,
        timestamp: Date.now()
      });
    }

    // Reset form
    setNewAdmin({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'admin',
      permissions: DEFAULT_ROLES.garcom,
      active: true
    });
    setIsAdding(false);
    setEditingId(null);
    onUpdate();
  };

  const handleEdit = (admin: Admin) => {
    setNewAdmin({
      username: admin.username,
      password: '', // Não preencher senha para edição
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      active: admin.active
    });
    setEditingId(admin.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (id === currentAdmin.id) {
      alert('Você não pode excluir a si mesmo!');
      return;
    }
    if (confirm('Tem certeza que deseja excluir este administrador?')) {
      const updated = admins.filter(a => a.id !== id);
      setAdmins(updated);
      storage.saveAdmins(updated);
      
      storage.addLog({
        id: Math.random().toString(36).slice(2, 11),
        type: 'caixa',
        action: 'admin_excluido',
        description: `Admin excluído: ${admins.find(a => a.id === id)?.name}`,
        userId: currentAdmin.id,
        timestamp: Date.now()
      });
      onUpdate();
    }
  };

  const togglePermission = (permissionType: PermissionType) => {
    const currentPerms = newAdmin.permissions || [];
    const updatedPerms = currentPerms.map(p => 
      p.type === permissionType ? { ...p, enabled: !p.enabled } : p
    );
    
    // Se permissão não existe, adicionar
    if (!updatedPerms.find(p => p.type === permissionType)) {
      updatedPerms.push({ type: permissionType, enabled: true });
    }
    
    setNewAdmin({ ...newAdmin, permissions: updatedPerms });
  };

  const applyRoleTemplate = (roleName: string) => {
    const template = DEFAULT_ROLES[roleName];
    if (template) {
      setNewAdmin({ ...newAdmin, permissions: template });
    }
  };

  const permissionLabels: Record<PermissionType, string> = {
    'caixa': 'Caixa/PDV',
    'pedidos': 'Gestão de Pedidos',
    'reservas': 'Gestão de Reservas',
    'estoque': 'Controle de Estoque',
    'clientes': 'Cadastro de Clientes',
    'financeiro': 'Dashboard Financeiro',
    'admins': 'Gerenciar Admins'
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
            Gerenciamento de Administradores
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Controle de acesso e permissões do sistema
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setNewAdmin({
              username: '',
              password: '',
              name: '',
              email: '',
              role: 'admin',
              permissions: DEFAULT_ROLES.garcom,
              active: true
            });
          }}
          className="px-6 py-3 bg-[#FF4500] text-white font-black rounded-xl hover:scale-105 transition-all orange-glow shadow-lg shadow-[#FF4500]/20"
        >
          {isAdding ? 'Cancelar' : '+ Novo Admin'}
        </button>
      </div>

      {/* Form de Adição/Edição */}
      {isAdding && (
        <div className="glass p-6 rounded-3xl border border-white/20 backdrop-blur-xl">
          <h3 className="text-xl font-black text-white mb-6">
            {editingId ? 'Editar Administrador' : 'Novo Administrador'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Nome Completo *</label>
              <input
                type="text"
                value={newAdmin.name || ''}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF4500] transition-colors"
                placeholder="Nome completo"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Username *</label>
              <input
                type="text"
                value={newAdmin.username || ''}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF4500] transition-colors"
                placeholder="nomeusuario"
                disabled={!!editingId}
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                {editingId ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}
              </label>
              <input
                type="password"
                value={newAdmin.password || ''}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF4500] transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">E-mail</label>
              <input
                type="email"
                value={newAdmin.email || ''}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF4500] transition-colors"
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Cargo</label>
              <select
                value={newAdmin.role || 'admin'}
                onChange={(e) => {
                  const role = e.target.value as 'master' | 'admin' | 'garcom' | 'caixa' | 'gerente';
                  const permissions = DEFAULT_ROLES[role] || DEFAULT_ROLES.garcom;
                  setNewAdmin({ ...newAdmin, role, permissions });
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF4500] transition-colors font-bold"
                disabled={currentAdmin.role !== 'master'}
                style={{ color: '#ffffff' }}
              >
                <option value="garcom">Garçom</option>
                <option value="caixa">Caixa</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Administrador</option>
                {currentAdmin.role === 'master' && <option value="master">Administrador CEO</option>}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Status</label>
              <select
                value={newAdmin.active ? 'true' : 'false'}
                onChange={(e) => setNewAdmin({ ...newAdmin, active: e.target.value === 'true' })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF4500] transition-colors font-bold"
                style={{ color: '#ffffff' }}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          {/* Templates de Permissões */}
          {newAdmin.role !== 'master' && (
            <div className="mb-6">
              <label className="block text-xs font-black text-gray-400 uppercase mb-3">Templates de Permissões</label>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => applyRoleTemplate('garcom')}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors"
                >
                  Garçom
                </button>
                <button
                  onClick={() => applyRoleTemplate('caixa')}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors"
                >
                  Caixa
                </button>
                <button
                  onClick={() => applyRoleTemplate('gerente')}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors"
                >
                  Gerente
                </button>
              </div>
            </div>
          )}

          {/* Permissões Individuais */}
          {newAdmin.role !== 'master' && (
            <div className="mb-6">
              <label className="block text-xs font-black text-gray-400 uppercase mb-3">Permissões Individuais</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {(Object.keys(permissionLabels) as PermissionType[]).map((permType) => {
                  if (permType === 'admins' && currentAdmin.role !== 'master') return null;
                  const perm = newAdmin.permissions?.find(p => p.type === permType);
                  const enabled = perm?.enabled || false;
                  return (
                    <label
                      key={permType}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => togglePermission(permType)}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#FF4500] focus:ring-[#FF4500]"
                      />
                      <span className="text-sm text-white font-bold">{permissionLabels[permType]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full py-4 bg-[#FF4500] text-white font-black rounded-xl hover:scale-[1.02] transition-all orange-glow shadow-lg shadow-[#FF4500]/20"
          >
            {editingId ? 'Salvar Alterações' : 'Criar Administrador'}
          </button>
        </div>
      )}

      {/* Busca */}
      <div className="glass p-4 rounded-2xl border border-white/20 backdrop-blur-xl">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, username ou e-mail..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF4500] transition-colors"
        />
      </div>

      {/* Lista de Admins */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAdmins.map((admin) => (
          <div
            key={admin.id}
            className={`glass p-6 rounded-2xl border-2 backdrop-blur-xl transition-all ${
              admin.active 
                ? 'border-white/20 hover:border-white/30' 
                : 'border-red-500/30 opacity-60'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                    admin.role === 'master' ? 'bg-[#FF4500] text-white' : 'bg-white/10 text-white'
                  }`}>
                    {admin.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {admin.name}
                      {admin.role === 'master' && (
                        <span className="ml-2 px-2 py-1 bg-[#FF4500] text-white text-xs rounded-lg">MASTER</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-400">@{admin.username}</p>
                    {admin.email && <p className="text-xs text-gray-500">{admin.email}</p>}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {admin.role === 'master' ? (
                    <span className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 text-xs font-black">
                      Acesso Total
                    </span>
                  ) : (
                    admin.permissions.map((perm) => 
                      perm.enabled ? (
                        <span
                          key={perm.type}
                          className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-xs font-bold"
                        >
                          {permissionLabels[perm.type]}
                        </span>
                      ) : null
                    )
                  )}
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  {admin.lastLogin && (
                    <span>Último acesso: {new Date(admin.lastLogin).toLocaleString('pt-BR')}</span>
                  )}
                  {admin.createdBy && (
                    <span className="ml-4">
                      Criado por: {admins.find(a => a.id === admin.createdBy)?.name || 'Desconhecido'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                {currentAdmin.role === 'master' && (
                  <>
                    <button
                      onClick={() => handleEdit(admin)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-bold hover:bg-white/20 transition-colors"
                    >
                      Editar
                    </button>
                    {admin.id !== currentAdmin.id && (
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm font-bold hover:bg-red-500/30 transition-colors"
                      >
                        Excluir
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAdmins.length === 0 && (
        <div className="glass p-12 rounded-3xl border border-white/20 text-center">
          <p className="text-gray-400 font-bold">Nenhum administrador encontrado</p>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
