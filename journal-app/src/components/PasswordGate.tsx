import React, { useRef, useState } from 'react';
import { sha256Hex } from '../lib/hash';
import { emptySnapshot, readSnapshotFile } from '../lib/backup';
import { useStore } from '../lib/store';
import type { ExportSnapshot } from '../lib/store';

const UNLOCK_KEY = 'journal.unlocked';
// SHA-256 digest of the passphrase — the plaintext is never stored in the source.
const PASSPHRASE_HASH = '8265d41cb585485ac0c16bb9230f6f69c4e0a3dcd30929eeea44dc49437528ac';

function readUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === 'true';
  } catch {
    return false;
  }
}

function markUnlocked() {
  try {
    sessionStorage.setItem(UNLOCK_KEY, 'true');
  } catch {
    // private-mode/blocked storage: unlock still works for this render, just won't persist across reload
  }
}

function ForgotPassword({ onUnlocked, onBack }: { onUnlocked: () => void; onBack: () => void }) {
  const { importSnapshot } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ExportSnapshot | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    try {
      const snapshot = await readSnapshotFile(file);
      setPending(snapshot);
    } catch {
      setError('That file doesn’t look like a journal backup.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (pending) {
    return (
      <>
        <p className="lock-title">Restore this file?</p>
        <p className="lock-hint">This replaces anything already on this device.</p>
        <div className="forgot-actions">
          <button
            className="primary-btn"
            onClick={() => {
              importSnapshot(pending);
              markUnlocked();
              onUnlocked();
            }}
          >
            Yes, restore and unlock
          </button>
          <button className="text-btn" onClick={() => setPending(null)}>
            Cancel
          </button>
        </div>
      </>
    );
  }

  if (confirmingReset) {
    return (
      <>
        <p className="lock-title">Start fresh?</p>
        <p className="lock-hint">This erases everything currently on this device. It can’t be undone.</p>
        <div className="forgot-actions">
          <button
            className="primary-btn lock-submit-danger"
            onClick={() => {
              importSnapshot(emptySnapshot());
              markUnlocked();
              onUnlocked();
            }}
          >
            Yes, erase and start fresh
          </button>
          <button className="text-btn" onClick={() => setConfirmingReset(false)}>
            Cancel
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="lock-title">Forgot password?</p>
      <p className="lock-hint">There is no password reset.</p>
      <div className="forgot-actions">
        <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
          Import data
        </button>
        <button className="secondary-btn" onClick={() => setConfirmingReset(true)}>
          Reset from empty log
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => handleFile(e.target.files)}
      />
      {error && <p className="lock-error">{error}</p>}
      <button className="text-btn lock-back" onClick={onBack}>
        ‹ Back
      </button>
    </>
  );
}

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(readUnlocked);
  const [view, setView] = useState<'password' | 'forgot'>('password');
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  async function submit() {
    if (!value || checking) return;
    setChecking(true);
    const hash = await sha256Hex(value);
    if (hash === PASSPHRASE_HASH) {
      markUnlocked();
      setUnlocked(true);
    } else {
      setError(true);
      setValue('');
      setChecking(false);
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="phone-frame">
      <div className="phone-content lock-content">
        {view === 'forgot' ? (
          <ForgotPassword onUnlocked={() => setUnlocked(true)} onBack={() => setView('password')} />
        ) : (
          <>
            <p className="lock-title">Journal</p>
            <p className="lock-hint">Enter the password to continue.</p>
            <input
              className="field lock-input"
              type="password"
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
            {error && <p className="lock-error">Wrong password.</p>}
            <button className="primary-btn lock-submit" disabled={!value || checking} onClick={submit}>
              {checking ? 'Checking…' : 'Unlock'}
            </button>
            <button className="text-btn lock-forgot" onClick={() => setView('forgot')}>
              Forgot password?
            </button>
          </>
        )}
      </div>
    </div>
  );
}
