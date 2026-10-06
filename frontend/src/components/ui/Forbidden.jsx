import { ErrorPage } from './ErrorBoundary';
import { useNavigate } from 'react-router-dom';

/**
 * Página de erro 403 — acesso negado.
 * Reutiliza o <ErrorPage /> (mesma estrutura BEM e a mesma animação das demais
 * páginas de erro); muda apenas o tom (âmbar) e o texto.
 */
export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <ErrorPage
      status="403"
      tone="warning"
      eyebrow="Acesso negado"
      title="Esta área é restrita"
      message="Sua conta não tem permissão para abrir esta página. Se você acredita que deveria ter acesso, peça ao administrador para habilitar esta seção no seu perfil."
      hint="HTTP 403 — permissão insuficiente"
      actionLabel="Voltar à página anterior"
      onAction={() => navigate(-1)}
      secondaryAction
      secondaryLabel="Ir para o dashboard"
      secondaryHref="/dashboard"
    />
  );
}
