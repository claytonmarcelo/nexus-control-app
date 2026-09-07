import { ErrorPage } from './ErrorBoundary';

export default function NotFound() {
  return (
    <ErrorPage
      status="404"
      eyebrow="Nexus Control"
      title="Esta página tomou outro caminho"
      message="O endereço informado não corresponde a uma área disponível no seu painel."
      secondaryAction
    />
  );
}