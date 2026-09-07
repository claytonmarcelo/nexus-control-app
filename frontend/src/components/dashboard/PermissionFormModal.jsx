import { useEffect, useState } from 'react';

const PAGE_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard', description: 'Resumo operacional e indicadores' },
  { key: 'itens', label: 'Itens', description: 'Inventário e materiais de informática' },
  { key: 'usuarios', label: 'Usuários', description: 'Gestão administrativa de acessos' },
  { key: 'perfil', label: 'Perfil', description: 'Dados pessoais e segurança' },
];

export default function PermissionFormModal({ isOpen, onClose, onSubmit, user, initialPermissions }) {
  const [permissions, setPermissions] = useState(initialPermissions || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setPermissions(initialPermissions || {});
  }, [isOpen, initialPermissions]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(permissions);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()} role="dialog" aria-modal="true" aria-labelledby="permission-form-title">
      <div className="modal-content max-w-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-nexus-400">Controle individual</p>
              <h2 id="permission-form-title" className="mt-2 text-xl font-semibold text-white">Permissões de {user.nome}</h2>
            </div>
            <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-lg text-nexus-400 hover:bg-dark-hover hover:text-white" aria-label="Fechar">
              <svg className="mx-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-3">
            {PAGE_OPTIONS.map((page) => (
              <label key={page.key} className="flex cursor-pointer items-center gap-4 rounded-xl border border-dark-border bg-dark-hover p-4 transition-colors hover:border-nexus-500/50">
                <input
                  type="checkbox"
                  checked={permissions[page.key] === true}
                  onChange={(event) => setPermissions(prev => ({ ...prev, [page.key]: event.target.checked }))}
                  className="h-5 w-5 accent-nexus-500"
                />
                <span>
                  <span className="block font-medium text-white">{page.label}</span>
                  <span className="block text-sm text-nexus-400">{page.description}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar permissões'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
