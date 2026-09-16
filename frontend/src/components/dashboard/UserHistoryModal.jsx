import { useState, useEffect } from 'react';
import { checkoutService } from '../../services/services';
import { useModal } from '../../contexts/ModalContext';
import { formatDate } from '../../utils/date';
import Spinner from '../ui/Spinner';

export default function UserHistoryModal({ isOpen, onClose, user }) {
  const { toast, confirm } = useModal();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserOrders();
    }
  }, [isOpen, user]);

  const loadUserOrders = async () => {
    setLoading(true);
    try {
      const data = await checkoutService.getUserOrdersByAdmin(user.id);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar pedidos do usuário:', error);
      toast({ message: 'Erro ao carregar histórico de compras deste usuário', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmed = await confirm({
      title: 'Excluir registro de compra',
      message: `Tem certeza que deseja excluir o pedido #${orderId} do histórico deste usuário? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir Definitivamente',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeletingId(orderId);
    try {
      await checkoutService.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast({ message: 'Pedido excluído do histórico com sucesso!', variant: 'success' });
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      toast({ message: error.response?.data?.message || 'Erro ao excluir pedido', variant: 'danger' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await checkoutService.updateOrder(orderId, { status_pagamento: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status_pagamento: newStatus } : o));
      toast({ message: `Status do pedido #${orderId} atualizado para ${newStatus}!`, variant: 'success' });
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      toast({ message: 'Erro ao atualizar status do pedido', variant: 'danger' });
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isOpen) return null;

  const formatBRL = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const totalGasto = orders.reduce((acc, order) => {
    if (order.status_pagamento !== 'cancelado') {
      return acc + (Number(order.total) || 0);
    }
    return acc;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal Window */}
        <div className="relative w-full max-w-4xl rounded-2xl bg-dark-card border border-dark-border shadow-2xl p-6 md:p-8 space-y-6 text-white my-8 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-dark-border pb-4 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-nexus-500/10 text-nexus-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </span>
                <h2 className="text-xl font-bold text-white">Histórico de Compras do Usuário</h2>
              </div>
              <p className="text-sm text-nexus-400 mt-1">
                Visualização e gestão administrativa das compras de <strong className="text-white">{user?.nome}</strong> ({user?.email})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-nexus-400 hover:text-white hover:bg-dark-hover transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-shrink-0">
            <div className="bg-dark-surface p-3.5 rounded-xl border border-dark-border">
              <span className="text-xs text-nexus-400">Total de Pedidos</span>
              <p className="text-xl font-bold text-white mt-1">{orders.length}</p>
            </div>
            <div className="bg-dark-surface p-3.5 rounded-xl border border-dark-border">
              <span className="text-xs text-nexus-400">Total Investido (Válido)</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">{formatBRL(totalGasto)}</p>
            </div>
            <div className="bg-dark-surface p-3.5 rounded-xl border border-dark-border flex items-center justify-between">
              <div>
                <span className="text-xs text-nexus-400">Nível do Usuário</span>
                <p className="text-sm font-semibold capitalize text-nexus-300 mt-1">{user?.nivel_acesso || 'Cliente'}</p>
              </div>
              <button
                onClick={loadUserOrders}
                disabled={loading}
                className="p-2 rounded-lg bg-dark-hover hover:bg-nexus-600/20 text-nexus-300 transition-colors"
                title="Atualizar lista"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Orders Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Spinner size="lg" />
                <p className="text-sm text-nexus-400">Carregando pedidos do usuário...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-dark-border bg-dark-surface/50">
                <svg className="w-12 h-12 text-nexus-500 mx-auto mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-base font-semibold text-white">Nenhum pedido registrado</p>
                <p className="text-sm text-nexus-400 mt-1">Este usuário ainda não realizou compras na plataforma.</p>
              </div>
            ) : (
              orders.map((order) => {
                const items = Array.isArray(order.items)
                  ? order.items
                  : typeof order.items === 'string'
                  ? JSON.parse(order.items)
                  : Array.isArray(order.itens)
                  ? order.itens
                  : [];
                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-xl border border-dark-border bg-dark-surface hover:border-nexus-500/40 transition-all space-y-4"
                  >
                    {/* Order header row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-dark-border/60">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-nexus-300">
                          #{order.id}
                        </span>
                        <span className="text-xs text-nexus-400">
                          {formatDate(order.criado_em)}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-dark-card border border-dark-border text-nexus-300">
                          {order.metodo_pagamento || 'PIX'}
                        </span>
                      </div>

                      {/* Status and Action Buttons */}
                      <div className="flex items-center gap-3">
                        <select
                          value={order.status_pagamento || 'pendente'}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          className="text-xs font-semibold rounded-lg px-2.5 py-1 bg-dark-card border border-dark-border text-white focus:ring-1 focus:ring-nexus-500 outline-none"
                        >
                          <option value="pendente">⏳ Pendente</option>
                          <option value="aprovado">✅ Aprovado</option>
                          <option value="concluido">🎉 Concluído</option>
                          <option value="cancelado">❌ Cancelado</option>
                        </select>

                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={deletingId === order.id}
                          className="p-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1"
                          title="Excluir do histórico"
                        >
                          {deletingId === order.id ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="hidden sm:inline">Excluir</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Order Items list */}
                    <div className="space-y-2">
                      {items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-dark-card/40 border border-dark-border/40"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-nexus-400"></span>
                            <span className="text-white font-medium">{it.item_nome || it.nome || `Item #${it.item_id}`}</span>
                            <span className="text-nexus-400 text-xs">x{it.quantidade}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-white">
                              {formatBRL(it.subtotal || (Number(it.preco_unitario) * Number(it.quantidade)))}
                            </span>
                            <span className="text-xs text-nexus-500 block">
                              {formatBRL(it.preco_unitario)} un.
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order summary footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-dark-border/60 text-sm">
                      <span className="text-nexus-400 text-xs">
                        Total de {items.length} {items.length === 1 ? 'item' : 'itens'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-nexus-400 text-xs uppercase tracking-wider">Total do Pedido:</span>
                        <span className="text-base font-bold text-emerald-400">
                          {formatBRL(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end pt-4 border-t border-dark-border flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-dark-surface hover:bg-dark-hover text-white text-sm font-medium transition-colors border border-dark-border"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
