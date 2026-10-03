import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import Items, { ItemEditPage } from './Items';
import { useAuth } from '../../contexts/AuthContext';
import { ModalProvider } from '../../contexts/ModalContext';
import { itemService } from '../../services/services';
import { useCart } from '../../contexts/CartContext';

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: vi.fn(),
}));

vi.mock('../../contexts/CartContext', async () => {
  const actual = await vi.importActual('../../contexts/CartContext');
  return {
    ...actual,
    useCart: vi.fn(() => ({
      addItem: vi.fn(),
    })),
  };
});

vi.mock('../../services/services', () => ({
  itemService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

const renderWithProviders = (component) =>
  render(
    <BrowserRouter>
      <ModalProvider>
        {component}
      </ModalProvider>
    </BrowserRouter>
  );

const mockUser = {
  id: 1,
  nome: 'Test User',
  email: 'test@test.com',
  nivel_acesso: 'admin',
};

describe('Catalog Items UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: mockUser,
      isAdmin: true,
      isFuncionario: false,
      isCliente: false,
    });
    useCart.mockReturnValue({
      addItem: vi.fn(),
    });
  });

  it('renders catalog items and pagination controls', async () => {
    itemService.getAll.mockResolvedValue({
      items: [
        { id: 1, nome: 'Servidor Dell', descricao: 'Servidor de produção', categoria: 'Servidores', fabricante: 'Dell', imagem_url: '', valor_venda: 1500, valor_aluguel_mensal: 300, estoque: 5 },
        { id: 2, nome: 'Switch Cisco', descricao: 'Switch empresarial', categoria: 'Rede', fabricante: 'Cisco', imagem_url: '', valor_venda: 2200, valor_aluguel_mensal: 420, estoque: 8 },
      ],
      pagination: { page: 1, limit: 8, total: 12, totalPages: 2 },
    });

    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText('Servidor Dell')).toBeInTheDocument();
      expect(screen.getByText('Switch Cisco')).toBeInTheDocument();
    });

    expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
  });

  it('applies search and category filters on the catalog request', async () => {
    itemService.getAll.mockResolvedValue({
      items: [
        { id: 10, nome: 'Servidor X', descricao: 'Servidor empresarial', categoria: 'Servidores', fabricante: 'Dell', imagem_url: '', valor_venda: 1500, valor_aluguel_mensal: 300, estoque: 4 },
      ],
      pagination: { page: 1, limit: 8, total: 1, totalPages: 1 },
    });

    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText('Servidor X')).toBeInTheDocument();
    });

    const searchInput = await screen.findByLabelText('Buscar produtos');
    fireEvent.change(searchInput, { target: { value: 'servidor' } });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Servidores' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Servidores' }));

    await waitFor(() => {
      expect(itemService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({
        page: 1,
        limit: 8,
        search: 'servidor',
        categoria: 'Servidores',
      }));
    });
  });

  it('shows an empty state when a category filter returns no items', async () => {
    itemService.getAll
      .mockResolvedValueOnce({
        items: [
          { id: 11, nome: 'Servidor X', descricao: 'Servidor empresarial', categoria: 'Servidores', fabricante: 'Dell', imagem_url: '', valor_venda: 1500, valor_aluguel_mensal: 300, estoque: 4 },
        ],
        pagination: { page: 1, limit: 8, total: 1, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        items: [],
        pagination: { page: 1, limit: 8, total: 0, totalPages: 1 },
      });

    renderWithProviders(<Items />);

    await screen.findByText('Servidor X');
    fireEvent.click(screen.getByRole('button', { name: 'Servidores' }));

    expect(await screen.findByText('Nenhum item encontrado')).toBeInTheDocument();
    expect(screen.getByText('Tente alterar o filtro ou a busca')).toBeInTheDocument();
    expect(itemService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({
      page: 1,
      limit: 8,
      categoria: 'Servidores',
    }));
  });

  it('notifies and returns to the catalog when the item fails to load for editing', async () => {
    itemService.getById.mockRejectedValue(new Error('Request failed'));

    render(
      <MemoryRouter initialEntries={['/itens/99/editar']}>
        <ModalProvider>
          <Routes>
            <Route path="/itens/:itemId/editar" element={<ItemEditPage />} />
            <Route path="/itens" element={<div>Catálogo</div>} />
          </Routes>
        </ModalProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Catálogo')).toBeInTheDocument();
    expect(await screen.findByText('Erro ao carregar item para edição')).toBeInTheDocument();
    expect(itemService.getById).toHaveBeenCalledWith('99');
  });

  it('navigates to the dedicated edit page for an item', async () => {
    itemService.getAll.mockResolvedValue({
      items: [
        { id: 7, nome: 'Servidor Dell', descricao: 'Servidor de produção', categoria: 'Servidores', fabricante: 'Dell', imagem_url: '', valor_venda: 1500, valor_aluguel_mensal: 300, estoque: 5 },
      ],
      pagination: { page: 1, limit: 8, total: 1, totalPages: 1 },
    });

    render(
      <MemoryRouter initialEntries={['/itens']}>
        <ModalProvider>
          <Routes>
            <Route path="/itens" element={<Items />} />
            <Route path="/itens/:itemId/editar" element={<div>Editar produto</div>} />
          </Routes>
        </ModalProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Servidor Dell')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Editar'));

    await waitFor(() => {
      expect(screen.getByText('Editar produto')).toBeInTheDocument();
    });
  });
});
