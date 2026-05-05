'use client';

import type { Game, PrizeType, TierState, GameTierState } from '@/lib/types';
import { TIERS, PRIZE_TYPES, PRIZE_ICON } from '@/lib/constants';

interface Props {
  game: Exclude<Game, 'All' | 'Streak'>;
  gameState: GameTierState;
  rounds: number;
  onChange: (tier: string, update: Partial<TierState>) => void;
}

export function PrizeTable({ game, gameState, rounds, onChange }: Props) {
  const tiers = TIERS[game] ?? [];

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
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="hint">Type in either column — the other updates automatically.</p>
    </div>
  );
}
