'use client';

import { useState } from 'react';
import type { Game, PrizeType, TierState, GameTierState } from '@/lib/types';
import { PRIZE_TYPES, PRIZE_ICON } from '@/lib/constants';
import { getEffectiveTiers } from '@/lib/utils';

interface Props {
  game: Exclude<Game, 'All' | 'Streak' | 'Pass the Ball'>;
  gameState: GameTierState;
  rounds: number;
  onChange: (tier: string, update: Partial<TierState>) => void;
  customTiers: Record<string, string[]>;
  onAddTier: (tier: string) => void;
  onRemoveTier: (tier: string) => void;
}

export function PrizeTable({ game, gameState, rounds, onChange, customTiers, onAddTier, onRemoveTier }: Props) {
  const [newTierInput, setNewTierInput] = useState('');

  const tiers = getEffectiveTiers(game, customTiers);

  const handleAddTier = () => {
    const v = newTierInput.trim();
    if (!v || tiers.includes(v)) return;
    onAddTier(v);
    setNewTierInput('');
  };

  return (
    <div>
      <table aria-label={`${game} prize breakdown`}>
        <caption className="sr-only">{game} prize breakdown by tier</caption>
        <thead>
          <tr>
            <th scope="col">Tier</th>
            <th scope="col">Prize Type</th>
            <th className="right" scope="col">Per Round</th>
            <th className="right" scope="col">Total (all rounds)</th>
            <th scope="col" aria-label="Remove tier" style={{ width: 28 }} />
          </tr>
        </thead>
        <tbody>
          {tiers.map(tier => {
            const s: TierState = gameState[tier] ?? { type: 'Coins', perRound: '', total: '', lastEdited: null };
            const prStyle = s.lastEdited === 'total' ? 'calculated' : 'entered';
            const totStyle = s.lastEdited === 'perRound' ? 'calculated' : 'entered';

            return (
              <tr key={tier}>
                <td className="tier-label">{tier}</td>
                <td>
                  <select
                    value={s.type}
                    aria-label={`${tier} prize type`}
                    onChange={e => onChange(tier, { type: e.target.value as PrizeType })}
                  >
                    {PRIZE_TYPES.map(p => (
                      <option key={p} value={p}>{PRIZE_ICON[p]} {p}</option>
                    ))}
                  </select>
                </td>
                <td className="num-input">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={s.perRound}
                    className={prStyle}
                    aria-label={`${tier} — per round amount`}
                    onFocus={e => { (e.target as HTMLInputElement).className = 'entered'; }}
                    onChange={e => {
                      const val = e.target.value;
                      const total = val === '' ? '' : String(Math.round(parseFloat(val) * rounds));
                      onChange(tier, { perRound: val, total, lastEdited: 'perRound' });
                    }}
                  />
                </td>
                <td className="num-input">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={s.total}
                    className={totStyle}
                    aria-label={`${tier} — total amount across all rounds`}
                    onFocus={e => { (e.target as HTMLInputElement).className = 'entered'; }}
                    onChange={e => {
                      const val = e.target.value;
                      const perRound = val === '' ? '' : String(Math.round(parseFloat(val) / rounds));
                      onChange(tier, { total: val, perRound, lastEdited: 'total' });
                    }}
                  />
                </td>
                <td className="tier-action-cell">
                  {tiers.length > 1 && (
                    <button
                      className="tier-remove-icon"
                      onClick={() => onRemoveTier(tier)}
                      aria-label={`Remove ${tier} tier`}
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="tier-management-strip single-col">
        <div className="tier-mgmt-label">Tiers</div>
        <div className="tier-chips">
          {tiers.map(tier => (
            <span key={tier} className="tier-chip">
              {tier}
              {tiers.length > 1 && (
                <button onClick={() => onRemoveTier(tier)} aria-label={`Remove ${tier}`}>×</button>
              )}
            </span>
          ))}
          <div className="tier-chip-add">
            <input
              type="text"
              placeholder="New tier name"
              value={newTierInput}
              aria-label="New tier name"
              onChange={e => setNewTierInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddTier(); }}
            />
            <button onClick={handleAddTier}>+ Add tier</button>
          </div>
        </div>
      </div>

      <p className="hint">Type in either column — the other updates automatically.</p>
    </div>
  );
}
