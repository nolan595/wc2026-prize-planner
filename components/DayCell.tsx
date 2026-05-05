'use client';

import type { Market, PrizeType, PrizeTagData } from '@/lib/types';
import { COUNTRIES } from '@/lib/constants';
import { dayLabel, toLocal, prizeClass, prizeIcon } from '@/lib/utils';
import { SlotStrip } from './SlotStrip';

interface SlotInfo {
  slot: 'sk' | 'ml' | 'pd';
  data: [string, string];
}

interface Props {
  day: number;
  game: string;
  market: Market;
  // Single-game mode data
  slotData?: [string, string] | null;
  slotClass?: string;
  // All-games mode data
  slots?: SlotInfo[];
  isAll: boolean;
  isOff: boolean;
  isEditing: boolean;
  hasOverride: boolean;
  prizeTags: PrizeTagData[];
  activeMonth: 'jun' | 'jul';
  eventOverrides: Record<string, [string, string]>;
  onToggle: (day: number) => void;
  onEdit: (day: number) => void;
  onSwap: (day: number, slot: string) => void;
  onAddRound: (day: number, slot: string) => void;
}

export function DayCell({
  day,
  game,
  market,
  slotData,
  slotClass,
  slots,
  isAll,
  isOff,
  isEditing,
  hasOverride,
  prizeTags,
  activeMonth,
  eventOverrides,
  onToggle,
  onEdit,
  onSwap,
  onAddRound,
}: Props) {
  const country = COUNTRIES[market];
  const offset = country.offset;

  if (isAll) {
    if (!slots || !slots.length) {
      return (
        <div
          className="cal-cell no-fixture"
          style={{ cursor: 'default' }}
          aria-hidden="true"
        />
      );
    }

    return (
      <div className="cal-cell has-fixture" style={{ cursor: 'default' }}>
        <div className="day-num">{dayLabel(day)}</div>
        {slots.map(({ slot, data }) => (
          <SlotStrip
            key={slot}
            slot={slot}
            match={data[0]}
            istTime={data[1]}
            offset={offset}
            onSwap={() => onSwap(day, slot)}
          />
        ))}
      </div>
    );
  }

  // Single-game mode — derive the slot key once, used throughout
  const slotKeyNoFixture = game === 'Streak' ? 'sk' : game === 'Match Line' ? 'ml' : 'pd';
  const hasFixture = !!slotData;

  if (!hasFixture) {
    return (
      <div className="cal-cell no-fixture">
        <div className="day-num" style={{ opacity: 0.6 }}>{dayLabel(day)}</div>
        <button
          className="add-round-btn"
          title={activeMonth === 'jul' ? 'Add a custom event on this day' : 'Add a round on this day'}
          onClick={e => {
            e.stopPropagation();
            if (activeMonth === 'jul') {
              onAddRound(day, slotKeyNoFixture);
            } else {
              onSwap(day, slotKeyNoFixture);
            }
          }}
          aria-label={`Add round on ${dayLabel(day)}`}
        >
          +
        </button>
      </div>
    );
  }

  const [match, istTime] = slotData;
  const isHome = country.homeMatches?.has(match);

  let cellClass = 'cal-cell has-fixture';
  if (!isOff) cellClass += ' ' + (slotClass ?? '');
  if (isOff) cellClass += ' toggled-off';
  if (isEditing) cellClass += ' editing';

  // A slot is considered "custom" (user-typed name) when it's a July day and the
  // eventOverrides key is present. July pool entries are all placeholder labels
  // (e.g. "R32 — Match A"), so any override on a July day is a custom event.
  const slotKey = game === 'Streak' ? 'sk' : game === 'Match Line' ? 'ml' : 'pd';
  const isCustom =
    activeMonth === 'jul' &&
    !!eventOverrides[`${day}-${slotKey}`];

  return (
    <div
      className={cellClass}
      onClick={() => onToggle(day)}
      role="gridcell"
      aria-label={`${dayLabel(day)} ${match}`}
      aria-pressed={!isOff}
    >
      <div className="day-num">
        {dayLabel(day)}
        {isOff && hasFixture && <span className="off-mark"> ✕</span>}
        {hasOverride && !isOff && <span className="override-dot" />}
      </div>

      <div className="match-name">{match}{isHome ? ' ★' : ''}</div>
      <div className="match-time">{toLocal(istTime, offset)}</div>

      {!isOff && prizeTags.length > 0 && (
        <div className="prize-tags">
          {prizeTags.map((tag, i) => {
            if (tag.type === 'sk-level') {
              return (
                <span key={i} className="prize-tag-item sk-level">
                  {tag.label}
                </span>
              );
            }
            return (
              <span key={i} className={`prize-tag-item ${prizeClass(tag.type as PrizeType)}`}>
                {prizeIcon(tag.type as PrizeType)} {tag.val?.toLocaleString()}
              </span>
            );
          })}
        </div>
      )}

      <div className="day-actions" role="group" aria-label={`Actions for ${dayLabel(day)}`}>
        {!isOff && (
          <button
            className="day-btn"
            title="Override prizes for this round"
            aria-label={`Override prizes for ${dayLabel(day)}`}
            onClick={e => { e.stopPropagation(); onEdit(day); }}
          >
            ✏
          </button>
        )}
        <button
          className="day-btn"
          title={isCustom ? 'Edit custom event' : 'Reassign match'}
          aria-label={isCustom ? `Edit custom event for ${dayLabel(day)}` : `Reassign match for ${dayLabel(day)}`}
          onClick={e => {
            e.stopPropagation();
            if (isCustom) {
              onAddRound(day, slotKey);
            } else {
              onSwap(day, slotKey);
            }
          }}
        >
          &#8635;
        </button>
      </div>
    </div>
  );
}
