import React from 'react';
import type { ScreenId } from '../lib/types';
import {
  BarChartIcon,
  CalendarIcon,
  GridIcon,
  HouseIcon,
  OpenBookIcon,
  PlusIcon,
  SpeechBubbleIcon,
} from './icons';

interface NavItem {
  id: ScreenId;
  label: string;
  icon: (color: string) => React.ReactNode;
}

const ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: (c) => <HouseIcon color={c} /> },
  { id: 'words', label: 'Words', icon: (c) => <SpeechBubbleIcon color={c} /> },
  { id: 'entries', label: 'Entries', icon: (c) => <CalendarIcon color={c} /> },
  { id: 'new', label: 'New', icon: (c) => <PlusIcon color={c} size={20} /> },
  { id: 'reading', label: 'Reading', icon: (c) => <OpenBookIcon color={c} /> },
  { id: 'insights', label: 'Insights', icon: (c) => <BarChartIcon color={c} /> },
  { id: 'images', label: 'Images', icon: (c) => <GridIcon color={c} /> },
];

export function BottomNav({
  active,
  onNavigate,
}: {
  active: ScreenId;
  onNavigate: (s: ScreenId) => void;
}) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => {
        const isActive = active === item.id;
        const isNew = item.id === 'new';
        const color = isNew ? (isActive ? 'var(--bg)' : 'var(--text)') : isActive ? 'var(--text)' : 'var(--text-tertiary)';
        return (
          <button
            key={item.id}
            className="nav-item"
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={isNew ? `nav-new-circle${isActive ? ' active' : ''}` : 'nav-icon'}>
              {item.icon(color)}
            </span>
            <span
              className="nav-label"
              style={{ color: isNew ? 'transparent' : isActive ? 'var(--text)' : 'var(--text-tertiary)' }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
