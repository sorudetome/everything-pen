import React, { useState } from 'react';

export function ConfirmDelete({
  onConfirm,
  onCancel,
  label = 'Delete',
  confirmLabel = 'Delete?',
}: {
  onConfirm: () => void;
  onCancel?: () => void;
  label?: string;
  confirmLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="confirm-delete">
        <span className="confirm-delete-label">{confirmLabel}</span>
        <button className="text-btn danger" onClick={onConfirm}>
          Yes
        </button>
        <button
          className="text-btn"
          onClick={() => {
            setConfirming(false);
            onCancel?.();
          }}
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button className="text-btn danger" onClick={() => setConfirming(true)}>
      {label}
    </button>
  );
}
