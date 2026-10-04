import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { checkoutService } from '../../services/services';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));
  } catch {
    return '—';
  }
};

const STATUS_MAP = {
  pendente:    { label: 'Pendente',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)' },
  pago:        { label: 'Pago',        color: '#10b981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.25)' },
  aprovado:    { label: 'Aprovado',    color: '#10b981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.25)' },
  cancelado:   { label: 'Cancelado',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)' },
  concluido:   { label: 'Concluído',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.25)' },
  processando: { label: 'Processando',color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)' },
};

function getStatus(order) {
  const raw = (order.status_pagamento || order.status_pedido || 'pendente').toLowerCase();
  return STATUS_MAP[raw] || { label: raw, color: '#d4af37', bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.25)' };
}

export default function OrdersSummaryWidget({ maxItems = 3, showAll = false }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await checkoutService.getMyOrders({ limit: showAll ? 50 : maxItems + 2 });
      const list = Array.isArray(data?.orders)
        ? data.orders
        : Array.isArray(data)
        ? data
        : [];
      setOrders(list);
    } catch (err) {
      console.error('[OrdersSummaryWidget] Erro ao carregar pedidos:', err);
      setError('Não foi possível carregar seus pedidos.');
    } finally {
      setLoading(false);
    }
  }, [maxItems, showAll]);

  useEffect(() => { load(); }, [load]);

  // — LOADING —
  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Meus Pedidos
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }}>
              <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: 'var(--border-color)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded" style={{ backgroundColor: 'var(--border-color)' }} />
                <div className="h-2 w-1/3 rounded" style={{ backgroundColor: 'var(--border-color)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // — ERROR —
  if (error) {
    return (
      <div className="card p-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          Meus Pedidos
        </h2>
        <div className="flex flex-col items-center py-4 gap-2 text-center">
          <AlertIcon className="w-5 h-5" style={{ color: '#ef4444' }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{error}</p>
          <button
            onClick={load}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--accent-gold)', backgroundColor: 'var(--accent-gold-faint)', border: '1px solid var(--accent-gold-border)' }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const displayed = showAll ? orders : orders.slice(0, maxItems);

  // — EMPTY —
  if (orders.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Meus Pedidos
          </h2>
        </div>
        <div className="flex flex-col items-center py-6 gap-2 text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
            style={{ backgroundColor: 'var(--accent-gold-faint)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold-border)' }}>
            <ShoppingBagIcon className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Nenhum pedido realizado ainda.</p>
          <Link
            to="/itens"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all mt-1"
            style={{ color: 'var(--accent-gold)', backgroundColor: 'var(--accent-gold-faint)', border: '1px solid var(--accent-gold-border)' }}
          >
            Explorar catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'var(--divider)' }}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Meus Pedidos
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {orders.length} {orders.length === 1 ? 'pedido realizado' : 'pedidos realizados'}
          </p>
        </div>
        {orders.length > maxItems && !showAll && (
          <Link
            to="/checkout"
            className="text-xs font-semibold flex items-center gap-1 hover:underline"
            style={{ color: 'var(--accent-gold)' }}
          >
            Ver todos
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {displayed.map((order) => {
          const st = getStatus(order);
          const orderTotal = order.total ?? order.valor_total ?? 0;
          const itemCount = Array.isArray(order.itens) ? order.itens.length : (order.quantidade_itens ?? null);
          return (
            <div
              key={order.id}
              className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200"
              style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-gold-border)'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'var(--bg-elevated-1)'; }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: st.bg, border: `1px solid ${st.border}`, color: st.color }}>
                <ShoppingBagIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  Pedido #{String(order.id).padStart(4, '0')}
                  {itemCount != null && (
                    <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                      · {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                    </span>
                  )}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(order.criado_em || order.created_at)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: st.color, backgroundColor: st.bg, border: `1px solid ${st.border}` }}
                >
                  {st.label}
                </span>
                {orderTotal > 0 && (
                  <p className="text-xs font-bold" style={{ color: 'var(--accent-gold)' }}>
                    {formatCurrency(orderTotal)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShoppingBagIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function AlertIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}
