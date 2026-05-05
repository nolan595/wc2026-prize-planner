'use client';

export function GameGuide() {
  return (
    <div className="card">
      <div className="card-title">Game Guide</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '10px',
      }}>
        <div style={{
          borderLeft: '3px solid var(--color-streak)',
          background: 'var(--color-bg-well)',
          borderRadius: 6,
          padding: '12px 14px',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--color-streak)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 5,
          }}>
            Streak — Early AM
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55,
          }}>
            Overnight fixture — players wake up to a new result and a new question waiting for them. No live action required; drives daily habit and morning engagement.
          </div>
        </div>

        <div style={{
          borderLeft: '3px solid var(--color-matchline)',
          background: 'var(--color-bg-well)',
          borderRadius: 6,
          padding: '12px 14px',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--color-matchline)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 5,
          }}>
            Match Line — Afternoon
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55,
          }}>
            In-play game tied to an afternoon or early evening fixture. Strong in-play features keep players active during the match and complement live betting.
          </div>
        </div>

        <div style={{
          borderLeft: '3px solid var(--color-predictor)',
          background: 'var(--color-bg-well)',
          borderRadius: 6,
          padding: '12px 14px',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--color-predictor)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 5,
          }}>
            Predictor — Hype Fixture
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55,
          }}>
            Rapid rounds or big-event fixtures. Can run standalone as a session opener, or extend engagement after Match Line — keeping players in the app into the evening.
          </div>
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.625rem',
        color: 'var(--color-text-faint)',
        marginTop: 10,
        fontStyle: 'italic',
      }}>
        Select a market and game above to configure prizes. Use the calendar to toggle rounds on/off or override prizes for individual days.
      </div>
    </div>
  );
}
