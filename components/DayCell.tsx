'use client';

import type { Market, PrizeType, PrizeTagData, CustomPredictorRound } from '@/lib/types';
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
  // Custom Predictor round state for this day
  customRound?: CustomPredictorRound | null;
  isContinuation?: CustomPredictorRound | null;
  // Pass the Ball multiplier and fixture for this day
  ptbMultiplier?: number;
  ptbFixture?: [string, string];
  onToggle: (day: number) => void;
  onEdit: (day: number) => void;
  onSwap: (day: number, slot: string) => void;
  onAddRound: (day: number, slot: string) => void;
  onEditRound?: (round: CustomPredictorRound) => void;
  onDeleteRound?: (id: string) => void;
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
  customRound,
  isContinuation,
  ptbMultiplier,
  ptbFixture,
  onToggle,
  onEdit,
  onSwap,
  onAddRound,
  onEditRound,
  onDeleteRound,
}: Props) {
  const country = COUNTRIES[market];
  const offset = country.offset;

  // Faded continuation cell — this day belongs to a multi-day round that started earlier
  if (isContinuation) {
    return (
      <div
        className="cal-cell continuation active-pd"
        aria-label={`${dayLabel(day)} — Predictor round continues`}
        aria-hidden="true"
      >
        <div className="day-num">{dayLabel(day)}</div>
        <div className="continuation-label">↩ Predictor</div>
      </div>
    );
  }

  // Pass the Ball — every day is shown; multiplier may or may not be set
  if (game === 'Pass the Ball') {
    const hasMultiplier = ptbMultiplier !== undefined && ptbMultiplier > 0;
    let cellClass = `cal-cell ptb-cell${hasMultiplier ? ' active-ptb' : ' no-fixture'}`;
    if (isEditing) cellClass += ' editing';

    return (
      <div
        className={cellClass}
        onClick={() => onEdit(day)}
        role="gridcell"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onEdit(day); }}
        aria-label={`${dayLabel(day)}${hasMultiplier ? ` — ×${ptbMultiplier}` : ' — no multiplier'}`}
        aria-pressed={hasMultiplier}
      >
        <div className="day-num">{dayLabel(day)}</div>
        {hasMultiplier ? (
          <>
            <div className="ptb-multiplier">×{ptbMultiplier}</div>
            {ptbFixture && (
              <>
                <div className="match-name" style={{ fontSize: '0.7rem', marginTop: 2 }}>{ptbFixture[0]}</div>
                <div className="match-time" style={{ fontSize: '0.65rem' }}>{toLocal(ptbFixture[1], offset)}</div>
              </>
            )}
          </>
        ) : (
          <button
            className="add-round-btn"
            title="Set multiplier for this day"
            onClick={e => { e.stopPropagation(); onEdit(day); }}
            aria-label={`Set Pass the Ball multiplier for ${dayLabel(day)}`}
          >
            +
          </button>
        )}
      </div>
    );
  }

  // Primary cell for a custom multi-fixture Predictor round
  if (customRound) {
    let cellClass = 'cal-cell has-fixture active-pd';
    if (isOff) cellClass += ' toggled-off';
    if (isEditing) cellClass += ' editing';

    return (
      <div
        className={cellClass}
        onClick={() => onToggle(day)}
        role="gridcell"
        aria-label={`${dayLabel(day)} — Custom Predictor round, ${customRound.fixtures.length} fixture${customRound.fixtures.length !== 1 ? 's' : ''}`}
        aria-pressed={!isOff}
      >
        <div className="day-num">
          {dayLabel(day)}
          {isOff && <span className="off-mark"> ✕</span>}
          {hasOverride && !isOff && <span className="override-dot" />}
        </div>

        {customRound.endDay > customRound.startDay && (
          <div className="custom-round-span">→ {dayLabel(customRound.endDay)}</div>
        )}

        <div className="custom-round-fixtures">
          {customRound.fixtures.length === 0 ? (
            <div className="custom-round-empty">No fixtures yet</div>
          ) : (
            <>
              {customRound.fixtures.slice(0, 2).map((f, i) => (
                <div key={i} className="custom-round-fixture-item">{f.match}</div>
              ))}
              {customRound.fixtures.length > 2 && (
                <div className="custom-round-fixture-more">
                  +{customRound.fixtures.length - 2} more
                </div>
              )}
            </>
          )}
        </div>

        {!isOff && prizeTags.length > 0 && (
          <div className="prize-tags">
            {prizeTags.map((tag, i) => (
              <span key={i} className={`prize-tag-item ${prizeClass(tag.type as PrizeType)}`}>
                {prizeIcon(tag.type as PrizeType)} {tag.val?.toLocaleString()}
              </span>
            ))}
          </div>
        )}

        <div className="day-actions" role="group" aria-label={`Actions for ${dayLabel(day)}`}>
          <button
            className="day-btn"
            title="Edit this round"
            aria-label={`Edit round on ${dayLabel(day)}`}
            onClick={e => { e.stopPropagation(); onEditRound?.(customRound); }}
          >
            ✏
          </button>
          <button
            className="day-btn"
            title="Delete this round"
            aria-label={`Delete round on ${dayLabel(day)}`}
            style={{ color: 'var(--color-error)' }}
            onClick={e => { e.stopPropagation(); onDeleteRound?.(customRound.id); }}
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

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
    const isPredictor = game === 'Predictor';
    return (
      <div className="cal-cell no-fixture">
        <div className="day-num" style={{ opacity: 0.6 }}>{dayLabel(day)}</div>
        <button
          className="add-round-btn"
          title={isPredictor ? 'Add a Predictor round on this day' : activeMonth === 'jul' ? 'Add a custom event on this day' : 'Add a round on this day'}
          onClick={e => {
            e.stopPropagation();
            // Predictor always opens the multi-fixture round builder
            if (isPredictor) {
              onAddRound(day, slotKeyNoFixture);
            } else if (activeMonth === 'jul') {
              onAddRound(day, slotKeyNoFixture);
            } else {
              onSwap(day, slotKeyNoFixture);
            }
          }}
          aria-label={`Add ${isPredictor ? 'Predictor round' : 'round'} on ${dayLabel(day)}`}
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
