import React, { useState } from 'react';
import { sha256Hex } from '../lib/hash';

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

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(readUnlocked);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  async function submit() {
    if (!value || checking) return;
    setChecking(true);
    const hash = await sha256Hex(value);
    if (hash === PASSPHRASE_HASH) {
      try {
        sessionStorage.setItem(UNLOCK_KEY, 'true');
      } catch {
        // private-mode/blocked storage: unlock still works for this render, just won't persist across reload
      }
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
      </div>
    </div>
  );
}
