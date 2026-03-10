import React from 'react';
import '../styles/AdminDashboard.css';

const ConfirmDialog = ({ open, title, message, confirmText, cancelText, onConfirm, onCancel, confirmDanger }) => {
  if (!open) return null;

  const dialogTitle = title || 'Potvrdenie';
  const dialogMessage = message || '';
  const titleId = 'admin-confirm-title';
  const messageId = 'admin-confirm-message';

  return (
    <div className="admin-confirm-overlay">
      <div
        className="admin-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <div className="admin-confirm-header">
          <span className="admin-confirm-icon" aria-hidden="true">
            {confirmDanger ? '⚠️' : '❔'}
          </span>
          <h3 className="admin-confirm-title" id={titleId}>
            {dialogTitle}
          </h3>
        </div>

        <div className="admin-confirm-body">
          <p className="admin-confirm-text" id={messageId}>
            {dialogMessage}
          </p>
        </div>

        <div className="admin-confirm-actions">
          <button
            type="button"
            onClick={onCancel}
            className="admin-confirm-btn admin-confirm-btn-cancel"
          >
            {cancelText || 'Zrušiť'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`admin-confirm-btn ${confirmDanger ? 'admin-confirm-btn-danger' : 'admin-confirm-btn-success'}`}
          >
            {confirmText || 'Potvrdiť'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
