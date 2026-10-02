import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { itemService } from '../../services/services';
import { useModal } from '../../contexts/ModalContext';
import { useCart } from '../../contexts/CartContext';
import { calcDailyRate, calcRentalTotal } from '../../contexts/CartContext';
import LoadingScreen from '../ui/LoadingScreen';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import ItemFormModal from './ItemFormModal';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

const MIN_RENTAL_DAYS = 7;
const MAX_RENTAL_DAYS = 365;
const QUICK_DAYS = [7, 14, 30, 60, 90, 180];

const CATEGORY_COLORS = {
  Servidores: 'from-blue-600/30 to-blue-800/10 border-blue-500/20 text-blue-300',
  Rede: 'from-cyan-600/30 to-cyan-800/10 border-cyan-500/20 text-cyan-300',
  Segurança: 'from-red-600/30 to-red-800/10 border-red-500/20 text-red-300',
  Energia: 'from-yellow-600/30 to-yellow-800/10 border-yellow-500/20 text-yellow-300',
  Serviços: 'from-purple-600/30 to-purple-800/10 border-purple-500/20 text-purple-300',
  default: 'from-nexus-600/20 to-nexus-800/10 border-nexus-500/20 text-nexus-300',
};

function getCategoryStyle(categoria) {
  return CATEGORY_COLORS[categoria] || CATEGORY_COLORS.default;
}

