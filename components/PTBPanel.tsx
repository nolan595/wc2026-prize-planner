'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Market } from '@/lib/types';
import { WC_ALL_MATCHES } from '@/lib/constants';
import { dayLabel, toLocal } from '@/lib/utils';

interface Props {
  day: number;
  market: Market;
  currentMultiplier: number | undefined;
  currentFixture: [string, string] | undefined;
  onSave: (day: number, multiplier: number, fixture: [string, string] | null) => void;
  onClear: (day: number) => void;
  onClose: () => void;
}

const CUSTOM_KEY = '__custom__';
const NONE_KEY = '__none__';

export function PTBPanel({
  day,
  market,
  currentMultiplier,
  currentFixture,
  onSave,
  onClear,
  onClose,
}: Props) {
  const reduceMotion = useReducedMotion();
  const poolForDay = WC_ALL_MATCHES[day] ?? [];

  // Determine initial fixture select state
  function initialSelectValue() {
    if (!currentFixture) return NONE_KEY;
    const inPool = poolForDay.find(([m]) => m === currentFixture[0]);
    return inPool ? currentFixture[0] : CUSTOM_KEY;
  }

  const [multValue, setMultValue] = useState(String(currentMultiplier ?? ''));
  const [fixtureSelect, setFixtureSelect] = useState(initialSelectValue);
  const [customName, setCustomName] = useState(currentFixture && !poolForDay.find(([m]) => m === currentFixture[0]) ? currentFixture[0] : '');
  const [customTime, setCustomTime] = useState(currentFixture && !poolForDay.find(([m]) => m === currentFixture[0]) ? currentFixture[1] : '');

  useEffect(() => {
    setMultValue(String(currentMultiplier ?? ''));
    setFixtureSelect(initialSelectValue());
    const inPool = currentFixture ? poolForDay.find(([m]) => m === currentFixture[0]) : null;
    setCustomName(currentFixture && !inPool ? currentFixture[0] : '');
    setCustomTime(currentFixture && !inPool ? currentFixture[1] : '');
  }, [day]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsedMult = parseFloat(multValue);
  const isValidMult = !isNaN(parsedMult) && parsedMult > 0;
  const isCustom = fixtureSelect === CUSTOM_KEY;
  const isNone = fixtureSelect === NONE_KEY;

  function buildFixture(): [string, string] | null {
    if (isNone) return null;
    if (isCustom) {
      if (!customName.trim()) return null;
      return [customName.trim(), customTime.trim() || ''];
    }
    const entry = poolForDay.find(([m]) => m === fixtureSelect);
    return entry ?? null;
  }

  const resolvedFixture = buildFixture();
  const canSave = isValidMult;

  function handleSave() {
    if (!canSave) return;
    onSave(day, parsedMult, resolvedFixture);
  }

  const offset = { romania: 2, poland: 1, belgium: 1, greece: 2, brazil: -4, serbia: 1 }[market] ?? 0;

  const labelStyle = {
    display: 'block',
    fontFamily: 'var(--font-display)',
    fontSize: '0.6875rem',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 8,
  };

  return (
    <motion.div
      className="override-panel"
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="op-header">
        <span className="op-title">Pass the Ball — {dayLabel(day)}</span>
        <button className="modal-close" onClick={onClose} aria-label="Close PTB editor">✕</button>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* Multiplier */}
        <div>
          <label htmlFor="ptb-multiplier-input" style={labelStyle}>Multiplier</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-ptb)' }}>×</span>
            <input
              id="ptb-multiplier-input"
              type="number"
              min="1"
              step="1"
              value={multValue}
              onChange={e => setMultValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
              placeholder="e.g. 5"
              autoFocus
              style={{ width: 80 }}
            />
          </div>
        </div>

        {/* Fixture picker */}
        <div>
          <label htmlFor="ptb-fixture-select" style={labelStyle}>
            Fixture <span style={{ color: 'var(--color-text-faint)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <select
            id="ptb-fixture-select"
            value={fixtureSelect}
            onChange={e => setFixtureSelect(e.target.value)}
          >
            <option value={NONE_KEY}>— No fixture —</option>
            {poolForDay.map(([match, istTime]) => (
              <option key={match} value={match}>
                {match} ({toLocal(istTime, offset)})
              </option>
            ))}
            <option value={CUSTOM_KEY}>Custom…</option>
          </select>
        </div>
      </div>

      {/* Custom fixture inputs */}
      {isCustom && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 12 }}>
          <div>
            <label htmlFor="ptb-custom-name" style={{ ...labelStyle, marginBottom: 5 }}>Match name</label>
            <input
              id="ptb-custom-name"
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="e.g. Brazil v Argentina"
            />
          </div>
          <div style={{ minWidth: 110 }}>
            <label htmlFor="ptb-custom-time" style={{ ...labelStyle, marginBottom: 5 }}>IST time</label>
            <input
              id="ptb-custom-time"
              type="text"
              value={customTime}
              onChange={e => setCustomTime(e.target.value)}
              placeholder="8:00 PM"
              style={{ width: 100 }}
            />
          </div>
        </div>
      )}

      <div className="op-actions" style={{ marginTop: 16 }}>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={!canSave}
          aria-label={`Save PTB for ${dayLabel(day)}`}
        >
          Save ×{isValidMult ? parsedMult : '?'}
          {resolvedFixture ? ` · ${resolvedFixture[0].split(' v ')[0]}` : ''}
        </button>
        {currentMultiplier !== undefined && (
          <button
            className="btn-ghost"
            onClick={() => onClear(day)}
            style={{ color: 'var(--color-error)', marginLeft: 8 }}
          >
            Remove
          </button>
        )}
      </div>
    </motion.div>
  );
}
