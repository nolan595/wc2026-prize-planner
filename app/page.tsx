'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import type {
  Market, Game, PlanState, TierState, LbState, LbTierState,
  PrizeType, RoundOverrides, EventOverrides, StateByGame, StreakPrizeState, OverrideEntry,
  CustomPredictorRound, JackpotState
} from '@/lib/types';
type RoundTierOverrides = Record<string, Record<string, string[]>>;
import {
  MARKET_OPTIONS, GAME_OPTIONS, STREAK_CONFIG, TIERS,
} from '@/lib/constants';
import {
  defaultPlanState, ensureGameState, ensureStreakState, ensureLbState,
  getRounds, getActiveRounds, recalcTierState, createDefaultTierState, defaultJackpotState,
} from '@/lib/utils';
import { useAutoSave } from '@/lib/useAutoSave';

import { SaveStatusIndicator } from '@/components/SaveStatusIndicator';
import { GameGuide } from '@/components/GameGuide';
import { CalendarGrid } from '@/components/CalendarGrid';
import { OverridePanel } from '@/components/OverridePanel';
import { SwapModal } from '@/components/SwapModal';
import { CustomRoundModal } from '@/components/CustomRoundModal';
import { PTBPanel } from '@/components/PTBPanel';
import { PrizeTable } from '@/components/PrizeTable';
import { StreakPrizeTable } from '@/components/StreakPrizeTable';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { SummaryGrid } from '@/components/SummaryGrid';

// ── State shape ──────────────────────────────────────────────

type AppState = PlanState;

// ── Helpers ──────────────────────────────────────────────────

function buildInitialState(market: Market): AppState {
  const base = defaultPlanState(market);
  const s = { ...base };
  s.stateByGame = ensureGameState(s.stateByGame, 'Predictor');
  s.stateByGame = ensureGameState(s.stateByGame, 'Match Line');
  s.stateByGame = ensureGameState(s.stateByGame, 'Streak');
  s.streakPrizeState = ensureStreakState(s.streakPrizeState, market);
  s.lbState = ensureLbState(s.lbState);
  return s;
}

function hydrateFromPayload(payload: unknown, market: Market): AppState {
  if (!payload || typeof payload !== 'object') return buildInitialState(market);
  const p = payload as Partial<PlanState>;
  const s: AppState = {
    market: market,
    game: (p.game ?? 'All') as Game,
    toggledOff: (p.toggledOff && typeof p.toggledOff === 'object' && !Array.isArray(p.toggledOff))
      ? p.toggledOff as Record<string, number[]>
      : {},
    roundOverrides: (p.roundOverrides ?? {}) as RoundOverrides,
    eventOverrides: (p.eventOverrides ?? {}) as EventOverrides,
    stateByGame: (p.stateByGame ?? {}) as StateByGame,
    streakPrizeState: (p.streakPrizeState ?? {}) as StreakPrizeState,
    lbState: (p.lbState ?? {}) as LbState,
    customRounds: Array.isArray(p.customRounds) ? p.customRounds as CustomPredictorRound[] : [],
    streakJackpot: (p.streakJackpot && typeof p.streakJackpot === 'object' && !Array.isArray(p.streakJackpot))
      ? p.streakJackpot as Record<string, JackpotState>
      : {},
    customStreakConfig: (p.customStreakConfig && typeof p.customStreakConfig === 'object' && !Array.isArray(p.customStreakConfig))
      ? p.customStreakConfig as Record<string, { levels: number[]; segments: string[] }>
      : {},
    customTiers: (p.customTiers && typeof p.customTiers === 'object' && !Array.isArray(p.customTiers))
      ? p.customTiers as Record<string, string[]>
      : {},
    roundTierOverrides: (p.roundTierOverrides && typeof p.roundTierOverrides === 'object' && !Array.isArray(p.roundTierOverrides))
      ? p.roundTierOverrides as Record<string, Record<string, string[]>>
      : {},
    slotCustomRounds: (p.slotCustomRounds && typeof p.slotCustomRounds === 'object' && !Array.isArray(p.slotCustomRounds))
      ? p.slotCustomRounds as Record<string, [string, string][]>
      : {},
    ptbMultipliers: (p.ptbMultipliers && typeof p.ptbMultipliers === 'object' && !Array.isArray(p.ptbMultipliers))
      ? p.ptbMultipliers as Record<string, number>
      : {},
    ptbFixtures: (p.ptbFixtures && typeof p.ptbFixtures === 'object' && !Array.isArray(p.ptbFixtures))
      ? p.ptbFixtures as Record<string, [string, string]>
      : {},
  };
  // Ensure structural completeness
  s.stateByGame = ensureGameState(s.stateByGame, 'Predictor', s.customTiers);
  s.stateByGame = ensureGameState(s.stateByGame, 'Match Line', s.customTiers);
  s.stateByGame = ensureGameState(s.stateByGame, 'Streak');
  s.streakPrizeState = ensureStreakState(s.streakPrizeState, market, s.customStreakConfig);
  s.lbState = ensureLbState(s.lbState);
  return s;
}

