import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import AppModal from '../components/AppModal';

export const ModalContext = createContext(null);

const initialState = {
  isOpen: false,
  type: 'info',
  title: '',
  message: '',
  confirmText: 'OK',
  cancelText: 'Cancel',
  showCancel: false,
  mode: 'message',
  confirmDelaySeconds: 0,
};

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState(initialState);
  const resolverRef = useRef(null);

  const closeModal = useCallback(() => {
    setModalState(initialState);
  }, []);

  const showMessage = useCallback(({ type = 'info', title, message, confirmText = 'OK' }) => {
    setModalState({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      cancelText: 'Cancel',
      showCancel: false,
      mode: 'message',
      confirmDelaySeconds: 0,
    });
  }, []);

  const confirm = useCallback(
    ({ type = 'warning', title, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmDelaySeconds = 0 }) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        setModalState({
          isOpen: true,
          type,
          title,
          message,
          confirmText,
          cancelText,
          showCancel: true,
          mode: 'confirm',
          confirmDelaySeconds: Math.max(0, Number(confirmDelaySeconds) || 0),
        });
      }),
    []
  );

  const handleConfirm = useCallback(() => {
    if (modalState.mode === 'confirm' && resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
    closeModal();
  }, [closeModal, modalState.mode]);

  const handleCancel = useCallback(() => {
    if (modalState.mode === 'confirm' && resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    closeModal();
  }, [closeModal, modalState.mode]);

  const value = useMemo(
    () => ({
      showMessage,
      showSuccess: (title, message) => showMessage({ type: 'success', title, message }),
      showError: (title, message) => showMessage({ type: 'error', title, message }),
      showInfo: (title, message) => showMessage({ type: 'info', title, message }),
      confirm,
    }),
    [confirm, showMessage]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <AppModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
        confirmDelaySeconds={modalState.confirmDelaySeconds}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ModalContext.Provider>
  );
};
