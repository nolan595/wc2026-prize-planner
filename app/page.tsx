'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import type {
  Market, Game, PlanState, TierState, LbState, LbTierState,
  PrizeType, RoundOverrides, EventOverrides, StateByGame, StreakPrizeState, OverrideEntry
} from '@/lib/types';
import {
  MARKET_OPTIONS, GAME_OPTIONS,
} from '@/lib/constants';
import {
  defaultPlanState, ensureGameState, ensureStreakState, ensureLbState,
  getRounds, getActiveRounds, recalcTierState,
} from '@/lib/utils';
import { useAutoSave } from '@/lib/useAutoSave';

import { SaveStatusIndicator } from '@/components/SaveStatusIndicator';
import { GameGuide } from '@/components/GameGuide';
import { CalendarGrid } from '@/components/CalendarGrid';
import { OverridePanel } from '@/components/OverridePanel';
import { SwapModal } from '@/components/SwapModal';
import { CustomEventModal } from '@/components/CustomEventModal';
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
    toggledOff: Array.isArray(p.toggledOff) ? p.toggledOff : [],
    roundOverrides: (p.roundOverrides ?? {}) as RoundOverrides,
    eventOverrides: (p.eventOverrides ?? {}) as EventOverrides,
    stateByGame: (p.stateByGame ?? {}) as StateByGame,
    streakPrizeState: (p.streakPrizeState ?? {}) as StreakPrizeState,
    lbState: (p.lbState ?? {}) as LbState,
  };
  // Ensure structural completeness
  s.stateByGame = ensureGameState(s.stateByGame, 'Predictor');
  s.stateByGame = ensureGameState(s.stateByGame, 'Match Line');
  s.stateByGame = ensureGameState(s.stateByGame, 'Streak');
  s.streakPrizeState = ensureStreakState(s.streakPrizeState, market);
  s.lbState = ensureLbState(s.lbState);
  return s;
}

// ── Main Page ────────────────────────────────────────────────

