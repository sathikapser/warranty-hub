import React from 'react';

const HealthScoreCard = ({ healthData, onQuickFix }) => {
  const score = healthData?.overallScore ?? healthData?.score ?? 85;
  const grade = healthData?.grade ?? 'A';
  const gradeColor = healthData?.gradeColor ?? '#10b981';
  const insights = healthData?.insights ?? [];
  const penalties = healthData?.penalties ?? [];
  const bonuses = healthData?.bonuses ?? [];

  // SVG Circle calculations
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Warranty Health Score</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Continuous workspace coverage & document audit</p>
        </div>
        <span className="badge" style={{ background: `${gradeColor}20`, color: gradeColor, borderColor: `${gradeColor}50` }}>
          Grade {grade}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', margin: 'auto 0' }}>
        {/* Radial Circular Gauge */}
        <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
          <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background Track */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Progress Stroke */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke={gradeColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>

          {/* Centered Score */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>/ 100</span>
          </div>
        </div>

        {/* Diagnostic Breakdown */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {penalties.length > 0 ? (
            penalties.slice(0, 2).map((p, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#f87171' }}>
                <span>⚠️</span>
                <span>{p.reason} ({p.points} pts)</span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.84rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🛡️</span>
              <span>All active assets pass validation</span>
            </div>
          )}

          {insights.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '4px' }}>
              {insights[0]}
            </div>
          )}
        </div>
      </div>

      {onQuickFix && (
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={onQuickFix}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', fontSize: '0.82rem' }}
          >
            ⚡ View Actionable Fixes to Reach 100
          </button>
        </div>
      )}
    </div>
  );
};

export default HealthScoreCard;
