'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion, AnimatePresence, motion } from 'framer-motion';
import type { Market } from '@/lib/types';
import { SLOT_NAME } from '@/lib/constants';
import { getMatchPool, getSlotData, dayLabel } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  day: number | null;
  slot: string | null;
  market: Market;
  eventOverrides: Record<string, [string, string]>;
  onClose: () => void;
  onApply: (day: number, slot: string, match: string, time: string) => void;
  onReset: (day: number, slot: string) => void;
}

export function SwapModal({
  isOpen,
  day,
  slot,
  market,
  eventOverrides,
  onClose,
  onApply,
  onReset,
}: Props) {
  const reducedMotion = useReducedMotion();
  const selectRef = useRef<HTMLSelectElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (isOpen && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || day === null || slot === null) return null;

  const typedSlot = slot as 'sk' | 'ml' | 'pd';
  const pool = getMatchPool(day, market);
  const current = getSlotData(day, market, typedSlot, eventOverrides);
  const isNew = !current;
  const slotDisplayName = SLOT_NAME[typedSlot] ?? slot;

  const handleApply = () => {
    if (!selectRef.current) return;
    const [matchName, matchTime] = selectRef.current.value.split('|');
    if (matchName) onApply(day, slot, matchName, matchTime ?? '');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            ref={dialogRef}
            className="modal-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="swap-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="modal-hd">
              <span id="swap-modal-title">
                {isNew
                  ? `Add Round — ${dayLabel(day)} (${slotDisplayName})`
                  : `Assign Match — ${dayLabel(day)} (${slotDisplayName})`
                }
              </span>
              <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
            </div>
            <div className="modal-sub">
              {isNew
                ? 'Pick a match to create a round on this day.'
                : `Current: ${current?.[0] ?? ''}`
              }
            </div>

            <select
              ref={selectRef}
              style={{ marginBottom: 12 }}
              aria-label="Select match"
              defaultValue={current ? `${current[0]}|${current[1]}` : undefined}
            >
              {pool.length === 0 ? (
                <option>No matches available for this day</option>
              ) : (
                pool.map(([match, time]) => (
                  <option key={match} value={`${match}|${time}`}>
                    {match} ({time} IST)
                  </option>
                ))
              )}
            </select>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={handleApply}>Apply</button>
              <button className="btn-ghost" onClick={() => onReset(day, slot)}>
                Reset to Default
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
