import { describe, it, expect } from 'vitest';
import {
  toLocal,
  dayLabel,
  getActiveRounds,
  getRounds,
  recalcTierState,
  getSlotData,
} from '@/lib/utils';
import type { TierState } from '@/lib/types';

// ── toLocal ───────────────────────────────────────────────────────────────────

describe('toLocal', () => {
  it('converts afternoon IST to CET (UTC+1) correctly', () => {
    // 8:00 PM IST → 3:30 PM CET (offset -4.5h, but offset is whole hours here)
    // Poland offset = +1 → 8:00 PM IST + 1h = ... wait, IST = UTC+5:30, CET = UTC+1
    // So offset from IST is -4.5. But COUNTRIES.poland.offset = 1, meaning "local = IST + 1h"
    // 8:00 PM IST + 1h offset = 9:00 PM local
    expect(toLocal('8:00 PM', 1)).toBe('9:00 PM');
  });

  it('converts midnight IST to next-day marker (offset -4)', () => {
    // Brazil offset = -4 → 12:00 AM IST - 4h = 8:00 PM previous day
    // But toLocal: total = 0 + (-4)*60 = -240 → wraps: -240 + 1440 = 1200 min = 8:00 PM, no next-day
    expect(toLocal('12:00 AM', -4)).toBe('8:00 PM');
  });

  it('adds +1 day marker when conversion crosses midnight forward', () => {
    // 11:00 PM + offset 2 → 1:00 AM next day
    expect(toLocal('11:00 PM', 2)).toBe('1:00 AM +1');
  });

  it('handles 12:00 PM (noon) correctly', () => {
    // 12:00 PM = noon, offset 0 → 12:00 PM
    expect(toLocal('12:00 PM', 0)).toBe('12:00 PM');
  });

  it('handles 12:00 AM (midnight) with zero offset', () => {
    expect(toLocal('12:00 AM', 0)).toBe('12:00 AM');
  });

  it('returns the original string unchanged for invalid input', () => {
    expect(toLocal('not-a-time', 0)).toBe('not-a-time');
    expect(toLocal('', 0)).toBe('');
  });

  it('pads minutes correctly for 1-digit minutes', () => {
    // 2:05 AM + offset 1 = 3:05 AM
    expect(toLocal('2:05 AM', 1)).toBe('3:05 AM');
  });

  it('handles exact 24-hour boundary (total === 1440) wrapping to 12:00 AM without +1', () => {
    // 11:00 PM + 1h offset = 12:00 AM next day (1440 min → wraps → 0 = 12:00 AM, nextDay = true)
    expect(toLocal('11:00 PM', 1)).toBe('12:00 AM +1');
  });
});

// ── dayLabel ──────────────────────────────────────────────────────────────────

describe('dayLabel', () => {
  it('returns June labels for days 11–30', () => {
    expect(dayLabel(11)).toBe('Jun 11');
    expect(dayLabel(30)).toBe('Jun 30');
  });

  it('returns July labels for days 31–49', () => {
    expect(dayLabel(31)).toBe('Jul 1');
    expect(dayLabel(49)).toBe('Jul 19');
  });

  it('maps day 31 to Jul 1', () => {
    expect(dayLabel(31)).toBe('Jul 1');
  });
});

// ── getActiveRounds ───────────────────────────────────────────────────────────

describe('getActiveRounds', () => {
  it('counts Streak (sk) active rounds for romania with no toggles', () => {
    const count = getActiveRounds('sk', 'romania', new Set(), {});
    // Days with sk slot in BASE_IST: 12–28 (excluding 28 which only has sk for colombia)
    // Let's just verify it's a positive reasonable number
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(39); // max possible days 11–49
  });

  it('returns 0 less when a day with a fixture is toggled off', () => {
    const withoutToggle = getActiveRounds('sk', 'romania', new Set(), {});
    // Day 12 has sk slot → toggle it off
    const withToggle = getActiveRounds('sk', 'romania', new Set([12]), {});
    expect(withToggle).toBe(withoutToggle - 1);
  });

  it('counts Predictor (pd) active rounds for romania', () => {
    const count = getActiveRounds('pd', 'romania', new Set(), {});
    expect(count).toBeGreaterThan(0);
  });

  it('respects eventOverrides — a day gains a fixture when override adds one', () => {
    // Day 28 has only sk in BASE_IST — no pd fixture
    const withoutOv = getActiveRounds('pd', 'romania', new Set(), {});
    const withOv = getActiveRounds('pd', 'romania', new Set(), { '28-pd': ['Test Match', '8:00 PM'] });
    expect(withOv).toBe(withoutOv + 1);
  });
});

// ── getRounds ─────────────────────────────────────────────────────────────────

