import { useMemo, useEffect } from 'react';
import { useStudyTimer, type TimerMode } from '../hooks/useStudyTimer';
import { useRealtimeState } from '../state/realtimeState';

const MODE_LABELS: Record<TimerMode, string> = {
  pomodoro: 'Pomodoro',
  custom: 'Custom Session',
  focus: 'Continuous Focus',
};

const formatRemaining = (remainingMs: number) => {
  const totalSeconds = Math.max(Math.ceil(remainingMs / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatStatus = (status: 'idle' | 'running' | 'paused') => {
  switch (status) {
    case 'running':
      return 'Running';
    case 'paused':
      return 'Paused';
    default:
      return 'Ready';
  }
};

const ProgressBar = ({ value }: { value: number }) => {
  const percent = useMemo(() => {
    if (!Number.isFinite(value)) return 0;
    return Math.min(Math.max(Math.round(value * 100), 0), 100);
  }, [value]);

  return (
    <div
      className="study-timer__progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="study-timer__progress-bar" style={{ width: `${percent}%` }} />
    </div>
  );
};

type StudyTimerPanelProps = {
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
};

export default function StudyTimerPanel({
  onStart,
  onPause,
  onReset,
}: StudyTimerPanelProps) {
  const timer = useStudyTimer();
  const isRunning = timer.status === 'running';
  const { preferences } = useRealtimeState();
  const isStudent = preferences?.isStudent ?? false;

  useEffect(() => {
    const remoteMode = preferences?.timerMethod ?? 'pomodoro';
    if (remoteMode !== timer.mode) {
      timer.switchMode(remoteMode);
    }
  }, [preferences?.timerMethod, timer]);

  const handleStart = () => {
    if (isRunning) return;
    timer.start();
    onStart();
  };

  const handlePause = () => {
    if (!isRunning) return;
    timer.pause();
    onPause();
  };

  const handleReset = () => {
    timer.reset();
    onReset();
  };

  const phaseLabel = useMemo(() => {
    if (timer.phase === 'work') {
      return isStudent ? 'Study' : 'Work';
    }
    return timer.label;
  }, [isStudent, timer.label, timer.phase]);

  return (
    <section className="study-timer" aria-label="Study timer">
      <header className="study-timer__header">
        <div>
          <span className="study-timer__mode">{MODE_LABELS[timer.mode]}</span>
          <span className="study-timer__phase">{phaseLabel}</span>
        </div>
        <span className="study-timer__status">{formatStatus(timer.status)}</span>
      </header>

      <div className="study-timer__time">{formatRemaining(timer.remainingMs)}</div>
      <ProgressBar value={timer.progress} />

      <div className="study-timer__controls" role="group" aria-label="Timer controls">
        <button
          type="button"
          className="study-timer__button primary"
          onClick={handleStart}
          disabled={isRunning}
        >
          Start
        </button>
        <button
          type="button"
          className="study-timer__button"
          onClick={handlePause}
          disabled={!isRunning}
        >
          Pause
        </button>
        <button type="button" className="study-timer__button" onClick={handleReset}>
          Reset
        </button>
      </div>
    </section>
  );
}


