import { useState, useEffect } from 'react';
import { useModal } from '../../contexts/ModalContext';

export default function ItemFormModal({ isOpen, onClose, onSubmit, initialData, loading }) {
  const [formData, setFormData] = useState({ nome: '', descricao: '', categoria: 'Informática', valor_venda: '', valor_aluguel_mensal: '', estoque: 10, imagem_url: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useModal();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ nome: initialData.nome, descricao: initialData.descricao || '', categoria: initialData.categoria || 'Informática', valor_venda: initialData.valor_venda || '', valor_aluguel_mensal: initialData.valor_aluguel_mensal || '', estoque: initialData.estoque ?? 10, imagem_url: initialData.imagem_url || '' });
      } else {
        setFormData({ nome: '', descricao: '', categoria: 'Informática', valor_venda: '', valor_aluguel_mensal: '', estoque: 10, imagem_url: '' });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, loading, onClose]);

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
    if (formData.imagem_url && !formData.imagem_url.match(/^https?:\/\/.+/)) newErrors.imagem_url = 'A URL da imagem deve ser válida (http:// ou https://)';
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
      className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-md animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && !loading && onClose()} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="item-form-title"
    >
      <div className="glass relative flex flex-col w-full max-w-xl max-h-[88vh] rounded-2xl sm:rounded-3xl shadow-glass-lg border border-nexus-500/30 overflow-hidden animate-scale-in">
        {/* Header - Fixed at top */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-nexus-500/10 via-nexus-500/5 to-transparent border-b border-nexus-500/20 px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-nexus-500/30 bg-nexus-500/10 text-nexus-400 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m20 7-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nexus-400">
                  {initialData ? 'Edição de Produto' : 'Novo Produto'}
                </p>
                <h2 id="item-form-title" className="text-lg sm:text-xl font-bold leading-tight text-white">
                  {initialData ? 'Editar Item' : 'Cadastrar Item'}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-nexus-400 transition-colors hover:bg-dark-hover hover:text-white disabled:opacity-50"
              aria-label="Fechar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Form with scrollable body and fixed footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden" noValidate>
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5">
            <div>
              <label htmlFor="nome" className="label">Nome do item *</label>
              <input
                id="nome"
                name="nome"
                type="text"
                value={formData.nome}
                onChange={handleChange}
                className={`input ${errors.nome ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Ex: Servidor Rack Dell PowerEdge R440"
                maxLength={200}
                disabled={isSubmitting || loading}
                aria-invalid={!!errors.nome}
                aria-describedby={errors.nome ? 'nome-error' : undefined}
                autoFocus
              />
              {errors.nome && <p id="nome-error" className="mt-1 text-xs text-red-400" role="alert">{errors.nome}</p>}
            </div>

            <div>
              <label htmlFor="imagem_url" className="label">URL da Imagem (Externa)</label>
              <input
                id="imagem_url"
                name="imagem_url"
                type="url"
                value={formData.imagem_url}
                onChange={handleChange}
                className={`input ${errors.imagem_url ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="https://images.unsplash.com/photo-..."
                disabled={isSubmitting || loading}
                aria-invalid={!!errors.imagem_url}
              />
              {errors.imagem_url && <p className="mt-1 text-xs text-red-400" role="alert">{errors.imagem_url}</p>}
              <p className="mt-1 text-[11px] text-nexus-400/80">
                Insira uma URL de imagem externa real para representar o item. Evite imagens fictícias geradas por IA.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="categoria" className="label">Categoria</label>
                <input
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ex: Servidores"
                  disabled={isSubmitting || loading}
                />
              </div>
              <div>
                <label htmlFor="estoque" className="label">Estoque</label>
                <input
                  id="estoque"
                  name="estoque"
                  type="number"
                  min="0"
                  value={formData.estoque}
                  onChange={handleChange}
                  className="input"
                  disabled={isSubmitting || loading}
                />
              </div>
              <div>
                <label htmlFor="valor_venda" className="label">Valor de venda (R$)</label>
                <input
                  id="valor_venda"
                  name="valor_venda"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valor_venda}
                  onChange={handleChange}
                  className="input"
                  placeholder="0,00"
                  disabled={isSubmitting || loading}
                />
              </div>
              <div>
                <label htmlFor="valor_aluguel_mensal" className="label">Aluguel mensal (R$)</label>
                <input
                  id="valor_aluguel_mensal"
                  name="valor_aluguel_mensal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valor_aluguel_mensal}
                  onChange={handleChange}
                  className="input"
                  placeholder="0,00"
                  disabled={isSubmitting || loading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="descricao" className="label mb-0">Descrição</label>
                <span className="text-[11px] text-nexus-400/70">{formData.descricao.length}/1000</span>
              </div>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                className={`input ${errors.descricao ? 'border-red-500 focus:ring-red-500' : ''} resize-none`}
                placeholder="Detalhes técnicos e especificações do item (opcional)"
                maxLength={1000}
                rows={3}
                disabled={isSubmitting || loading}
                aria-invalid={!!errors.descricao}
                aria-describedby={errors.descricao ? 'descricao-error' : undefined}
              />
              {errors.descricao && <p id="descricao-error" className="mt-1 text-xs text-red-400" role="alert">{errors.descricao}</p>}
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="shrink-0 border-t border-dark-border bg-dark-card/90 backdrop-blur-md px-6 py-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto px-5 py-2.5 text-sm font-medium"
              disabled={isSubmitting || loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto px-6 py-2.5 text-sm font-medium"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvando...
                </span>
              ) : (
                initialData ? 'Atualizar Item' : 'Criar Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}