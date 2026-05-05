'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion, AnimatePresence, motion } from 'framer-motion';
import type { SaveStatus } from '@/lib/types';

interface Props {
  status: SaveStatus;
  onRetry: () => void;
}

interface StatusConfig {
  dotColor: string;
  text: string;
  textColor: string;
  pulse: boolean;
}

const STATUS_CONFIG: Record<SaveStatus, StatusConfig> = {
  idle:   { dotColor: 'var(--color-text-faint)',   text: 'All changes saved', textColor: 'var(--color-text-faint)',   pulse: false },
  saving: { dotColor: 'var(--color-info)',          text: 'Saving…',           textColor: 'var(--color-text-muted)',   pulse: true  },
  saved:  { dotColor: 'var(--color-success)',       text: 'Saved',             textColor: 'var(--color-success)',      pulse: false },
  error:  { dotColor: 'var(--color-error)',         text: 'Save failed — click to retry', textColor: 'var(--color-error)', pulse: false },
};

export function SaveStatusIndicator({ status, onRetry }: Props) {
  const reducedMotion = useReducedMotion();
  const cfg = STATUS_CONFIG[status];
  const dotRef = useRef<HTMLSpanElement>(null);

  // Handle pulse animation imperatively to avoid TS variant type issues
  useEffect(() => {
    const el = dotRef.current;
    if (!el) return;
    if (cfg.pulse && !reducedMotion) {
      el.style.animation = 'savePulse 0.8s ease-in-out infinite';
    } else {
      el.style.animation = '';
      el.style.opacity = cfg.pulse ? '0.6' : '1';
    }
  }, [cfg.pulse, reducedMotion]);

  return (
    <>
      <style>{`
        @keyframes savePulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          cursor: status === 'error' ? 'pointer' : 'default',
        }}
        onClick={status === 'error' ? onRetry : undefined}
        role="status"
        aria-live="polite"
      >
        <span
          ref={dotRef}
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: cfg.dotColor,
            flexShrink: 0,
          }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.04em',
              color: cfg.textColor,
              whiteSpace: 'nowrap' as const,
            }}
          >
            {cfg.text}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  );
}
