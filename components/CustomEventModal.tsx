'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion, AnimatePresence, motion } from 'framer-motion';
import type { Market } from '@/lib/types';
import { SLOT_NAME } from '@/lib/constants';
import { dayLabel } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  day: number | null;
  slot: string | null;
  market: Market;
  eventOverrides: Record<string, [string, string]>;
  onClose: () => void;
  onApply: (day: number, slot: string, name: string, time: string) => void;
}

export function CustomEventModal({
  isOpen,
  day,
  slot,
  eventOverrides,
  onClose,
  onApply,
}: Props) {
  const reducedMotion = useReducedMotion();
  const nameRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || day === null || slot === null) return null;

  const existing = eventOverrides[`${day}-${slot}`];
  const slotDisplayName = SLOT_NAME[slot as 'sk' | 'ml' | 'pd'] ?? slot;

  const handleApply = () => {
    const name = nameRef.current?.value.trim() ?? '';
    if (!name) { nameRef.current?.focus(); return; }
    const time = timeRef.current?.value.trim() || '8:00 PM';
    onApply(day, slot, name, time);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleApply();
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
            className="modal-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-event-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="modal-hd">
              <span id="custom-event-title">Add Event — {dayLabel(day)}</span>
              <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
            </div>
            <div className="modal-sub">Game slot: {slotDisplayName}</div>

            <div className="op-field" style={{ marginBottom: 10 }}>
              <label htmlFor="custom-event-name">Event name</label>
              <input
                id="custom-event-name"
                ref={nameRef}
                type="text"
                placeholder="e.g. Copa América Final"
                defaultValue={existing?.[0] ?? ''}
                onKeyDown={handleKeyDown}
                style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', padding: '8px 10px' }}
              />
            </div>

            <div className="op-field" style={{ marginBottom: 12 }}>
              <label htmlFor="custom-event-time">Time (local, e.g. 8:00 PM)</label>
              <input
                id="custom-event-time"
                ref={timeRef}
                type="text"
                placeholder="8:00 PM"
                defaultValue={existing?.[1] ?? ''}
                onKeyDown={handleKeyDown}
                style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', padding: '8px 10px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={handleApply}>Add</button>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
