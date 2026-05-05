export type Market = 'romania' | 'poland' | 'brazil' | 'belgium' | 'greece' | 'serbia';

export type Game = 'All' | 'Predictor' | 'Streak' | 'Match Line';

export type Slot = 'sk' | 'ml' | 'pd';

export type PrizeType = 'Coins' | 'Free Bets' | 'Free Spins' | 'Cash';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface TierState {
  type: PrizeType;
  perRound: string;
  total: string;
  lastEdited: 'perRound' | 'total' | null;
}

// { tierName: TierState }
export type GameTierState = Record<string, TierState>;

// { gameName: GameTierState }
export type StateByGame = Record<string, GameTierState>;

// { level: { segment: TierState } }
export type StreakLevelState = Record<string, Record<string, TierState>>;

// { market: StreakLevelState }
export type StreakPrizeState = Record<string, StreakLevelState>;

export interface LbTierState {
  type: PrizeType;
  prizePerLb: string;
  numLbs: string;
}

// { tierName: LbTierState }
export type LbState = Record<string, LbTierState>;

// Per-round prize override for a single tier
export interface OverrideEntry {
  val: number;
  type: PrizeType;
}

// { day: { tier: OverrideEntry } }
export type DayOverrides = Record<string, Record<string, OverrideEntry>>;

// { game: DayOverrides }
export type RoundOverrides = Record<string, DayOverrides>;

// { 'day-slot': [matchName, istTime] }
export type EventOverrides = Record<string, [string, string]>;

export interface PlanState {
  market: Market;
  game: Game;
  toggledOff: number[];
  roundOverrides: RoundOverrides;
  eventOverrides: EventOverrides;
  stateByGame: StateByGame;
  streakPrizeState: StreakPrizeState;
  lbState: LbState;
}

// Match pool entry
export type MatchEntry = [string, string]; // [matchName, istTime]

// Slot data for a day
export type SlotData = MatchEntry | null;

// Prize tag display data
export interface PrizeTagData {
  type: PrizeType | 'sk-level';
  val?: number;
  label?: string;
}
