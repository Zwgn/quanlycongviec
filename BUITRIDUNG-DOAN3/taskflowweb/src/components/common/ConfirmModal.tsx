import '../../assets/styles/ConfirmModal.css';

import React from 'react';

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = true,
  isSubmitting = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="confirm-modal-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="confirm-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="confirm-modal-head">
          <h3>{title}</h3>
          <button type="button" className="confirm-modal-close" onClick={onCancel}>
            x
          </button>
        </div>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-modal-cancel" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-modal-confirm${isDanger ? ' is-danger' : ''}`}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
