import type { Market, PrizeType, Slot, Game } from './types';

// Default match assignments per calendar day (days 11–49) by slot
// Times are in IST (Irish Standard Time, UTC+1)
export const BASE_IST: Record<number, Partial<Record<Slot, [string, string]>>> = {
  11: { ml: ['Mexico v South Africa',        '10:00 PM'] },
  12: { ml: ['Canada v Bosnia & Herzegovina',  '9:00 PM'], sk: ['USA v Paraguay',               '2:00 AM'] },
  13: { ml: ['Qatar v Switzerland',          '12:00 AM'], pd: ['Brazil v Morocco',             '12:00 AM'], sk: ['Haiti v Scotland',              '3:00 AM'] },
  14: { ml: ['Germany v Curaçao',             '8:00 PM'], pd: ['Netherlands v Japan',          '11:00 PM'] },
  15: { ml: ['Spain v Cape Verde',            '6:00 PM'], pd: ['Belgium v Egypt',              '7:00 PM'], sk: ['Iran v New Zealand',             '6:00 AM'] },
  16: { ml: ['France v Senegal',              '9:00 PM'], sk: ['Argentina v Algeria',           '4:00 AM'] },
  17: { ml: ['Portugal v DR Congo',            '8:00 PM'], pd: ['England v Croatia',            '11:00 PM'], sk: ['Ghana v Panama',                 '1:00 AM'] },
  18: { ml: ['Mexico v South Korea',          '4:00 AM'], sk: ['Canada v Qatar',                '3:00 AM'] },
  19: { ml: ['USA v Australia',              '12:00 AM'], sk: ['Scotland v Morocco',           '12:00 AM'] },
  20: { ml: ['Netherlands v Sweden',           '8:00 PM'], pd: ['Germany v Ivory Coast',        '10:00 PM'], sk: ['Brazil v Haiti',                 '3:00 AM'] },
  21: { ml: ['Spain v Saudi Arabia',          '6:00 PM'], pd: ['Belgium v Iran',              '12:00 AM'] },
  22: { ml: ['Argentina v Austria',           '8:00 PM'], pd: ['France v Iraq',               '11:00 PM'], sk: ['Norway v Senegal',               '2:00 AM'] },
  23: { ml: ['Portugal v Uzbekistan',         '8:00 PM'], pd: ['England v Ghana',             '10:00 PM'], sk: ['Panama v Croatia',               '1:00 AM'] },
  24: { ml: ['Switzerland v Canada',         '12:00 AM'], pd: ['Scotland v Brazil',           '12:00 AM'] },
  25: { ml: ['Ecuador v Germany',            '10:00 PM'], sk: ['Tunisia v Netherlands',         '2:00 AM'] },
  26: { ml: ['Norway v France',               '9:00 PM'], sk: ['Cape Verde v Saudi Arabia',     '3:00 AM'] },
  27: { ml: ['Croatia v Ghana',              '11:00 PM'], sk: ['Colombia v Portugal',           '3:30 AM'] },
  // Round of 32
  28: { sk: ['R32 — Match 1',               '12:00 AM'] },
  29: { ml: ['R32 — Match 2',                '8:00 PM'], pd: ['R32 — Match 3',               '11:30 PM'], sk: ['R32 — Match 4',                '4:00 AM'] },
  30: { ml: ['R32 — Match 5',                '8:00 PM'], pd: ['R32 — Match 6',               '11:00 PM'], sk: ['R32 — Match 7',                '4:00 AM'] },
  31: { ml: ['R32 — Match 8',                '6:00 PM'], sk: ['R32 — Match 9',                '1:00 AM'], pd: ['R32 — Match 10',               '5:00 AM'] },
  32: { sk: ['R32 — Match 11',             '12:00 AM'], pd: ['R32 — Match 12',                '1:00 AM'], ml: ['R32 — Match 13',               '8:00 AM'] },
  33: { ml: ['R32 — Match 14',             '10:00 PM'], sk: ['R32 — Match 15',              '12:00 AM'], pd: ['R32 — Match 16',               '4:30 AM'] },
  // Round of 16
  34: { ml: ['R16 — Match 1',               '8:00 PM'], pd: ['R16 — Match 2',               '11:00 PM'] },
  35: { ml: ['R16 — Match 3',              '10:00 PM'], pd: ['R16 — Match 4',                '3:00 AM'] },
  36: { ml: ['R16 — Match 5',              '10:00 PM'], pd: ['R16 — Match 6',                '5:00 AM'] },
  37: { ml: ['R16 — Match 7',               '6:00 PM'], pd: ['R16 — Match 8',                '1:00 AM'] },
  // Quarter-Finals
  39: { ml: ['QF — Match 1',               '10:00 PM'] },
  40: { sk: ['QF — Match 2',              '12:00 AM'] },
  41: { ml: ['QF — Match 3',              '11:00 PM'], pd: ['QF — Match 4',                  '4:00 AM'] },
  // Semi-Finals
  44: { pd: ['Semi-Final 1',              '10:00 PM'] },
  45: { pd: ['Semi-Final 2',               '9:00 PM'] },
  // Third Place & Final
  48: { pd: ['Third Place Play-off',      '11:00 PM'] },
  49: { pd: ['The Final',                  '9:00 PM'] },
};

