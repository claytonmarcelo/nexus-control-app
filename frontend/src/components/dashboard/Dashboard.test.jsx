import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../dashboard/Dashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import { ModalProvider } from '../../contexts/ModalContext';
import { itemService, userService, checkoutService } from '../../services/services';

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: vi.fn(),
}));

vi.mock('../../contexts/CartContext', () => ({
  useCart: () => ({
    totalItems: 0,
    subtotal: 0,
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
  }),
}));

vi.mock('../../services/services', () => ({
  itemService: {
    getAll: vi.fn(),
  },
  userService: {
    getAll: vi.fn(),
  },
  checkoutService: {
    getAllOrders: vi.fn(),
    getMyOrders: vi.fn(),
  },
  healthService: {
    check: vi.fn(),
  },
}));

const mockUser = {
  id: 1,
  nome: 'Test User',
  email: 'test@test.com',
  nivel_acesso: 'cliente',
  criado_em: '2024-01-01T00:00:00.000Z',
};

const renderWithProviders = (component, user = mockUser) => {
  useAuth.mockReturnValue({
    user: { ...user },
    isAdmin: user.nivel_acesso === 'admin',
    isFuncionario: user.nivel_acesso === 'funcionario',
    isCliente: user.nivel_acesso === 'cliente',
  });

  return render(
    <BrowserRouter>
      <AuthProvider>
        <ModalProvider>
          {component}
        </ModalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const mockEmptyData = () => {
  itemService.getAll.mockResolvedValue({ items: [] });
  userService.getAll.mockResolvedValue({ users: [] });
  checkoutService.getAllOrders.mockResolvedValue({ orders: [] });
  checkoutService.getMyOrders.mockResolvedValue({ orders: [] });
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { ...mockUser },
      isAdmin: false,
      isFuncionario: false,
      isCliente: true,
    });
  });

  it('renders welcome message with user name', async () => {
    mockEmptyData();

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/bom dia|boa tarde|boa noite/i)).toBeInTheDocument();
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
    });
  });

  it('shows stat cards with correct data', async () => {
    itemService.getAll.mockResolvedValue({
      items: [
        { id: 1, nome: 'Item 1', criado_por: 1 },
        { id: 2, nome: 'Item 2', criado_por: 2 },
      ],
    });
    checkoutService.getMyOrders.mockResolvedValue({ orders: [] });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Itens no Catálogo')).toBeInTheDocument();
      expect(screen.getByText('No Carrinho')).toBeInTheDocument();
      expect(screen.getAllByText('Meus Pedidos').length).toBeGreaterThan(0);
    });
  });

  it('shows quick actions based on user role', async () => {
    mockEmptyData();

    renderWithProviders(<Dashboard />, { ...mockUser, nivel_acesso: 'cliente' });

    await waitFor(() => {
      expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
      expect(screen.getByText('Ver carrinho')).toBeInTheDocument();
    });
  });

  it('shows admin actions for admin user', async () => {
    mockEmptyData();

    renderWithProviders(<Dashboard />, { ...mockUser, nivel_acesso: 'admin' });

    await waitFor(() => {
      expect(screen.getByText('Gerenciar usuários')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar itens')).toBeInTheDocument();
      expect(screen.getByText('Painel de controle')).toBeInTheDocument();
    });
  });
});
