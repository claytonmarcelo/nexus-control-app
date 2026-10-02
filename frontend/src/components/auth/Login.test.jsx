import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { AuthProvider } from '../../contexts/AuthContext';
import { ModalProvider } from '../../contexts/ModalContext';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const renderWithProviders = (component) => {
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

describe('Login Component', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
    api.post.mockReset();
    api.get.mockReset();
  });

  it('renders login form with email and password fields', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByLabelText('Email', { selector: '#email' })).toBeInTheDocument();
    expect(screen.getByLabelText('Senha', { selector: '#senha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<Login />);
    
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Email é obrigatório')).toBeInTheDocument();
      expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    renderWithProviders(<Login />);
    
    fireEvent.change(screen.getByLabelText('Email', { selector: '#email' }), { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    renderWithProviders(<Login />);
    
    fireEvent.change(screen.getByLabelText('Email', { selector: '#email' }), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Senha', { selector: '#senha' }), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Senha deve ter no mínimo 6 caracteres')).toBeInTheDocument();
    });
  });

  it('flips to register form when clicking Cadastre-se', async () => {
    renderWithProviders(<Login />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Ir para cadastro' }));
    
    await waitFor(() => {
      expect(screen.getByLabelText('Nome completo')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cadastrar/i })).toBeInTheDocument();
    });
  });

  it('flips back to login when clicking Entrar on register form', async () => {
    renderWithProviders(<Login />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Ir para cadastro' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Nome completo')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Ir para login' }));
    
    await waitFor(() => {
      expect(screen.getByLabelText('Email', { selector: '#email' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });
  });

  it('shows the password requirement and does not submit a weak registration password', async () => {
    renderWithProviders(<Login />);
    fireEvent.click(screen.getByRole('button', { name: 'Ir para cadastro' }));

    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email de cadastro'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha de cadastro'), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: '123456' } });

    expect(screen.getByText(/6 dígitos seguidos de 1 símbolo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/exatamente 6 dígitos seguidos de 1 símbolo/i);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('sends a valid registration and stores the returned session tokens', async () => {
    api.post.mockResolvedValue({
      data: {
        data: {
          user: { id: 42, nome: 'Test User', email: 'test@example.com', nivel_acesso: 'cliente' },
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
        },
      },
    });

    renderWithProviders(<Login />);
    fireEvent.click(screen.getByRole('button', { name: 'Ir para cadastro' }));
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email de cadastro'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha de cadastro'), { target: { value: '654321#' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: '654321#' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        nome: 'Test User',
        email: 'test@example.com',
        senha: '654321#',
      });
    });
    expect(localStorage.getItem('accessToken')).toBe('test-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token');
  });

  it('shows backend registration validation details', async () => {
    api.post.mockRejectedValue({
      response: {
        data: {
          message: 'Dados inválidos',
          errors: [{ msg: 'Email inválido' }],
        },
      },
    });

    renderWithProviders(<Login />);
    fireEvent.click(screen.getByRole('button', { name: 'Ir para cadastro' }));
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email de cadastro'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha de cadastro'), { target: { value: '654321#' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: '654321#' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    expect(await screen.findByText('Email inválido')).toBeInTheDocument();
  });
});