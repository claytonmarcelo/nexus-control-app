import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { itemService } from '../../services/services';
import { useModal } from '../../contexts/ModalContext';
import { useCart } from '../../contexts/CartContext';
import LoadingScreen from '../ui/LoadingScreen';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import ItemFormModal from './ItemFormModal';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

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

function ProductCard({ item, user, isAdmin, isFuncionario, isCliente, onEdit, onDelete, onAddToCart, deletingId }) {
  const [imgError, setImgError] = useState(false);
  const catStyle = getCategoryStyle(item.categoria);
  const isOwn = item.criado_por === user?.id;
  const canEdit = isAdmin || isFuncionario || isOwn;
  const canDelete = isAdmin || (isFuncionario && isOwn);

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
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${catStyle.split(' ').slice(0, 2).join(' ')}`}>
            <BoxIcon className="h-16 w-16 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-card/90 via-transparent to-transparent" />
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
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-nexus-500 uppercase tracking-wide">Aluguel/mês</span>
              <span className="text-sm font-semibold text-nexus-300">{formatCurrency(item.valor_aluguel_mensal)}</span>
            </div>
          )}
        </div>

        {/* Client CTA buttons */}
        {isCliente && (
          <div className="flex flex-col gap-2 pt-1">
            {item.valor_venda > 0 && (
              <button
                id={`add-to-cart-${item.id}`}
                className="btn-primary w-full gap-2 py-2.5 text-xs"
                onClick={() => onAddToCart(item, 'compra')}
              >
                <CartPlusIcon className="h-4 w-4" />
                Adicionar ao carrinho
              </button>
            )}
            {item.valor_aluguel_mensal > 0 && (
              <button
                id={`rent-${item.id}`}
                className="btn-secondary w-full gap-2 py-2.5 text-xs"
                onClick={() => onAddToCart(item, 'aluguel')}
              >
                <ClockIcon className="h-4 w-4" />
                Alugar por mês
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function Items() {
  const { user, isAdmin, isFuncionario, isCliente } = useAuth();
  const { toast, confirm } = useModal();
  const { addItem } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await itemService.getAll({ limit: 100 });
      setItems(response.items || []);
    } catch {
      toast({ message: 'Erro ao carregar catálogo', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleAddToCart = (item, tipo) => {
    if (tipo === 'compra') {
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
      });
      toast({ message: `"${item.nome}" adicionado ao carrinho!`, variant: 'success' });
    } else {
      addItem({
        id: `${item.id}-aluguel`,
        item_id: item.id,
        nome: `${item.nome} (Aluguel/mês)`,
        descricao: item.descricao,
        fabricante: item.fabricante,
        imagem_url: item.imagem_url,
        preco_unitario: item.valor_aluguel_mensal,
        valor_aluguel_mensal: item.valor_aluguel_mensal,
        categoria: item.categoria,
      });
      toast({ message: `"${item.nome}" (aluguel) adicionado ao carrinho!`, variant: 'success' });
    }
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
    try {
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
    } catch (error) {
      throw error;
    }
  };

  const categories = ['Todos', ...Array.from(new Set(items.map(i => i.categoria).filter(Boolean)))];

  const filteredItems = items.filter(item => {
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
        {/* Category pills */}
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
          description={search || activeCategory !== 'Todos' ? 'Tente alterar o filtro ou a busca' : 'Nenhum produto cadastrado ainda.'}
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