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

  const variantStyles = {
    info: 'border-nexus-500/50',
    success: 'border-green-500/50',
    warning: 'border-yellow-500/50',
    danger: 'border-red-500/50',
  };

  const iconStyles = {
    info: 'text-nexus-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
  };

  if (modal.type === 'toast') {
    return (
      <div className={`fixed bottom-6 right-6 z-[100] animate-slide-up glass ${variantStyles[modal.variant]} border-l-4 p-4 rounded-xl shadow-xl min-w-[300px] max-w-md`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 mt-0.5 ${iconStyles[modal.variant]}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {modal.variant === 'success' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
              {modal.variant === 'warning' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
              {modal.variant === 'danger' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
              {modal.variant === 'info' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
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
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={`modal-content ${variantStyles[modal.variant]} border-l-4`}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconStyles[modal.variant]} bg-current/10`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {modal.variant === 'success' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                {modal.variant === 'warning' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
                {modal.variant === 'danger' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
                {modal.variant === 'info' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                {modal.type === 'confirm' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
              </svg>
            </div>
            <div className="flex-1">
              <h3 id="modal-title" className="text-lg font-semibold text-white mb-1">{modal.title}</h3>
              <p className="text-nexus-300 text-sm">{modal.message}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            {modal.type === 'confirm' && (
              <>
                <button
                  onClick={() => { modal.onCancel?.(); onClose(modal.id); }}
                  className="btn-secondary"
                >
                  {modal.cancelText}
                </button>
                <button
                  onClick={() => { modal.onConfirm?.(); onClose(modal.id); }}
                  className={modal.variant === 'danger' ? 'btn-danger' : 'btn-primary'}
                >
                  {modal.confirmText}
                </button>
              </>
            )}
            {modal.type === 'alert' && (
              <button
                onClick={() => { modal.onConfirm?.(); onClose(modal.id); }}
                className="btn-primary w-full sm:w-auto"
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