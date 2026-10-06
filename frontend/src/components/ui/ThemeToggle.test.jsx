import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ThemeToggle from './ThemeToggle';
import { ThemeProvider } from '../../contexts/ThemeContext';

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ThemeToggle', () => {
  it('renderiza variante pill por padrão com role switch', () => {
    renderWithTheme(<ThemeToggle />);
    const button = screen.getByRole('switch');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-checked');
  });

  it('alterna o tema ao ser clicado na variante pill', () => {
    renderWithTheme(<ThemeToggle />);
    const button = screen.getByRole('switch');
    const initialChecked = button.getAttribute('aria-checked');
    fireEvent.click(button);
    expect(button.getAttribute('aria-checked')).not.toBe(initialChecked);
  });

  it('renderiza variante auth com texto correspondente', () => {
    renderWithTheme(<ThemeToggle variant="auth" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('auth-theme-toggle');
    expect(screen.getByText(/claro|escuro/i)).toBeInTheDocument();
  });

  it('renderiza variante mobile com label de modo', () => {
    renderWithTheme(<ThemeToggle variant="mobile" />);
    expect(screen.getByText(/modo (escuro|claro)/i)).toBeInTheDocument();
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });

  it('renderiza variante icon', () => {
    renderWithTheme(<ThemeToggle variant="icon" id="test-icon-toggle" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('id', 'test-icon-toggle');
  });
});
