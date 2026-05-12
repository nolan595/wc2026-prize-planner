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
  onRemoveTier: (tier: string) => void;
  onApplyQuestionCount: (total: number, start: number) => void;
}

export function PrizeTable({ game, gameState, rounds, onChange, customTiers, onRemoveTier, onApplyQuestionCount }: Props) {
  const [qCount, setQCount] = useState('');
  const [qStart, setQStart] = useState('');

  const qStartPlaceholder = (() => {
    const total = parseInt(qCount);
    return total >= 2 ? String(Math.floor(total / 2) + 1) : 'e.g. 3';
  })();

  function handleApplyQCount() {
    const total = parseInt(qCount);
    if (!total || total < 2) return;
    const defaultStart = Math.floor(total / 2) + 1;
    const startRaw = parseInt(qStart);
    const start = (startRaw >= 1 && startRaw <= total) ? startRaw : defaultStart;
    onApplyQuestionCount(total, start);
    setQCount('');
    setQStart('');
  }

  const tiers = getEffectiveTiers(game, customTiers);

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

      {/* Question count — auto-generates tiers like "7/12 correct" */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12, marginBottom: 4 }}>
        <span style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Questions per round:</span>
        <input
          type="number"
          min="1"
          max="30"
          placeholder="e.g. 6"
          value={qCount}
          onChange={e => setQCount(e.target.value)}
          style={{ width: 70, fontSize: '0.82rem', padding: '5px 8px' }}
          aria-label="Total questions per round"
        />
        <span style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Prize from:</span>
        <input
          type="number"
          min="1"
          max="30"
          placeholder={qStartPlaceholder}
          value={qStart}
          onChange={e => setQStart(e.target.value)}
          style={{ width: 70, fontSize: '0.82rem', padding: '5px 8px' }}
          aria-label="First question that wins a prize"
        />
        <button
          className="btn-apply"
          style={{ margin: 0, fontSize: '0.72rem', padding: '5px 12px' }}
          onClick={handleApplyQCount}
        >
          Apply
        </button>
      </div>


<p className="hint">Type in either column — the other updates automatically.</p>
    </div>
  );
}
