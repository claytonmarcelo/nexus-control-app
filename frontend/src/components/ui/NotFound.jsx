import { ErrorPage } from './ErrorBoundary';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <ErrorPage
      status="404"
      eyebrow="Nexus Control"
      title="Página não encontrada"
      message="O endereço solicitado não existe ou não está mais disponível. Retorne ao seu painel de controle para continuar navegando."
      actionLabel="Voltar à página anterior"
      onAction={() => navigate(-1)}
      secondaryAction
    />
  );
}