import { Component } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function RouteErrorBoundary({ children }) {
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={location.key || location.pathname}>
      {children}
    </ErrorBoundary>
  );
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erro inesperado durante a navegação:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          status="500"
          eyebrow="Nexus Control"
          title="Algo saiu do roteiro"
          message="Encontramos uma instabilidade ao abrir esta experiência. Tente novamente ou retorne ao seu painel seguro."
          actionLabel="Tentar novamente"
          onAction={this.handleRetry}
          secondaryAction
        />
      );
    }

    return this.props.children;
  }
}

export function ErrorPage({
  status,
  eyebrow = 'Nexus Control',
  title,
  message,
  actionLabel,
  onAction,
  secondaryAction = false,
}) {
  return (
    <main className="error-page" role="main">
      <div className="error-page__glow" aria-hidden="true" />
      <section className="error-page__content" aria-labelledby="error-title">
        <div className="error-page__mark" aria-hidden="true">
          <span>{status}</span>
          <i />
        </div>
        <p className="error-page__eyebrow">{eyebrow}</p>
        <h1 id="error-title">{title}</h1>
        <p className="error-page__message">{message}</p>
        <div className="error-page__actions">
          {onAction && (
            <button type="button" className="btn-primary" onClick={onAction}>
              <RefreshIcon />
              {actionLabel}
            </button>
          )}
          {secondaryAction && (
            <Link to="/dashboard" className="btn-secondary">
              <HomeIcon />
              Ir para o dashboard
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

function RefreshIcon() {
  return (
    <svg aria-hidden="true" className="error-page__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 11a8.1 8.1 0 0 0-14.9-4M4 5v4h4M4 13a8.1 8.1 0 0 0 14.9 4M20 19v-4h-4" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="error-page__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" />
    </svg>
  );
}
