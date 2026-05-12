'use client';

import type { Game, Market, LbState, RoundOverrides, StateByGame, StreakPrizeState, PrizeType, CustomPredictorRound, JackpotState } from '@/lib/types';
import { LB_TIERS, GAME_SLOT, PRIZE_CSS, PRIZE_ICON } from '@/lib/constants';
import { getSlotData, getCustomRoundPrimary, dayLabel, getEffectiveStreakConfig, getEffectiveTiers, defaultJackpotState } from '@/lib/utils';

interface Props {
  game: Game;
  market: Market;
  toggledOff: Set<number>;
  toggledOffByGame?: Record<string, number[]>;
  stateByGame: StateByGame;
  streakPrizeState: StreakPrizeState;
  roundOverrides: RoundOverrides;
  lbState: LbState;
  eventOverrides: Record<string, [string, string]>;
  customRounds: CustomPredictorRound[];
  streakJackpot?: Record<string, JackpotState>;
  ptbMultipliers?: Record<string, number>;
  ptbFixtures?: Record<string, [string, string]>;
  customStreakConfig?: Record<string, { levels: number[]; segments: string[] }>;
  customTiers?: Record<string, string[]>;
}

export function SummaryGrid({
  toggledOffByGame,
  game,
  market,
  toggledOff,
  stateByGame,
  streakPrizeState,
  roundOverrides,
  lbState,
  eventOverrides,
  customRounds,
  streakJackpot,
  ptbMultipliers,
  ptbFixtures,
  customStreakConfig,
  customTiers,
}: Props) {
  if (game === 'Pass the Ball') {
    const ptbDays = Object.entries(ptbMultipliers ?? {})
      .filter(([, v]) => v > 0)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));

    if (ptbDays.length === 0) {
      return (
        <div className="summary-grid">
          <div style={{ color: 'var(--color-text-faint)', fontSize: '0.875rem' }}>
            No multipliers set yet. Click any day on the calendar to add one.
          </div>
        </div>
      );
    }

    return (
      <div className="summary-grid">
        {ptbDays.map(([day, mult]) => {
          const fixture = ptbFixtures?.[day];
          return (
            <div key={day} className="summary-item ptb">
              <div className="s-label">{dayLabel(parseInt(day))}</div>
              <div className="s-total ptb-multiplier-summary">×{mult}</div>
              {fixture && (
                <div className="s-sub" style={{ marginTop: 2 }}>{fixture[0]}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (game === 'All') {
    const GAMES = ['Streak', 'Match Line', 'Predictor'] as const;
    const GAME_COLOR: Record<string, string> = { Streak: '#ff5252', 'Match Line': '#4caf50', Predictor: '#4a9eff' };
    const grandTotals: Record<string, number> = {};
    let anyData = false;

    const cards = GAMES.map(g => {
      const gSlot = GAME_SLOT[g as keyof typeof GAME_SLOT];
      const gameToggledOff = new Set<number>(toggledOffByGame?.[g] ?? []);
      const activeDays: number[] = [];
      for (let d = 11; d <= 49; d++) {
        if (gameToggledOff.has(d)) continue;
        if (getSlotData(d, market, gSlot, eventOverrides)) activeDays.push(d);
        else if (gSlot === 'pd' && getCustomRoundPrimary(d, customRounds)) activeDays.push(d);
      }

      const fixedTotals: Record<string, number> = {};
      type StreakLevel = { level: number; rows: { seg: string; val: number; type: string }[] };
      let streakLevels: StreakLevel[] | null = null;
      let jackpotInfo: { label: string; sub: string } | null = null;

      if (g === 'Streak') {
        const cfg = getEffectiveStreakConfig(market, customStreakConfig ?? {});
        const ss = streakPrizeState[market] ?? {};
        const levels: StreakLevel[] = [];
        cfg.levels.forEach(lv => {
          const rows: { seg: string; val: number; type: string }[] = [];
          cfg.segments.forEach(seg => {
            const val = parseFloat((ss[String(lv)] ?? {})[seg]?.perRound ?? '') || 0;
            const type = (ss[String(lv)] ?? {})[seg]?.type ?? 'Coins';
            if (val) rows.push({ seg, val, type });
          });
          if (rows.length) levels.push({ level: lv, rows });
        });
        if (levels.length) streakLevels = levels;

        LB_TIERS.forEach(tier => {
          const s = lbState[tier];
          if (!s) return;
          const v = (parseFloat(s.prizePerLb) || 0) * (parseFloat(s.numLbs) || 0);
          if (v) fixedTotals[s.type] = (fixedTotals[s.type] || 0) + v;
        });

        const js: JackpotState = streakJackpot?.[market] ?? defaultJackpotState();
        if (js.type === 'instant' && parseFloat(js.prizePerWinner) > 0) {
          jackpotInfo = {
            label: '🏆 Jackpot (instant)',
            sub: `${parseFloat(js.prizePerWinner).toLocaleString()} ${js.prizeType} per winner · ${activeDays.length} rounds`,
          };
        } else if (js.type === 'pool' && parseFloat(js.poolSize) > 0) {
          const pool = parseFloat(js.poolSize);
          const payoutEvery = parseInt(js.payoutEvery ?? '') || null;
          const expStr = payoutEvery ? ` · total exposure: ${(pool * payoutEvery).toLocaleString()}` : '';
          jackpotInfo = {
            label: '🏆 Jackpot (shared pool)',
            sub: `${pool.toLocaleString()} ${js.prizeType}/payout${expStr}`,
          };
        }
      } else {
        const gameState = stateByGame[g] ?? {};
        const gameOvs = roundOverrides[g] ?? {};
        getEffectiveTiers(g, customTiers ?? {}).forEach(tier => {
          const s = gameState[tier];
          activeDays.forEach(d => {
            const ovEntry = gameOvs[String(d)]?.[tier];
            const val = ovEntry !== undefined ? ovEntry.val : (parseFloat(s?.perRound ?? '') || 0);
            const type = ovEntry !== undefined ? ovEntry.type : (s?.type ?? 'Coins');
            if (val) fixedTotals[type] = (fixedTotals[type] || 0) + val;
          });
        });
      }

      const hasContent = Object.keys(fixedTotals).length || streakLevels?.length || jackpotInfo;
      if (!hasContent) return null;
      anyData = true;

      // Fixed costs go into grand total (LB for streak, all tiers for others)
      Object.entries(fixedTotals).forEach(([type, total]) => {
        grandTotals[type] = (grandTotals[type] || 0) + total;
      });

      const color = GAME_COLOR[g];

      return (
        <div key={g} className="summary-item" style={{ borderLeftColor: color }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{g}</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--color-text-faint)' }}>{activeDays.length} round{activeDays.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Streak per-winner rates */}
          {g === 'Streak' && streakLevels && (() => {
            const byType: Record<string, { min: number; max: number }> = {};
            streakLevels.forEach(({ rows }) => rows.forEach(({ val, type }) => {
              if (!byType[type]) byType[type] = { min: val, max: val };
              else { byType[type].min = Math.min(byType[type].min, val); byType[type].max = Math.max(byType[type].max, val); }
            }));
            return Object.entries(byType).map(([type, { min, max }]) => {
              const range = min === max ? min.toLocaleString() : `${min.toLocaleString()} – ${max.toLocaleString()}`;
              return (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{PRIZE_ICON[type as PrizeType] ?? ''} {type}</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{range} <span style={{ fontSize: '0.62rem', color: 'var(--color-text-faint)', fontWeight: 400 }}>/ winner</span></span>
                </div>
              );
            });
          })()}

          {/* Streak LB fixed costs */}
          {g === 'Streak' && Object.entries(fixedTotals).map(([type, total]) => (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{PRIZE_ICON[type as PrizeType] ?? ''} {type} <span style={{ color: 'var(--color-text-faint)' }}>(LB)</span></span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{Math.round(total).toLocaleString()}</span>
            </div>
          ))}

          {/* Other games fixed totals */}
          {g !== 'Streak' && Object.entries(fixedTotals).map(([type, total]) => (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{PRIZE_ICON[type as PrizeType] ?? ''} {type}</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{Math.round(total).toLocaleString()}</span>
            </div>
          ))}

          {!streakLevels?.length && !Object.keys(fixedTotals).length && !jackpotInfo && (
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', padding: '4px 0' }}>No prizes configured</div>
          )}

          {/* Jackpot mini-card */}
          {jackpotInfo && (
            <div style={{ marginTop: 6, padding: '5px 7px', background: 'rgba(245,197,24,0.07)', borderRadius: 4, borderLeft: '2px solid #f5c518' }}>
              <div style={{ fontSize: '0.68rem', color: '#f5c518', fontWeight: 700 }}>{jackpotInfo.label}</div>
              <div style={{ fontSize: '0.63rem', color: 'var(--color-text-muted)', marginTop: 1 }}>{jackpotInfo.sub}</div>
            </div>
          )}
        </div>
      );
    });

    if (!anyData) {
      return (
        <div className="summary-grid">
          <div style={{ color: 'var(--color-text-faint)', fontSize: '0.875rem' }}>
            Configure prizes per game to see a combined summary.
          </div>
        </div>
      );
    }

    const grandEntries = Object.entries(grandTotals);

    return (
      <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {cards}
        {grandEntries.length > 0 && (
          <div className="summary-item" style={{ borderLeftColor: '#f5c518', gridColumn: '1 / -1', background: '#112240' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f5c518', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Grand Total</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--color-text-faint)' }}>fixed costs only · Streak per-winner prizes excluded</span>
            </div>
            {grandEntries.map(([type, total]) => (
              <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '0.76rem', color: '#aac4e8' }}>{PRIZE_ICON[type as PrizeType] ?? ''} {type}</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f5c518' }}>{Math.round(total).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const slot = GAME_SLOT[game as keyof typeof GAME_SLOT];

  // Collect active days — for Predictor, also include custom round startDays
  const activeDays: number[] = [];
  for (let d = 11; d <= 49; d++) {
    if (toggledOff.has(d)) continue;
    if (getSlotData(d, market, slot, eventOverrides)) { activeDays.push(d); continue; }
    if (slot === 'pd' && getCustomRoundPrimary(d, customRounds)) activeDays.push(d);
  }

  const totals: Record<string, number> = {};
  const subs: Record<string, { instant: number; lb: number }> = {};

  const addToTotals = (type: string, amount: number, isLb: boolean) => {
    if (!totals[type]) { totals[type] = 0; subs[type] = { instant: 0, lb: 0 }; }
    totals[type] += amount;
    if (isLb) subs[type].lb += amount;
    else subs[type].instant += amount;
  };

  if (game === 'Streak') {
    const cfg = getEffectiveStreakConfig(market, customStreakConfig ?? {});
    const ss = streakPrizeState[market] ?? {};

    cfg.levels.forEach(lv => {
      const lvState = (ss[String(lv)] ?? {}) as Record<string, { type: PrizeType; perRound: string }>;
      cfg.segments.forEach(seg => {
        const s = lvState[seg];
        if (!s) return;
        const val = parseFloat(s.perRound) || 0;
        if (!val) return;
        addToTotals(s.type, val * activeDays.length, false);
      });
    });

    LB_TIERS.forEach(tier => {
      const s = lbState[tier];
      if (!s) return;
      const v = (parseFloat(s.prizePerLb) || 0) * (parseFloat(s.numLbs) || 0);
      if (!v) return;
      addToTotals(s.type, v, true);
    });
  } else {
    const gameState = stateByGame[game] ?? {};
    const gameOvs = roundOverrides[game] ?? {};

    getEffectiveTiers(game, customTiers ?? {}).forEach(tier => {
      const s = gameState[tier];
      const defaultVal = parseFloat(s?.perRound ?? '') || 0;
      const hasAnyOverride = activeDays.some(d => gameOvs[String(d)]?.[tier] !== undefined);
      if (!defaultVal && !hasAnyOverride) return;

      activeDays.forEach(d => {
        const ovEntry = gameOvs[String(d)]?.[tier];
        const val = ovEntry !== undefined ? ovEntry.val : defaultVal;
        const type = ovEntry !== undefined ? ovEntry.type : (s?.type ?? 'Coins');
        if (!val) return;
        addToTotals(type, val, false);
      });
    });
  }

  // Build jackpot card for Streak
  const jackpotCard = (() => {
    if (game !== 'Streak') return null;
    const js: JackpotState = streakJackpot?.[market] ?? defaultJackpotState();
    const rounds = activeDays.length;
    const qLabel = js.questionsToWin ? `Q${js.questionsToWin} in a row` : 'perfect score';

    if (js.type === 'instant' && parseFloat(js.prizePerWinner) > 0) {
      const amt = parseFloat(js.prizePerWinner);
      return (
        <div className="summary-item" style={{ borderLeftColor: '#f5c518', gridColumn: '1 / -1' }}>
          <div className="s-label">🏆 Jackpot — Instant ({js.prizeType})</div>
          <div className="s-total">{amt.toLocaleString()} per winner</div>
          <div className="s-sub">
            Trigger: {qLabel} · fixed prize paid immediately · {rounds} active round{rounds !== 1 ? 's' : ''} · total scales with winner count
          </div>
        </div>
      );
    }
    if (js.type === 'pool' && parseFloat(js.poolSize) > 0) {
      const pool = parseFloat(js.poolSize);
      const payoutEvery = parseInt(js.payoutEvery ?? '') || null;
      const totalExposure = payoutEvery ? pool * payoutEvery : null;
      const payoutLabel = payoutEvery
        ? `paid every ${payoutEvery} LB period${payoutEvery !== 1 ? 's' : ''}`
        : 'payout frequency not set';
      return (
        <div className="summary-item" style={{ borderLeftColor: '#f5c518', gridColumn: '1 / -1' }}>
          <div className="s-label">🏆 Jackpot — Shared Pool ({js.prizeType})</div>
          <div className="s-total">{pool.toLocaleString()} per payout</div>
          <div className="s-sub">
            Trigger: {qLabel} · split across all winners · {payoutLabel}
            {totalExposure !== null ? ` · total exposure: ${totalExposure.toLocaleString()}` : ''}
            {` · ${rounds} active round${rounds !== 1 ? 's' : ''}`}
          </div>
        </div>
      );
    }
    return null;
  })();

  if (Object.keys(totals).length === 0 && !jackpotCard) {
    return (
      <div className="summary-grid">
        <div style={{ color: 'var(--color-text-faint)', fontSize: '0.875rem' }}>
          Enter prize amounts above to see totals.
        </div>
      </div>
    );
  }

  return (
    <div className="summary-grid">
      {Object.entries(totals).map(([type, total]) => {
        const cssClass = PRIZE_CSS[type as PrizeType] ?? 'freebets';
        const icon = PRIZE_ICON[type as PrizeType] ?? '';
        const sub = subs[type];
        const showSub = game === 'Streak' && (sub.instant > 0 || sub.lb > 0);

        return (
          <div key={type} className={`summary-item ${cssClass}`}>
            <div className="s-label">{icon} {type}</div>
            <div className="s-total">{Math.round(total).toLocaleString()}</div>
            {showSub && (
              <div className="s-sub">
                Instant: {Math.round(sub.instant).toLocaleString()} · LB: {Math.round(sub.lb).toLocaleString()}
              </div>
            )}
          </div>
        );
      })}

      {game === 'Streak' && Object.keys(totals).length > 0 && (
        <div className="summary-item note">
          <div className="s-label">Instant prizes</div>
          <div className="s-sub" style={{ fontSize: '0.75rem', marginTop: 4, lineHeight: 1.5 }}>
            Amounts above are per prized player per round × active days. Total budget scales with player volume.
          </div>
        </div>
      )}

      {jackpotCard}
    </div>
  );
}
