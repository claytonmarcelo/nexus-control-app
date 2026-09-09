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
    <div 
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(event) => event.target === event.currentTarget && onClose()} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="permission-form-title"
    >
      <div className="glass w-full max-w-lg rounded-3xl shadow-glass-lg overflow-hidden animate-scale-in border-b-2 border-nexus-500/30">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-nexus-500/10 via-nexus-500/5 to-transparent border-b border-nexus-500/20">
          <div className="absolute inset-0 bg-nexus-500/5" />
          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-nexus-500/30 bg-nexus-500/10 shadow-[0_0_24px_rgba(212,175,55,0.1)]">
                  <svg className="h-6 w-6 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nexus-400">
                    Controle individual
                  </p>
                  <h2 id="permission-form-title" className="mt-2 text-xl font-bold leading-tight text-white">
                    Permissões de {user.nome}
                  </h2>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-nexus-400 transition-colors hover:bg-dark-hover hover:text-white" aria-label="Fechar">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">

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

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary w-full gap-2 sm:w-auto px-6 py-3 font-medium" disabled={saving}>Cancelar</button>
            <button type="submit" className="btn-primary w-full gap-2 sm:w-auto px-6 py-3 font-medium" disabled={saving}>{saving ? 'Salvando...' : 'Salvar permissões'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
