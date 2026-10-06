import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/services';
import { useModal } from '../../contexts/ModalContext';
import { formatDate } from '../../utils/date';
import { isRootAdmin } from '../../utils/access';
import LoadingScreen from '../ui/LoadingScreen';
import EmptyState from '../ui/EmptyState';
import UserFormModal from './UserFormModal';
import PermissionFormModal from './PermissionFormModal';
import UserHistoryModal from './UserHistoryModal';

export default function Users() {
  const { user, isAdmin } = useAuth();
  const { toast, confirm } = useModal();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [permissionUser, setPermissionUser] = useState(null);
  const [permissionData, setPermissionData] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.getAll();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({ message: 'Erro ao carregar usuários', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin, loadUsers]);

  const handleDelete = async (targetUser) => {
    if (targetUser.id === user.id) {
      toast({ message: 'Não é possível excluir sua própria conta', variant: 'warning' });
      return;
    }

    const confirmed = await confirm({
      title: 'Excluir usuário',
      message: `Tem certeza que deseja excluir "${targetUser.nome}"? Contas com histórico são desativadas e preservadas; contas sem registros são removidas definitivamente.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      setDeletingUser(targetUser.id);
      try {
        const result = await userService.delete(targetUser.id);
        if (result?.data?.desativada) {
          // Soft delete: a conta permanece no banco com histórico, mas sai das
          // contas ativas. Recarrega para refletir o novo estado real.
          await loadUsers();
        } else {
          setUsers(prev => prev.filter(u => u.id !== targetUser.id));
        }
        toast({ message: result?.message || 'Usuário excluído com sucesso', variant: 'success' });
      } catch (error) {
        toast({ message: error.response?.data?.message || 'Erro ao excluir usuário', variant: 'danger' });
      } finally {
        setDeletingUser(null);
      }
    }
  };

  const handleEdit = (targetUser) => {
    setEditingUser(targetUser);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handlePermissionEdit = async (targetUser) => {
    try {
      const response = await userService.getPermissions(targetUser.id);
      setPermissionUser(targetUser);
      setPermissionData(response.permissions);
    } catch (error) {
      toast({ message: 'Erro ao carregar permissões', variant: 'danger' });
    }
  };

  const handlePermissionSubmit = async (permissions) => {
    try {
      await userService.updatePermissions(permissionUser.id, permissions);
      toast({ message: 'Permissões atualizadas com sucesso', variant: 'success' });
      setPermissionUser(null);
      setPermissionData(null);
    } catch (error) {
      toast({ message: error.response?.data?.message || 'Erro ao atualizar permissões', variant: 'danger' });
      throw error;
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleFormSubmit = async (data) => {
    if (editingUser) {
      await userService.update(editingUser.id, data);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
      toast({ message: 'Usuário atualizado com sucesso', variant: 'success' });
    } else {
      await userService.create(data);
      await loadUsers();
      toast({ message: 'Usuário criado com sucesso', variant: 'success' });
    }
    handleFormClose();
  };

  const filteredUsers = users.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-gold)' }}>Administração</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Gerenciar Usuários
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Controle de acessos, permissões e histórico da equipe</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Novo Usuário
        </button>
      </div>

      <div className="card">
        <div className="p-5 border-b" style={{ borderColor: 'var(--divider)' }}>
          <div className="relative max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--accent-gold)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-11"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-12 h-12" />}
            title="Nenhum usuário encontrado"
            description={search ? 'Nenhum resultado corresponde à sua busca.' : 'Nenhum usuário cadastrado no momento.'}
            action={{ label: 'Criar primeiro usuário', onClick: handleCreate }}
          />
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
            {filteredUsers.map(targetUser => (
              <div
                key={targetUser.id}
                className="p-5 transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))',
                      color: '#0d0d0d',
                      boxShadow: '0 2px 8px var(--accent-gold-faint)',
                    }}
                  >
                    {targetUser.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{targetUser.nome}</h3>
                      <RoleBadge role={targetUser.nivel_acesso} isRoot={isRootAdmin(targetUser)} />
                      {targetUser.id === user.id && (
                        <span
                          className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border"
                          style={{
                            backgroundColor: 'var(--accent-gold-faint)',
                            color: 'var(--accent-gold)',
                            borderColor: 'var(--accent-gold-border)',
                          }}
                        >
                          Você
                        </span>
                      )}
                      {targetUser.status_conta === 'desativada' && (
                        <span
                          className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border"
                          style={{
                            backgroundColor: 'var(--color-error-bg)',
                            color: 'var(--color-error)',
                            borderColor: 'var(--color-error-border)',
                          }}
                        >
                          Desativada
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate mb-1" style={{ color: 'var(--text-muted)' }}>{targetUser.email}</p>
                    <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <span>Cadastrado em {formatDate(targetUser.criado_em)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setHistoryUser(targetUser)}
                      className="p-2 rounded-lg transition-colors border"
                      style={{
                        backgroundColor: 'var(--color-success-bg)',
                        color: 'var(--color-success)',
                        borderColor: 'var(--color-success-border)',
                      }}
                      aria-label="Histórico de compras"
                      title="Histórico de Compras"
                    >
                      <ShoppingBagIcon className="w-4 h-4" />
                    </button>
                    {!isRootAdmin(targetUser) && targetUser.status_conta !== 'desativada' && (
                      <button
                        onClick={() => handlePermissionEdit(targetUser)}
                        className="p-2 rounded-lg transition-colors border"
                        style={{
                          backgroundColor: 'var(--accent-gold-faint)',
                          color: 'var(--accent-gold)',
                          borderColor: 'var(--accent-gold-border)',
                        }}
                        aria-label="Gerenciar permissões"
                        title="Permissões"
                      >
                        <ShieldIcon className="w-4 h-4" />
                      </button>
                    )}
                    {!isRootAdmin(targetUser) && targetUser.status_conta !== 'desativada' && (
                      <button
                        onClick={() => handleEdit(targetUser)}
                        className="p-2 rounded-lg transition-colors border"
                        style={{
                          backgroundColor: 'var(--bg-elevated-2)',
                          color: 'var(--text-secondary)',
                          borderColor: 'var(--border-color)',
                        }}
                        aria-label="Editar usuário"
                        title="Editar"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    )}
                    {targetUser.id !== user.id && !isRootAdmin(targetUser) && targetUser.status_conta !== 'desativada' && (
                      <button
                        onClick={() => handleDelete(targetUser)}
                        disabled={deletingUser === targetUser.id}
                        className="p-2 rounded-lg transition-colors border disabled:opacity-50"
                        style={{
                          backgroundColor: 'var(--color-error-bg)',
                          color: 'var(--color-error)',
                          borderColor: 'var(--color-error-border)',
                        }}
                        aria-label="Excluir usuário"
                      >
                        {deletingUser === targetUser.id ? (
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <TrashIcon className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UserFormModal
        isOpen={showForm}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editingUser}
        isCurrentUser={editingUser?.id === user.id}
      />
      <PermissionFormModal
        isOpen={permissionUser !== null}
        onClose={() => { setPermissionUser(null); setPermissionData(null); }}
        onSubmit={handlePermissionSubmit}
        user={permissionUser}
        initialPermissions={permissionData}
      />
      <UserHistoryModal
        isOpen={historyUser !== null}
        onClose={() => setHistoryUser(null)}
        user={historyUser}
      />
    </div>
  );
}

function RoleBadge({ role, isRoot }) {
  const styles = {
    admin: 'bg-red-600/20 text-red-400',
    funcionario: 'bg-green-600/20 text-green-400',
    cliente: 'bg-nexus-600/20 text-nexus-400',
  };

  const labels = {
    admin: 'Admin',
    funcionario: 'Funcionário',
    cliente: 'Cliente',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[role]}`}>
      {isRoot ? 'Admin raiz' : labels[role]}
    </span>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function EditIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function ShoppingBagIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}