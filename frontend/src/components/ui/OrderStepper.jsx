/**
 * OrderStepper - Componente visual para rastreamento de pedidos
 * Exibe timeline premium dos status do pedido com animações suaves e elegância Luxury Tech
 */

export default function OrderStepper({ status = 'pendente', createdAt: _createdAt = new Date() }) {
  const steps = [
    { id: 'pendente', label: 'Pedido Criado', icon: '📋', description: 'Pedido em processamento' },
    { id: 'confirmado', label: 'Confirmado', icon: '✓', description: 'Pagamento aprovado' },
    { id: 'processando', label: 'Processando', icon: '⚙️', description: 'Preparando entrega' },
    { id: 'enviado', label: 'Enviado', icon: '📦', description: 'Em trânsito' },
    { id: 'entregue', label: 'Entregue', icon: '✅', description: 'Concluído com sucesso' },
  ];

  const getStatusIndex = () => {
    const statusMap = {
      pendente: 0,
      confirmado: 1,
      processando: 2,
      enviado: 3,
      entregue: 4,
    };
    return statusMap[status] || 0;
  };

  const currentIndex = getStatusIndex();

  return (
    <div className="w-full">
      {/* Timeline Horizontal (Desktop & Tablet) */}
      <div className="relative hidden sm:block py-4">
        {/* Background Track */}
        <div
          className="absolute top-11 left-8 right-8 h-1 rounded-full"
          style={{ backgroundColor: 'var(--border-color)' }}
        />

        {/* Progress Line */}
        <div
          className="absolute top-11 left-8 h-1 rounded-full transition-all duration-500"
          style={{
            width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 4rem)`,
            background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-gold-light))',
            boxShadow: '0 0 12px var(--accent-gold-glow)',
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between items-start">
          {steps.map((step, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1 px-1">
                {/* Circle Node */}
                <div
                  className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isCurrent ? 'scale-110 shadow-lg' : ''
                  }`}
                  style={{
                    backgroundColor: isCurrent
                      ? 'var(--accent-gold)'
                      : isActive
                      ? 'var(--accent-gold-faint)'
                      : 'var(--bg-elevated-1)',
                    border: isCurrent
                      ? '2px solid var(--accent-gold-light)'
                      : isActive
                      ? '1px solid var(--accent-gold-border)'
                      : '1px solid var(--border-color)',
                    color: isCurrent
                      ? '#0d0d0d'
                      : isActive
                      ? 'var(--accent-gold)'
                      : 'var(--text-muted)',
                    boxShadow: isCurrent ? '0 0 20px var(--accent-gold-glow)' : 'none',
                  }}
                >
                  <span className="text-xl font-bold">
                    {step.icon}
                  </span>

                  {/* Pulse Ring for Current */}
                  {isCurrent && (
                    <div
                      className="absolute -inset-1 rounded-2xl animate-ping opacity-25"
                      style={{ border: '2px solid var(--accent-gold)' }}
                    />
                  )}
                </div>

                {/* Labels */}
                <div className="mt-3 text-center">
                  <p
                    className="text-xs font-bold uppercase tracking-wider transition-colors duration-300"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Card */}
      <div
        className="mt-6 rounded-2xl p-5 border flex items-center gap-4 transition-all"
        style={{
          backgroundColor: 'var(--bg-elevated-1)',
          borderColor: 'var(--accent-gold-border)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            backgroundColor: 'var(--accent-gold-faint)',
            border: '1px solid var(--accent-gold-border)',
          }}
        >
          {steps[currentIndex].icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent-gold)' }}>
            Status Atual do Pedido
          </p>
          <p className="text-base font-bold truncate mt-0.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {steps[currentIndex].label}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
            {steps[currentIndex].description}
          </p>
        </div>
      </div>

      {/* Timeline Vertical (Mobile < 640px) */}
      <div className="sm:hidden mt-6 space-y-3">
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={step.id}
              className="flex items-center gap-3 p-3 rounded-xl border transition-all"
              style={{
                backgroundColor: isCurrent ? 'var(--accent-gold-faint)' : 'var(--bg-elevated-1)',
                borderColor: isCurrent ? 'var(--accent-gold-border)' : 'var(--border-color)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{
                  backgroundColor: isCurrent ? 'var(--accent-gold)' : 'var(--bg-hover)',
                  color: isCurrent ? '#0d0d0d' : isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                  border: isCurrent ? 'none' : '1px solid var(--border-color)',
                }}
              >
                {step.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-bold uppercase tracking-wide truncate"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {step.label}
                </p>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                  {step.description}
                </p>
              </div>

              {isActive && (
                <span className="text-xs font-bold" style={{ color: 'var(--accent-gold)' }}>
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
