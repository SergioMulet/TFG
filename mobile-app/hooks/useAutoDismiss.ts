import { useEffect } from 'react';

export function useAutoDismiss(active: boolean, setActive: (value: boolean) => void, delayMs = 2000) {
  useEffect(() => {
    if (!active) return;
    const timeout = setTimeout(() => setActive(false), delayMs);
    return () => clearTimeout(timeout);
  }, [active, setActive, delayMs]);
}
