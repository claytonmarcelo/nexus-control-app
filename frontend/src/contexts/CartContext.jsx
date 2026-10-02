import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'nexus-control-cart';
const CHECKOUT_STORAGE_KEY = 'nexus-control-checkout';

const MIN_RENTAL_DAYS = 7;

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

/**
 * Calcula o valor diário de aluguel a partir do valor mensal.
 * Usa uma fórmula que mantém a margem: valorDiario = valorMensal / 28 * fator
 * - Aluguéis curtos (7-14 dias): fator 1.25 (custo por dia levemente maior)
 * - Aluguéis médios (15-30 dias): fator 1.10
 * - Aluguéis longos (31-90 dias): fator 1.00 (equivale ao mensal proporcional)
 * - Aluguéis muito longos (91+ dias): fator 0.92 (desconto fidelidade)
 */
export function calcDailyRate(valorMensal, dias) {
  const base = Number(valorMensal) || 0;
  const baseDiario = base / 28;
  let fator;
  if (dias <= 14)       fator = 1.25;
  else if (dias <= 30)  fator = 1.10;
  else if (dias <= 90)  fator = 1.00;
  else                  fator = 0.92;
  return baseDiario * fator;
}

/**
 * Calcula o total de aluguel para N dias.
 */
export function calcRentalTotal(valorMensal, dias) {
  const dailyRate = calcDailyRate(valorMensal, dias);
  return dailyRate * dias;
}

function normalizeItem(item, quantidade = 1) {
  if (!item || (!item.id && !item.item_id)) return null;
  const id = String(item.id || item.item_id);

  // Determine pricing for rental items
  const isRental = item.tipo === 'aluguel';
  const rentalDays = isRental ? Math.max(MIN_RENTAL_DAYS, Number(item.dias_aluguel) || MIN_RENTAL_DAYS) : null;
  const valorMensalBase = isRental ? (Number(item.valor_aluguel_mensal_base) || 0) : 0;

  // For rental: preco_unitario = total rental cost for the selected days (not daily rate)
  // For purchase: preco_unitario = unit sale price
  let preco_unitario;
  if (isRental && valorMensalBase > 0) {
    preco_unitario = calcRentalTotal(valorMensalBase, rentalDays);
  } else {
    preco_unitario = getUnitPrice(item);
  }

  return {
    id,
    item_id: item.item_id || item.id,
    nome: item.nome || item.name || 'Produto sem nome',
    descricao: item.descricao || item.description || '',
    fabricante: item.fabricante || '',
    imagem_url: item.imagem_url || '',
    preco_unitario,
    quantidade: Math.max(1, Math.floor(Number(quantidade) || 1)),
    categoria: item.categoria || item.category || 'Sem categoria',
    // Rental specific fields
    tipo: item.tipo || 'compra',
    dias_aluguel: rentalDays,
    valor_aluguel_mensal_base: valorMensalBase,
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
    if (!product) return;

    setItems((currentItems) => {
      const existingItem = currentItems.find((currentItem) => String(currentItem.id) === product.id);

      if (!existingItem) return [...currentItems, product];

      // For rental items: update days if changed, otherwise increase quantity
      if (product.tipo === 'aluguel') {
        return currentItems.map((currentItem) =>
          String(currentItem.id) === product.id
            ? {
                ...currentItem,
                dias_aluguel: product.dias_aluguel,
                preco_unitario: product.preco_unitario,
                quantidade: currentItem.quantidade + product.quantidade,
              }
            : currentItem
        );
      }

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

  // Update rental days for an existing cart item
  const updateRentalDays = useCallback((itemId, dias) => {
    const nextDays = Math.max(MIN_RENTAL_DAYS, Math.floor(Number(dias) || MIN_RENTAL_DAYS));

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (String(item.id) !== String(itemId) || item.tipo !== 'aluguel') return item;
        const newTotal = calcRentalTotal(item.valor_aluguel_mensal_base, nextDays);
        return { ...item, dias_aluguel: nextDays, preco_unitario: newTotal };
      })
    );
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
        nome: item.nome,
        tipo: item.tipo || 'compra',
        dias_aluguel: item.dias_aluguel || null,
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

  const getItemSubtotal = useCallback((item) => {
    return (Number(item.preco_unitario) || 0) * (Number(item.quantidade) || 0);
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
    updateRentalDays,
    removeItem,
    clearCart,
    prepareCheckoutData,
    getCheckoutHistory,
    getItemSubtotal,
    lastCheckoutData,
    MIN_RENTAL_DAYS,
    calcDailyRate,
    calcRentalTotal,
    ...totals,
  }), [items, addItem, updateQuantity, updateRentalDays, removeItem, clearCart, prepareCheckoutData, getCheckoutHistory, getItemSubtotal, lastCheckoutData, totals]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}
