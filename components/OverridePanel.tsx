'use client';

import { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { motion } from 'framer-motion';
import type { Game, Market, RoundOverrides, StateByGame, PrizeType, OverrideEntry } from '@/lib/types';
import { PRIZE_TYPES, PRIZE_ICON } from '@/lib/constants';
import { dayLabel, getSlotData, getEffectiveTiers } from '@/lib/utils';

interface Props {
  editingDay: number;
  game: Exclude<Game, 'All' | 'Pass the Ball'>;
  market: Market;
  stateByGame: StateByGame;
  roundOverrides: RoundOverrides;
  eventOverrides: Record<string, [string, string]>;
  customTiers: Record<string, string[]>;
  roundTierOverrides: Record<string, Record<string, string[]>>;
  onClose: () => void;
  onClear: () => void;
  onChange: (day: number, tier: string, entry: OverrideEntry | null) => void;
  onSetRoundTiers: (day: number, tiers: string[]) => void;
  onClearRoundTiers: (day: number) => void;
}

export function OverridePanel({
  editingDay,
  game,
  market,
  stateByGame,
  roundOverrides,
  eventOverrides,
  customTiers,
  roundTierOverrides,
  onClose,
  onClear,
  onChange,
  onSetRoundTiers,
  onClearRoundTiers,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [qCount, setQCount] = useState('');
  const [qStart, setQStart] = useState('');

  const slot = game === 'Streak' ? 'sk' : game === 'Match Line' ? 'ml' : 'pd';
  const slotData = getSlotData(editingDay, market, slot, eventOverrides);
  const matchName = slotData ? slotData[0] : '';

  const roundTiers = roundTierOverrides[game]?.[String(editingDay)];
  const tiers = roundTiers ?? getEffectiveTiers(game, customTiers);
  const gameState = stateByGame[game] ?? {};
  const dayOverrides = roundOverrides[game]?.[String(editingDay)] ?? {};

  const qStartPlaceholder = (() => {
    const total = parseInt(qCount);
    return total >= 2 ? String(Math.floor(total / 2) + 1) : 'auto';
  })();

  function applyQuestionCount() {
    const total = parseInt(qCount);
    if (!total || total < 2) return;
    const defaultStart = Math.floor(total / 2) + 1;
    const startRaw = parseInt(qStart);
    const start = (startRaw >= 1 && startRaw <= total) ? startRaw : defaultStart;
    const newTiers: string[] = [];
    for (let i = start; i <= total; i++) newTiers.push(`${i}/${total} correct`);
    onSetRoundTiers(editingDay, newTiers);
    setQCount('');
    setQStart('');
  }

  function resetRoundTiers() {
    onClearRoundTiers(editingDay);
    setQCount('');
    setQStart('');
  }

  function handleClear() {
    onClear();
    onClearRoundTiers(editingDay);
    setQCount('');
    setQStart('');
  }

  return (
    <motion.div
      className="override-panel"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="op-header">
        <span>
          Prize Override — {dayLabel(editingDay)}{matchName ? `: ${matchName}` : ''}
        </span>
        <button className="op-close" onClick={onClose} aria-label="Close override panel">
          ✕
        </button>
      </div>

      {/* Question count row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Questions:</span>
        <input
          type="number"
          min="1"
          max="30"
          placeholder="e.g. 12"
          value={qCount}
          onChange={e => setQCount(e.target.value)}
          style={{ width: 70, fontSize: '0.8rem', padding: '4px 7px' }}
          aria-label="Total questions in this round"
        />
        <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Prize from:</span>
        <input
          type="number"
          min="1"
          max="30"
          placeholder={qStartPlaceholder}
          value={qStart}
          onChange={e => setQStart(e.target.value)}
          style={{ width: 70, fontSize: '0.8rem', padding: '4px 7px' }}
          aria-label="First question that wins a prize"
        />
        <button
          className="btn-sm"
          style={{ marginTop: 0, padding: '4px 10px' }}
          onClick={applyQuestionCount}
        >
          Apply
        </button>
        {roundTiers && (
          <button
            className="btn-sm"
            style={{ marginTop: 0, padding: '4px 10px' }}
            onClick={resetRoundTiers}
          >
            Reset tiers
          </button>
        )}
      </div>

      <div className="op-grid">
        {tiers.map(tier => {
          const s = gameState[tier];
          const existing = dayOverrides[tier] as OverrideEntry | undefined;

          return (
            <div key={tier} className="op-field">
              <label htmlFor={`op-${tier}-type`}>{tier}</label>
              <select
                id={`op-${tier}-type`}
                style={{ marginBottom: 4, fontSize: '0.76rem', padding: '4px 6px' }}
                value={existing ? existing.type : (s?.type ?? 'Coins')}
                onChange={e => {
                  const newType = e.target.value as PrizeType;
                  const currentVal = existing?.val;
                  if (currentVal !== undefined) {
                    onChange(editingDay, tier, { val: currentVal, type: newType });
                  }
                }}
                aria-label={`${tier} prize type`}
              >
                {PRIZE_TYPES.map(p => (
                  <option key={p} value={p}>{PRIZE_ICON[p]} {p}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                className="entered"
                placeholder={s?.perRound || '0'}
                value={existing !== undefined ? String(existing.val) : ''}
                aria-label={`${tier} — override amount`}
                onChange={e => {
                  const val = e.target.value;
                  const currentType = existing?.type ?? (s?.type ?? 'Coins') as PrizeType;
                  if (val === '') {
                    onChange(editingDay, tier, null);
                  } else {
                    onChange(editingDay, tier, { val: parseFloat(val) || 0, type: currentType });
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      <button className="btn-ghost" style={{ marginTop: 10 }} onClick={handleClear}>
        Clear Override
      </button>
    </motion.div>
  );
}