// ── Main Page ────────────────────────────────────────────────

export default function PlannerPage() {
  const [market, setMarket] = useState<Market>('romania');
  const [game, setGame] = useState<Game>('All');
  const [activeMonth, setActiveMonth] = useState<'jun' | 'jul'>('jun');
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [toggledOffByGame, setToggledOffByGame] = useState<Record<string, number[]>>({});
  const [roundOverrides, setRoundOverrides] = useState<RoundOverrides>({});
  const [eventOverrides, setEventOverrides] = useState<EventOverrides>({});
  const [stateByGame, setStateByGame] = useState<StateByGame>({});
  const [streakPrizeState, setStreakPrizeState] = useState<StreakPrizeState>({});
  const [lbState, setLbState] = useState<LbState>({});
  const [loading, setLoading] = useState(true);

  const [customRounds, setCustomRounds] = useState<CustomPredictorRound[]>([]);
  const [streakJackpot, setStreakJackpot] = useState<Record<string, JackpotState>>({});
  const [customStreakConfig, setCustomStreakConfig] = useState<Record<string, { levels: number[]; segments: string[] }>>({});
  const [customTiers, setCustomTiers] = useState<Record<string, string[]>>({});
  const [ptbMultipliers, setPtbMultipliers] = useState<Record<string, number>>({});
  const [ptbFixtures, setPtbFixtures] = useState<Record<string, [string, string]>>({});
  const [roundTierOverrides, setRoundTierOverrides] = useState<RoundTierOverrides>({});
  const [slotCustomRounds, setSlotCustomRounds] = useState<Record<string, [string, string][]>>({});

  // Modal state
  const [swapModal, setSwapModal] = useState<{ day: number; slot: string } | null>(null);
  const [customRoundModal, setCustomRoundModal] = useState<{ day: number; slot: string } | null>(null);

  const { status: saveStatus, triggerSave, retry } = useAutoSave(market);

  // Derive the current game's toggled-off set
  const toggledOff = new Set<number>(toggledOffByGame[game] ?? []);

  // Build current plan state for saving / passing down
  const buildPlanState = useCallback((): PlanState => ({
    market,
    game,
    toggledOff: toggledOffByGame,
    roundOverrides,
    eventOverrides,
    stateByGame,
    streakPrizeState,
    lbState,
    customRounds,
    streakJackpot,
    customStreakConfig,
    customTiers,
    roundTierOverrides,
    slotCustomRounds,
    ptbMultipliers,
    ptbFixtures,
  }), [market, game, toggledOffByGame, roundOverrides, eventOverrides, stateByGame, streakPrizeState, lbState, customRounds, streakJackpot, customStreakConfig, customTiers, roundTierOverrides, slotCustomRounds, ptbMultipliers, ptbFixtures]);

  // Track whether we've done the initial load for the current market
  const initialLoadDoneRef = useRef(false);

  // Load plan for market from API on mount and on market change
  useEffect(() => {
    initialLoadDoneRef.current = false;
    setLoading(true);

    fetch(`/api/plans/${market}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(res => {
        const payload = res?.data?.payload;
        const hydrated = hydrateFromPayload(payload, market);
        setGame(hydrated.game);
        setToggledOffByGame(hydrated.toggledOff);
        setRoundOverrides(hydrated.roundOverrides);
        setEventOverrides(hydrated.eventOverrides);
        setStateByGame(hydrated.stateByGame);
        setStreakPrizeState(hydrated.streakPrizeState);
        setLbState(hydrated.lbState);
        setCustomRounds(hydrated.customRounds);
        setStreakJackpot(hydrated.streakJackpot ?? {});
        setCustomStreakConfig(hydrated.customStreakConfig ?? {});
        setCustomTiers(hydrated.customTiers ?? {});
        setRoundTierOverrides(hydrated.roundTierOverrides ?? {});
        setSlotCustomRounds(hydrated.slotCustomRounds ?? {});
        setPtbMultipliers(hydrated.ptbMultipliers ?? {});
        setPtbFixtures(hydrated.ptbFixtures ?? {});
      })
      .catch(() => {
        const hydrated = buildInitialState(market);
        setGame(hydrated.game);
        setToggledOffByGame({});
        setRoundOverrides({});
        setEventOverrides({});
        setStateByGame(hydrated.stateByGame);
        setStreakPrizeState(hydrated.streakPrizeState);
        setLbState(hydrated.lbState);
        setCustomRounds([]);
        setStreakJackpot({});
        setCustomStreakConfig({});
        setCustomTiers({});
        setRoundTierOverrides({});
        setSlotCustomRounds({});
        setPtbMultipliers({});
        setPtbFixtures({});
      })
      .finally(() => {
        setLoading(false);
        initialLoadDoneRef.current = true;
      });
  }, [market]);

  // Auto-save whenever state changes (after initial load)
  useEffect(() => {
    if (!initialLoadDoneRef.current || loading) return;
    triggerSave(buildPlanState());
  }, [toggledOffByGame, roundOverrides, eventOverrides, stateByGame, streakPrizeState, lbState, game, customRounds, streakJackpot, customStreakConfig, customTiers, roundTierOverrides, slotCustomRounds, ptbMultipliers, ptbFixtures]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ────────────────────────────────────────

  const rounds = getRounds(game, market, toggledOff, eventOverrides, customRounds);

  const getActiveRoundsCount = (slotType: 'sk' | 'ml' | 'pd') =>
    getActiveRounds(slotType, market, toggledOff, eventOverrides, slotType === 'pd' ? customRounds : undefined);

  const ptbDaysSet = Object.values(ptbMultipliers).filter(v => v > 0).length;
  const roundBadgeText = game === 'All'
    ? `${getActiveRoundsCount('sk')} Streak · ${getActiveRoundsCount('ml')} ML · ${getActiveRoundsCount('pd')} Pred`
    : game === 'Pass the Ball'
    ? `${ptbDaysSet} day${ptbDaysSet !== 1 ? 's' : ''} set`
    : `${rounds} round${rounds !== 1 ? 's' : ''}`;

  // ── Handlers ──────────────────────────────────────────────

  const handleMarketChange = useCallback((newMarket: Market) => {
    setMarket(newMarket);
    setActiveMonth('jun');
    setEditingDay(null);
    if (game === 'Pass the Ball' && newMarket !== 'brazil') {
      setGame('All');
    }
    // State reset handled by the market-change useEffect above
  }, [game]);

  const handleGameChange = useCallback((newGame: Game) => {
    setGame(newGame);
    setEditingDay(null);

    // Ensure tiers for the new game
    if (newGame !== 'All' && newGame !== 'Streak') {
      setStateByGame(prev => ensureGameState(prev, newGame, customTiers));
    }
    if (newGame === 'Streak') {
      setStreakPrizeState(prev => ensureStreakState(prev, market, customStreakConfig));
    }
    setLbState(prev => ensureLbState(prev));
  }, [market, customStreakConfig, customTiers]);

  const handleToggle = useCallback((day: number) => {
    setToggledOffByGame(prev => {
      const current = new Set<number>(prev[game] ?? []);
      if (current.has(day)) current.delete(day);
      else current.add(day);
      return { ...prev, [game]: Array.from(current) };
    });
    if (editingDay === day) setEditingDay(null);
  }, [editingDay, game]);

  const handleSetMonth = useCallback((m: 'jun' | 'jul') => {
    setActiveMonth(m);
    if (editingDay !== null) setEditingDay(null);
  }, [editingDay]);

  const handleEdit = useCallback((day: number) => {
    if (game === 'All') return;
    setEditingDay(prev => prev === day ? null : day);
  }, [game]);

  const handleCloseOverride = useCallback(() => setEditingDay(null), []);

  const handleClearOverride = useCallback(() => {
    if (editingDay === null) return;
    setRoundOverrides(prev => {
      const next = { ...prev };
      if (next[game]) {
        const gameOvs = { ...next[game] };
        delete gameOvs[String(editingDay)];
        next[game] = gameOvs;
      }
      return next;
    });
  }, [editingDay, game]);

  const handleOverrideChange = useCallback((day: number, tier: string, entry: OverrideEntry | null) => {
    setRoundOverrides(prev => {
      const next = { ...prev };
      if (!next[game]) next[game] = {};
      const gameOvs = { ...next[game] };
      const dayOvs = { ...(gameOvs[String(day)] ?? {}) };

      if (entry === null) {
        delete dayOvs[tier];
      } else {
        dayOvs[tier] = entry;
      }

      if (Object.keys(dayOvs).length === 0) {
        delete gameOvs[String(day)];
      } else {
        gameOvs[String(day)] = dayOvs;
      }

      next[game] = gameOvs;
      return next;
    });
  }, [game]);

  // Swap modal
  const handleOpenSwap = useCallback((day: number, slotStr: string) => {
    setSwapModal({ day, slot: slotStr });
  }, []);

  const handleApplySwap = useCallback((day: number, slotStr: string, matchName: string, time: string) => {
    setEventOverrides(prev => ({ ...prev, [`${day}-${slotStr}`]: [matchName, time] }));
    setSwapModal(null);
  }, []);

  const handleResetSwap = useCallback((day: number, slotStr: string) => {
    setEventOverrides(prev => {
      const next = { ...prev };
      delete next[`${day}-${slotStr}`];
      return next;
    });
    setSwapModal(null);
  }, []);

  // Custom round modal — unified for all games
  const handleOpenCustomRound = useCallback((day: number, slotStr: string) => {
    setCustomRoundModal({ day, slot: slotStr });
  }, []);

  const handleSaveCustomRound = useCallback((day: number, slot: string, events: [string, string][], span: number) => {
    if (slot === 'pd') {
      const round: CustomPredictorRound = {
        id: customRounds.find(r => r.startDay === day)?.id ?? crypto.randomUUID(),
        startDay: day,
        endDay: Math.min(day + span - 1, 49),
        fixtures: events.map(([match, time]) => ({ wcDay: day, match, time })),
      };
      setCustomRounds(prev => {
        const idx = prev.findIndex(r => r.startDay === day);
        if (idx >= 0) { const next = [...prev]; next[idx] = round; return next; }
        return [...prev, round];
      });
    } else {
      const key = `${day}-${slot}`;
      setSlotCustomRounds(prev => ({ ...prev, [key]: events }));
      setEventOverrides(prev => ({ ...prev, [key]: events[0] }));
    }
    setCustomRoundModal(null);
  }, [customRounds]);

  const handleDeleteCustomRound = useCallback((day: number, slot: string) => {
    if (slot === 'pd') {
      setCustomRounds(prev => prev.filter(r => r.startDay !== day));
    } else {
      const key = `${day}-${slot}`;
      setSlotCustomRounds(prev => { const n = { ...prev }; delete n[key]; return n; });
      setEventOverrides(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  }, []);

  const handleEditPredRound = useCallback((round: CustomPredictorRound) => {
    setCustomRoundModal({ day: round.startDay, slot: 'pd' });
  }, []);

  // Pass the Ball multiplier + fixture handlers
  const handlePTBSet = useCallback((day: number, multiplier: number, fixture: [string, string] | null) => {
    setPtbMultipliers(prev => ({ ...prev, [String(day)]: multiplier }));
    setPtbFixtures(prev => {
      if (!fixture) {
        const next = { ...prev };
        delete next[String(day)];
        return next;
      }
      return { ...prev, [String(day)]: fixture };
    });
    setEditingDay(null);
  }, []);

  const handlePTBClear = useCallback((day: number) => {
    setPtbMultipliers(prev => {
      const next = { ...prev };
      delete next[String(day)];
      return next;
    });
    setPtbFixtures(prev => {
      const next = { ...prev };
      delete next[String(day)];
      return next;
    });
    setEditingDay(null);
  }, []);

  // Flexible streak config handlers
  const handleAddStreakLevel = useCallback((level: number) => {
    setCustomStreakConfig(prev => {
      const current = prev[market] ?? STREAK_CONFIG[market];
      if (current.levels.includes(level)) return prev;
      const newLevels = [...current.levels, level].sort((a, b) => a - b);
      return { ...prev, [market]: { ...current, levels: newLevels } };
    });
  }, [market]);

  const handleRemoveStreakLevel = useCallback((level: number) => {
    setCustomStreakConfig(prev => {
      const current = prev[market] ?? STREAK_CONFIG[market];
      return { ...prev, [market]: { ...current, levels: current.levels.filter(l => l !== level) } };
    });
  }, [market]);

  const handleAddStreakSegment = useCallback((segment: string) => {
    setCustomStreakConfig(prev => {
      const current = prev[market] ?? STREAK_CONFIG[market];
      if (current.segments.includes(segment)) return prev;
      return { ...prev, [market]: { ...current, segments: [...current.segments, segment] } };
    });
    setStreakPrizeState(prev => {
      const marketState = { ...(prev[market] ?? {}) };
      Object.keys(marketState).forEach(lv => {
        const lvState = { ...marketState[lv] };
        if (!lvState[segment]) lvState[segment] = createDefaultTierState();
        marketState[lv] = lvState;
      });
      return { ...prev, [market]: marketState };
    });
  }, [market]);

  const handleRemoveStreakSegment = useCallback((segment: string) => {
    setCustomStreakConfig(prev => {
      const current = prev[market] ?? STREAK_CONFIG[market];
      return { ...prev, [market]: { ...current, segments: current.segments.filter(s => s !== segment) } };
    });
  }, [market]);

  // Flexible game tier handlers
  const handleAddGameTier = useCallback((tier: string) => {
    setCustomTiers(prev => {
      const current = prev[game] ?? (TIERS[game as keyof typeof TIERS] ?? []);
      if (current.includes(tier)) return prev;
      return { ...prev, [game]: [...current, tier] };
    });
    setStateByGame(prev => {
      const gameState = { ...(prev[game] ?? {}) };
      if (!gameState[tier]) gameState[tier] = createDefaultTierState();
      return { ...prev, [game]: gameState };
    });
  }, [game]);

  const handleRemoveGameTier = useCallback((tier: string) => {
    setCustomTiers(prev => {
      const current = prev[game] ?? (TIERS[game as keyof typeof TIERS] ?? []);
      if (current.length <= 1) return prev;
      return { ...prev, [game]: current.filter(t => t !== tier) };
    });
  }, [game]);

  // Round-specific tier override (question count)
  const handleSetRoundTiers = useCallback((day: number, tiers: string[]) => {
    setRoundTierOverrides(prev => {
      const gameMap = { ...(prev[game] ?? {}) };
      gameMap[String(day)] = tiers;
      return { ...prev, [game]: gameMap };
    });
  }, [game]);

  const handleClearRoundTiers = useCallback((day: number) => {
    setRoundTierOverrides(prev => {
      if (!prev[game]) return prev;
      const gameMap = { ...prev[game] };
      delete gameMap[String(day)];
      return { ...prev, [game]: gameMap };
    });
  }, [game]);

  // Prize table changes
  const handlePrizeTierChange = useCallback((tier: string, update: Partial<TierState>) => {
    setStateByGame(prev => {
      const gameState = { ...(prev[game] ?? {}) };
      gameState[tier] = { ...(gameState[tier] ?? { type: 'Coins', perRound: '', total: '', lastEdited: null }), ...update };
      return { ...prev, [game]: gameState };
    });
  }, [game]);

  const handleStreakChange = useCallback((level: number, segment: string, update: Partial<TierState>) => {
    setStreakPrizeState(prev => {
      const marketState = { ...(prev[market] ?? {}) };
      const lvState = { ...(marketState[String(level)] ?? {}) };
      lvState[segment] = { ...(lvState[segment] ?? { type: 'Coins', perRound: '', total: '', lastEdited: null }), ...update };
      marketState[String(level)] = lvState;
      return { ...prev, [market]: marketState };
    });
  }, [market]);

  const handleJackpotChange = useCallback((update: Partial<JackpotState>) => {
    setStreakJackpot(prev => {
      const current = prev[market] ?? defaultJackpotState();
      return { ...prev, [market]: { ...current, ...update } };
    });
  }, [market]);

  const handleLbChange = useCallback((tier: string, update: Partial<LbTierState>) => {
    setLbState(prev => {
      const tierState = { ...(prev[tier] ?? { type: 'Coins' as PrizeType, prizePerLb: '', numLbs: '' }), ...update };
      return { ...prev, [tier]: tierState };
    });
  }, []);

  // Recalculate dependent fields when round count changes
  useEffect(() => {
    if (game === 'All' || loading) return;

    if (game === 'Streak') {
      setStreakPrizeState(prev => {
        const marketState = { ...(prev[market] ?? {}) };
        let changed = false;
        Object.keys(marketState).forEach(lv => {
          const lvState = { ...marketState[lv] };
          Object.keys(lvState).forEach(seg => {
            const updated = recalcTierState(lvState[seg], rounds);
            if (updated !== lvState[seg]) { lvState[seg] = updated; changed = true; }
          });
          marketState[lv] = lvState;
        });
        if (!changed) return prev;
        return { ...prev, [market]: marketState };
      });
    } else {
      setStateByGame(prev => {
        const gameState = { ...(prev[game] ?? {}) };
        let changed = false;
        Object.keys(gameState).forEach(tier => {
          const updated = recalcTierState(gameState[tier], rounds);
          if (updated !== gameState[tier]) { gameState[tier] = updated; changed = true; }
        });
        if (!changed) return prev;
        return { ...prev, [game]: gameState };
      });
    }
  }, [rounds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────

  const currentStreakState = streakPrizeState[market] ?? {};
  const currentGameState = stateByGame[game] ?? {};

  if (loading) {
    return (
      <main style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '40px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Loading…
        </span>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 40px' }}>

      {/* ── Internal warning banner ── */}
      <div style={{
        background: 'rgba(255, 82, 82, 0.08)',
        border: '1px solid rgba(255, 82, 82, 0.3)',
        borderRadius: 6,
        padding: '8px 16px',
        marginBottom: 'var(--space-4)',
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: '#ff7070',
        textTransform: 'uppercase',
      }}>
        ⚠ Do Not Share This Externally
      </div>

      {/* ── Page header ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-5)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.375rem',
          fontWeight: 700,
          color: 'var(--color-gold)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: 0,
        }}>
          Hunch F2P World Cup Calendar
        </h1>
        <SaveStatusIndicator status={saveStatus} onRetry={retry} />
      </header>

      {/* ── Game guide ── */}
      <GameGuide />

      {/* ── Configuration ── */}
      <div className="card">
        <div className="card-title">Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-display)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 5,
            }} htmlFor="market-select">
              Market
            </label>
            <select
              id="market-select"
              value={market}
              onChange={e => handleMarketChange(e.target.value as Market)}
            >
              {MARKET_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-display)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 5,
            }} htmlFor="game-select">
              Game
            </label>
            <select
              id="game-select"
              value={game}
              onChange={e => handleGameChange(e.target.value as Game)}
            >
              {GAME_OPTIONS.filter(opt => !opt.brazilOnly || market === 'brazil').map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Calendar ── */}
      <div className="card">
        <div className="card-title">
          World Cup — Schedule
          <span className="round-badge">{roundBadgeText}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            className={`month-tab${activeMonth === 'jun' ? ' active' : ''}`}
            onClick={() => handleSetMonth('jun')}
            aria-pressed={activeMonth === 'jun'}
          >
            June — Group Stage
          </button>
          <button
            className={`month-tab${activeMonth === 'jul' ? ' active' : ''}`}
            onClick={() => handleSetMonth('jul')}
            aria-pressed={activeMonth === 'jul'}
          >
            July — Knockouts
          </button>
        </div>

        <CalendarGrid
          game={game}
          market={market}
          activeMonth={activeMonth}
          toggledOff={toggledOff}
          toggledOffByGame={toggledOffByGame}
          editingDay={editingDay}
          roundOverrides={roundOverrides}
          eventOverrides={eventOverrides}
          stateByGame={stateByGame}
          streakPrizeState={streakPrizeState}
          customRounds={customRounds}
          customStreakConfig={customStreakConfig}
          customTiers={customTiers}
          ptbMultipliers={ptbMultipliers}
          ptbFixtures={ptbFixtures}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onSwap={handleOpenSwap}
          onAddRound={handleOpenCustomRound}
          onEditRound={handleEditPredRound}
          onDeleteRound={(id) => handleDeleteCustomRound(customRounds.find(r => r.id === id)?.startDay ?? 0, 'pd')}
        />

        <AnimatePresence>
          {editingDay !== null && game !== 'All' && game !== 'Pass the Ball' && (
            <OverridePanel
              key={`op-${editingDay}`}
              editingDay={editingDay}
              game={game as Exclude<Game, 'All' | 'Pass the Ball'>}
              market={market}
              stateByGame={stateByGame}
              roundOverrides={roundOverrides}
              eventOverrides={eventOverrides}
              customTiers={customTiers}
              roundTierOverrides={roundTierOverrides}
              onClose={handleCloseOverride}
              onClear={handleClearOverride}
              onChange={handleOverrideChange}
              onSetRoundTiers={handleSetRoundTiers}
              onClearRoundTiers={handleClearRoundTiers}
            />
          )}
          {editingDay !== null && game === 'Pass the Ball' && (
            <PTBPanel
              key={`ptb-${editingDay}`}
              day={editingDay}
              market={market}
              currentMultiplier={ptbMultipliers[String(editingDay)]}
              currentFixture={ptbFixtures[String(editingDay)]}
              onSave={handlePTBSet}
              onClear={handlePTBClear}
              onClose={handleCloseOverride}
            />
          )}
        </AnimatePresence>

        <p className="cal-hint">
          {game === 'All'
            ? 'Use the swap button to reassign a match to a different game slot.'
            : game === 'Pass the Ball'
            ? 'Click any day to set its Pass the Ball multiplier.'
            : 'Click a fixture to include / exclude it. Use ✏ to override prizes for that round, the swap button to reassign a match.'}
        </p>
      </div>

      {/* ── Prize breakdown ── */}
      <div className="card">
        <div className="card-title">Prize Breakdown</div>

        {game === 'All' && (
          <div className="all-notice">Select a specific game above to configure prizes.</div>
        )}

        {game === 'Pass the Ball' && (
          <div className="all-notice">
            Pass the Ball uses per-day multipliers set on the calendar. No prize tiers to configure.
          </div>
        )}

        {game !== 'All' && game !== 'Streak' && game !== 'Pass the Ball' && (
          <PrizeTable
            game={game as Exclude<Game, 'All' | 'Streak' | 'Pass the Ball'>}
            gameState={currentGameState}
            rounds={rounds}
            onChange={handlePrizeTierChange}
            customTiers={customTiers}
            onRemoveTier={handleRemoveGameTier}
            onApplyQuestionCount={(total, start) => {
              const tiers: string[] = [];
              for (let i = start; i <= total; i++) tiers.push(`${i}/${total} correct`);
              setCustomTiers(prev => ({ ...prev, [game]: tiers }));
              setStateByGame(prev => {
                const gs = { ...(prev[game] ?? {}) };
                tiers.forEach(t => { if (!gs[t]) gs[t] = { type: 'Coins', perRound: '', total: '', lastEdited: null }; });
                return { ...prev, [game]: gs };
              });
            }}
          />
        )}

        {game === 'Streak' && (
          <StreakPrizeTable
            market={market}
            streakState={currentStreakState}
            rounds={rounds}
            onChange={handleStreakChange}
            customStreakConfig={customStreakConfig}
            onAddLevel={handleAddStreakLevel}
            onRemoveLevel={handleRemoveStreakLevel}
            onAddSegment={handleAddStreakSegment}
            onRemoveSegment={handleRemoveStreakSegment}
            jackpot={streakJackpot[market] ?? defaultJackpotState()}
            onJackpotChange={handleJackpotChange}
          />
        )}
      </div>

      {/* ── Leaderboard (Streak only) ── */}
      <LeaderboardTable
        visible={game === 'Streak'}
        lbState={lbState}
        onChange={handleLbChange}
      />


      {/* ── Summary ── */}
      <div className="card">
        <div className="card-title">Summary</div>
        <SummaryGrid
          game={game}
          market={market}
          toggledOff={toggledOff}
          toggledOffByGame={toggledOffByGame}
          stateByGame={stateByGame}
          streakPrizeState={streakPrizeState}
          roundOverrides={roundOverrides}
          lbState={lbState}
          eventOverrides={eventOverrides}
          customRounds={customRounds}
          streakJackpot={streakJackpot}
          customStreakConfig={customStreakConfig}
          customTiers={customTiers}
          ptbMultipliers={ptbMultipliers}
          ptbFixtures={ptbFixtures}
        />
      </div>

      {/* ── Modals ── */}
      <SwapModal
        isOpen={!!swapModal}
        day={swapModal?.day ?? null}
        slot={swapModal?.slot ?? null}
        market={market}
        eventOverrides={eventOverrides}
        onClose={() => setSwapModal(null)}
        onApply={handleApplySwap}
        onReset={handleResetSwap}
      />

      <CustomRoundModal
        isOpen={!!customRoundModal}
        day={customRoundModal?.day ?? null}
        slot={(customRoundModal?.slot ?? null) as import('@/lib/types').Slot | null}
        market={market}
        existingEvent={customRoundModal && customRoundModal.slot !== 'pd'
          ? (slotCustomRounds[`${customRoundModal.day}-${customRoundModal.slot}`]?.[0] ?? eventOverrides[`${customRoundModal.day}-${customRoundModal.slot}`] ?? null)
          : null}
        existingRound={customRoundModal?.slot === 'pd'
          ? (customRounds.find(r => r.startDay === customRoundModal.day) ?? null)
          : null}
        onClose={() => setCustomRoundModal(null)}
        onSave={handleSaveCustomRound}
        onDelete={handleDeleteCustomRound}
      />

    </main>
  );
}
