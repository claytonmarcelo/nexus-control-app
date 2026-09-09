import { useState, useEffect } from 'react';
import { useModal } from '../../contexts/ModalContext';

export default function ItemFormModal({ isOpen, onClose, onSubmit, initialData, loading }) {
  const [formData, setFormData] = useState({ nome: '', descricao: '', categoria: 'Informática', valor_venda: '', valor_aluguel_mensal: '', estoque: 10 });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useModal();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ nome: initialData.nome, descricao: initialData.descricao || '', categoria: initialData.categoria || 'Informática', valor_venda: initialData.valor_venda || '', valor_aluguel_mensal: initialData.valor_aluguel_mensal || '', estoque: initialData.estoque ?? 10 });
      } else {
        setFormData({ nome: '', descricao: '', categoria: 'Informática', valor_venda: '', valor_aluguel_mensal: '', estoque: 10 });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    else if (formData.nome.length > 200) newErrors.nome = 'Nome deve ter no máximo 200 caracteres';
    if (formData.descricao && formData.descricao.length > 1000) newErrors.descricao = 'Descrição deve ter no máximo 1000 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao salvar item';
      toast({ message, variant: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="item-form-title"
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m20 7-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nexus-400">
                    {initialData ? 'Edição' : 'Cadastro'}
                  </p>
                  <h2 id="item-form-title" className="mt-2 text-xl font-bold leading-tight text-white">
                    {initialData ? 'Editar Item' : 'Novo Item'}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-nexus-400 transition-colors hover:bg-dark-hover hover:text-white"
                aria-label="Fechar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6" noValidate>

          <div className="space-y-5">
            <div>
              <label htmlFor="nome" className="label">Nome do item *</label>
              <input
                id="nome"
                name="nome"
                type="text"
                value={formData.nome}
                onChange={handleChange}
                className={`input ${errors.nome ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Ex: Notebook Dell XPS 15"
                maxLength={200}
                disabled={isSubmitting || loading}
                aria-invalid={!!errors.nome}
                aria-describedby={errors.nome ? 'nome-error' : undefined}
                autoFocus
              />
              {errors.nome && <p id="nome-error" className="mt-1 text-sm text-red-400" role="alert">{errors.nome}</p>}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div><label htmlFor="categoria" className="label">Categoria</label><input id="categoria" name="categoria" value={formData.categoria} onChange={handleChange} className="input" disabled={isSubmitting || loading} /></div>
              <div><label htmlFor="estoque" className="label">Estoque</label><input id="estoque" name="estoque" type="number" min="0" value={formData.estoque} onChange={handleChange} className="input" disabled={isSubmitting || loading} /></div>
              <div><label htmlFor="valor_venda" className="label">Valor de venda (R$)</label><input id="valor_venda" name="valor_venda" type="number" min="0" step="0.01" value={formData.valor_venda} onChange={handleChange} className="input" disabled={isSubmitting || loading} /></div>
              <div><label htmlFor="valor_aluguel_mensal" className="label">Aluguel mensal (R$)</label><input id="valor_aluguel_mensal" name="valor_aluguel_mensal" type="number" min="0" step="0.01" value={formData.valor_aluguel_mensal} onChange={handleChange} className="input" disabled={isSubmitting || loading} /></div>
            </div>

            <div>
              <label htmlFor="descricao" className="label">Descrição</label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                className={`input ${errors.descricao ? 'border-red-500 focus:ring-red-500' : ''} resize-none`}
                placeholder="Detalhes do item (opcional)"
                maxLength={1000}
                rows={4}
                disabled={isSubmitting || loading}
                aria-invalid={!!errors.descricao}
                aria-describedby={errors.descricao ? 'descricao-error' : undefined}
              />
              {errors.descricao && <p id="descricao-error" className="mt-1 text-sm text-red-400" role="alert">{errors.descricao}</p>}
              <p className="mt-1 text-xs text-nexus-500 text-right">
                {formData.descricao.length}/1000
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full gap-2 sm:w-auto px-6 py-3 font-medium"
              disabled={isSubmitting || loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary w-full gap-2 sm:w-auto px-6 py-3 font-medium"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvando...
                </span>
              ) : (
                initialData ? 'Atualizar' : 'Criar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}