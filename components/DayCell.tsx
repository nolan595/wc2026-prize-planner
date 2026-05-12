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
  // Custom Predictor rounds starting on this day (can be multiple)
  customRounds?: CustomPredictorRound[];
  isContinuation?: CustomPredictorRound | null;
  // Pass the Ball multiplier and fixture for this day
  ptbMultiplier?: number;
  ptbFixture?: [string, string];
  onToggle: (day: number) => void;
  onEdit: (day: number) => void;
  onSwap: (day: number, slot: string) => void;
  onAddRound: (day: number, slot: string, roundId?: string) => void;
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
  customRounds,
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
  const slotKey = game === 'Streak' ? 'sk' : game === 'Match Line' ? 'ml' : 'pd';

  // Pure continuation cell — no primary rounds and no existing fixture on this day
  if (isContinuation && (!customRounds || customRounds.length === 0) && !slotData) {
    return (
      <div
        className={`cal-cell continuation active-pd has-add`}
        aria-label={`${dayLabel(day)} — round continues`}
      >
        <div className="day-num">{dayLabel(day)}</div>
        <div className="continuation-label">↩ {isContinuation.fixtures[0]?.match ?? 'Predictor'}</div>
        <div className="day-actions" role="group">
          <button
            className="day-btn"
            title="Add a custom round on this day"
            aria-label={`Add custom round on ${dayLabel(day)}`}
            onClick={e => { e.stopPropagation(); onAddRound(day, slotKey); }}
          >
            ＋
          </button>
        </div>
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

  // Primary cell for one or more custom Predictor rounds starting on this day
  if (customRounds && customRounds.length > 0) {
    let cellClass = 'cal-cell has-fixture active-pd';
    if (isOff) cellClass += ' toggled-off';
    if (isEditing) cellClass += ' editing';

    return (
      <div
        className={cellClass}
        onClick={() => onToggle(day)}
        role="gridcell"
        aria-label={`${dayLabel(day)} — ${customRounds.length} custom Predictor round${customRounds.length !== 1 ? 's' : ''}`}
        aria-pressed={!isOff}
      >
        <div className="day-num">
          {dayLabel(day)}
          {isOff && <span className="off-mark"> ✕</span>}
          {hasOverride && !isOff && <span className="override-dot" />}
        </div>

        {isContinuation && (
          <>
            <div className="continuation-label">↩ {isContinuation.fixtures[0]?.match ?? 'Predictor'}</div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '3px 0' }} />
          </>
        )}

        {customRounds.map(cr => (
          <div key={cr.id} className="custom-round-block" onClick={e => e.stopPropagation()}>
            {cr.endDay > cr.startDay && (
              <div className="custom-round-span">→ {dayLabel(cr.endDay)}</div>
            )}
            <div className="custom-round-fixtures">
              {cr.fixtures.length === 0 ? (
                <div className="custom-round-empty">No fixtures yet</div>
              ) : (
                <>
                  {cr.fixtures.slice(0, 2).map((f, i) => (
                    <div key={i} className="custom-round-fixture-item">{f.match}</div>
                  ))}
                  {cr.fixtures.length > 2 && (
                    <div className="custom-round-fixture-more">+{cr.fixtures.length - 2} more</div>
                  )}
                </>
              )}
            </div>
            <div className="custom-round-actions">
              <button
                className="day-btn"
                title="Edit this round"
                aria-label={`Edit round on ${dayLabel(day)}`}
                onClick={e => { e.stopPropagation(); onAddRound(day, 'pd', cr.id); }}
              >
                ✏
              </button>
              <button
                className="day-btn"
                title="Delete this round"
                aria-label={`Delete round on ${dayLabel(day)}`}
                style={{ color: 'var(--color-error)' }}
                onClick={e => { e.stopPropagation(); onDeleteRound?.(cr.id); }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {!isOff && prizeTags.length > 0 && (
          <div className="prize-tags">
            {prizeTags.map((tag, i) => (
              <span key={i} className={`prize-tag-item ${prizeClass(tag.type as PrizeType)}`}>
                {prizeIcon(tag.type as PrizeType)} {tag.val?.toLocaleString()}
              </span>
            ))}
          </div>
        )}

        <div className="day-actions" role="group" aria-label={`Actions for ${dayLabel(day)}`} onClick={e => e.stopPropagation()}>
          <button
            className="day-btn"
            title="Add another round"
            aria-label={`Add another round on ${dayLabel(day)}`}
            onClick={e => { e.stopPropagation(); onAddRound(day, slotKey); }}
          >
            +
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

  const hasFixture = !!slotData;

  if (!hasFixture) {
    return (
      <div className="cal-cell no-fixture">
        <div className="day-num" style={{ opacity: 0.6 }}>{dayLabel(day)}</div>
        <button
          className="add-round-btn"
          title="Add a custom round on this day"
          onClick={e => {
            e.stopPropagation();
            if (activeMonth === 'jul') {
              onAddRound(day, slotKey);
            } else {
              onSwap(day, slotKey);
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

      {isContinuation && (
        <>
          <div className="continuation-label">↩ {isContinuation.fixtures[0]?.match ?? 'Predictor'}</div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '3px 0' }} />
        </>
      )}
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
        <button
          className="day-btn"
          title="Add a custom round on this day"
          aria-label={`Add custom round on ${dayLabel(day)}`}
          onClick={e => { e.stopPropagation(); onAddRound(day, slotKey); }}
        >
          ＋
        </button>
      </div>
    </div>
  );
}
