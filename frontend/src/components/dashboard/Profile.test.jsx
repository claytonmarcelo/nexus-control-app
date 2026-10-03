import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from './Profile';
import { useAuth } from '../../contexts/AuthContext';
import { ModalProvider } from '../../contexts/ModalContext';
import { userService } from '../../services/services';
import { ROOT_ADMIN_EMAIL } from '../../utils/access';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/services', () => ({
  userService: {
    update: vi.fn(),
    changePassword: vi.fn(),
    deleteOwnAccount: vi.fn(),
  },
  checkoutService: {
    getMyOrders: vi.fn(),
    deleteOrder: vi.fn(),
  },
}));

const clientUser = {
  id: 42,
  nome: 'Cliente de teste',
  email: 'cliente@example.test',
  nivel_acesso: 'cliente',
  criado_em: '2024-01-01T00:00:00.000Z',
};

const renderProfile = (user = clientUser) => {
  const logout = vi.fn();
  useAuth.mockReturnValue({
    user,
    updateUser: vi.fn(),
    logout,
  });

  render(
    <BrowserRouter>
      <ModalProvider>
        <Profile />
      </ModalProvider>
    </BrowserRouter>
  );

  return { logout };
};

describe('Profile account deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires a password and does not open confirmation when it is missing', async () => {
    renderProfile();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }));

    expect(await screen.findByText('Informe sua senha atual para continuar')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(userService.deleteOwnAccount).not.toHaveBeenCalled();
  });

  it('does not call the API when the user cancels confirmation', async () => {
    renderProfile();
    fireEvent.change(screen.getByLabelText('Confirme sua senha atual'), {
      target: { value: '123456#' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(userService.deleteOwnAccount).not.toHaveBeenCalled();
  });

  it('deletes the account after confirmation and logs out', async () => {
    userService.deleteOwnAccount.mockResolvedValue({ success: true });
    const { logout } = renderProfile();
    fireEvent.change(screen.getByLabelText('Confirme sua senha atual'), {
      target: { value: '123456#' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir minha conta' }));

    await waitFor(() => {
      expect(userService.deleteOwnAccount).toHaveBeenCalledWith({ senha_atual: '123456#' });
      expect(logout).toHaveBeenCalledOnce();
    });
  });

  it('shows the API error and keeps the user signed in when deletion fails', async () => {
    userService.deleteOwnAccount.mockRejectedValue({
      response: { data: { message: 'Senha atual incorreta' } },
    });
    const { logout } = renderProfile();
    fireEvent.change(screen.getByLabelText('Confirme sua senha atual'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir minha conta' }));

    expect(await screen.findByText('Senha atual incorreta')).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it('keeps the root administrator account protected in the profile', () => {
    renderProfile({ ...clientUser, email: ROOT_ADMIN_EMAIL, nivel_acesso: 'admin' });

    expect(screen.getByText('A conta do administrador raiz é protegida e não pode ser excluída.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirme sua senha atual')).not.toBeInTheDocument();
  });
});
