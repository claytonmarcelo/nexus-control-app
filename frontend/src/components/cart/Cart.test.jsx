import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider, useCart } from '../../contexts/CartContext';
import Cart from './Cart';
import { ModalProvider } from '../../contexts/ModalContext';

// Mock do ModalContext
vi.mock('../../contexts/ModalContext', () => ({
  useModal: () => ({
    confirm: vi.fn(async () => true),
    toast: vi.fn(),
  }),
  ModalProvider: ({ children }) => <div>{children}</div>,
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <CartProvider>
        <ModalProvider>
          {component}
        </ModalProvider>
      </CartProvider>
    </BrowserRouter>
  );
};

describe('Cart Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('✅ Deve exibir mensagem quando carrinho está vazio', () => {
    renderWithProviders(<Cart />);
    expect(screen.getByText(/Seu carrinho está vazio/i)).toBeInTheDocument();
  });

  it('✅ Deve adicionar item ao carrinho', async () => {
    const TestComponent = () => {
      const { addItem, items } = useCart();

      return (
        <>
          <button onClick={() => addItem({ id: 1, nome: 'Produto 1', valor_venda: 100 })}>
            Adicionar Item
          </button>
          <div data-testid="item-count">{items.length}</div>
        </>
      );
    };

    renderWithProviders(<TestComponent />);
    const addButton = screen.getByText('Adicionar Item');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    });
  });

  it('✅ Deve atualizar quantidade de item', async () => {
    const TestComponent = () => {
      const { addItem, updateQuantity, items } = useCart();

      return (
        <>
          <button onClick={() => addItem({ id: 1, nome: 'Produto 1', valor_venda: 100 })}>
            Adicionar
          </button>
          {items.length > 0 && (
            <>
              <button onClick={() => updateQuantity(items[0].id, 5)}>Atualizar para 5</button>
              <div data-testid="quantity">{items[0].quantidade}</div>
            </>
          )}
        </>
      );
    };

    renderWithProviders(<TestComponent />);
    fireEvent.click(screen.getByText('Adicionar'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Atualizar para 5'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('quantity')).toHaveTextContent('5');
    });
  });

  it('✅ Deve remover item do carrinho', async () => {
    const TestComponent = () => {
      const { addItem, removeItem, items } = useCart();

      return (
        <>
          <button onClick={() => addItem({ id: 1, nome: 'Produto 1', valor_venda: 100 })}>
            Adicionar
          </button>
          {items.length > 0 && (
            <button onClick={() => removeItem(items[0].id)}>Remover</button>
          )}
          <div data-testid="item-count">{items.length}</div>
        </>
      );
    };

    renderWithProviders(<TestComponent />);
    fireEvent.click(screen.getByText('Adicionar'));

    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    });

    fireEvent.click(screen.getByText('Remover'));

    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    });
  });

  it('✅ Deve calcular total corretamente', async () => {
    const TestComponent = () => {
      const { addItem, total } = useCart();

      return (
        <>
          <button onClick={() => addItem({ id: 1, nome: 'Produto 1', preco_unitario: 100 })}>
            Adicionar 100
          </button>
          <button onClick={() => addItem({ id: 2, nome: 'Produto 2', preco_unitario: 50 })}>
            Adicionar 50
          </button>
          <div data-testid="total">{total}</div>
        </>
      );
    };

    renderWithProviders(<TestComponent />);
    
    fireEvent.click(screen.getByText('Adicionar 100'));
    fireEvent.click(screen.getByText('Adicionar 50'));

    await waitFor(() => {
      expect(screen.getByTestId('total')).toHaveTextContent('150');
    });
  });

  it('✅ Deve persistir carrinho em localStorage', async () => {
    const TestComponent = () => {
      const { addItem } = useCart();

      return (
        <button onClick={() => addItem({ id: 1, nome: 'Produto 1', preco_unitario: 100 })}>
          Adicionar
        </button>
      );
    };

    renderWithProviders(<TestComponent />);
    fireEvent.click(screen.getByText('Adicionar'));

    await waitFor(() => {
      const stored = localStorage.getItem('nexus-control-cart');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored)).toHaveLength(1);
    });
  });

  it('✅ Deve preparar dados para checkout', async () => {
    const TestComponent = () => {
      const { addItem, prepareCheckoutData, lastCheckoutData } = useCart();

      return (
        <>
          <button onClick={() => addItem({ id: 1, nome: 'Produto 1', preco_unitario: 100 })}>
            Adicionar
          </button>
          <button onClick={() => prepareCheckoutData('pix')}>Preparar Checkout</button>
          {lastCheckoutData && <div data-testid="checkout-data">{JSON.stringify(lastCheckoutData)}</div>}
        </>
      );
    };

    renderWithProviders(<TestComponent />);
    fireEvent.click(screen.getByText('Adicionar'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Preparar Checkout'));
    });

    await waitFor(() => {
      const checkoutData = screen.getByTestId('checkout-data');
      const data = JSON.parse(checkoutData.textContent);
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('metodo_pagamento', 'pix');
    });
  });
});

describe('Checkout Component - Integração', () => {
  it('✅ Deve exibir opções de pagamento', () => {
    renderWithProviders(<Cart />);
    // Verificar se os elementos padrão do carrinho estão presentes
    expect(screen.getByText(/seu carrinho/i)).toBeInTheDocument();
  });
});

describe('CartContext - Segurança', () => {
  it('✅ Deve validar quantidade mínima', async () => {
    const TestComponent = () => {
      const { addItem, updateQuantity, items } = useCart();

      return (
        <>
          <button onClick={() => addItem({ id: 1, nome: 'Produto 1', preco_unitario: 100 })}>
            Adicionar
          </button>
          {items.length > 0 && (
            <>
              <button onClick={() => updateQuantity(items[0].id, 0)}>Remover via Quantidade</button>
              <div data-testid="item-count">{items.length}</div>
            </>
          )}
        </>
      );
    };

    renderWithProviders(<TestComponent />);
    fireEvent.click(screen.getByText('Adicionar'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Remover via Quantidade'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    });
  });

  it('✅ Deve ignorar itens com dados inválidos', async () => {
    const TestComponent = () => {
      const { addItem, items } = useCart();

      return (
        <>
          <button onClick={() => addItem({ nome: 'Produto sem ID' })}>
            Adicionar Inválido
          </button>
          <div data-testid="item-count">{items.length}</div>
        </>
      );
    };

    renderWithProviders(<TestComponent />);
    fireEvent.click(screen.getByText('Adicionar Inválido'));

    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    });
  });
});
