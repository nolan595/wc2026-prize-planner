import type { Market, Slot, PlanState, TierState, LbTierState, PrizeTagData, PrizeType, CustomPredictorRound, JackpotState } from './types';
import {
  BASE_IST,
  WC_ALL_MATCHES,
  COUNTRIES,
  GAME_SLOT,
  TIERS,
  LB_TIERS,
  STREAK_CONFIG,
  PRIZE_CSS,
  PRIZE_ICON,
} from './constants';

/**
 * Convert a 12-hour IST time string to the market's local time.
 * Returns a string in the form "H:MM AM/PM" with optional "+1" day suffix.
 */
export function toLocal(timeStr: string, offset: number): string {
  const m = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return timeStr;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  let total = h * 60 + min + offset * 60;
  let nextDay = false;
  if (total >= 1440) { total -= 1440; nextDay = true; }
  if (total < 0) total += 1440;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  const nap = nh >= 12 ? 'PM' : 'AM';
  const nh12 = nh % 12 === 0 ? 12 : nh % 12;
  return `${nh12}:${String(nm).padStart(2, '0')} ${nap}${nextDay ? ' +1' : ''}`;
}

/**
 * Returns the display label for a day number (11–49).
 * Days 11–30 = June, days 31–49 = July 1–19.
 */
export function dayLabel(d: number): string {
  return d <= 30 ? `Jun ${d}` : `Jul ${d - 30}`;
}

/**
 * Resolves the effective match data for a given day + slot combination,
 * accounting for market-specific overrides and user event overrides.
 */
export function getSlotData(
  day: number,
  market: Market,
  slot: Slot,
  eventOverrides: Record<string, [string, string]>
): [string, string] | null {
  const ovKey = `${day}-${slot}`;
  if (eventOverrides[ovKey]) return eventOverrides[ovKey];

  const country = COUNTRIES[market];
  const baseDay = BASE_IST[day];
  if (!baseDay) return null;

  const ov = (country.overrides ?? {})[day] ?? {};

  if (slot === 'pd') {
    if (ov.pd !== undefined) return ov.pd;
    if (country.predictorOverrides && country.predictorOverrides[day]) {
      return country.predictorOverrides[day];
    }
    return baseDay.pd ?? null;
  }

  if (ov[slot] !== undefined) return ov[slot] as [string, string];
  return baseDay[slot] ?? null;
}

/**
 * Builds the pool of available matches for a given day + market combination,
 * used to populate the swap modal dropdown.
 */
export function getMatchPool(day: number, market: Market): [string, string][] {
  const seen = new Set<string>();
  const pool: [string, string][] = [];

  const add = (d: [string, string] | null | undefined) => {
    if (d && !seen.has(d[0])) {
      seen.add(d[0]);
      pool.push(d);
    }
  };

  (WC_ALL_MATCHES[day] ?? []).forEach(add);

  const base = BASE_IST[day] ?? {};
  (['sk', 'ml', 'pd'] as Slot[]).forEach(sl => add(base[sl]));

  const country = COUNTRIES[market];
  const ov = (country.overrides ?? {})[day] ?? {};
  (['sk', 'ml', 'pd'] as Slot[]).forEach(sl => {
    if (ov[sl]) add(ov[sl]);
  });

  if (country.predictorOverrides && country.predictorOverrides[day]) {
    add(country.predictorOverrides[day]);
  }

  return pool;
}

/**
 * Returns the custom Predictor round whose startDay equals the given day, or null.
 */
export function getCustomRoundPrimary(
  day: number,
  customRounds: CustomPredictorRound[] | undefined
): CustomPredictorRound | null {
  return customRounds?.find(r => r.startDay === day) ?? null;
}

/**
 * Returns the custom Predictor round for which this day is a faded continuation
 * (i.e. day > startDay && day <= endDay), or null.
 */
export function getCustomRoundContinuation(
  day: number,
  customRounds: CustomPredictorRound[] | undefined
): CustomPredictorRound | null {
  return customRounds?.find(r => day > r.startDay && day <= r.endDay) ?? null;
}

/**
 * Count active rounds for a given slot across the entire WC period.
 * For the 'pd' slot, custom Predictor round startDays also count.
 */
