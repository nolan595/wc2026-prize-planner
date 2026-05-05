import type { Market, PrizeType, Slot, Game } from './types';

// Default match assignments per calendar day (days 11–49) by slot
// Times are in IST (India Standard Time, UTC+5:30)
export const BASE_IST: Record<number, Partial<Record<Slot, [string, string]>>> = {
  11: { ml: ['Mexico v South Africa',        '8:00 PM'] },
  12: { sk: ['South Korea v Czechia',         '2:00 AM'], ml: ['Canada v Bosnia & Herzegovina', '8:00 PM'] },
  13: { sk: ['USA v Paraguay',                '2:00 AM'], ml: ['Qatar v Switzerland',            '8:00 PM'], pd: ['Brazil v Morocco',        '11:00 PM'] },
  14: { sk: ['Haiti v Scotland',              '2:00 AM'], ml: ['Germany v Curacao',              '6:00 PM'] },
  15: { sk: ['Sweden v Tunisia',              '3:00 AM'], ml: ['Spain v Cape Verde',             '5:00 PM'], pd: ['Belgium v Egypt',          '8:00 PM'] },
  16: { sk: ['Iran v New Zealand',            '2:00 AM'], ml: ['France v Senegal',               '8:00 PM'] },
  17: { sk: ['Argentina v Algeria',           '2:00 AM'], ml: ['Portugal v DR Congo',            '6:00 PM'], pd: ['England v Croatia',        '9:00 PM'] },
  18: { sk: ['Ghana v Panama',               '12:00 AM'], ml: ['Czechia v South Africa',         '5:00 PM'] },
  19: { sk: ['Mexico v South Korea',          '2:00 AM'], ml: ['USA v Australia',                '8:00 PM'] },
  20: { sk: ['Brazil v Haiti',               '1:30 AM'],  ml: ['Netherlands v Sweden',           '6:00 PM'], pd: ['Germany v Ivory Coast',   '9:00 PM'] },
  21: { sk: ['Ecuador v Curacao',             '1:00 AM'], ml: ['Spain v Saudi Arabia',           '5:00 PM'], pd: ['Belgium v Iran',           '8:00 PM'] },
  22: { sk: ['New Zealand v Egypt',           '2:00 AM'], ml: ['Argentina v Austria',            '6:00 PM'], pd: ['France v Iraq',           '10:00 PM'] },
  23: { sk: ['Norway v Senegal',              '1:00 AM'], ml: ['Portugal v Uzbekistan',          '6:00 PM'], pd: ['England v Ghana',          '9:00 PM'] },
  24: { sk: ['Panama v Croatia',             '12:00 AM'], ml: ['Switzerland v Canada',           '8:00 PM'], pd: ['Scotland v Brazil',       '11:00 PM'] },
  25: { sk: ['Czechia v Mexico',              '2:00 AM'], ml: ['Ecuador v Germany',              '9:00 PM'] },
  26: { sk: ['Tunisia v Netherlands',        '12:00 AM'], ml: ['Norway v France',                '8:00 PM'] },
  27: { sk: ['Uruguay v Spain',               '1:00 AM'], ml: ['Croatia v Ghana',               '10:00 PM'] },
  28: { sk: ['Colombia v Portugal',          '12:30 AM'] },
  // Round of 32
  29: { sk: ['R32 — Match A', '2:00 AM'], ml: ['R32 — Match B', '8:00 PM'], pd: ['R32 — Match C', '9:30 PM'] },
  30: { sk: ['R32 — Match D', '2:00 AM'], ml: ['R32 — Match E', '8:00 PM'], pd: ['R32 — Match F', '9:30 PM'] },
  31: { sk: ['R32 — Match G', '2:00 AM'], ml: ['R32 — Match H', '8:00 PM'], pd: ['R32 — Match I', '9:30 PM'] },
  32: { sk: ['R32 — Match J', '2:00 AM'], ml: ['R32 — Match K', '8:00 PM'], pd: ['R32 — Match L', '9:30 PM'] },
  // Round of 16
  34: { ml: ['R16 — Match M', '8:00 PM'], pd: ['R16 — Match N', '10:00 PM'] },
  35: { ml: ['R16 — Match O', '8:00 PM'], pd: ['R16 — Match P', '10:00 PM'] },
  36: { ml: ['R16 — Match Q', '8:00 PM'], pd: ['R16 — Match R', '10:00 PM'] },
  37: { ml: ['R16 — Match S', '8:00 PM'], pd: ['R16 — Match T', '10:00 PM'] },
  // Quarter-Finals
  39: { ml: ['QF — Match U',  '8:00 PM'], pd: ['QF — Match V',  '10:00 PM'] },
  40: { ml: ['QF — Match W',  '8:00 PM'], pd: ['QF — Match X',  '10:00 PM'] },
  // Semi-Finals
  43: { pd: ['Semi-Final 1',  '1:00 AM'] },
  44: { pd: ['Semi-Final 2',  '1:00 AM'] },
  // Bronze Final & Final
  48: { pd: ['Bronze Final',  '9:00 PM'] },
  49: { pd: ['The Final',     '8:00 PM'] },
};

