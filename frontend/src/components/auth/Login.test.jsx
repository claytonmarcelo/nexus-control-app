import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { AuthProvider } from '../../contexts/AuthContext';
import { ModalProvider } from '../../contexts/ModalContext';

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
});