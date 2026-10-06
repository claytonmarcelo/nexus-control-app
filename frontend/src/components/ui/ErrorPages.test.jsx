import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ErrorPage } from './ErrorBoundary';
import Forbidden from './Forbidden';
import NotFound from './NotFound';

function renderInRouter(ui, initialEntries = ['/qualquer-rota']) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

describe('ErrorPage (base das páginas de erro)', () => {
  it('monta a estrutura BEM completa com código, título e mensagem', () => {
    const { container } = renderInRouter(
      <ErrorPage status="418" title="Título de teste" message="Mensagem de teste." />
    );

    expect(container.querySelector('.error-page')).toBeInTheDocument();
    expect(container.querySelector('.error-page__glow')).toBeInTheDocument();
    expect(container.querySelector('.error-page__mark')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Título de teste' })).toBeInTheDocument();
    expect(screen.getByText('418')).toBeInTheDocument();
    expect(screen.getByText('Mensagem de teste.')).toBeInTheDocument();
  });

  it('usa o tom champagne por padrão e o modificador pedido quando informado', () => {
    const { container } = renderInRouter(
      <ErrorPage status="403" tone="warning" title="Restrito" message="Sem permissão." />
    );

    expect(container.querySelector('.error-page').className).toContain('error-page--warning');
  });

  it('mostra a dica técnica apenas quando ela é fornecida', () => {
    const semDica = renderInRouter(<ErrorPage status="500" title="Erro" message="Falhou." />);
    expect(semDica.container.querySelector('.error-page__hint')).toBeNull();
    semDica.unmount();

    const comDica = renderInRouter(
      <ErrorPage status="500" title="Erro" message="Falhou." hint="HTTP 500" />
    );
    expect(comDica.getByText('HTTP 500')).toBeInTheDocument();
  });

  it('respeita o rótulo e o destino personalizados da ação secundária', () => {
    renderInRouter(
      <ErrorPage
        status="403"
        title="Restrito"
        message="Sem permissão."
        secondaryAction
        secondaryLabel="Voltar ao início"
        secondaryHref="/"
      />
    );

    expect(screen.getByRole('link', { name: /Voltar ao início/i })).toHaveAttribute('href', '/');
  });

  it('dispara a ação primária ao clicar', () => {
    const onAction = vi.fn();
    renderInRouter(
      <ErrorPage
        status="500"
        title="Erro"
        message="Falhou."
        actionLabel="Tentar novamente"
        onAction={onAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe('NotFound (404)', () => {
  it('exibe a página 404 com a rota tentada na dica', () => {
    const { container } = renderInRouter(<NotFound />, ['/relatorio-inexistente']);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(container.querySelector('.error-page--gold')).toBeInTheDocument();
    expect(container.querySelector('.error-page__hint').textContent).toContain('/relatorio-inexistente');
  });

  it('oferece voltar e ir para o dashboard', () => {
    renderInRouter(<NotFound />);

    expect(screen.getByRole('button', { name: /Voltar à página anterior/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
  });
});

describe('Forbidden (403)', () => {
  it('exibe a página de acesso negado no tom âmbar', () => {
    const { container } = renderInRouter(<Forbidden />, ['/admin']);

    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Esta área é restrita' })).toBeInTheDocument();
    expect(container.querySelector('.error-page--warning')).toBeInTheDocument();
  });

  it('leva o usuário de volta ao dashboard', () => {
    renderInRouter(<Forbidden />);

    expect(screen.getByRole('link', { name: /Ir para o dashboard/i })).toHaveAttribute('href', '/dashboard');
  });
});
