import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { itemService } from '../../services/services';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/date';

export default function RecentItems() {
  const { isCliente } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecentItems = useCallback(async () => {
    try {
      const response = await itemService.getAll({ limit: 5 });
      setItems(response.items || []);
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
            {items.map(item => (
              <Link
                key={item.id}
                to={`/itens/${item.id}`}
                className="block p-4 rounded-xl bg-dark-hover border border-dark-border hover:border-nexus-500/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-nexus-600/20 flex items-center justify-center group-hover:bg-nexus-600/40 transition-colors">
                    <BoxIcon className="w-6 h-6 text-nexus-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{item.nome}</p>
                    <p className="text-sm text-nexus-400 flex items-center gap-2">
                      <span>Por {item.criador_nome || 'Desconhecido'}</span>
                      <span className="text-dark-border">•</span>
                      <span>{formatDate(item.criado_em)}</span>
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-nexus-500 group-hover:text-nexus-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
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