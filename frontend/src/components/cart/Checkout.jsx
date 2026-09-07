import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useModal } from '../../contexts/ModalContext';
import { checkoutService } from '../../services/services';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(Number(value) || 0);

const INITIAL_CARD = {
  holder: '',
  number: '',
  expiry: '',
  cvv: '',
};

export default function Checkout() {
  const { items, totalItems, subtotal, clearCart, getItemSubtotal } = useCart();
  const { toast } = useModal();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [card, setCard] = useState(INITIAL_CARD);
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [countdown, setCountdown] = useState(4);

  const fallbackPixCopyPaste = useMemo(() => (
    `00020126360014BR.GOV.BCB.PIX0114NEXUSCONTROL520400005303986540${subtotal.toFixed(2).replace('.', '')}5802BR5913NEXUS CONTROL6009SAO PAULO62070503***6304`
  ), [subtotal]);

  useEffect(() => {
    if (!items.length && !completedOrder) {
      navigate('/carrinho', { replace: true });
    }
  }, [items.length, completedOrder, navigate]);

  useEffect(() => {
    if (!completedOrder) return undefined;

    const redirectTimer = window.setTimeout(() => {
      if (countdown <= 1) {
        clearCart();
        navigate('/dashboard', { replace: true });
        return;
      }

      setCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(redirectTimer);
  }, [completedOrder, countdown, clearCart, navigate]);

  const updateCard = (field, value) => {
    if (field === 'number') {
      const digits = value.replace(/\D/g, '').slice(0, 19);
      setCard((current) => ({ ...current, number: digits.replace(/(.{4})/g, '$1 ').trim() }));
      return;
    }

    if (field === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      setCard((current) => ({
        ...current,
        expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits,
      }));
      return;
    }

    if (field === 'cvv') {
      setCard((current) => ({ ...current, cvv: value.replace(/\D/g, '').slice(0, 4) }));
      return;
    }

    setCard((current) => ({ ...current, [field]: value }));
  };

  const validateCard = () => {
    const digits = card.number.replace(/\D/g, '');

    if (card.holder.trim().length < 3) return 'Informe o nome impresso no cartão.';
    if (digits.length < 13) return 'Informe um número de cartão válido.';
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return 'Informe a validade no formato MM/AA.';
    if (card.cvv.length < 3) return 'Informe o código de segurança do cartão.';

    return null;
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(fallbackPixCopyPaste);
      toast({ message: 'Código Pix copiado para a área de transferência.', variant: 'success' });
    } catch {
      toast({ message: 'Não foi possível copiar automaticamente. Selecione o código para copiá-lo.', variant: 'warning' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!items.length || submitting) return;

    if (paymentMethod === 'credito') {
      const validationError = validateCard();
      if (validationError) {
        toast({ message: validationError, variant: 'warning' });
        return;
      }
    }

    setSubmitting(true);
    try {
      const backendPaymentMethod = paymentMethod === 'credito' ? 'cartao' : 'pix';

      const checkoutData = {
        items: items.map(item => ({
          item_id: Number(item.item_id || String(item.id).split('-')[0]),
          quantidade: Number(item.quantidade),
          preco: Number(item.preco_unitario)
        })),
        total: Number(subtotal),
        metodo_pagamento: backendPaymentMethod
      };

      const order = await checkoutService.create(checkoutData);

      setCompletedOrder(order);
      setCountdown(4);
    } catch (error) {
      toast({
        message: error.response?.data?.message || 'Não foi possível confirmar seu pagamento. Tente novamente.',
        variant: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length && !completedOrder) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center text-sm text-nexus-400">
        Redirecionando para o carrinho…
      </div>
    );
  }

  return (
    <>
      <section className="space-y-6 animate-fade-in">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nexus-400">Checkout protegido</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">Finalizar pedido</h1>
            <p className="mt-2 text-sm text-nexus-400">Revise sua seleção e escolha a forma de pagamento.</p>
          </div>
          <Link to="/carrinho" className="inline-flex items-center gap-2 text-sm font-medium text-nexus-400 transition-colors hover:text-nexus-300">
            <ArrowLeftIcon className="h-5 w-5" />
            Voltar ao carrinho
          </Link>
        </header>

        <form onSubmit={handleSubmit} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="glass rounded-3xl p-5 shadow-glass sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-nexus-500/30 bg-nexus-600/15 text-sm font-semibold text-nexus-300">1</span>
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">Forma de pagamento</h2>
                  <p className="text-sm text-nexus-400">Escolha como deseja concluir este pedido.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Forma de pagamento">
                <PaymentOption
                  active={paymentMethod === 'pix'}
                  icon={<PixIcon className="h-6 w-6" />}
                  title="Pix"
                  description="Aprovação imediata"
                  onClick={() => setPaymentMethod('pix')}
                />
                <PaymentOption
                  active={paymentMethod === 'credito'}
                  icon={<CardIcon className="h-6 w-6" />}
                  title="Cartão de crédito"
                  description="Dados protegidos"
                  onClick={() => setPaymentMethod('credito')}
                />
              </div>

              {paymentMethod === 'pix' ? (
                <PixPayment copyPaste={fallbackPixCopyPaste} onCopy={handleCopyPix} />
              ) : (
                <CreditCardForm card={card} onChange={updateCard} />
              )}
            </section>

            <section className="glass overflow-hidden rounded-3xl shadow-glass">
              <div className="flex items-center gap-3 border-b border-dark-border px-5 py-4 sm:px-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-nexus-500/30 bg-nexus-600/15 text-sm font-semibold text-nexus-300">2</span>
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">Resumo do pedido</h2>
                  <p className="text-sm text-nexus-400">{totalItems} {totalItems === 1 ? 'item selecionado' : 'itens selecionados'}</p>
                </div>
              </div>
              <ul className="divide-y divide-dark-border">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{item.nome}</p>
                      <p className="mt-1 text-sm text-nexus-400">{item.quantidade} × {formatCurrency(item.preco_unitario)}</p>
                    </div>
                    <p className="shrink-0 font-medium text-nexus-300">{formatCurrency(getItemSubtotal(item))}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="glass rounded-3xl p-5 shadow-glass sm:p-6 xl:sticky xl:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nexus-400">Total do pedido</p>
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 text-nexus-400">
                <span>Subtotal</span>
                <span className="font-medium text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-nexus-400">
                <span>Entrega</span>
                <span className="font-medium text-nexus-300">Grátis</span>
              </div>
              <div className="border-t border-dark-border pt-4">
                <div className="flex items-end justify-between gap-4">
                  <span className="font-display text-lg font-semibold text-white">Total geral</span>
                  <span className="font-display text-2xl font-semibold text-gourmet-champagne">{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary mt-7 w-full gap-2">
              {submitting ? <SpinnerIcon className="h-5 w-5 animate-spin" /> : <LockIcon className="h-5 w-5" />}
              {submitting ? 'Confirmando pagamento…' : `Pagar com ${paymentMethod === 'pix' ? 'Pix' : 'cartão'}`}
            </button>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-nexus-500">
              <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-nexus-400" />
              Os dados de pagamento são usados somente para confirmar este pedido.
            </p>
          </aside>
        </form>
      </section>

      {completedOrder && <SuccessOverlay order={completedOrder} countdown={countdown} />}
    </>
  );
}

function PaymentOption({ active, icon, title, description, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
        active
          ? 'border-nexus-500 bg-nexus-600/15 shadow-champagne'
          : 'border-dark-border bg-dark-card/40 hover:border-nexus-500/50 hover:bg-dark-hover'
      }`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? 'bg-nexus-600/30 text-nexus-300' : 'bg-dark-hover text-nexus-400'}`}>
        {icon}
      </span>
      <span>
        <span className="block font-medium text-white">{title}</span>
        <span className="mt-0.5 block text-xs text-nexus-400">{description}</span>
      </span>
    </button>
  );
}

function PixPayment({ copyPaste, onCopy }) {
  return (
    <div className="mt-6 rounded-2xl border border-nexus-500/20 bg-nexus-600/[0.07] p-4 sm:p-5">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0 rounded-2xl bg-white p-3 shadow-champagne" aria-label="Representação visual do QR Code Pix">
          <QrCodePlaceholder />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-white">Pague com Pix</h3>
          <p className="mt-1 text-sm leading-6 text-nexus-400">
            Aponte a câmera para o QR Code ou copie o código abaixo no aplicativo do seu banco.
          </p>
          <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-nexus-400" htmlFor="pix-copy-paste">Pix Copia e Cola</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input id="pix-copy-paste" readOnly value={copyPaste} className="neumorphic-inner min-w-0 flex-1 border border-dark-border px-3 py-2.5 text-xs text-white outline-none" />
            <button type="button" onClick={onCopy} className="btn-secondary shrink-0 gap-2 px-4 py-2.5">
              <CopyIcon className="h-4 w-4" />
              Copiar
            </button>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-nexus-500">
            <CheckIcon className="h-4 w-4 text-nexus-400" />
            Código gerado para este ambiente de pagamento.
          </p>
        </div>
      </div>
    </div>
  );
}

function CreditCardForm({ card, onChange }) {
  return (
    <div className="neumorphic mt-6 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-nexus-600/20 text-nexus-300">
          <CardIcon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-medium text-white">Dados do cartão</h3>
          <p className="text-sm text-nexus-400">Simulação segura: apenas os quatro últimos dígitos são enviados.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="card-holder">Nome impresso no cartão</label>
          <input
            id="card-holder"
            value={card.holder}
            onChange={(event) => onChange('holder', event.target.value)}
            autoComplete="cc-name"
            placeholder="NOME COMO ESTÁ NO CARTÃO"
            className="neumorphic-inner w-full border border-dark-border px-4 py-3 text-sm text-white placeholder:text-nexus-500 outline-none transition focus:border-nexus-500 focus:ring-2 focus:ring-nexus-500/30"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="card-number">Número do cartão</label>
          <div className="relative">
            <CardIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-nexus-400" />
            <input
              id="card-number"
              value={card.number}
              onChange={(event) => onChange('number', event.target.value)}
              autoComplete="cc-number"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              className="neumorphic-inner w-full border border-dark-border py-3 pl-12 pr-4 text-sm text-white placeholder:text-nexus-500 outline-none transition focus:border-nexus-500 focus:ring-2 focus:ring-nexus-500/30"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="card-expiry">Validade</label>
          <input
            id="card-expiry"
            value={card.expiry}
            onChange={(event) => onChange('expiry', event.target.value)}
            autoComplete="cc-exp"
            inputMode="numeric"
            placeholder="MM/AA"
            className="neumorphic-inner w-full border border-dark-border px-4 py-3 text-sm text-white placeholder:text-nexus-500 outline-none transition focus:border-nexus-500 focus:ring-2 focus:ring-nexus-500/30"
          />
        </div>
        <div>
          <label className="label" htmlFor="card-cvv">CVV</label>
          <input
            id="card-cvv"
            value={card.cvv}
            onChange={(event) => onChange('cvv', event.target.value)}
            autoComplete="cc-csc"
            inputMode="numeric"
            type="password"
            placeholder="•••"
            className="neumorphic-inner w-full border border-dark-border px-4 py-3 text-sm text-white placeholder:text-nexus-500 outline-none transition focus:border-nexus-500 focus:ring-2 focus:ring-nexus-500/30"
          />
        </div>
      </div>
    </div>
  );
}

function SuccessOverlay({ order, countdown }) {
  const orderReference = order?.pedido?.numero || order?.pedido?.id || order?.numero || order?.id;
  const progress = Math.min(100, Math.max(0, ((4 - countdown) / 4) * 100));

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="payment-success-title">
      <div className="glass w-full max-w-md rounded-3xl p-7 text-center shadow-glass-lg sm:p-9 animate-scale-in">
        <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full border border-green-400/30 bg-green-500/15 text-green-300 shadow-[0_0_36px_rgba(74,222,128,0.18)]">
          <SuccessIcon className="h-10 w-10" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-nexus-400">Pagamento confirmado</p>
        <h2 id="payment-success-title" className="mt-3 font-display text-2xl font-semibold text-white">Pedido recebido com sucesso!</h2>
        <p className="mt-3 text-sm leading-6 text-nexus-300">Seu pedido está sendo processado. Em breve você receberá as próximas atualizações.</p>
        {orderReference && <p className="mt-4 text-xs text-nexus-500">Pedido #{orderReference}</p>}
        <div className="mt-7">
          <p className="text-sm text-nexus-400">Redirecionando automaticamente em <span className="font-semibold text-nexus-300">{countdown}s</span></p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-dark-hover">
            <div className="h-full rounded-full bg-gradient-to-r from-nexus-600 to-nexus-300 transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QrCodePlaceholder() {
  const size = 21;
  const cells = [];

  const finderCell = (row, column, top, left) => {
    const y = row - top;
    const x = column - left;
    if (x < 0 || x > 6 || y < 0 || y > 6) return null;
    return x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
  };

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const finder = finderCell(row, column, 0, 0) ?? finderCell(row, column, 0, 14) ?? finderCell(row, column, 14, 0);
      const dark = finder ?? ((row * 11 + column * 7 + row * column) % 5 < 2 && row !== 6 && column !== 6);
      if (dark) {
        cells.push(<rect key={`${row}-${column}`} x={column} y={row} width="1" height="1" fill="#121212" />);
      }
    }
  }

  return <svg viewBox="0 0 21 21" className="h-32 w-32 rounded-sm" aria-hidden="true">{cells}</svg>;
}

function PixIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m12 3 3.4 3.4a2.1 2.1 0 0 0 1.48.62h1.34a2.1 2.1 0 0 1 1.48.61l1.68 1.68a2.1 2.1 0 0 1 0 2.97l-1.68 1.68a2.1 2.1 0 0 1-1.48.61h-1.34a2.1 2.1 0 0 0-1.48.62L12 18.6l-3.4-3.4a2.1 2.1 0 0 0-1.48-.62H5.78a2.1 2.1 0 0 1-1.48-.61L2.62 12.3a2.1 2.1 0 0 1 0-2.97L4.3 7.65a2.1 2.1 0 0 1 1.48-.61h1.34a2.1 2.1 0 0 0 1.48-.62L12 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m8 12 4-4 4 4-4 4-4-4Z" />
    </svg>
  );
}

function CardIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.8" />
      <path strokeLinecap="round" strokeWidth="1.8" d="M3 10h18M7 15h3" />
    </svg>
  );
}

function ArrowLeftIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m11 17-5-5m0 0 5-5m-5 5h12" />
    </svg>
  );
}

function CopyIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" strokeWidth="1.8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 12 4 4L19 6" />
    </svg>
  );
}

function LockIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" strokeWidth="1.8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3 5 6v5c0 4.55 2.9 8.68 7 10 4.1-1.32 7-5.45 7-10V6l-7-3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m9.5 12 1.7 1.7 3.5-3.5" />
    </svg>
  );
}

function SpinnerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3Z" />
    </svg>
  );
}

function SuccessIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="m5 12 4 4L19 6" />
    </svg>
  );
}