/* ─────────────────────────────────────────────────────────
   RENTAL DAYS PICKER MODAL
───────────────────────────────────────────────────────── */
function RentalDaysModal({ item, onConfirm, onCancel }) {
  const [dias, setDias] = useState(MIN_RENTAL_DAYS);
  const sliderRef = useRef(null);

  const sliderPct = ((dias - MIN_RENTAL_DAYS) / (MAX_RENTAL_DAYS - MIN_RENTAL_DAYS)) * 100;
  const dailyRate = calcDailyRate(item.valor_aluguel_mensal, dias);
  const totalRental = calcRentalTotal(item.valor_aluguel_mensal, dias);

  // Update slider CSS custom property for fill effect
  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.style.setProperty('--slider-pct', `${sliderPct.toFixed(1)}%`);
    }
  }, [sliderPct]);

  // Close on ESC
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const setSafeDays = (val) => {
    const v = Math.max(MIN_RENTAL_DAYS, Math.min(MAX_RENTAL_DAYS, Math.round(Number(val) || MIN_RENTAL_DAYS)));
    setDias(v);
  };

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 1);
  const returnDate = new Date(deliveryDate);
  returnDate.setDate(returnDate.getDate() + dias);

  const formatDate = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  // Determine tier label and discount message
  const tierLabel = dias <= 14 ? 'Curto Prazo' : dias <= 30 ? 'Médio Prazo (-10%)' : dias <= 90 ? 'Longo Prazo (-20%)' : 'Plano Fidelidade (-26%)';
  const tierColor = dias <= 14 ? '#f59e0b' : dias <= 30 ? '#10b981' : dias <= 90 ? '#3b82f6' : '#a855f7';

  return (
    <div
      className="rental-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rental-modal-title"
    >
      <div className="rental-modal">
        {/* Header Compacto */}
        <div className="rental-modal-header">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-nexus-500/30 bg-nexus-500/10 shrink-0">
              <ClockIcon className="h-4 w-4 text-nexus-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-500 block leading-tight">Nexus Rent · Locação</span>
              <h2 id="rental-modal-title" className="text-sm font-bold text-white truncate leading-tight">
                {item.nome}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-nexus-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
            aria-label="Fechar modal de aluguel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body Compacto */}
        <div className="rental-modal-body">
          {/* Status e Faixa de Preço */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-nexus-400 font-medium">
              Base: <strong className="text-white">{formatCurrency(item.valor_aluguel_mensal)}/mês</strong>
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: `${tierColor}15`, border: `1px solid ${tierColor}40`, color: tierColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: tierColor }} />
              {tierLabel}
            </span>
          </div>

          {/* Stepper + Display de Dias */}
          <div className="rental-days-display">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSafeDays(dias - 1)}
                disabled={dias <= MIN_RENTAL_DAYS}
                className="w-8 h-8 rounded-lg bg-dark-bg/60 border border-nexus-500/20 text-nexus-300 hover:bg-nexus-500/20 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-base transition-colors"
                aria-label="Diminuir 1 dia"
              >
                −
              </button>
              <div className="text-center">
                <div className="rental-days-number leading-none">{dias} <span className="text-sm font-normal text-nexus-400">dias</span></div>
                <div className="text-[11px] text-nexus-400 mt-1">
                  📅 {formatDate(deliveryDate)} até {formatDate(returnDate)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSafeDays(dias + 1)}
                disabled={dias >= MAX_RENTAL_DAYS}
                className="w-8 h-8 rounded-lg bg-dark-bg/60 border border-nexus-500/20 text-nexus-300 hover:bg-nexus-500/20 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-base transition-colors"
                aria-label="Aumentar 1 dia"
              >
                +
              </button>
            </div>

            {/* Slider de Dias */}
            <div className="mt-2.5">
              <input
                ref={sliderRef}
                type="range"
                min={MIN_RENTAL_DAYS}
                max={MAX_RENTAL_DAYS}
                step={1}
                value={dias}
                onChange={(e) => setSafeDays(e.target.value)}
                className="rental-days-slider"
                aria-label="Controle deslizante de dias de aluguel"
                id="rental-days-slider"
              />
            </div>
          </div>

          {/* Seleção rápida em botões compactos */}
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-semibold text-nexus-500 uppercase tracking-wider shrink-0">Atalhos:</span>
            <div className="rental-quick-days flex-1">
              {QUICK_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSafeDays(d)}
                  className={`rental-quick-btn ${dias === d ? 'active' : ''}`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Resumo financeiro inteligente */}
          <div className="rental-price-breakdown">
            <div className="rental-price-row">
              <span>Diária calculada:</span>
              <span className="text-nexus-200 font-semibold">{formatCurrency(dailyRate)}/dia</span>
            </div>
            <div className="rental-price-row total">
              <span>Investimento total ({dias} dias):</span>
              <span className="rental-price-total-value">{formatCurrency(totalRental)}</span>
            </div>
          </div>

          {/* Aviso corporativo Nexus */}
          <div className="rental-info-badge">
            <svg className="w-3.5 h-3.5 shrink-0 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[11px] leading-tight text-nexus-300">
              Garantia de disponibilidade imediata e substituição expressa Nexus Care inclusas.
            </span>
          </div>

          {/* Ações */}
          <div className="flex gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary py-2 px-3 text-xs flex-1"
              id="rental-modal-cancel"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(dias)}
              className="btn-primary py-2 px-3 text-xs flex-[1.6] justify-center gap-1.5 font-semibold"
              id="rental-modal-confirm"
            >
              <ClockIcon className="h-4 w-4" />
              <span>Alugar por {formatCurrency(totalRental)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PRODUCT CARD
───────────────────────────────────────────────────────── */
function ProductCard({ item, user, isAdmin, isFuncionario, onEdit, onDelete, onAddToCart, onRent, deletingId }) {
  const [imgError, setImgError] = useState(false);
  const catStyle = getCategoryStyle(item.categoria);
  const isOwn = item.criado_por === user?.id;
  const canEdit = isAdmin || isFuncionario || isOwn;
  const canDelete = isAdmin || (isFuncionario && isOwn);
  const available = item.estoque == null || Number(item.estoque) > 0;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-dark-border bg-dark-card transition-all duration-300 hover:border-nexus-500/40 hover:shadow-[0_0_32px_rgba(212,175,55,0.08)]"
      style={{ minHeight: 0 }}
    >
      {/* Image */}
      <div className="relative h-44 w-full overflow-hidden bg-dark-hover sm:h-48">
        {item.imagem_url && !imgError ? (
          <img
            src={item.imagem_url}
            alt={item.nome}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80"
            alt="Imagem não disponível"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-80"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/50 to-transparent opacity-90" />
        {/* Category badge */}
        <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm bg-dark-bg/70 ${catStyle.split(' ').slice(-1)}`}>
          {item.categoria}
        </span>
        {/* Admin/employee actions */}
        {(canEdit || canDelete) && (
          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {canEdit && (
              <button
                onClick={() => onEdit(item)}
                className="rounded-lg bg-dark-bg/80 p-1.5 text-nexus-400 backdrop-blur-sm transition hover:bg-dark-bg hover:text-nexus-200"
                aria-label="Editar"
              >
                <EditIcon className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(item)}
                disabled={deletingId === item.id}
                className="rounded-lg bg-dark-bg/80 p-1.5 text-red-400 backdrop-blur-sm transition hover:bg-dark-bg hover:text-red-300 disabled:opacity-50"
                aria-label="Excluir"
              >
                {deletingId === item.id
                  ? <Spinner size="sm" />
                  : <TrashIcon className="h-4 w-4" />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 gap-3">
        {item.fabricante && (
          <span className="text-[11px] font-medium uppercase tracking-widest text-nexus-500">{item.fabricante}</span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">{item.nome}</h3>
        {item.descricao && (
          <p className="line-clamp-2 text-xs leading-relaxed text-nexus-400">{item.descricao}</p>
        )}
        {item.estoque !== undefined && (
          <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.estoque > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {item.estoque > 0 ? `${item.estoque} em estoque` : 'Indisponível'}
          </span>
        )}

        {/* Prices */}
        <div className="mt-auto flex flex-col gap-1.5 pt-2 border-t border-dark-border/50">
          {item.valor_venda > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-nexus-500 uppercase tracking-wide">Compra</span>
              <span className="text-sm font-bold text-gourmet-champagne">{formatCurrency(item.valor_venda)}</span>
            </div>
          )}
          {item.valor_aluguel_mensal > 0 && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-nexus-500 uppercase tracking-wide">Aluguel</span>
                <span className="text-sm font-semibold text-nexus-300">{formatCurrency(item.valor_aluguel_mensal)}/mês</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-nexus-600 uppercase tracking-wide">Mín. 7 dias</span>
                <span className="text-[11px] text-nexus-500">
                  {formatCurrency(calcDailyRate(item.valor_aluguel_mensal, 7))}/dia
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {item.valor_venda > 0 && (
            <button
              id={`add-to-cart-${item.id}`}
              className="btn-primary w-full gap-2 py-2.5 text-xs"
              onClick={() => onAddToCart(item)}
              disabled={!available}
            >
              <CartPlusIcon className="h-4 w-4" />
              {available ? 'Adicionar ao carrinho' : 'Sem estoque'}
            </button>
          )}
          {item.valor_aluguel_mensal > 0 && (
            <button
              id={`rent-${item.id}`}
              className="btn-secondary w-full gap-2 py-2.5 text-xs"
              onClick={() => onRent(item)}
              disabled={!available}
            >
              <ClockIcon className="h-4 w-4" />
              {available ? 'Selecionar dias de aluguel' : 'Sem estoque'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN ITEMS COMPONENT
───────────────────────────────────────────────────────── */
export default function Items() {
  const { user, isAdmin, isFuncionario, isCliente } = useAuth();
  const { toast, confirm } = useModal();
  const { addItem } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [rentalModalItem, setRentalModalItem] = useState(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [search, setSearch] = useState(queryParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await itemService.getAll({ limit: 100 });
      const itemsData = response?.data?.items || response?.items || [];
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (error) {
      toast({ message: 'Erro ao carregar catálogo', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadItems(); }, [loadItems]);

  // Purchase: add directly
  const handleAddToCart = (item) => {
    addItem({
      id: item.id,
      item_id: item.id,
      nome: item.nome,
      descricao: item.descricao,
      fabricante: item.fabricante,
      imagem_url: item.imagem_url,
      preco_unitario: item.valor_venda,
      valor_venda: item.valor_venda,
      categoria: item.categoria,
      tipo: 'compra',
    });
    toast({ message: `"${item.nome}" adicionado ao carrinho!`, variant: 'success' });
  };

  // Rental: open modal to pick days
  const handleRent = (item) => {
    setRentalModalItem(item);
  };

  const handleRentalConfirm = (dias) => {
    const item = rentalModalItem;
    const totalRental = calcRentalTotal(item.valor_aluguel_mensal, dias);
    addItem({
      id: `${item.id}-aluguel`,
      item_id: item.id,
      nome: item.nome,
      descricao: item.descricao,
      fabricante: item.fabricante,
      imagem_url: item.imagem_url,
      preco_unitario: totalRental,
      categoria: item.categoria,
      tipo: 'aluguel',
      dias_aluguel: dias,
      valor_aluguel_mensal_base: item.valor_aluguel_mensal,
    });
    toast({
      message: `"${item.nome}" adicionado para aluguel de ${dias} dias — ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRental)}`,
      variant: 'success',
    });
    setRentalModalItem(null);
  };

  const handleDelete = async (item) => {
    const confirmed = await confirm({
      title: 'Excluir item',
      message: `Tem certeza que deseja excluir "${item.nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    setDeletingItem(item.id);
    try {
      await itemService.delete(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      toast({ message: 'Item excluído com sucesso', variant: 'success' });
    } catch {
      toast({ message: 'Erro ao excluir item', variant: 'danger' });
    } finally {
      setDeletingItem(null);
    }
  };

  const handleFormSubmit = async (data) => {
    if (editingItem) {
      await itemService.update(editingItem.id, data);
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...data } : i));
      toast({ message: 'Item atualizado com sucesso', variant: 'success' });
    } else {
      const newItem = await itemService.create(data);
      setItems(prev => [newItem.item, ...prev]);
      toast({ message: 'Item criado com sucesso', variant: 'success' });
    }
    setShowForm(false);
    setEditingItem(null);
  };

  const catalogItems = items.filter(item => Number(item.valor_venda) > 0 || Number(item.valor_aluguel_mensal) > 0);
  const categories = ['Todos', ...Array.from(new Set(catalogItems.map(i => i.categoria).filter(Boolean)))];

  const filteredItems = catalogItems.filter(item => {
    const matchesSearch =
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      item.fabricante?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || item.categoria === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nexus-500">Catálogo</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Produtos &amp; Serviços</h1>
          <p className="mt-1 text-sm text-nexus-400">{filteredItems.length} {filteredItems.length === 1 ? 'item encontrado' : 'itens encontrados'}</p>
        </div>
        {(isFuncionario || isAdmin) && (
          <button id="create-item-btn" onClick={() => { setEditingItem(null); setShowForm(true); }} className="btn-primary self-start sm:self-auto">
            <PlusIcon className="h-5 w-5 mr-2" /> Novo Item
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col rounded-xl border border-dark-border bg-dark-card p-4 transition-all hover:border-nexus-500/30 hover:shadow-lg">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-nexus-500">Total de Produtos</span>
          <span className="mt-1 text-3xl font-bold text-white">{catalogItems.length}</span>
        </div>
        <div className="flex flex-col rounded-xl border border-dark-border bg-dark-card p-4 transition-all hover:border-nexus-500/30 hover:shadow-lg">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-nexus-500">Categorias</span>
          <span className="mt-1 text-3xl font-bold text-white">{categories.length > 1 ? categories.length - 1 : 0}</span>
        </div>
        <div className="flex flex-col rounded-xl border border-dark-border bg-dark-card p-4 transition-all hover:border-nexus-500/30 hover:shadow-lg">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-nexus-500">Itens em Estoque</span>
          <span className="mt-1 text-3xl font-bold text-white">
            {catalogItems.reduce((acc, item) => acc + (item.estoque || 0), 0)}
          </span>
        </div>
        <div className="flex flex-col rounded-xl border border-dark-border bg-dark-card p-4 transition-all hover:border-nexus-500/30 hover:shadow-lg">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-nexus-500">Valor do Estoque</span>
          <span className="mt-1 text-xl sm:text-2xl font-bold text-gourmet-champagne">
            {formatCurrency(catalogItems.reduce((acc, item) => acc + ((item.estoque || 0) * (item.valor_venda || 0)), 0))}
          </span>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-lg w-full">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-nexus-500" />
          <input
            type="text"
            placeholder="Buscar por nome, fabricante ou descrição…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input w-full pl-12"
            aria-label="Buscar produtos"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro por categoria">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'border-nexus-500 bg-nexus-600/20 text-nexus-200'
                  : 'border-dark-border text-nexus-400 hover:border-nexus-500/40 hover:text-nexus-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<BoxIcon className="h-14 w-14" />}
          title="Nenhum item encontrado"
          description={search || activeCategory !== 'Todos' ? 'Tente alterar o filtro ou a busca' : 'Nenhum produto com preço de venda ou locação disponível no catálogo.'}
        />
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))' }}
        >
          {filteredItems.map(item => (
            <ProductCard
              key={item.id}
              item={item}
              user={user}
              isAdmin={isAdmin}
              isFuncionario={isFuncionario}
              isCliente={isCliente}
              onEdit={i => { setEditingItem(i); setShowForm(true); }}
              onDelete={handleDelete}
              onAddToCart={handleAddToCart}
              onRent={handleRent}
              deletingId={deletingItem}
            />
          ))}
        </div>
      )}

      <ItemFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingItem(null); }}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        loading={false}
      />

      {/* Rental Days Modal */}
      {rentalModalItem && (
        <RentalDaysModal
          item={rentalModalItem}
          onConfirm={handleRentalConfirm}
          onCancel={() => setRentalModalItem(null)}
        />
      )}
    </div>
  );
}

/* ---- Icons ---- */
function BoxIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
function EditIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
function CartPlusIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.2 2.4A1 1 0 006.7 17H17m0 0a2 2 0 100 4 2 2 0 000-4Zm-10 0a2 2 0 100 4 2 2 0 000-4Z" />
    </svg>
  );
}
function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 3" />
    </svg>
  );
}