export function getActiveRounds(
  slot: Slot,
  market: Market,
  toggledOff: Set<number>,
  eventOverrides: Record<string, [string, string]>,
  customRounds?: CustomPredictorRound[]
): number {
  let n = 0;
  for (let d = 11; d <= 49; d++) {
    if (toggledOff.has(d)) continue;
    if (getSlotData(d, market, slot, eventOverrides)) { n++; continue; }
    if (slot === 'pd' && getCustomRoundPrimary(d, customRounds)) n++;
  }
  return n;
}

/**
 * Returns the active round count for the current game selection.
 */
export function getRounds(
  game: string,
  market: Market,
  toggledOff: Set<number>,
  eventOverrides: Record<string, [string, string]>,
  customRounds?: CustomPredictorRound[]
): number {
  if (game === 'All') return 1;
  const slot = GAME_SLOT[game as keyof typeof GAME_SLOT];
  if (!slot) return 1;
  return Math.max(1, getActiveRounds(slot, market, toggledOff, eventOverrides, customRounds));
}

/**
 * Returns the effective streak config for a market, using custom config if set.
 */
export function getEffectiveStreakConfig(
  market: Market,
  customConfig: Record<string, { levels: number[]; segments: string[] }>
): { levels: number[]; segments: string[] } {
  return customConfig[market] ?? STREAK_CONFIG[market];
}

/**
 * Returns the effective tier list for a game, using custom tiers if set.
 */
export function getEffectiveTiers(
  game: string,
  customTiers: Record<string, string[]>
): string[] {
  return customTiers[game] ?? (TIERS[game as keyof typeof TIERS] ?? []);
}

/**
 * Returns the effective tier list for a specific round, falling back to game-level tiers.
 * roundTierOverrides lets individual rounds have different question counts.
 */
export function getEffectiveRoundTiers(
  game: string,
  day: number,
  customTiers: Record<string, string[]>,
  roundTierOverrides: Record<string, Record<string, string[]>>
): string[] {
  return roundTierOverrides[game]?.[String(day)] ?? getEffectiveTiers(game, customTiers);
}

/**
 * Derives prize tag data to display on a calendar cell.
 */
export function getPrizeTagData(
  day: number,
  game: string,
  market: Market,
  stateByGame: Record<string, Record<string, { type: PrizeType; perRound: string }>>,
  streakPrizeState: Record<string, Record<string, Record<string, { type: PrizeType; perRound: string }>>>,
  roundOverrides: Record<string, Record<string, Record<string, { val: number; type: PrizeType }>>>,
  customStreakConfig?: Record<string, { levels: number[]; segments: string[] }>,
  customTiers?: Record<string, string[]>
): PrizeTagData[] {
  if (game === 'All') return [];

  if (game === 'Streak') {
    const cfg = customStreakConfig
      ? getEffectiveStreakConfig(market as Market, customStreakConfig)
      : STREAK_CONFIG[market as Market];
    const ss = streakPrizeState[market] ?? {};
    const activeLevels = cfg.levels.filter(lv => {
      const lvState = ss[String(lv)] ?? {};
      return cfg.segments.some(seg => parseFloat((lvState[seg] ?? {}).perRound ?? '') > 0);
    });
    return activeLevels.map(lv => ({ type: 'sk-level' as const, label: `Q${lv}` }));
  }

  const gameState = stateByGame[game] ?? {};
  const byType: Record<string, number> = {};

  (customTiers ? getEffectiveTiers(game, customTiers) : (TIERS[game as keyof typeof TIERS] ?? [])).forEach(tier => {
    const s = gameState[tier];
    if (!s) return;
    const ov = roundOverrides[game]?.[String(day)];
    const ovEntry = ov?.[tier];
    const val = ovEntry !== undefined ? ovEntry.val : (parseFloat(s.perRound) || 0);
    const type = ovEntry !== undefined ? ovEntry.type : s.type;
    if (!val) return;
    byType[type] = (byType[type] || 0) + val;
  });

  return Object.entries(byType).map(([type, val]) => ({
    type: type as PrizeType,
    val: Math.round(val),
  }));
}

/**
 * Creates default tier state for a game.
 */