// Full WC 2026 group stage pool — all matches by IST calendar day
export const WC_ALL_MATCHES: Record<number, [string, string][]> = {
  11: [['USA v Paraguay', '10:30 AM'], ['Germany v Curacao', '10:30 PM'], ['Korea Republic v Czechia', '11:30 AM'], ['Mexico v South Africa', '2:30 PM'], ['Australia v Turkiye', '9:30 AM']],
  12: [['Sweden v Tunisia', '7:30 AM'], ['Spain v Cabo Verde', '9:30 PM']],
  13: [['Belgium v Egypt', '12:30 AM'], ['Saudi Arabia v Uruguay', '3:30 AM'], ['Iran v New Zealand', '6:30 AM'], ['Austria v Jordan', '9:30 AM']],
  14: [['Portugal v DR Congo', '10:30 PM'], ['France v Senegal', '12:30 AM'], ['Iraq v Norway', '3:30 AM'], ['Argentina v Algeria', '6:30 AM']],
  15: [['Ghana v Panama', '4:30 AM'], ['Uzbekistan v Colombia', '7:30 AM'], ['Czechia v South Africa', '9:30 PM']],
  16: [['Switzerland v Bosnia & Herzegovina', '12:30 AM'], ['Canada v Qatar', '3:30 AM'], ['Mexico v Korea Republic', '6:30 AM']],
  17: [['Netherlands v Sweden', '10:30 PM'], ['USA v Australia', '12:30 AM'], ['Scotland v Morocco', '3:30 AM'], ['Brazil v Haiti', '6:00 AM'], ['Turkiye v Paraguay', '8:30 AM'], ['Tunisia v Japan', '9:30 AM']],
  18: [['Germany v Ivory Coast', '1:30 AM'], ['Ecuador v Curacao', '5:30 AM'], ['Spain v Saudi Arabia', '9:30 PM']],
  19: [['Argentina v Austria', '10:30 PM'], ['Belgium v Iran', '12:30 AM'], ['Uruguay v Cabo Verde', '3:30 AM'], ['New Zealand v Egypt', '6:30 AM']],
  20: [['Portugal v Uzbekistan', '10:30 PM'], ['Norway v Senegal', '5:30 AM'], ['Jordan v Algeria', '8:30 AM']],
  21: [['England v Ghana', '1:30 AM'], ['Panama v Croatia', '4:30 AM'], ['Colombia v DR Congo', '7:30 AM']],
  22: [['Switzerland v Canada', '12:30 AM'], ['Bosnia & Herzegovina v Qatar', '12:30 AM'], ['Scotland v Brazil', '3:30 AM'], ['Morocco v Haiti', '3:30 AM'], ['Czechia v Mexico', '6:30 AM'], ['South Africa v Korea Republic', '6:30 AM']],
  23: [['Curacao v Ivory Coast', '1:30 AM'], ['Ecuador v Germany', '1:30 AM'], ['Japan v Sweden', '4:30 AM'], ['Tunisia v Netherlands', '4:30 AM'], ['Turkiye v USA', '7:30 AM']],
  24: [['Norway v France', '12:30 AM'], ['Senegal v Iraq', '12:30 AM'], ['Cabo Verde v Saudi Arabia', '5:30 AM'], ['Uruguay v Spain', '5:30 AM'], ['Egypt v Iran', '8:30 AM'], ['New Zealand v Belgium', '8:30 AM']],
  25: [['Panama v England', '2:30 AM'], ['Croatia v Ghana', '2:30 AM'], ['Colombia v Portugal', '5:00 AM'], ['DR Congo v Uzbekistan', '5:00 AM'], ['Algeria v Austria', '7:30 AM'], ['Jordan v Argentina', '7:30 AM']],
  // Knockouts
  29: [['R32 — Match A', '2:00 AM'], ['R32 — Match B', '8:00 PM'], ['R32 — Match C', '9:30 PM']],
  30: [['R32 — Match D', '2:00 AM'], ['R32 — Match E', '8:00 PM'], ['R32 — Match F', '9:30 PM']],
  31: [['R32 — Match G', '2:00 AM'], ['R32 — Match H', '8:00 PM'], ['R32 — Match I', '9:30 PM']],
  32: [['R32 — Match J', '2:00 AM'], ['R32 — Match K', '8:00 PM'], ['R32 — Match L', '9:30 PM']],
  34: [['R16 — Match M', '8:00 PM'], ['R16 — Match N', '10:00 PM']],
  35: [['R16 — Match O', '8:00 PM'], ['R16 — Match P', '10:00 PM']],
  36: [['R16 — Match Q', '8:00 PM'], ['R16 — Match R', '10:00 PM']],
  37: [['R16 — Match S', '8:00 PM'], ['R16 — Match T', '10:00 PM']],
  39: [['QF — Match U', '8:00 PM'], ['QF — Match V', '10:00 PM']],
  40: [['QF — Match W', '8:00 PM'], ['QF — Match X', '10:00 PM']],
  43: [['Semi-Final 1', '1:00 AM']],
  44: [['Semi-Final 2', '1:00 AM']],
  48: [['Bronze Final', '9:00 PM']],
  49: [['The Final', '8:00 PM']],
};

