import React from 'react';

export function Chip({
  label,
  variant = 'suggested',
  onClick,
  count,
}: {
  label: string;
  variant?: 'active' | 'suggested' | 'static';
  onClick?: () => void;
  count?: number;
}) {
  const content = (
    <>
      {label}
      {variant === 'active' && <span className="chip-x">×</span>}
      {typeof count === 'number' && <span className="chip-count">{count}</span>}
    </>
  );
  if (!onClick) {
    return <span className={`chip chip-${variant}`}>{content}</span>;
  }
  return (
    <button type="button" className={`chip chip-${variant}`} onClick={onClick}>
      {content}
    </button>
  );
}
