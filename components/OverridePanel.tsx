'use client';

import { useReducedMotion } from 'framer-motion';
import { motion } from 'framer-motion';
import type { Game, Market, RoundOverrides, StateByGame, PrizeType, OverrideEntry } from '@/lib/types';
import { TIERS, PRIZE_TYPES, PRIZE_ICON } from '@/lib/constants';
import { dayLabel, getSlotData } from '@/lib/utils';

interface Props {
  editingDay: number;
  game: Exclude<Game, 'All' | 'Pass the Ball'>;
  market: Market;
  stateByGame: StateByGame;
  roundOverrides: RoundOverrides;
  eventOverrides: Record<string, [string, string]>;
  onClose: () => void;
  onClear: () => void;
  onChange: (day: number, tier: string, entry: OverrideEntry | null) => void;
}

export function OverridePanel({
  editingDay,
  game,
  market,
  stateByGame,
  roundOverrides,
  eventOverrides,
  onClose,
  onClear,
  onChange,
}: Props) {
  const reducedMotion = useReducedMotion();
  const slot = game === 'Streak' ? 'sk' : game === 'Match Line' ? 'ml' : 'pd';
  const slotData = getSlotData(editingDay, market, slot, eventOverrides);
  const matchName = slotData ? slotData[0] : '';
  const tiers = TIERS[game] ?? [];
  const gameState = stateByGame[game] ?? {};
  const dayOverrides = roundOverrides[game]?.[String(editingDay)] ?? {};

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

      <button className="btn-ghost" style={{ marginTop: 10 }} onClick={onClear}>
        Clear Override
      </button>
    </motion.div>
  );
}
