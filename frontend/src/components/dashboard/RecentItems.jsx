import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { itemService } from '../../services/services';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/date';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

const CATEGORY_COLORS = {
  Servidores: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Rede: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Segurança: 'bg-red-500/10 text-red-400 border-red-500/20',
  Energia: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Serviços: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  default: 'bg-nexus-500/10 text-nexus-400 border-nexus-500/20',
};

export default function RecentItems() {
  const { isCliente } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecentItems = useCallback(async () => {
    try {
      const response = await itemService.getAll({ limit: 5 });
      const itemsList = Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.items)
        ? response.items
        : [];
      setItems(itemsList);
    } catch (error) {
      console.error('Erro ao carregar itens recentes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentItems();
  }, [loadRecentItems]);

  if (loading) {
    return (
      <div className="card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Itens Recentes</h2>
            <Link to="/itens" className="text-sm text-nexus-400 hover:text-nexus-300 transition-colors">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-dark-hover animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-dark-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-dark-border" />
                  <div className="h-3 w-1/2 rounded bg-dark-border" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Itens Recentes</h2>
          <Link to="/itens" className="text-sm text-nexus-400 hover:text-nexus-300 transition-colors">
            Ver todos
          </Link>
        </div>
        
        {items.length === 0 ? (
          <div className="text-center py-8">
            <BoxIcon className="w-12 h-12 mx-auto text-nexus-500 mb-3 opacity-50" />
            <p className="text-nexus-400">Nenhum item cadastrado ainda</p>
            {isCliente && (
              <Link to="/itens" className="mt-4 inline-flex items-center gap-2 text-nexus-400 hover:text-nexus-300 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Criar primeiro item
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const catStyle = CATEGORY_COLORS[item.categoria] || CATEGORY_COLORS.default;
              return (
                <Link
                  key={item.id}
                  to={`/itens?search=${encodeURIComponent(item.nome)}`}
                  className="block p-4 rounded-xl bg-dark-card border border-dark-border hover:border-nexus-500/50 hover:bg-dark-hover transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-dark-border flex-shrink-0">
                      {item.imagem_url ? (
                        <img src={item.imagem_url} alt={item.nome} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-nexus-900/40 text-nexus-500">
                          <BoxIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white truncate">{item.nome}</p>
                        {item.categoria && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${catStyle}`}>
                            {item.categoria}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-nexus-400">
                        <span>Por {item.criador_nome || 'Desconhecido'}</span>
                        <span className="text-dark-border hidden sm:inline">•</span>
                        <span>{formatDate(item.criado_em)}</span>
                      </div>
                    </div>

                    {item.valor_venda > 0 && (
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-nexus-500 uppercase tracking-wider mb-0.5">Valor</p>
                        <p className="text-sm font-bold text-gourmet-champagne">{formatCurrency(item.valor_venda)}</p>
                      </div>
                    )}

                    <svg className="w-5 h-5 text-nexus-500 group-hover:text-nexus-400 transition-colors ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BoxIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}