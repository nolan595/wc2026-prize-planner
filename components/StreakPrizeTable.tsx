'use client';

import { useState } from 'react';
import type { Market, TierState, PrizeType, JackpotState } from '@/lib/types';
import { PRIZE_TYPES, PRIZE_ICON } from '@/lib/constants';
import { getEffectiveStreakConfig } from '@/lib/utils';

const JACKPOT_TYPES: { value: JackpotState['type']; label: string }[] = [
  { value: 'instant', label: 'Instant (fixed per winner)' },
  { value: 'pool',    label: 'Shared pool (split across winners)' },
];

interface Props {
  market: Market;
  streakState: Record<string, Record<string, TierState>>;
  rounds: number;
  onChange: (level: number, segment: string, update: Partial<TierState>) => void;
  customStreakConfig: Record<string, { levels: number[]; segments: string[] }>;
  onAddLevel: (level: number) => void;
  onRemoveLevel: (level: number) => void;
  onAddSegment: (segment: string) => void;
  onRemoveSegment: (segment: string) => void;
  jackpot: JackpotState;
  onJackpotChange: (update: Partial<JackpotState>) => void;
}

export function StreakPrizeTable({
  market,
  streakState,
  rounds,
  onChange,
  customStreakConfig,
  onAddLevel,
  onRemoveLevel,
  onAddSegment,
  onRemoveSegment,
  jackpot,
  onJackpotChange,
}: Props) {
  const [newLevelInput, setNewLevelInput] = useState('');
  const [newSegInput, setNewSegInput] = useState('');

  const cfg = getEffectiveStreakConfig(market, customStreakConfig);

  const handleAddLevel = () => {
    const v = parseInt(newLevelInput.trim(), 10);
    if (!v || v <= 0 || cfg.levels.includes(v)) return;
    onAddLevel(v);
    setNewLevelInput('');
  };

  const handleAddSegment = () => {
    const v = newSegInput.trim();
    if (!v || cfg.segments.includes(v)) return;
    onAddSegment(v);
    setNewSegInput('');
  };

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
            <th scope="col" aria-label="Remove segment" style={{ width: 28 }} />
          </tr>
        </thead>
        <tbody>
          {cfg.levels.map(lv => {
            const lvKey = String(lv);
            const lvState = streakState[lvKey] ?? {};

            return [
              <tr key={`header-${lv}`} className="sk-level-header">
                <td colSpan={5}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Prize Level <span className="sk-level-badge">Q{lv}</span></span>
                    {cfg.levels.length > 1 && (
                      <button
                        className="tier-remove-btn"
                        onClick={() => onRemoveLevel(lv)}
                        aria-label={`Remove Q${lv} level`}
                      >
                        × Remove level
                      </button>
                    )}
                  </div>
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
                    <td className="tier-action-cell">
                      {cfg.segments.length > 1 && (
                        <button
                          className="tier-remove-icon"
                          onClick={() => onRemoveSegment(seg)}
                          aria-label={`Remove ${seg} segment`}
                          title={`Remove ${seg} from all levels`}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }),
            ];
          })}
        </tbody>
      </table>

      {/* ── Jackpot section ─────────────────────────── */}
      <div className="jackpot-section" role="region" aria-label="Jackpot configuration">
        <div className="jackpot-header">🏆 Jackpot (Perfect Score)</div>
        <div className="jackpot-grid">
          <div className="jackpot-field">
            <label htmlFor="jp-type">Type</label>
            <select
              id="jp-type"
              value={jackpot.type}
              onChange={e => onJackpotChange({ type: e.target.value as JackpotState['type'] })}
            >
              {JACKPOT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="jackpot-field">
            <label htmlFor="jp-prize-type">Prize Type</label>
            <select
              id="jp-prize-type"
              value={jackpot.prizeType}
              onChange={e => onJackpotChange({ prizeType: e.target.value as PrizeType })}
            >
              {PRIZE_TYPES.map(p => (
                <option key={p} value={p}>{PRIZE_ICON[p]} {p}</option>
              ))}
            </select>
          </div>
          <div className="jackpot-field">
            <label htmlFor="jp-prize-amount">
              {jackpot.type === 'instant' ? 'Prize Per Winner' : 'Total Pool Size'}
            </label>
            <input
              id="jp-prize-amount"
              type="number"
              min="0"
              placeholder="0"
              value={jackpot.type === 'instant' ? jackpot.prizePerWinner : jackpot.poolSize}
              aria-label={jackpot.type === 'instant' ? 'Prize per winner' : 'Total pool size'}
              onChange={e => {
                if (jackpot.type === 'instant') {
                  onJackpotChange({ prizePerWinner: e.target.value });
                } else {
                  onJackpotChange({ poolSize: e.target.value });
                }
              }}
            />
          </div>
          <div className="jackpot-field">
            <label htmlFor="jp-questions">Questions to Win Jackpot</label>
            <input
              id="jp-questions"
              type="number"
              min="1"
              placeholder="e.g. 10"
              value={jackpot.questionsToWin}
              aria-label="Questions to win jackpot"
              onChange={e => onJackpotChange({ questionsToWin: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* ── Management strip ─────────────────────────── */}
      <div className="tier-management-strip">
        <div className="tier-mgmt-col">
          <div className="tier-mgmt-label">
            Prize Levels <span>(question thresholds)</span>
          </div>
          <div className="tier-chips">
            {cfg.levels.map(lv => (
              <span key={lv} className="tier-chip">
                Q{lv}
                {cfg.levels.length > 1 && (
                  <button onClick={() => onRemoveLevel(lv)} aria-label={`Remove Q${lv}`}>×</button>
                )}
              </span>
            ))}
            <div className="tier-chip-add">
              <input
                type="number"
                min="1"
                placeholder="e.g. 10"
                value={newLevelInput}
                aria-label="New level question threshold"
                onChange={e => setNewLevelInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddLevel(); }}
              />
              <button onClick={handleAddLevel}>+ Add level</button>
            </div>
          </div>
        </div>

        <div className="tier-mgmt-col">
          <div className="tier-mgmt-label">Segments</div>
          <div className="tier-chips">
            {cfg.segments.map(seg => (
              <span key={seg} className="tier-chip">
                {seg}
                {cfg.segments.length > 1 && (
                  <button onClick={() => onRemoveSegment(seg)} aria-label={`Remove ${seg} segment`}>×</button>
                )}
              </span>
            ))}
            <div className="tier-chip-add">
              <input
                type="text"
                placeholder="e.g. LV"
                value={newSegInput}
                aria-label="New segment name"
                onChange={e => setNewSegInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddSegment(); }}
              />
              <button onClick={handleAddSegment}>+ Add segment</button>
            </div>
          </div>
        </div>
      </div>

      <p className="hint">
        Prize is awarded per qualifying player per round. "× Active Rounds" = per-player total across all active days.
      </p>
    </div>
  );
}
