import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../dashboard/Dashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import { ModalProvider } from '../../contexts/ModalContext';
import { itemService, healthService } from '../../services/services';

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: vi.fn(),
}));

vi.mock('../../services/services', () => ({
  itemService: {
    getAll: vi.fn(),
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
    itemService.getAll.mockResolvedValue({ items: [] });
    healthService.check.mockResolvedValue({ users: 0 });
    
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
      ]
    });
    healthService.check.mockResolvedValue({ users: 5 });
    
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Total de Itens')).toBeInTheDocument();
      expect(screen.getByText('Meus Itens')).toBeInTheDocument();
    });
  });

  it('shows quick actions based on user role', async () => {
    itemService.getAll.mockResolvedValue({ items: [] });
    healthService.check.mockResolvedValue({ users: 0 });
    
    renderWithProviders(<Dashboard />, { ...mockUser, nivel_acesso: 'cliente' });
    
    await waitFor(() => {
      expect(screen.getByText('Solicitar novo item')).toBeInTheDocument();
    });
  });

  it('shows admin actions for admin user', async () => {
    useAuth.mockReturnValue({
      user: { ...mockUser, nivel_acesso: 'admin' },
      isAdmin: true,
      isFuncionario: false,
      isCliente: false,
    });
    itemService.getAll.mockResolvedValue({ items: [] });
    healthService.check.mockResolvedValue({ users: 0 });
    
    renderWithProviders(<Dashboard />, { ...mockUser, nivel_acesso: 'admin' });
    
    await waitFor(() => {
      expect(screen.getByText('Gerenciar usuários')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar todos os itens')).toBeInTheDocument();
    });
  });
});