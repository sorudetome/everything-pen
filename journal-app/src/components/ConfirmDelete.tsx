import React, { useState } from 'react';

export function ConfirmDelete({ onConfirm, label = 'Delete' }: { onConfirm: () => void; label?: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="confirm-delete">
        <span className="confirm-delete-label">Delete?</span>
        <button className="text-btn danger" onClick={onConfirm}>
          Yes
        </button>
        <button className="text-btn" onClick={() => setConfirming(false)}>
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
