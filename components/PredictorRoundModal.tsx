'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Market, CustomPredictorRound, CustomPredictorFixture } from '@/lib/types';
import { WC_ALL_MATCHES, COUNTRIES } from '@/lib/constants';
import { dayLabel, toLocal } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  startDay: number | null;
  market: Market;
  editingRound?: CustomPredictorRound | null;
  onClose: () => void;
  onSave: (round: CustomPredictorRound) => void;
  onDelete?: (id: string) => void;
}

const MATCH_DAYS = (Object.keys(WC_ALL_MATCHES) as unknown as number[])
  .map(Number)
  .sort((a, b) => a - b);

export function PredictorRoundModal({
  isOpen,
  startDay,
  market,
  editingRound,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [endDay, setEndDay] = useState<number>(startDay ?? 11);
  const [selected, setSelected] = useState<CustomPredictorFixture[]>([]);

  const offset = COUNTRIES[market].offset;

  useEffect(() => {
    if (!isOpen) return;
    if (editingRound) {
      setEndDay(editingRound.endDay);
      setSelected(editingRound.fixtures);
    } else {
      setEndDay(startDay ?? 11);
      setSelected([]);
    }
  }, [isOpen, editingRound, startDay]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const toggleFixture = (wcDay: number, match: string, time: string) => {
    setSelected(prev => {
      const exists = prev.some(f => f.wcDay === wcDay && f.match === match);
      if (exists) return prev.filter(f => !(f.wcDay === wcDay && f.match === match));
      return [...prev, { wcDay, match, time }];
    });
  };

  const isSelected = (wcDay: number, match: string) =>
    selected.some(f => f.wcDay === wcDay && f.match === match);

  const handleSave = () => {
    if (startDay === null) return;
    onSave({
      id: editingRound?.id ?? crypto.randomUUID(),
      startDay,
      endDay,
      fixtures: selected,
    });
  };

  if (!isOpen || startDay === null) return null;

  const endDayOptions: number[] = [];
  for (let d = startDay; d <= 49; d++) endDayOptions.push(d);

  const isEditing = !!editingRound;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="modal-box pred-round-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pred-round-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="modal-hd">
              <span id="pred-round-title">
                {isEditing ? 'Edit' : 'New'} Predictor Round — {dayLabel(startDay)}
              </span>
              <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
            </div>
            <div className="modal-sub">
              Attach any WC matches to this round — it can span multiple calendar days.
            </div>

            {/* Round Span */}
            <div className="pred-section">
              <div className="pred-section-label">Round Span</div>
              <div className="pred-span-row">
                <span className="pred-span-start">{dayLabel(startDay)}</span>
                <span className="pred-span-arrow">→</span>
                <select
                  value={endDay}
                  onChange={e => setEndDay(Number(e.target.value))}
                  aria-label="Round end day"
                  className="pred-span-select"
                >
                  {endDayOptions.map(d => (
                    <option key={d} value={d}>{dayLabel(d)}</option>
                  ))}
                </select>
              </div>
              {endDay > startDay && (
                <p className="pred-span-hint">
                  {dayLabel(startDay + 1)}{endDay > startDay + 1 ? ` – ${dayLabel(endDay)}` : ''} will show as faded continuation cells on the calendar.
                </p>
              )}
            </div>

            {/* Fixture Browser */}
            <div className="pred-section">
              <div className="pred-section-label">
                Fixtures
                {selected.length > 0 && (
                  <span className="pred-badge">{selected.length} selected</span>
                )}
              </div>
              <div className="pred-fixture-list" role="list" aria-label="WC fixture browser">
                {MATCH_DAYS.map(d => {
                  const matches = WC_ALL_MATCHES[d];
                  if (!matches) return null;
                  return (
                    <div key={d} role="group" aria-label={dayLabel(d)}>
                      <div className="pred-date-header">{dayLabel(d)}</div>
                      {matches.map(([match, time]) => {
                        const sel = isSelected(d, match);
                        return (
                          <button
                            key={match}
                            type="button"
                            className={`pred-fixture-row${sel ? ' selected' : ''}`}
                            onClick={() => toggleFixture(d, match, time)}
                            aria-pressed={sel}
                            aria-label={`${sel ? 'Remove' : 'Add'} ${match}`}
                          >
                            <span className="pred-fixture-check" aria-hidden="true">
                              {sel ? '✓' : '+'}
                            </span>
                            <span className="pred-fixture-info">
                              <span className="pred-fixture-name">{match}</span>
                              <span className="pred-fixture-time">{toLocal(time, offset)}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="pred-footer">
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={selected.length === 0}
                  aria-disabled={selected.length === 0}
                >
                  {isEditing ? 'Update Round' : 'Save Round'}
                </button>
                <button className="btn-ghost" onClick={onClose}>Cancel</button>
              </div>
              {isEditing && onDelete && (
                <button
                  className="btn-ghost pred-delete-btn"
                  onClick={() => { onDelete(editingRound!.id); onClose(); }}
                  aria-label="Delete this Predictor round"
                >
                  Delete Round
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
