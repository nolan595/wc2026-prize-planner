'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlanState, SaveStatus, Market } from './types';

const DEBOUNCE_MS = 1000;

interface UseAutoSaveReturn {
  status: SaveStatus;
  triggerSave: (state: PlanState) => void;
  retry: () => void;
}

export function useAutoSave(market: Market): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStateRef = useRef<PlanState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Track if this is the initial mount — don't save on first trigger if state is freshly loaded
  const isInitialRef = useRef(true);

  const save = useCallback(async (state: PlanState) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setStatus('saving');

    try {
      const res = await fetch(`/api/plans/${market}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: state }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        setStatus('error');
        return;
      }

      setStatus('saved');

      // Auto-transition to idle after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
    } catch (e) {
      // Ignore aborts — they come from a superseding save
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setStatus('error');
    }
  }, [market]);

  const triggerSave = useCallback((state: PlanState) => {
    lastStateRef.current = state;

    // Skip debounce on the very first call after a load (no user change yet)
    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Don't set 'saving' here — the fetch hasn't fired yet. The status
    // transitions to 'saving' only when the actual network request begins,
    // preventing a false "Saving…" indicator during the debounce window.

    debounceRef.current = setTimeout(() => {
      if (lastStateRef.current) save(lastStateRef.current);
    }, DEBOUNCE_MS);
  }, [save]);

  const retry = useCallback(() => {
    if (lastStateRef.current) save(lastStateRef.current);
  }, [save]);

  // Reset initial flag when market changes
  useEffect(() => {
    isInitialRef.current = true;
    setStatus('idle');
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, [market]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return { status, triggerSave, retry };
}