// Streak prize config per market
export const STREAK_CONFIG: Record<Market, { segments: string[]; levels: number[] }> = {
  romania: {
    segments: ['VIP', 'HV', 'MV / NC', 'LV / VLV', 'NV'],
    levels: [4, 7],
  },
  poland: {
    segments: ['VIP / HV', 'MV / LV', 'VLV / NV'],
    levels: [4, 7],
  },
  belgium: {
    segments: ['All customers'],
    levels: [4, 6],
  },
  brazil: {
    segments: ['HV / VIP', 'MV', 'LV / NC', 'NB / NV / VLV'],
    levels: [5],
  },
  greece: {
    segments: ['VIP', 'High Value', 'Medium Value', 'Low / VLV / NV'],
    levels: [2, 4, 7, 9, 10],
  },
  serbia: {
    segments: ['VIP / HV', 'MV / LV', 'NV'],
    levels: [4, 7],
  },
};

// Per-market configuration
export const COUNTRIES: Record<Market, {
  offset: number;
  predictorOverrides?: Record<number, [string, string]>;
  overrides?: Record<number, Partial<Record<Slot, [string, string]>>>;
  homeMatches: Set<string>;
}> = {
  romania: {
    offset: 2,
    predictorOverrides: { 13: ['France v Senegal', '8:00 PM'] },
    homeMatches: new Set(),
  },
  poland: {
    offset: 1,
    predictorOverrides: {},
    homeMatches: new Set(['Germany v Curacao', 'Germany v Ivory Coast']),
  },
  belgium: {
    offset: 1,
    predictorOverrides: {},
    homeMatches: new Set(['Belgium v Egypt', 'Belgium v Iran']),
  },
  greece: {
    offset: 2,
    predictorOverrides: {
      13: ['France v Senegal', '8:00 PM'],
      17: ['France v Iraq', '10:00 PM'],
      20: ['Spain v Saudi Arabia', '5:00 PM'],
      21: ['Argentina v Austria', '6:00 PM'],
      22: ['Spain v Cape Verde', '5:00 PM'],
      23: ['Germany v Curacao', '6:00 PM'],
    },
    homeMatches: new Set(),
  },
  brazil: {
    offset: -4,
    overrides: {
      17: { pd: ['France v Senegal', '8:00 PM'] },
      20: { sk: ['Türkiye v Paraguay', '4:00 AM'], ml: ['Netherlands v Sweden', '6:00 PM'], pd: ['Brazil v Haiti', '1:30 AM'] },
      21: { pd: ['Argentina v Austria', '6:00 PM'] },
      22: { pd: ['Uruguay v Spain', '1:00 AM'] },
      23: { pd: ['Colombia v Portugal', '12:30 AM'] },
    },
    homeMatches: new Set(['Brazil v Morocco', 'Brazil v Haiti', 'Scotland v Brazil']),
  },
  serbia: {
    offset: 1,
    predictorOverrides: {
      15: ['France v Senegal', '8:00 PM'],
      21: ['Argentina v Austria', '6:00 PM'],
    },
    homeMatches: new Set(['Argentina v Algeria', 'Argentina v Austria', 'France v Iraq']),
  },
};

