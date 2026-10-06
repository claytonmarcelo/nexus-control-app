import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from './Profile';
import { useAuth } from '../../contexts/AuthContext';
import { ModalProvider } from '../../contexts/ModalContext';
import { checkoutService, userService, alertService } from '../../services/services';
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
  alertService: {
    getMyAlerts: vi.fn(),
    getMyEvents: vi.fn(),
    getUserEvents: vi.fn(),
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
    alertService.getMyAlerts.mockResolvedValue({ alerts: [], resumo: { possui_debitos: false } });
    alertService.getMyEvents.mockResolvedValue({ eventos: [] });
  });

  it('requires a password and does not open confirmation when it is missing', async () => {
    renderProfile();

    fireEvent.click(screen.getByRole('button', { name: 'Desativar minha conta' }));

    expect(await screen.findByText('Informe sua senha atual para continuar')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(userService.deleteOwnAccount).not.toHaveBeenCalled();
  });

  it('presents the profile sections with clear tab navigation', async () => {
    checkoutService.getMyOrders.mockResolvedValue([]);
    renderProfile();

    expect(screen.getByRole('heading', { name: 'Meu perfil' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Informações pessoais' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Segurança' }));
    expect(screen.getByRole('heading', { name: 'Segurança da conta' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Histórico' }));
    expect(await screen.findByRole('heading', { name: 'Histórico de compras' })).toBeInTheDocument();
    expect(checkoutService.getMyOrders).toHaveBeenCalledWith({ limit: 50 });
  });

  it('surfaces the alert center when the tab is opened', async () => {
    alertService.getMyAlerts.mockResolvedValue({
      alerts: [
        {
          tipo: 'pagamento_pendente',
          severidade: 'atencao',
          pedido_id: 10,
          valor: 99.9,
          mensagem: 'O pedido #10 ainda não teve o pagamento confirmado.',
          acao: 'pagar',
        },
      ],
      resumo: { possui_debitos: true, total_debitos: 99.9, tem_alertas: true, pode_desativar_sem_confirmar: false },
    });
    renderProfile();

    fireEvent.click(screen.getByRole('tab', { name: 'Alertas' }));

    expect(await screen.findByRole('heading', { name: /O que precisa da sua atenção/i })).toBeInTheDocument();
    expect(await screen.findByText(/O pedido #10 ainda não teve o pagamento/i)).toBeInTheDocument();
    expect(alertService.getMyAlerts).toHaveBeenCalled();
  });

  it('does not call the API when the user cancels confirmation', async () => {
    renderProfile();
    fireEvent.change(screen.getByLabelText('Confirme sua senha atual'), {
      target: { value: '123456#' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Desativar minha conta' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(userService.deleteOwnAccount).not.toHaveBeenCalled();
  });

  it('deactivates the account after confirmation and logs out', async () => {
    userService.deleteOwnAccount.mockResolvedValue({ success: true });
    const { logout } = renderProfile();
    fireEvent.change(screen.getByLabelText('Confirme sua senha atual'), {
      target: { value: '123456#' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Desativar minha conta' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Desativar minha conta' }));

    await waitFor(() => {
      expect(userService.deleteOwnAccount).toHaveBeenCalledWith({ senha_atual: '123456#' });
      expect(logout).toHaveBeenCalledOnce();
    });
  });

  it('opens the obligations modal when the backend returns 409 and confirms with the flag', async () => {
    userService.deleteOwnAccount
      .mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            message: 'Pendências ativas detectadas',
            errors: {
              obrigacoes: {
                possui_obrigacoes: true,
                pedidos_pendentes: [{ id: 7, total: 120 }],
                alugueis_abertos: [{ id: 3, item_nome: 'Notebook Dell', status: 'ativo' }],
                debitos: 120,
              },
            },
          },
        },
      })
      .mockResolvedValueOnce({ success: true });

    const { logout } = renderProfile();
    fireEvent.change(screen.getByLabelText('Confirme sua senha atual'), {
      target: { value: '123456#' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Desativar minha conta' }));

    // Modal de confirmação inicial (ModalContext)
    let dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Desativar minha conta' }));

    // Agora o modal de obrigações aparece listando pendências
    dialog = await screen.findByRole('dialog', { name: /Pendências em aberto/i });
    expect(within(dialog).getByText(/Notebook Dell/i)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar desativação' }));

    await waitFor(() => {
      expect(userService.deleteOwnAccount).toHaveBeenLastCalledWith({
        senha_atual: '123456#',
        confirmar_obrigacoes: true,
      });
      expect(logout).toHaveBeenCalledOnce();
    });
  });

  it('shows the API error and keeps the user signed in when deactivation fails', async () => {
    userService.deleteOwnAccount.mockRejectedValue({
      response: { data: { message: 'Senha atual incorreta' } },
    });
    const { logout } = renderProfile();
    fireEvent.change(screen.getByLabelText('Confirme sua senha atual'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Desativar minha conta' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Desativar minha conta' }));

    expect(await screen.findByText('Senha atual incorreta')).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it('keeps the root administrator account protected in the profile', () => {
    renderProfile({ ...clientUser, email: ROOT_ADMIN_EMAIL, nivel_acesso: 'admin' });

    expect(screen.getByText('A conta do administrador raiz é protegida e não pode ser desativada.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirme sua senha atual')).not.toBeInTheDocument();
  });
});
