import React from 'react';

/**
 * OrderStepper - Componente visual para rastreamento de pedidos
 * Exibe timeline neumórfica dos status do pedido com animações suaves
 */

export default function OrderStepper({ status = 'pendente', createdAt = new Date() }) {
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
      {/* Timeline Horizontal */}
      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-dark-border rounded-full"></div>

        {/* Progress Line */}
        <div
          className="absolute top-8 left-0 h-1 bg-gradient-to-r from-nexus-500 to-nexus-400 rounded-full transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {/* Steps */}
        <div className="relative flex justify-between items-start">
          {steps.map((step, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* Circle Node */}
                <div
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? 'neumorphic scale-125 shadow-lg'
                      : isActive
                        ? 'bg-nexus-600 border-2 border-nexus-500'
                        : 'bg-dark-card border-2 border-dark-border'
                  }`}
                >
                  <span
                    className={`text-2xl transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-nexus-400'
                    }`}
                  >
                    {step.icon}
                  </span>

                  {/* Pulse Animation for Current */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full border-2 border-nexus-500 animate-pulse"></div>
                  )}
                </div>

                {/* Labels */}
                <div className="mt-4 text-center">
                  <p
                    className={`text-sm font-semibold transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-nexus-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-nexus-400 mt-1">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Card */}
      <div className="mt-8 glass rounded-xl p-4 border border-nexus-500/30">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{steps[currentIndex].icon}</div>
          <div>
            <p className="text-sm text-nexus-400">Status Atual</p>
            <p className="text-lg font-semibold text-white">{steps[currentIndex].label}</p>
            <p className="text-xs text-nexus-400 mt-1">{steps[currentIndex].description}</p>
          </div>
        </div>
      </div>

      {/* Timeline Vertical (Mobile) */}
      <div className="md:hidden mt-6 space-y-4">
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.id} className="flex gap-4">
              {/* Vertical Line and Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-nexus-600 scale-125 shadow-lg'
                      : isActive
                        ? 'bg-nexus-600 border-2 border-nexus-500'
                        : 'bg-dark-card border-2 border-dark-border'
                  }`}
                >
                  <span className="text-lg">{step.icon}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-1 h-8 mt-2 ${
                      index < currentIndex ? 'bg-nexus-500' : 'bg-dark-border'
                    }`}
                  ></div>
                )}
              </div>

              {/* Content */}
              <div className="pt-1">
                <p className="text-sm font-semibold text-white">{step.label}</p>
                <p className="text-xs text-nexus-400">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