export const GAME_SLOT: Record<Exclude<Game, 'All'>, Slot> = {
  'Streak': 'sk',
  'Match Line': 'ml',
  'Predictor': 'pd',
};

export const SLOT_CLASS: Record<Slot, string> = {
  sk: 'active-streak',
  ml: 'active-ml',
  pd: 'active-pd',
};

export const SLOT_NAME: Record<Slot, string> = {
  sk: 'Streak',
  ml: 'Match Line',
  pd: 'Predictor',
};

export const TIERS: Record<Exclude<Game, 'All'>, string[]> = {
  'Predictor':  ['3/6 correct', '4/6 correct', '5/6 correct', '6/6 correct'],
  'Streak':     ['2/10', '4/10', '6/10', '7/10', '9/10', '10/10 Jackpot'],
  'Match Line': ['3/6 correct', '4/6 correct', '5/6 correct', '6/6 correct', 'Full Sheet'],
};

export const LB_TIERS: string[] = ['🥇 Gold', '🥈 Silver', '🥉 Bronze'];

export const LB_CLASSES: Record<string, string> = {
  '🥇 Gold':   'gold',
  '🥈 Silver': 'silver',
  '🥉 Bronze': 'bronze',
};

export const PRIZE_TYPES: PrizeType[] = ['Coins', 'Free Bets', 'Free Spins', 'Cash'];

export const PRIZE_ICON: Record<PrizeType, string> = {
  'Coins':      '🪙',
  'Free Bets':  '🎟',
  'Free Spins': '🎰',
  'Cash':       '💵',
};

export const PRIZE_CSS: Record<PrizeType, string> = {
  'Coins':      'coins',
  'Free Bets':  'freebets',
  'Free Spins': 'freespins',
  'Cash':       'cash',
};

export const MARKET_OPTIONS: { value: Market; label: string }[] = [
  { value: 'romania', label: '🇷🇴 Romania' },
  { value: 'poland',  label: '🇵🇱 Poland' },
  { value: 'brazil',  label: '🇧🇷 Brazil' },
  { value: 'belgium', label: '🇧🇪 Belgium' },
  { value: 'greece',  label: '🇬🇷 Greece' },
  { value: 'serbia',  label: '🇷🇸 Serbia' },
];

export const GAME_OPTIONS: { value: Game; label: string }[] = [
  { value: 'All',        label: '⚽ All Games' },
  { value: 'Predictor',  label: 'Predictor' },
  { value: 'Streak',     label: 'Streak' },
  { value: 'Match Line', label: 'Match Line' },
];
