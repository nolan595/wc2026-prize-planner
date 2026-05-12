'use client';

import type { ReactElement } from 'react';
import type { Market, PrizeTagData, Game, RoundOverrides, EventOverrides, StateByGame, StreakPrizeState, CustomPredictorRound } from '@/lib/types';
import { GAME_SLOT, SLOT_CLASS } from '@/lib/constants';
import { getSlotData, getPrizeTagData, getCustomRoundPrimary, getCustomRoundContinuation } from '@/lib/utils';
import { DayCell } from './DayCell';

const SLOT_TO_GAME: Record<string, string> = { sk: 'Streak', ml: 'Match Line', pd: 'Predictor' };

interface Props {
  game: Game;
  market: Market;
  activeMonth: 'jun' | 'jul';
  toggledOff: Set<number>;
  toggledOffByGame?: Record<string, number[]>;
  editingDay: number | null;
  roundOverrides: RoundOverrides;
  eventOverrides: EventOverrides;
  stateByGame: StateByGame;
  streakPrizeState: StreakPrizeState;
  customRounds: CustomPredictorRound[];
  ptbMultipliers?: Record<string, number>;
  ptbFixtures?: Record<string, [string, string]>;
  customStreakConfig?: Record<string, { levels: number[]; segments: string[] }>;
  customTiers?: Record<string, string[]>;
  onToggle: (day: number) => void;
  onEdit: (day: number) => void;
  onSwap: (day: number, slot: string) => void;
  onAddRound: (day: number, slot: string) => void;
  onEditRound: (round: CustomPredictorRound) => void;
  onDeleteRound: (id: string) => void;
}

// Day range for each month tab
// Jun: grid starts Mon Jun 8 (day 8), first fixture Jun 11 (day 11), last Jun 30 (day 30)
// Jul: grid starts with Jun 29 (day 29) to align week, last Jul 19 (day 49)
function monthRange(activeMonth: 'jun' | 'jul') {
  if (activeMonth === 'jun') return { gridStart: 8, firstShown: 11, last: 30 };
  return { gridStart: 29, firstShown: 29, last: 49 };
}

export function CalendarGrid({
  game,
  market,
  activeMonth,
  toggledOff,
  toggledOffByGame,
  editingDay,
  roundOverrides,
  eventOverrides,
  stateByGame,
  streakPrizeState,
  customRounds,
  ptbMultipliers,
  ptbFixtures,
  customStreakConfig,
  customTiers,
  onToggle,
  onEdit,
  onSwap,
  onAddRound,
  onEditRound,
  onDeleteRound,
}: Props) {
  const isAll = game === 'All';
  const isPTB = game === 'Pass the Ball';
  const slot = (isAll || isPTB) ? null : GAME_SLOT[game as keyof typeof GAME_SLOT];
  const { gridStart, firstShown, last } = monthRange(activeMonth);

  const days: ReactElement[] = [];

  for (let d = gridStart; d <= last; d++) {
    if (d < firstShown) {
      days.push(
        <div key={`empty-${d}`} className="cal-cell empty" aria-hidden="true" />
      );
      continue;
    }

    if (isPTB) {
      days.push(
        <DayCell
          key={d}
          day={d}
          game={game}
          market={market}
          ptbMultiplier={ptbMultipliers?.[String(d)]}
          ptbFixture={ptbFixtures?.[String(d)]}
          isAll={false}
          isOff={false}
          isEditing={editingDay === d}
          hasOverride={false}
          prizeTags={[]}
          activeMonth={activeMonth}
          eventOverrides={eventOverrides}
          onToggle={onToggle}
          onEdit={onEdit}
          onSwap={onSwap}
          onAddRound={onAddRound}
        />
      );
      continue;
    }

    if (isAll) {
      const slots = (['sk', 'ml', 'pd'] as const)
        .map(sl => ({ sl, data: getSlotData(d, market, sl, eventOverrides) }))
        .filter(x => x.data !== null && !(toggledOffByGame?.[SLOT_TO_GAME[x.sl]]?.includes(d))) as { sl: 'sk' | 'ml' | 'pd'; data: [string, string] }[];

      days.push(
        <DayCell
          key={d}
          day={d}
          game={game}
          market={market}
          isAll={true}
          slots={slots.map(x => ({ slot: x.sl, data: x.data }))}
          isOff={false}
          isEditing={false}
          hasOverride={false}
          prizeTags={[]}
          activeMonth={activeMonth}
          eventOverrides={eventOverrides}
          onToggle={onToggle}
          onEdit={onEdit}
          onSwap={onSwap}
          onAddRound={onAddRound}
        />
      );
    } else {
      // For Predictor, check if this day is part of a custom round
      const customRoundPrimary = game === 'Predictor'
        ? getCustomRoundPrimary(d, customRounds)
        : null;
      const customRoundContinuation = game === 'Predictor'
        ? getCustomRoundContinuation(d, customRounds)
        : null;

      // slotData is irrelevant for custom round days — the cell renders its own content
      const slotData = (customRoundPrimary || customRoundContinuation)
        ? null
        : (slot ? getSlotData(d, market, slot, eventOverrides) : null);

      const isOff = toggledOff.has(d);
      const hasOverride = !!(
        roundOverrides[game]?.[String(d)] &&
        Object.keys(roundOverrides[game][String(d)]).length > 0
      );
      const prizeTags = getPrizeTagData(d, game, market, stateByGame, streakPrizeState, roundOverrides, customStreakConfig, customTiers) as PrizeTagData[];

      days.push(
        <DayCell
          key={d}
          day={d}
          game={game}
          market={market}
          slotData={slotData}
          slotClass={slot ? SLOT_CLASS[slot] : undefined}
          isAll={false}
          isOff={isOff}
          isEditing={editingDay === d}
          hasOverride={hasOverride}
          prizeTags={prizeTags}
          activeMonth={activeMonth}
          eventOverrides={eventOverrides}
          customRound={customRoundPrimary}
          isContinuation={customRoundContinuation}
          onToggle={onToggle}
          onEdit={onEdit}
          onSwap={onSwap}
          onAddRound={onAddRound}
          onEditRound={onEditRound}
          onDeleteRound={onDeleteRound}
        />
      );
    }
  }

  // Pad last row to complete 7-column grid
  const totalCells = last - gridStart + 1;
  const rem = totalCells % 7;
  if (rem) {
    for (let i = 0; i < 7 - rem; i++) {
      days.push(
        <div key={`pad-${i}`} className="cal-cell empty" aria-hidden="true" />
      );
    }
  }

  return (
    <div
      className={`cal-grid${isAll ? ' all-mode' : ''}${isPTB ? ' ptb-mode' : ''}`}
      role="grid"
      aria-label="WC 2026 fixture calendar"
    >
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
        <div key={d} className="cal-header" role="columnheader">{d}</div>
      ))}
      {days}
    </div>
  );
}