// Full WC 2026 match pool — all matches by IST (Irish Standard Time, UTC+1) calendar day
export const WC_ALL_MATCHES: Record<number, [string, string][]> = {

  // ─── GROUP STAGE ───────────────────────────────────────────────────────────

  11: [
    ['Mexico v South Africa',          '10:00 PM'],
    ['South Korea v Czechia',           '5:00 AM'],
  ],
  12: [
    ['Canada v Bosnia & Herzegovina',   '9:00 PM'],
    ['USA v Paraguay',                  '2:00 AM'],
  ],
  13: [
    ['Qatar v Switzerland',            '12:00 AM'],
    ['Brazil v Morocco',               '12:00 AM'],
    ['Haiti v Scotland',                '3:00 AM'],
    ['Australia v Türkiye',             '9:00 AM'],
  ],
  14: [
    ['Germany v Curaçao',               '8:00 PM'],
    ['Netherlands v Japan',            '11:00 PM'],
    ['Ivory Coast v Ecuador',           '1:00 AM'],
    ['Sweden v Tunisia',                '5:00 AM'],
  ],
  15: [
    ['Spain v Cape Verde',              '6:00 PM'],
    ['Belgium v Egypt',                 '7:00 PM'],
    ['Saudi Arabia v Uruguay',         '12:00 AM'],
    ['Iran v New Zealand',              '6:00 AM'],
  ],
  16: [
    ['France v Senegal',                '9:00 PM'],
    ['Iraq v Norway',                  '12:00 AM'],
    ['Argentina v Algeria',             '4:00 AM'],
    ['Austria v Jordan',                '9:00 AM'],
  ],
  17: [
    ['Portugal v DR Congo',             '8:00 PM'],
    ['England v Croatia',              '11:00 PM'],
    ['Ghana v Panama',                  '1:00 AM'],
    ['Uzbekistan v Colombia',           '5:00 AM'],
  ],
  18: [
    ['Czechia v South Africa',          '6:00 PM'],
    ['Switzerland v Bosnia & Herzegovina', '12:00 AM'],
    ['Canada v Qatar',                  '3:00 AM'],
    ['Mexico v South Korea',            '4:00 AM'],
  ],
  19: [
    ['Scotland v Morocco',             '12:00 AM'],
    ['USA v Australia',                '12:00 AM'],
    ['Brazil v Haiti',                  '3:00 AM'],
    ['Türkiye v Paraguay',              '9:00 AM'],
  ],
  20: [
    ['Netherlands v Sweden',            '8:00 PM'],
    ['Germany v Ivory Coast',          '10:00 PM'],
    ['Ecuador v Curaçao',               '5:00 AM'],
    ['Tunisia v Japan',                 '7:00 AM'],
  ],
  21: [
    ['Spain v Saudi Arabia',            '6:00 PM'],
    ['Belgium v Iran',                 '12:00 AM'],
    ['Uruguay v Cape Verde',           '12:00 AM'],
    ['New Zealand v Egypt',             '6:00 AM'],
  ],
  22: [
    ['Argentina v Austria',             '8:00 PM'],
    ['France v Iraq',                  '11:00 PM'],
    ['Norway v Senegal',                '2:00 AM'],
    ['Jordan v Algeria',                '8:00 AM'],
  ],
  23: [
    ['Portugal v Uzbekistan',           '8:00 PM'],
    ['England v Ghana',                '10:00 PM'],
    ['Panama v Croatia',                '1:00 AM'],
    ['Colombia v DR Congo',             '5:00 AM'],
  ],
  24: [
    ['Switzerland v Canada',           '12:00 AM'],
    ['Bosnia & Herzegovina v Qatar',   '12:00 AM'],
    ['Scotland v Brazil',              '12:00 AM'],
    ['Morocco v Haiti',                '12:00 AM'],
    ['Czechia v Mexico',                '4:00 AM'],
    ['South Africa v South Korea',      '4:00 AM'],
  ],
  25: [
    ['Ecuador v Germany',              '10:00 PM'],
    ['Curaçao v Ivory Coast',          '10:00 PM'],
    ['Japan v Sweden',                  '2:00 AM'],
    ['Tunisia v Netherlands',           '2:00 AM'],
    ['Türkiye v USA',                   '7:00 AM'],
    ['Paraguay v Australia',            '7:00 AM'],
  ],
  26: [
    ['Norway v France',                 '9:00 PM'],
    ['Senegal v Iraq',                  '9:00 PM'],
    ['Cape Verde v Saudi Arabia',       '3:00 AM'],
    ['Uruguay v Spain',                 '3:00 AM'],
    ['Egypt v Iran',                    '8:00 AM'],
    ['New Zealand v Belgium',           '8:00 AM'],
  ],
  27: [
    ['Panama v England',               '11:00 PM'],
    ['Croatia v Ghana',                '11:00 PM'],
    ['Colombia v Portugal',             '3:30 AM'],
    ['DR Congo v Uzbekistan',           '3:30 AM'],
    ['Algeria v Austria',               '5:00 AM'],
    ['Jordan v Argentina',              '5:00 AM'],
  ],

  // ─── ROUND OF 32 ───────────────────────────────────────────────────────────

  28: [
    ['R32 — Match 1',                  '12:00 AM'],
  ],
  29: [
    ['R32 — Match 2',                   '8:00 PM'],
    ['R32 — Match 3',                  '11:30 PM'],
    ['R32 — Match 4',                   '4:00 AM'],
  ],
  30: [
    ['R32 — Match 5',                   '8:00 PM'],
    ['R32 — Match 6',                  '11:00 PM'],
    ['R32 — Match 7',                   '4:00 AM'],
  ],
  31: [
    ['R32 — Match 8',                   '6:00 PM'],
    ['R32 — Match 9',                   '1:00 AM'],
    ['R32 — Match 10',                  '5:00 AM'],
  ],
  32: [
    ['R32 — Match 11',                 '12:00 AM'],
    ['R32 — Match 12',                  '1:00 AM'],
    ['R32 — Match 13',                  '8:00 AM'],
  ],
  33: [
    ['R32 — Match 14',                 '10:00 PM'],
    ['R32 — Match 15',                 '12:00 AM'],
    ['R32 — Match 16',                  '4:30 AM'],
  ],

  // ─── ROUND OF 16 ───────────────────────────────────────────────────────────

  34: [
    ['R16 — Match 1',                   '8:00 PM'],
    ['R16 — Match 2',                  '11:00 PM'],
  ],
  35: [
    ['R16 — Match 3',                  '10:00 PM'],
    ['R16 — Match 4',                   '3:00 AM'],
  ],
  36: [
    ['R16 — Match 5',                  '10:00 PM'],
    ['R16 — Match 6',                   '5:00 AM'],
  ],
  37: [
    ['R16 — Match 7',                   '6:00 PM'],
    ['R16 — Match 8',                   '1:00 AM'],
  ],

  // ─── QUARTER-FINALS ────────────────────────────────────────────────────────

  39: [
    ['QF — Match 1',                   '10:00 PM'],
  ],
  40: [
    ['QF — Match 2',                   '12:00 AM'],
  ],
  41: [
    ['QF — Match 3',                   '11:00 PM'],
    ['QF — Match 4',                    '4:00 AM'],
  ],

  // ─── SEMI-FINALS ───────────────────────────────────────────────────────────

  44: [
    ['Semi-Final 1',                   '10:00 PM'],
  ],
  45: [
    ['Semi-Final 2',                    '9:00 PM'],
  ],

  // ─── THIRD PLACE & FINAL ───────────────────────────────────────────────────

  48: [
    ['Third Place Play-off',           '11:00 PM'],
  ],
  49: [
    ['The Final',                       '9:00 PM'],
  ],
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

export const GAME_SLOT: Record<Exclude<Game, 'All' | 'Pass the Ball'>, Slot> = {
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

export const TIERS: Record<Exclude<Game, 'All' | 'Pass the Ball'>, string[]> = {
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

export const GAME_OPTIONS: { value: Game; label: string; brazilOnly?: true }[] = [
  { value: 'All',            label: '⚽ All Games' },
  { value: 'Predictor',      label: 'Predictor' },
  { value: 'Streak',         label: 'Streak' },
  { value: 'Match Line',     label: 'Match Line' },
  { value: 'Pass the Ball',  label: 'Pass the Ball', brazilOnly: true },
];
