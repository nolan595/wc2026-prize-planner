'use client';

import type { Market, TierState, PrizeType } from '@/lib/types';
import { STREAK_CONFIG, PRIZE_TYPES, PRIZE_ICON } from '@/lib/constants';

interface Props {
  market: Market;
  streakState: Record<string, Record<string, TierState>>;
  rounds: number;
  onChange: (level: number, segment: string, update: Partial<TierState>) => void;
}

export function StreakPrizeTable({ market, streakState, rounds, onChange }: Props) {
  const cfg = STREAK_CONFIG[market];

  return (
    <div>
      <table aria-label="Streak prize breakdown by segment and level">
        <caption className="sr-only">Streak prize breakdown by segment and level</caption>
        <thead>
          <tr>
            <th scope="col">Segment</th>
            <th scope="col">Prize Type</th>
            <th className="right" scope="col">Per Player / Round</th>
            <th className="right" scope="col">× Active Rounds</th>
          </tr>
        </thead>
        <tbody>
          {cfg.levels.map(lv => {
            const lvKey = String(lv);
            const lvState = streakState[lvKey] ?? {};

            return [
              <tr key={`header-${lv}`} className="sk-level-header">
                <td colSpan={4}>
                  Prize Level <span className="sk-level-badge">Q{lv}</span>
                </td>
              </tr>,
              ...cfg.segments.map(seg => {
                const s: TierState = lvState[seg] ?? { type: 'Coins', perRound: '', total: '', lastEdited: null };
                const prStyle = s.lastEdited === 'total' ? 'calculated' : 'entered';
                const totStyle = s.lastEdited === 'perRound' ? 'calculated' : 'entered';

                return (
                  <tr key={`${lv}-${seg}`}>
                    <td className="seg-label">{seg}</td>
                    <td>
                      <select
                        value={s.type}
                        aria-label={`Q${lv} ${seg} prize type`}
                        onChange={e => onChange(lv, seg, { type: e.target.value as PrizeType })}
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
                        aria-label={`Q${lv} ${seg} — per player per round`}
                        onFocus={e => { (e.target as HTMLInputElement).className = 'entered'; }}
                        onChange={e => {
                          const val = e.target.value;
                          const total = val === '' ? '' : String(Math.round(parseFloat(val) * rounds));
                          onChange(lv, seg, { perRound: val, total, lastEdited: 'perRound' });
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
                        aria-label={`Q${lv} ${seg} — total across all active rounds`}
                        onFocus={e => { (e.target as HTMLInputElement).className = 'entered'; }}
                        onChange={e => {
                          const val = e.target.value;
                          const perRound = val === '' ? '' : String(Math.round(parseFloat(val) / rounds));
                          onChange(lv, seg, { total: val, perRound, lastEdited: 'total' });
                        }}
                      />
                    </td>
                  </tr>
                );
              }),
            ];
          })}
        </tbody>
      </table>
      <p className="hint">
        Prize is awarded per qualifying player per round. "× Active Rounds" = per-player total across all active days.
      </p>
    </div>
  );
}
