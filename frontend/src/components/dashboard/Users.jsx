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
      message: `Tem certeza que deseja excluir "${targetUser.nome}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      setDeletingUser(targetUser.id);
      try {
        await userService.delete(targetUser.id);
        setUsers(prev => prev.filter(u => u.id !== targetUser.id));
        toast({ message: 'Usuário excluído com sucesso', variant: 'success' });
      } catch (error) {
        toast({ message: 'Erro ao excluir usuário', variant: 'danger' });
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
    try {
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
    } catch (error) {
      throw error;
    }
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
          <h1 className="text-3xl font-bold text-white">Gerenciar Usuários</h1>
          <p className="text-nexus-400 mt-1">Administre os usuários do sistema</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Novo Usuário
        </button>
      </div>

      <div className="card">
        <div className="p-6 border-b border-dark-border">
          <div className="relative max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nexus-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-12"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-16 h-16" />}
            title="Nenhum usuário encontrado"
            description={search ? 'Tente alterar sua busca' : 'Nenhum usuário cadastrado'}
            action={{ label: 'Criar primeiro usuário', onClick: handleCreate }}
          />
        ) : (
          <div className="divide-y divide-dark-border">
            {filteredUsers.map(targetUser => (
              <div key={targetUser.id} className="p-6 hover:bg-dark-hover transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-nexus-600/20 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-6 h-6 text-nexus-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-white truncate">{targetUser.nome}</h3>
                      <RoleBadge role={targetUser.nivel_acesso} isRoot={isRootAdmin(targetUser)} />
                      {targetUser.id === user.id && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-600/20 text-gray-400 rounded-full">
                          Você
                        </span>
                      )}
                    </div>
                    <p className="text-nexus-400 text-sm mb-1">{targetUser.email}</p>
                    <div className="flex items-center gap-4 text-sm text-nexus-500">
                      <span>Criado em {formatDate(targetUser.criado_em)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isRootAdmin(targetUser) && (
                      <button
                        onClick={() => handlePermissionEdit(targetUser)}
                        className="p-2 rounded-lg text-nexus-400 hover:text-nexus-300 hover:bg-dark-hover transition-colors"
                        aria-label="Gerenciar permissões"
                      >
                        <ShieldIcon className="w-5 h-5" />
                      </button>
                    )}
                    {!isRootAdmin(targetUser) && (
                      <button
                        onClick={() => handleEdit(targetUser)}
                        className="p-2 rounded-lg text-nexus-400 hover:text-nexus-300 hover:bg-dark-hover transition-colors"
                        aria-label="Editar usuário"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                    )}
                    {targetUser.id !== user.id && !isRootAdmin(targetUser) && (
                      <button
                        onClick={() => handleDelete(targetUser)}
                        disabled={deletingUser === targetUser.id}
                        className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-colors disabled:opacity-50"
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

function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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