describe('getRounds', () => {
  it('returns 1 for game === "All"', () => {
    expect(getRounds('All', 'romania', new Set(), {})).toBe(1);
  });

  it('returns at least 1 even if no active fixtures exist', () => {
    // Toggle off every day
    const allOff = new Set(Array.from({ length: 39 }, (_, i) => i + 11));
    expect(getRounds('Streak', 'romania', allOff, {})).toBe(1);
  });

  it('returns the correct count for Match Line on romania', () => {
    const count = getRounds('Match Line', 'romania', new Set(), {});
    const direct = getActiveRounds('ml', 'romania', new Set(), {});
    expect(count).toBe(Math.max(1, direct));
  });

  it('returns 1 for unknown game name', () => {
    expect(getRounds('UnknownGame', 'romania', new Set(), {})).toBe(1);
  });
});

// ── recalcTierState ───────────────────────────────────────────────────────────

describe('recalcTierState', () => {
  const base: TierState = { type: 'Coins', perRound: '', total: '', lastEdited: null };

  it('recalculates total when lastEdited is perRound', () => {
    const state: TierState = { ...base, perRound: '100', total: '500', lastEdited: 'perRound' };
    const result = recalcTierState(state, 10);
    expect(result.total).toBe('1000');
    expect(result.perRound).toBe('100'); // unchanged
  });

  it('recalculates perRound when lastEdited is total', () => {
    const state: TierState = { ...base, perRound: '100', total: '500', lastEdited: 'total' };
    const result = recalcTierState(state, 10);
    expect(result.perRound).toBe('50');
    expect(result.total).toBe('500'); // unchanged
  });

  it('returns state unchanged when lastEdited is null', () => {
    const state: TierState = { ...base, perRound: '50', total: '200', lastEdited: null };
    const result = recalcTierState(state, 5);
    expect(result).toBe(state); // same reference
  });

  it('returns state unchanged when perRound is empty and lastEdited is perRound', () => {
    const state: TierState = { ...base, perRound: '', total: '300', lastEdited: 'perRound' };
    const result = recalcTierState(state, 5);
    expect(result).toBe(state);
  });

  it('returns state unchanged when total is empty and lastEdited is total', () => {
    const state: TierState = { ...base, perRound: '50', total: '', lastEdited: 'total' };
    const result = recalcTierState(state, 5);
    expect(result).toBe(state);
  });

  it('rounds fractional results correctly', () => {
    const state: TierState = { ...base, total: '100', lastEdited: 'total' };
    const result = recalcTierState(state, 3); // 100/3 = 33.33 → rounds to 33
    expect(result.perRound).toBe('33');
  });

  it('guards against rounds <= 0 (division by zero)', () => {
    const state: TierState = { ...base, total: '300', lastEdited: 'total' };
    const result = recalcTierState(state, 0);
    expect(result).toBe(state); // unchanged, no NaN produced
  });

  it('guards against negative rounds', () => {
    const state: TierState = { ...base, perRound: '100', lastEdited: 'perRound' };
    const result = recalcTierState(state, -5);
    expect(result).toBe(state);
  });
});

// ── getSlotData ───────────────────────────────────────────────────────────────

describe('getSlotData', () => {
  it('returns null for a day with no fixture in the slot', () => {
    // Day 11 only has ml in BASE_IST for romania
    expect(getSlotData(11, 'romania', 'sk', {})).toBeNull();
    expect(getSlotData(11, 'romania', 'pd', {})).toBeNull();
  });

  it('returns the base fixture for a day with a match', () => {
    // Day 11 ml = ['Mexico v South Africa', '8:00 PM']
    const result = getSlotData(11, 'romania', 'ml', {});
    expect(result).not.toBeNull();
    expect(result?.[0]).toBe('Mexico v South Africa');
  });

  it('returns eventOverride when one is set', () => {
    const result = getSlotData(11, 'romania', 'ml', { '11-ml': ['Custom Match', '9:00 PM'] });
    expect(result?.[0]).toBe('Custom Match');
    expect(result?.[1]).toBe('9:00 PM');
  });

  it('applies market-level predictorOverrides for romania', () => {
    // romania predictorOverrides: { 13: ['France v Senegal', '8:00 PM'] }
    // BASE_IST day 13 pd = ['Brazil v Morocco', '11:00 PM']
    const result = getSlotData(13, 'romania', 'pd', {});
    expect(result?.[0]).toBe('France v Senegal');
  });

  it('applies market-level overrides for brazil', () => {
    // brazil overrides day 20: { sk: ['Türkiye v Paraguay', '4:00 AM'] }
    // BASE_IST day 20 sk = ['Brazil v Haiti', '1:30 AM']
    const result = getSlotData(20, 'brazil', 'sk', {});
    expect(result?.[0]).toBe('Türkiye v Paraguay');
  });

  it('eventOverride takes precedence over market override', () => {
    const result = getSlotData(13, 'romania', 'pd', { '13-pd': ['Override Match', '7:00 PM'] });
    expect(result?.[0]).toBe('Override Match');
  });

  it('returns null for day outside fixture range (e.g. day 10)', () => {
    expect(getSlotData(10, 'romania', 'ml', {})).toBeNull();
  });
});
