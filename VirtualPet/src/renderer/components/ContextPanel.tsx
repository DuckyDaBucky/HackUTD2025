import { useMoodDetection } from '../hooks/useMoodDetection';
export type ContextOption = {
  label: string;
  variant?: 'primary' | 'secondary';
  onSelect?: () => void;
};

export type ContextPanelProps = {
  message: string;
  options: [ContextOption, ContextOption];
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

export default function ContextPanel({ message, options }: ContextPanelProps) {
  const mood = useMoodDetection();
  const isError = mood.status === 'error';
  const nextRunCountdown = formatDuration(mood.nextRunInMs);

  return (
    <aside className="context-panel" aria-label="Pet status and options">
      <div className="context-card">
        <p className="context-message">{message}</p>

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

          {mood.status === 'ready' && mood.scores?.length ? (
            <ul className="context-mood__list">
              {mood.scores.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <span>{formatPercent(item.score)}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <span className="context-mood__meta">
            {nextRunCountdown
              ? `Next check in ${nextRunCountdown}`
              : 'Automatic mood checks are running in the background.'}
            {mood.status === 'ready' && mood.updatedAt
              ? ` • Last check ${formatTime(mood.updatedAt)}`
              : ''}
          </span>
        </div>

        <div className="option-buttons">
          {options.map(({ label, variant = 'primary', onSelect }) => (
            <button
              key={label}
              type="button"
              className={`option-button ${variant}`}
              onClick={onSelect}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
