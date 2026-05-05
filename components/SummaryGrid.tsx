'use client';

import type { Game, Market, LbState, RoundOverrides, StateByGame, StreakPrizeState, PrizeType } from '@/lib/types';
import { TIERS, LB_TIERS, STREAK_CONFIG, GAME_SLOT, PRIZE_CSS, PRIZE_ICON } from '@/lib/constants';
import { getSlotData } from '@/lib/utils';

interface Props {
  game: Game;
  market: Market;
  toggledOff: Set<number>;
  stateByGame: StateByGame;
  streakPrizeState: StreakPrizeState;
  roundOverrides: RoundOverrides;
  lbState: LbState;
  eventOverrides: Record<string, [string, string]>;
}

export function SummaryGrid({
  game,
  market,
  toggledOff,
  stateByGame,
  streakPrizeState,
  roundOverrides,
  lbState,
  eventOverrides,
}: Props) {
  if (game === 'All') {
    return (
      <div className="summary-grid">
        <div style={{ color: 'var(--color-text-faint)', fontSize: '0.875rem' }}>
          Select a specific game to see prize totals.
        </div>
      </div>
    );
  }

  const slot = GAME_SLOT[game as keyof typeof GAME_SLOT];

  // Collect active days
  const activeDays: number[] = [];
  for (let d = 11; d <= 49; d++) {
    if (!toggledOff.has(d) && getSlotData(d, market, slot, eventOverrides)) {
      activeDays.push(d);
    }
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
    const cfg = STREAK_CONFIG[market];
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

    (TIERS[game as keyof typeof TIERS] ?? []).forEach(tier => {
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

  if (Object.keys(totals).length === 0) {
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

      {game === 'Streak' && (
        <div className="summary-item note">
          <div className="s-label">Instant prizes</div>
          <div className="s-sub" style={{ fontSize: '0.75rem', marginTop: 4, lineHeight: 1.5 }}>
            Amounts above are per prized player per round × active days. Total budget scales with player volume.
          </div>
        </div>
      )}
    </div>
  );
}
