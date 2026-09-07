import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'nexus-control-cart';
const CHECKOUT_STORAGE_KEY = 'nexus-control-checkout';

function readStoredCart() {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = rawCart ? JSON.parse(rawCart) : [];

    return Array.isArray(parsedCart)
      ? parsedCart.filter((item) => item?.id && Number(item.quantidade) > 0)
      : [];
  } catch {
    return [];
  }
}

function getUnitPrice(item) {
  const value = item.preco_unitario ?? item.precoUnitario ?? item.valor_venda ?? item.preco ?? 0;
  return Math.max(0, Number(value) || 0);
}

function normalizeItem(item, quantidade = 1) {
  return {
    id: String(item.id),
    item_id: item.item_id || item.id,
    nome: item.nome || item.name || 'Produto sem nome',
    descricao: item.descricao || item.description || '',
    fabricante: item.fabricante || '',
    imagem_url: item.imagem_url || '',
    preco_unitario: getUnitPrice(item),
    quantidade: Math.max(1, Math.floor(Number(quantidade) || 1)),
    categoria: item.categoria || item.category || 'Sem categoria',
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);
  const [lastCheckoutData, setLastCheckoutData] = useState(null);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item, quantidade = 1) => {
    const product = normalizeItem(item, quantidade);

    setItems((currentItems) => {
      const existingItem = currentItems.find((currentItem) => String(currentItem.id) === product.id);

      if (!existingItem) return [...currentItems, product];

      return currentItems.map((currentItem) => (
        String(currentItem.id) === product.id
          ? { ...currentItem, quantidade: currentItem.quantidade + product.quantidade }
          : currentItem
      ));
    });
  }, []);

  const updateQuantity = useCallback((itemId, quantidade) => {
    const nextQuantity = Math.floor(Number(quantidade) || 0);

    setItems((currentItems) => {
      if (nextQuantity <= 0) {
        return currentItems.filter((item) => String(item.id) !== String(itemId));
      }

      return currentItems.map((item) => (
        String(item.id) === String(itemId)
          ? { ...item, quantidade: nextQuantity }
          : item
      ));
    });
  }, []);

  const removeItem = useCallback((itemId) => {
    setItems((currentItems) => currentItems.filter((item) => String(item.id) !== String(itemId)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const prepareCheckoutData = useCallback((metodo_pagamento = 'pix') => {
    if (items.length === 0) {
      throw new Error('Carrinho vazio');
    }

    const checkoutData = {
      items: items.map(item => ({
        item_id: Number(item.item_id || item.id),
        quantidade: item.quantidade,
        preco: item.preco_unitario,
        nome: item.nome
      })),
      total: items.reduce(
        (sum, item) => sum + ((Number(item.preco_unitario) || 0) * (Number(item.quantidade) || 0)),
        0,
      ),
      metodo_pagamento,
      criado_em: new Date().toISOString()
    };

    setLastCheckoutData(checkoutData);
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(checkoutData));

    return checkoutData;
  }, [items]);

  const getCheckoutHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const totals = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);
    const subtotal = items.reduce(
      (sum, item) => sum + ((Number(item.preco_unitario) || 0) * (Number(item.quantidade) || 0)),
      0,
    );

    return { totalItems, subtotal, total: subtotal };
  }, [items]);

  const value = useMemo(() => ({
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    prepareCheckoutData,
    getCheckoutHistory,
    getItemSubtotal: (item) => (Number(item.preco_unitario) || 0) * (Number(item.quantidade) || 0),
    lastCheckoutData,
    ...totals,
  }), [items, addItem, updateQuantity, removeItem, clearCart, prepareCheckoutData, getCheckoutHistory, lastCheckoutData, totals]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}