export default function PlannerPage() {
  const [market, setMarket] = useState<Market>('romania');
  const [game, setGame] = useState<Game>('All');
  const [activeMonth, setActiveMonth] = useState<'jun' | 'jul'>('jun');
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [toggledOff, setToggledOff] = useState<Set<number>>(new Set());
  const [roundOverrides, setRoundOverrides] = useState<RoundOverrides>({});
  const [eventOverrides, setEventOverrides] = useState<EventOverrides>({});
  const [stateByGame, setStateByGame] = useState<StateByGame>({});
  const [streakPrizeState, setStreakPrizeState] = useState<StreakPrizeState>({});
  const [lbState, setLbState] = useState<LbState>({});
  const [loading, setLoading] = useState(true);

  // Modal state
  const [swapModal, setSwapModal] = useState<{ day: number; slot: string } | null>(null);
  const [customModal, setCustomModal] = useState<{ day: number; slot: string } | null>(null);

  const { status: saveStatus, triggerSave, retry } = useAutoSave(market);

  // Build current plan state for saving / passing down
  const buildPlanState = useCallback((): PlanState => ({
    market,
    game,
    toggledOff: Array.from(toggledOff),
    roundOverrides,
    eventOverrides,
    stateByGame,
    streakPrizeState,
    lbState,
  }), [market, game, toggledOff, roundOverrides, eventOverrides, stateByGame, streakPrizeState, lbState]);

  // Track whether we've done the initial load for the current market
  const initialLoadDoneRef = useRef(false);

  // Load plan for market from API on mount and on market change
  useEffect(() => {
    initialLoadDoneRef.current = false;
    setLoading(true);

    fetch(`/api/plans/${market}`)
      .then(r => r.json())
      .then(res => {
        const payload = res?.data?.payload;
        const hydrated = hydrateFromPayload(payload, market);
        setGame(hydrated.game);
        setToggledOff(new Set(hydrated.toggledOff));
        setRoundOverrides(hydrated.roundOverrides);
        setEventOverrides(hydrated.eventOverrides);
        setStateByGame(hydrated.stateByGame);
        setStreakPrizeState(hydrated.streakPrizeState);
        setLbState(hydrated.lbState);
      })
      .catch(() => {
        const hydrated = buildInitialState(market);
        setGame(hydrated.game);
        setToggledOff(new Set());
        setRoundOverrides({});
        setEventOverrides({});
        setStateByGame(hydrated.stateByGame);
        setStreakPrizeState(hydrated.streakPrizeState);
        setLbState(hydrated.lbState);
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
  }, [toggledOff, roundOverrides, eventOverrides, stateByGame, streakPrizeState, lbState, game]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ────────────────────────────────────────

  const rounds = getRounds(game, market, toggledOff, eventOverrides);

  const getActiveRoundsCount = (slotType: 'sk' | 'ml' | 'pd') =>
    getActiveRounds(slotType, market, toggledOff, eventOverrides);

  const roundBadgeText = game === 'All'
    ? `${getActiveRoundsCount('sk')} Streak · ${getActiveRoundsCount('ml')} ML · ${getActiveRoundsCount('pd')} Pred`
    : `${rounds} round${rounds !== 1 ? 's' : ''}`;

  // ── Handlers ──────────────────────────────────────────────

  const handleMarketChange = useCallback((newMarket: Market) => {
    setMarket(newMarket);
    setActiveMonth('jun');
    setEditingDay(null);
    // State reset handled by the market-change useEffect above
  }, []);

  const handleGameChange = useCallback((newGame: Game) => {
    setGame(newGame);
    setToggledOff(new Set());
    setEditingDay(null);

    // Ensure tiers for the new game
    if (newGame !== 'All' && newGame !== 'Streak') {
      setStateByGame(prev => ensureGameState(prev, newGame));
    }
    if (newGame === 'Streak') {
      setStreakPrizeState(prev => ensureStreakState(prev, market));
    }
    setLbState(prev => ensureLbState(prev));
  }, [market]);

  const handleToggle = useCallback((day: number) => {
    setToggledOff(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
    if (editingDay === day) setEditingDay(null);
  }, [editingDay]);

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

  // Custom event modal
  const handleOpenCustom = useCallback((day: number, slotStr: string) => {
    setCustomModal({ day, slot: slotStr });
  }, []);

  const handleApplyCustom = useCallback((day: number, slotStr: string, name: string, time: string) => {
    setEventOverrides(prev => ({ ...prev, [`${day}-${slotStr}`]: [name, time] }));
    setCustomModal(null);
  }, []);

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
          WC 2026 — F2P Prize Planner
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
              {GAME_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Calendar ── */}
      <div className="card">
        <div className="card-title">
          WC 2026 — Schedule
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
          editingDay={editingDay}
          roundOverrides={roundOverrides}
          eventOverrides={eventOverrides}
          stateByGame={stateByGame}
          streakPrizeState={streakPrizeState}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onSwap={handleOpenSwap}
          onAddRound={handleOpenCustom}
        />

        <AnimatePresence>
          {editingDay !== null && game !== 'All' && (
            <OverridePanel
              key={`op-${editingDay}`}
              editingDay={editingDay}
              game={game as Exclude<Game, 'All'>}
              market={market}
              stateByGame={stateByGame}
              roundOverrides={roundOverrides}
              eventOverrides={eventOverrides}
              onClose={handleCloseOverride}
              onClear={handleClearOverride}
              onChange={handleOverrideChange}
            />
          )}
        </AnimatePresence>

        <p className="cal-hint">
          {game === 'All'
            ? 'Use the swap button to reassign a match to a different game slot.'
            : 'Click a fixture to include / exclude it. Use ✏ to override prizes for that round, the swap button to reassign a match.'}
        </p>
      </div>

      {/* ── Prize breakdown ── */}
      <div className="card">
        <div className="card-title">Prize Breakdown</div>

        {game === 'All' && (
          <div className="all-notice">Select a specific game above to configure prizes.</div>
        )}

        {game !== 'All' && game !== 'Streak' && (
          <PrizeTable
            game={game as Exclude<Game, 'All' | 'Streak'>}
            gameState={currentGameState}
            rounds={rounds}
            onChange={handlePrizeTierChange}
          />
        )}

        {game === 'Streak' && (
          <StreakPrizeTable
            market={market}
            streakState={currentStreakState}
            rounds={rounds}
            onChange={handleStreakChange}
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
          stateByGame={stateByGame}
          streakPrizeState={streakPrizeState}
          roundOverrides={roundOverrides}
          lbState={lbState}
          eventOverrides={eventOverrides}
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

      <CustomEventModal
        isOpen={!!customModal}
        day={customModal?.day ?? null}
        slot={customModal?.slot ?? null}
        market={market}
        eventOverrides={eventOverrides}
        onClose={() => setCustomModal(null)}
        onApply={handleApplyCustom}
      />

    </main>
  );
}
