'use client';

import { useReducedMotion, AnimatePresence, motion } from 'framer-motion';
import type { LbState, PrizeType } from '@/lib/types';
import { LB_TIERS, LB_CLASSES, PRIZE_TYPES, PRIZE_ICON } from '@/lib/constants';

interface Props {
  visible: boolean;
  lbState: LbState;
  onChange: (tier: string, update: Partial<{ type: PrizeType; prizePerLb: string; numLbs: string }>) => void;
}

export function LeaderboardTable({ visible, lbState, onChange }: Props) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="card"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <div className="card-title">Leaderboard</div>
          <table aria-label="Leaderboard prize configuration">
            <caption className="sr-only">Leaderboard prize configuration by tier</caption>
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">Prize Type</th>
                <th className="right" scope="col">Prize per Leaderboard</th>
                <th className="right" scope="col">No. of Leaderboards</th>
                <th className="right" scope="col">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {LB_TIERS.map(tier => {
                const s = lbState[tier] ?? { type: 'Coins' as PrizeType, prizePerLb: '', numLbs: '' };
                const total = (parseFloat(s.prizePerLb) || 0) * (parseFloat(s.numLbs) || 0);
                const totalDisplay = total ? String(Math.round(total)) : '';
                const tierClass = LB_CLASSES[tier] ?? '';

                return (
                  <tr key={tier}>
                    <td className={`tier-label ${tierClass}`}>{tier}</td>
                    <td>
                      <select
                        value={s.type}
                        aria-label={`${tier} leaderboard prize type`}
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
                        value={s.prizePerLb}
                        className="entered"
                        aria-label={`${tier} — prize per leaderboard`}
                        onChange={e => onChange(tier, { prizePerLb: e.target.value })}
                      />
                    </td>
                    <td className="num-input">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={s.numLbs}
                        className="entered"
                        aria-label={`${tier} — number of leaderboards`}
                        onChange={e => onChange(tier, { numLbs: e.target.value })}
                      />
                    </td>
                    <td className="num-input">
                      <input
                        type="number"
                        readOnly
                        placeholder="—"
                        value={totalDisplay}
                        className="calculated"
                        aria-label={`${tier} — total cost (calculated)`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="hint">
            Enter prize per leaderboard and number of leaderboards — total calculates automatically.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
