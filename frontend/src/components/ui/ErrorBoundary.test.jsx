import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

function renderBoundary(children, resetKey = 'stable') {
  return render(
    <BrowserRouter>
      <ErrorBoundary resetKey={resetKey}>{children}</ErrorBoundary>
    </BrowserRouter>
  );
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('mantém a página normal quando não há erro', () => {
    renderBoundary(<p>Conteúdo estável</p>);

    expect(screen.getByText('Conteúdo estável')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Algo saiu do roteiro' })).not.toBeInTheDocument();
  });

  it('exibe a página premium de erro quando uma rota falha', () => {
    function BrokenPage() {
      throw new Error('Falha de renderização');
    }

    renderBoundary(<BrokenPage />);

    expect(screen.getByRole('heading', { name: 'Algo saiu do roteiro' })).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('limpa o erro quando a rota muda', () => {
    function BrokenPage() {
      throw new Error('Falha de renderização');
    }

    const view = renderBoundary(<BrokenPage />, 'broken');
    view.rerender(
      <BrowserRouter>
        <ErrorBoundary resetKey="recovered">
          <p>Conteúdo recuperado</p>
        </ErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByText('Conteúdo recuperado')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Algo saiu do roteiro' })).not.toBeInTheDocument();
  });
});
