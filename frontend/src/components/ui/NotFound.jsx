import { ErrorPage } from './ErrorBoundary';
import { useLocation, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <ErrorPage
      status="404"
      eyebrow="Página não encontrada"
      title="O endereço mudou de vitrine"
      message="O endereço solicitado não existe ou não está mais disponível. Retorne ao seu painel de controle para continuar navegando."
      hint={`Nenhuma rota corresponde a ${location.pathname}`}
      actionLabel="Voltar à página anterior"
      onAction={() => navigate(-1)}
      secondaryAction
    />
  );
}