export function createDefaultTierState(): TierState {
  return { type: 'Coins', perRound: '', total: '', lastEdited: null };
}

/**
 * Creates default jackpot state for a market.
 */
export function defaultJackpotState(): JackpotState {
  return { type: 'instant', prizeType: 'Coins', prizePerWinner: '', poolSize: '', questionsToWin: '', payoutEvery: '' };
}

/**
 * Creates default LB tier state.
 */
export function createDefaultLbState(): LbTierState {
  return { type: 'Coins', prizePerLb: '', numLbs: '' };
}

/**
 * Ensures all tiers exist in stateByGame for a given game.
 * Returns a new stateByGame object (does not mutate).
 */
export function ensureGameState(
  stateByGame: Record<string, Record<string, TierState>>,
  game: string,
  customTiers?: Record<string, string[]>
): Record<string, Record<string, TierState>> {
  if (game === 'All' || game === 'Streak') return stateByGame;
  const tiers = customTiers ? getEffectiveTiers(game, customTiers) : (TIERS[game as keyof typeof TIERS] ?? []);
  const existing = stateByGame[game] ?? {};
  const updated = { ...existing };
  tiers.forEach(t => {
    if (!updated[t]) updated[t] = createDefaultTierState();
  });
  return { ...stateByGame, [game]: updated };
}

/**
 * Ensures all streak levels + segments exist for a market.
 * Returns a new streakPrizeState object (does not mutate).
 */
export function ensureStreakState(
  streakPrizeState: Record<string, Record<string, Record<string, TierState>>>,
  market: Market,
  customConfig?: Record<string, { levels: number[]; segments: string[] }>
): Record<string, Record<string, Record<string, TierState>>> {
  const cfg = customConfig ? getEffectiveStreakConfig(market, customConfig) : STREAK_CONFIG[market];
  const existing = streakPrizeState[market] ?? {};
  const marketState = { ...existing };

  cfg.levels.forEach(lv => {
    const lvKey = String(lv);
    if (!marketState[lvKey]) marketState[lvKey] = {};
    const lvState = { ...marketState[lvKey] };
    cfg.segments.forEach(seg => {
      if (!lvState[seg]) lvState[seg] = createDefaultTierState();
    });
    marketState[lvKey] = lvState;
  });

  return { ...streakPrizeState, [market]: marketState };
}

/**
 * Ensures all LB tiers exist in lbState.
 */
export function ensureLbState(
  lbState: Record<string, LbTierState>
): Record<string, LbTierState> {
  const updated = { ...lbState };
  LB_TIERS.forEach(t => {
    if (!updated[t]) updated[t] = createDefaultLbState();
  });
  return updated;
}

/**
 * Recalculates the dependent field (total or perRound) when round count changes.
 */
export function recalcTierState(state: TierState, rounds: number): TierState {
  if (rounds <= 0) return state; // guard: avoid division by zero and nonsensical multiplication
  if (state.lastEdited === 'perRound' && state.perRound !== '') {
    return {
      ...state,
      total: String(Math.round(parseFloat(state.perRound) * rounds)),
    };
  }
  if (state.lastEdited === 'total' && state.total !== '') {
    return {
      ...state,
      perRound: String(Math.round(parseFloat(state.total) / rounds)),
    };
  }
  return state;
}

/**
 * Returns the prize CSS class for a given prize type.
 */
export function prizeClass(type: PrizeType): string {
  return PRIZE_CSS[type] ?? 'freebets';
}

/**
 * Returns the prize icon for a given prize type.
 */
export function prizeIcon(type: PrizeType): string {
  return PRIZE_ICON[type] ?? '';
}

/**
 * Returns default plan state for a fresh load.
 */
export function defaultPlanState(market: Market): PlanState {
  return {
    market,
    game: 'All',
    toggledOff: {},
    roundOverrides: {},
    eventOverrides: {},
    stateByGame: {},
    streakPrizeState: {},
    lbState: {},
    customRounds: [],
    customStreakConfig: {},
    customTiers: {},
    roundTierOverrides: {},
    slotCustomRounds: {},
    streakJackpot: {},
    ptbMultipliers: {},
    ptbFixtures: {},
  };
}
