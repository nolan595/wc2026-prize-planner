'use client';

import type { Slot } from '@/lib/types';
import { SLOT_NAME } from '@/lib/constants';
import { toLocal } from '@/lib/utils';

interface Props {
  slot: Slot;
  match: string;
  istTime: string;
  offset: number;
  onSwap: () => void;
}

export function SlotStrip({ slot, match, istTime, offset, onSwap }: Props) {
  return (
    <div className={`slot-strip ${slot}`}>
      <div className="slot-info">
        <div className="slot-game-label">{SLOT_NAME[slot]}</div>
        <div className="slot-match">{match}</div>
        <div className="slot-time">{toLocal(istTime, offset)}</div>
      </div>
      <button
        className="swap-btn"
        title="Reassign match"
        onClick={e => { e.stopPropagation(); onSwap(); }}
        aria-label={`Reassign match for ${SLOT_NAME[slot]}`}
      >
        &#8635;
      </button>
    </div>
  );
}
