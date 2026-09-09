import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modals, setModals] = useState([]);

  const showModal = useCallback((modal) => {
    const id = Date.now() + Math.random();
    const newModal = { id, ...modal, isOpen: true };
    setModals(prev => [...prev, newModal]);
    return id;
  }, []);

  const hideModal = useCallback((id) => {
    setModals(prev => prev.filter(m => m.id !== id));
  }, []);

  const hideAllModals = useCallback(() => {
    setModals([]);
  }, []);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      showModal({
        type: 'confirm',
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        variant: options.variant || 'danger',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }, [showModal]);

  const alert = useCallback((options) => {
    return new Promise((resolve) => {
      showModal({
        type: 'alert',
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'OK',
        variant: options.variant || 'info',
        onConfirm: () => resolve(),
      });
    });
  }, [showModal]);

  const toast = useCallback((options) => {
    const id = showModal({
      type: 'toast',
      message: options.message,
      variant: options.variant || 'info',
      duration: options.duration || 4000,
    });
    
    setTimeout(() => hideModal(id), options.duration || 4000);
    return id;
  }, [showModal, hideModal]);

  const value = {
    modals,
    showModal,
    hideModal,
    hideAllModals,
    confirm,
    alert,
    toast,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <ModalRenderer modals={modals} onClose={hideModal} />
    </ModalContext.Provider>
  );
}

function ModalRenderer({ modals, onClose }) {
  if (modals.length === 0) return null;

  return (
    <>
      {modals.map((modal) => (
        <Modal key={modal.id} modal={modal} onClose={onClose} />
      ))}
    </>
  );
}

function Modal({ modal, onClose }) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && modal.type !== 'toast') {
      onClose(modal.id);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && modal.type !== 'toast') {
      onClose(modal.id);
    }
  }, [modal.id, modal.type, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const variantConfig = {
    info: {
      headerBg: 'from-nexus-500/10 via-nexus-500/5 to-transparent',
      borderColor: 'border-nexus-500/30',
      iconColor: 'text-nexus-400',
      iconBg: 'bg-nexus-500/10',
      buttonClass: 'btn-primary'
    },
    success: {
      headerBg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      buttonClass: 'btn-primary'
    },
    warning: {
      headerBg: 'from-amber-500/10 via-amber-500/5 to-transparent',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      buttonClass: 'btn-primary'
    },
    danger: {
      headerBg: 'from-red-500/10 via-red-500/5 to-transparent',
      borderColor: 'border-red-500/30',
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/10',
      buttonClass: 'btn-danger'
    }
  };

  const config = variantConfig[modal.variant] || variantConfig.info;

  const getIcon = () => {
    switch (modal.variant) {
      case 'success':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />;
      case 'warning':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />;
      case 'danger':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />;
      default:
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
    }
  };

  if (modal.type === 'toast') {
    return (
      <div className={`fixed bottom-6 right-6 z-[100] animate-slide-up glass ${config.borderColor} border-l-4 p-4 rounded-xl shadow-xl min-w-[300px] max-w-md`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {getIcon()}
            </svg>
          </div>
          <p className="text-sm text-white flex-1">{modal.message}</p>
          <button onClick={() => onClose(modal.id)} className="flex-shrink-0 text-nexus-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={handleOverlayClick} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title"
    >
      <div className="glass w-full max-w-md rounded-3xl shadow-glass-lg overflow-hidden animate-scale-in border-b-2">
        {/* Header with gradient */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${config.headerBg} border-b ${config.borderColor}`}>
          <div className="absolute inset-0 bg-current/5" />
          <div className="relative p-6">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${config.borderColor} ${config.iconBg} shadow-[0_0_24px_rgba(0,0,0,0.1)]`}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {modal.type === 'confirm' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    getIcon()
                  )}
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nexus-400">
                  {modal.type === 'confirm' ? 'Confirmação necessária' : modal.variant === 'success' ? 'Sucesso' : modal.variant === 'warning' ? 'Atenção' : modal.variant === 'danger' ? 'Aviso importante' : 'Informação'}
                </p>
                <h3 id="modal-title" className="mt-2 text-xl font-bold leading-tight text-white">
                  {modal.title}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-base leading-relaxed text-nexus-300">
            {modal.message}
          </p>

          {/* Warning for destructive actions */}
          {modal.variant === 'danger' && modal.type === 'confirm' && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <svg className="h-5 w-5 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs leading-relaxed text-amber-200">
                Esta ação não pode ser desfeita. Certifique-se antes de continuar.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {modal.type === 'confirm' && (
              <>
                <button
                  onClick={() => { modal.onCancel?.(); onClose(modal.id); }}
                  className="btn-secondary w-full gap-2 sm:w-auto px-6 py-3 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { modal.onConfirm?.(); onClose(modal.id); }}
                  className={`${config.buttonClass} w-full gap-2 sm:w-auto px-6 py-3 font-medium`}
                >
                  {modal.confirmText}
                </button>
              </>
            )}
            {modal.type === 'alert' && (
              <button
                onClick={() => { modal.onConfirm?.(); onClose(modal.id); }}
                className={`${config.buttonClass} w-full gap-2 sm:w-auto px-6 py-3 font-medium`}
              >
                {modal.confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}