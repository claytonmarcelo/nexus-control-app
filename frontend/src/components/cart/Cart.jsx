import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useModal } from '../../contexts/ModalContext';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

/* ─────────────────────────────────────────────────────────
   Modal personalizado de confirmação de remoção de item
───────────────────────────────────────────────────────── */
function RemoveItemModal({ item, onConfirm, onCancel }) {
  // Fechar com ESC
  const handleKey = useCallback(
    (e) => { if (e.key === 'Escape') onCancel(); },
    [onCancel]
  );
  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-modal-title"
    >
      <div
        className="glass w-full max-w-md rounded-3xl shadow-glass-lg overflow-hidden animate-scale-in"
        style={{ animation: 'scale-in 220ms cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* Header com alerta visual */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border-b border-red-500/20">
          <div className="absolute inset-0 bg-red-500/5" />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-500/10 shadow-[0_0_24px_rgba(239,68,68,0.2)]">
                <TrashIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
                  Confirmação necessária
                </p>
                <h2
                  id="remove-modal-title"
                  className="mt-2 text-xl font-bold leading-tight text-white"
                >
                  Remover item do carrinho?
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 sm:p-8">
          <p className="text-base leading-relaxed text-nexus-300">
            Esta ação removerá <strong className="font-semibold text-white">"{item.nome}"</strong> do seu carrinho de compras.
          </p>

          {/* Card resumo do produto melhorado */}
          <div className="mt-6 rounded-2xl border border-dark-border bg-dark-hover/50 p-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-dark-border bg-dark-card">
                {item.imagem_url ? (
                  <img src={item.imagem_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-nexus-600/15 text-nexus-400">
                    <BoxIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{item.nome}</p>
                {item.fabricante && (
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-nexus-500">{item.fabricante}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-bold text-nexus-200">
                    {formatCurrency(item.preco_unitario)}
                  </span>
                  <span className="text-xs text-nexus-500">/ unidade</span>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso de impacto */}
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <svg className="h-5 w-5 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs leading-relaxed text-amber-200">
              Esta ação não pode ser desfeita. Se desejar comprar este produto novamente, você precisará adicioná-lo ao carrinho.
            </p>
          </div>

          {/* Botões com melhor hierarquia */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              id="remove-modal-cancel"
              className="btn-secondary w-full gap-2 sm:w-auto px-6 py-3 font-medium"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              id="remove-modal-confirm"
              className="btn-danger w-full gap-2 sm:w-auto px-6 py-3 font-medium"
            >
              <TrashIcon className="h-4 w-4" />
              Remover item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Componente principal Cart
───────────────────────────────────────────────────────── */
export default function Cart() {
  const { items, totalItems, subtotal, updateQuantity, removeItem, clearCart, getItemSubtotal } = useCart();
  const { confirm } = useModal();
  const [pendingRemove, setPendingRemove] = useState(null); // item a ser removido

  const handleRemoveClick = (item) => {
    setPendingRemove(item);
  };

  const handleRemoveConfirm = () => {
    if (pendingRemove) {
      removeItem(pendingRemove.id);
      setPendingRemove(null);
    }
  };

  const handleRemoveCancel = () => {
    setPendingRemove(null);
  };

  const handleClearCart = async () => {
    const accepted = await confirm({
      title: 'Limpar carrinho',
      message: 'Todos os produtos selecionados serão removidos do seu carrinho.',
      confirmText: 'Limpar tudo',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
    if (accepted) clearCart();
  };

  if (!items.length) {
    return (
      <section className="mx-auto flex min-h-[56vh] max-w-xl items-center justify-center animate-fade-in">
        <div className="glass w-full rounded-3xl p-8 text-center shadow-glass-lg sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-nexus-500/30 bg-nexus-600/15 text-nexus-300">
            <CartIcon className="h-8 w-8" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-nexus-400">Seu pedido</p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-white">Seu carrinho está vazio</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-nexus-400">
            Explore o catálogo e adicione os produtos e serviços que deseja.
          </p>
          <Link to="/itens" className="btn-primary mt-8 gap-2">
            <BoxIcon className="h-5 w-5" />
            Ver catálogo
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-6 animate-fade-in">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nexus-400">Seleção atual</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">Seu carrinho</h1>
            <p className="mt-2 text-sm text-nexus-400">
              {totalItems} {totalItems === 1 ? 'item selecionado' : 'itens selecionados'} para o seu pedido.
            </p>
          </div>
          <button type="button" onClick={handleClearCart} className="btn-ghost w-full gap-2 sm:w-auto">
            <TrashIcon className="h-5 w-5" />
            Limpar carrinho
          </button>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="glass overflow-hidden rounded-3xl shadow-glass">
            <div className="border-b border-dark-border px-5 py-4 sm:px-6">
              <h2 className="font-display text-lg font-semibold text-white">Itens selecionados</h2>
            </div>
            <ul className="divide-y divide-dark-border" aria-label="Itens do carrinho">
              {items.map((item) => (
                <li key={item.id} className="p-4 sm:p-6">
                  <div className="flex gap-3 sm:gap-5">
                    {/* Thumbnail */}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-dark-border sm:h-20 sm:w-20">
                      {item.imagem_url ? (
                        <img
                          src={item.imagem_url}
                          alt={item.nome}
                          className="h-full w-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-nexus-600/15 text-nexus-300">
                          <BoxIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          {item.fabricante && (
                            <p className="text-[11px] font-medium uppercase tracking-widest text-nexus-500">{item.fabricante}</p>
                          )}
                          <h3 className="truncate font-medium text-white">{item.nome}</h3>
                          <p className="mt-1 text-sm text-nexus-300">{formatCurrency(item.preco_unitario)} / unid.</p>
                        </div>
                        {/* Botão remover → abre modal personalizado */}
                        <button
                          type="button"
                          id={`remove-item-${item.id}`}
                          onClick={() => handleRemoveClick(item)}
                          className="group inline-flex w-fit items-center gap-1.5 rounded-xl border border-transparent px-3 py-1.5 text-xs font-medium text-nexus-400 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                          aria-label={`Remover ${item.nome} do carrinho`}
                        >
                          <TrashIcon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                          Remover
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        {/* Controle de quantidade */}
                        <div className="neumorphic flex items-center rounded-xl p-1" aria-label={`Quantidade de ${item.nome}`}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-nexus-300 transition-colors hover:bg-dark-hover hover:text-white"
                            aria-label={`Diminuir quantidade de ${item.nome}`}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            value={item.quantidade}
                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                            className="w-10 border-0 bg-transparent p-0 text-center text-sm font-semibold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            aria-label={`Quantidade de ${item.nome}`}
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-nexus-300 transition-colors hover:bg-dark-hover hover:text-white"
                            aria-label={`Aumentar quantidade de ${item.nome}`}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Subtotal do item */}
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wide text-nexus-500">Subtotal</p>
                          <p className="mt-1 font-display text-lg font-semibold text-white">
                            {formatCurrency(getItemSubtotal(item))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Resumo lateral */}
          <aside className="glass rounded-3xl p-5 shadow-glass sm:p-6 xl:sticky xl:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nexus-400">Resumo do pedido</p>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 text-nexus-400">
                <dt>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</dt>
                <dd className="font-medium text-white">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 text-nexus-400">
                <dt>Entrega</dt>
                <dd className="font-medium text-nexus-300">Grátis</dd>
              </div>
              <div className="border-t border-dark-border pt-4">
                <div className="flex items-end justify-between gap-4">
                  <dt className="font-display text-lg font-semibold text-white">Total geral</dt>
                  <dd className="font-display text-2xl font-semibold text-gourmet-champagne">
                    {formatCurrency(subtotal)}
                  </dd>
                </div>
              </div>
            </dl>
            <Link to="/checkout" className="btn-primary mt-7 w-full gap-2">
              Ir para pagamento
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              to="/itens"
              className="mt-4 inline-flex w-full items-center justify-center text-sm font-medium text-nexus-400 transition-colors hover:text-nexus-300"
            >
              Continuar comprando
            </Link>
          </aside>
        </div>
      </section>

      {/* Modal de confirmação de remoção */}
      {pendingRemove && (
        <RemoveItemModal
          item={pendingRemove}
          onConfirm={handleRemoveConfirm}
          onCancel={handleRemoveCancel}
        />
      )}
    </>
  );
}

/* ─── Icons ─── */
function CartIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-1.2 2.4A1 1 0 0 0 6.7 17H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
    </svg>
  );
}
function BoxIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m20 7-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
    </svg>
  );
}
function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7 18 19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7m4 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
    </svg>
  );
}
function XMarkIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
function MinusIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
    </svg>
  );
}
function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
    </svg>
  );
}
function ArrowRightIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0-5 5m5-5H6" />
    </svg>
  );
}
