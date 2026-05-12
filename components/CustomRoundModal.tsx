'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Market, CustomPredictorRound, Slot } from '@/lib/types';
import { WC_ALL_MATCHES, SLOT_NAME } from '@/lib/constants';
import { dayLabel } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  day: number | null;
  slot: Slot | null;
  market: Market;
  existingEvent?: [string, string] | null;
  existingRound?: CustomPredictorRound | null;
  onClose: () => void;
  onSave: (day: number, slot: Slot, events: [string, string][], spanDays: number) => void;
  onDelete?: (day: number, slot: Slot) => void;
}

const MATCH_DAYS = (Object.keys(WC_ALL_MATCHES) as unknown as number[])
  .map(Number)
  .sort((a, b) => a - b);

export function CustomRoundModal({
  isOpen,
  day,
  slot,
  existingEvent,
  existingRound,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const reducedMotion = useReducedMotion();
  const isPredictor = slot === 'pd';

  const [events, setEvents] = useState<[string, string][]>([['', '']]);
  const [spanDays, setSpanDays] = useState(1);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || day === null || slot === null) return;
    if (slot === 'pd' && existingRound) {
      setEvents(existingRound.fixtures.length > 0
        ? existingRound.fixtures.map(f => [f.match, f.time] as [string, string])
        : [['', '']]);
      setSpanDays(existingRound.endDay - existingRound.startDay + 1);
    } else if (existingEvent) {
      setEvents([[existingEvent[0], existingEvent[1]]]);
      setSpanDays(1);
    } else {
      setEvents([['', '']]);
      setSpanDays(1);
    }
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [isOpen, day, slot]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || day === null || slot === null) return null;

  const isEditing = slot === 'pd' ? !!existingRound : !!existingEvent;

  const updateEvent = (idx: number, field: 0 | 1, value: string) =>
    setEvents(prev => prev.map((e, i) => i === idx ? (field === 0 ? [value, e[1]] : [e[0], value]) : e) as [string, string][]);

  const pickWC = (idx: number, val: string) => {
    if (!val) return;
    const [m, t] = val.split('|');
    setEvents(prev => prev.map((e, i) => i === idx ? [m, t] : e) as [string, string][]);
  };

  const handleSave = () => {
    const valid = events.filter(([m]) => m.trim()) as [string, string][];
    if (!valid.length) { firstInputRef.current?.focus(); return; }
    const filled: [string, string][] = valid.map(([m, t]) => [m.trim(), t.trim() || '8:00 PM']);
    onSave(day, slot, filled, isPredictor ? spanDays : 1);
  };

  const spanEndDay = Math.min(day + spanDays - 1, 49);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="modal-box"
            style={{ maxWidth: 480, width: '90vw' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cr-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="modal-hd">
              <span id="cr-modal-title">
                Custom Round — {dayLabel(day)} ({SLOT_NAME[slot]})
              </span>
              <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
            </div>
            <div className="modal-sub">
              {isEditing ? 'Edit this custom round.' : 'Create a custom round for this day.'}
            </div>

            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
              {isPredictor ? 'Events in this round' : 'Event'}
            </div>

            {/* Event rows */}
            <div style={{ marginBottom: 8 }}>
              {events.map(([match, time], idx) => (
                <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' }}>
                  {/* WC quick-pick */}
                  <select
                    defaultValue=""
                    onChange={e => { pickWC(idx, e.target.value); e.currentTarget.value = ''; }}
                    aria-label="Pick WC match"
                    style={{
                      background: '#0d1d36', border: '1px solid #2a5080', color: '#7a9abf',
                      borderRadius: 6, padding: '6px 8px', fontSize: '0.8rem',
                      flexShrink: 0, width: 130, cursor: 'pointer',
                    }}
                  >
                    <option value="" disabled>⚽ WC picks</option>
                    {MATCH_DAYS.map(d => {
                      const matches = WC_ALL_MATCHES[d];
                      if (!matches?.length) return null;
                      return (
                        <optgroup key={d} label={dayLabel(d)}>
                          {matches.map(([m, t]) => (
                            <option key={m} value={`${m}|${t}`}>{m}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>

                  {/* Match name input */}
                  <input
                    ref={idx === 0 ? firstInputRef : undefined}
                    type="text"
                    placeholder="Or type custom event…"
                    value={match}
                    onChange={e => updateEvent(idx, 0, e.target.value)}
                    style={{
                      flex: 1, minWidth: 0, background: '#0d1d36', border: '1px solid #2a5080',
                      color: '#fff', borderRadius: 6, padding: '6px 8px', fontSize: '0.8rem', outline: 'none',
                    }}
                  />

                  {/* Time input */}
                  <input
                    type="text"
                    placeholder="8:00 PM"
                    value={time}
                    onChange={e => updateEvent(idx, 1, e.target.value)}
                    style={{
                      width: 90, flexShrink: 0, background: '#0d1d36', border: '1px solid #2a5080',
                      color: '#fff', borderRadius: 6, padding: '6px 8px', fontSize: '0.8rem', outline: 'none',
                    }}
                  />

                  {/* Remove row */}
                  {events.length > 1 && (
                    <button
                      onClick={() => setEvents(prev => prev.filter((_, i) => i !== idx))}
                      aria-label="Remove event"
                      style={{ background: 'none', border: 'none', color: 'rgba(255,82,82,0.6)', cursor: 'pointer', fontSize: '1rem', padding: '0 3px', lineHeight: 1 }}
                    >✕</button>
                  )}
                </div>
              ))}
            </div>

            {/* + Add event (Predictor only) */}
            {isPredictor && (
              <button
                onClick={() => setEvents(prev => [...prev, ['', '']])}
                style={{
                  background: 'none', border: '1px dashed #2a5080', color: '#4a9eff',
                  fontSize: '0.72rem', padding: '4px 10px', borderRadius: 5, cursor: 'pointer', marginBottom: 10,
                }}
              >
                + Add event
              </button>
            )}

            {/* Span controls (Predictor only) */}
            {isPredictor && (
              <div style={{ background: '#0a1628', borderRadius: 6, padding: 10, marginTop: 8, border: '1px solid #1e3a5f' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Round spans multiple days
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: '#7a9abf', whiteSpace: 'nowrap' }}>Covers</span>
                  <select
                    value={spanDays}
                    onChange={e => setSpanDays(Number(e.target.value))}
                    style={{ flex: 1, minWidth: 80, fontSize: '0.76rem', padding: '5px 7px' }}
                    aria-label="Number of days this round spans"
                  >
                    <option value={1}>1 day only</option>
                    <option value={2}>2 days</option>
                    <option value={3}>3 days</option>
                    <option value={4}>4 days</option>
                    <option value={5}>5 days</option>
                  </select>
                  {spanDays > 1 && (
                    <span style={{ fontSize: '0.7rem', color: '#f5c518', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                      ({dayLabel(day)} – {dayLabel(spanEndDay)})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Footer buttons */}
            <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleSave}>Save Round</button>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
              {isEditing && onDelete && (
                <button
                  className="btn-ghost"
                  onClick={() => { onDelete(day, slot); onClose(); }}
                  style={{ marginLeft: 'auto', color: '#ff5252', borderColor: 'rgba(255,82,82,0.6)' }}
                  aria-label="Delete this custom round"
                >
                  Delete
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
