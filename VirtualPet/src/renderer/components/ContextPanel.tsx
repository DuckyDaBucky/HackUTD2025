import { type CSSProperties, useEffect, useMemo, useRef } from 'react';
import useMoodDetection from '../hooks/useMoodDetection';
import { useRealtimeState } from '../state/realtimeState';
import StudyTimerPanel from './StudyTimerPanel';
export type ContextPanelProps = {
  message: string;
  onTimerStart: () => void;
  onTimerPause: () => void;
  onTimerReset: () => void;
};

const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

const formatTime = (timestamp?: number) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatDuration = (ms?: number) => {
  if (typeof ms !== 'number') return null;
  const totalSeconds = Math.max(Math.ceil(ms / 1000), 0);
  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${totalSeconds}s`;
};

const tipCardStyle: CSSProperties = {
  backgroundColor: '#0C142C',
  borderRadius: 16,
  padding: '12px 16px',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const tipTitleStyle: CSSProperties = {
  fontSize: 12,
  textTransform: 'uppercase',
  color: '#CBD5F5',
};

const tipBodyStyle: CSSProperties = {
  color: '#E5E7EB',
  lineHeight: 1.4,
};

export default function ContextPanel({
  message,
  onTimerStart,
  onTimerPause,
  onTimerReset,
}: ContextPanelProps) {
  const mood = useMoodDetection();
  const { stats, updateStats } = useRealtimeState();
  const lastDetectionTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (mood.status !== 'ready' || !mood.top) {
      return;
    }

    const normalized = mood.top.label.trim().toLowerCase();
    const roundedScore = Number((mood.top.score ?? 0).toFixed(3));
    const detectionTimestamp = mood.updatedAt ?? Date.now();

    if (lastDetectionTimestampRef.current === detectionTimestamp) {
      return;
    }

    lastDetectionTimestampRef.current = detectionTimestamp;

    updateStats({
      mood: normalized,
      focusLevel: Math.max(0, Math.round((mood.top.score ?? 0) * 10)),
      confidence: roundedScore,
    });
  }, [mood, updateStats]);

  const tipText = useMemo(() => {
    if (!stats) {
      return 'Tips appear once enough data is collected.';
    }
    if (stats.dailyTip && stats.dailyTip.trim().length > 0) {
      return stats.dailyTip.trim();
    }
    return 'We will share focused advice as soon as fresh mood data arrives.';
  }, [stats]);

  const isError = mood.status === 'error';
  const nextRunCountdown = formatDuration(mood.nextRunInMs);

  return (
    <aside className="context-panel" aria-label="Pet status and options">
      <div className="context-card">
        <StudyTimerPanel
          onStart={onTimerStart}
          onPause={onTimerPause}
          onReset={onTimerReset}
        />

        <div className="context-section">
          {message ? <p className="context-message">{message}</p> : null}

          <div className={`context-mood${isError ? ' is-error' : ''}`}>
            <span className="context-mood__title">Your mood</span>

            {mood.status === 'loading' || mood.status === 'idle' ? (
              <span className="context-mood__status">Checking mood...</span>
            ) : null}

            {mood.status === 'ready' && mood.top ? (
              <div className="context-mood__summary">
                <span className="context-mood__value">{mood.top.label}</span>
                <span className="context-mood__score">
                  {formatPercent(mood.top.score)}
                </span>
              </div>
            ) : null}

            {mood.status === 'error' && mood.error ? (
              <span className="context-mood__status">{mood.error}</span>
            ) : null}

            <span className="context-mood__meta">
              {nextRunCountdown
                ? `Next check in ${nextRunCountdown}`
                : 'Automatic mood checks are running.'}
              {mood.status === 'ready' && mood.updatedAt
                ? ` · Last check ${formatTime(mood.updatedAt)}`
                : ''}
            </span>
          </div>
        </div>

        <div className="context-section">
          <div className="context-tip" style={tipCardStyle}>
            <span style={tipTitleStyle}>Tip of the day</span>
            <span style={tipBodyStyle}>{tipText}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
