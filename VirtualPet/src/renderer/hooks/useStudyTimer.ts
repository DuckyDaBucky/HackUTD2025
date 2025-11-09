import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type TimerMode = 'pomodoro' | 'custom' | 'focus';
type TimerPhase = 'work' | 'short-break' | 'long-break' | 'custom-break' | 'focus';
type TimerStatus = 'idle' | 'running' | 'paused';

export type CustomDurations = {
  work: number;
  break: number;
};

export type FocusDuration = {
  duration: number;
};

type TimerSettings = {
  mode: TimerMode;
  custom: CustomDurations;
  focus: FocusDuration;
};

type StudyTimerState = {
  mode: TimerMode;
  phase: TimerPhase;
  status: TimerStatus;
  remainingMs: number;
  totalMs: number;
  progress: number;
  completedWorkSessions: number;
};

export type StudyTimer = StudyTimerState & {
  label: string;
  start(): void;
  pause(): void;
  reset(): void;
  switchMode(mode: TimerMode): void;
  updateCustomDurations(next: CustomDurations): void;
  updateFocusDuration(next: FocusDuration): void;
  settings: TimerSettings;
};

const STORAGE_KEY = 'virtualpet_timer_settings';

const DEFAULTS = {
  mode: 'pomodoro' as TimerMode,
  pomodoro: {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    roundsBeforeLong: 4,
  },
  custom: {
    work: 30,
    break: 10,
  },
  focus: {
    duration: 60,
  },
};

const clampMinutes = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return Math.min(Math.max(rounded, 1), 8 * 60);
};

const minutesToMs = (minutes: number) => minutes * 60 * 1000;

const readSettings = (): TimerSettings => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        mode: DEFAULTS.mode,
        custom: { ...DEFAULTS.custom },
        focus: { ...DEFAULTS.focus },
      };
    }
    const parsed = JSON.parse(raw) as Partial<TimerSettings>;
    return {
      mode: parsed.mode ?? DEFAULTS.mode,
      custom: {
        work: clampMinutes(parsed.custom?.work ?? DEFAULTS.custom.work, DEFAULTS.custom.work),
        break: clampMinutes(parsed.custom?.break ?? DEFAULTS.custom.break, DEFAULTS.custom.break),
      },
      focus: {
        duration: clampMinutes(
          parsed.focus?.duration ?? DEFAULTS.focus.duration,
          DEFAULTS.focus.duration,
        ),
      },
    };
  } catch (error) {
    console.warn('[timer] Failed to read saved timer settings', error);
    return {
      mode: DEFAULTS.mode,
      custom: { ...DEFAULTS.custom },
      focus: { ...DEFAULTS.focus },
    };
  }
};

const getPhaseLabel = (phase: TimerPhase, mode: TimerMode) => {
  switch (phase) {
    case 'work':
      return mode === 'focus' ? 'Focus' : 'Work';
    case 'short-break':
      return 'Short Break';
    case 'long-break':
      return 'Long Break';
    case 'custom-break':
      return 'Break';
    case 'focus':
    default:
      return 'Focus';
  }
};

export const useStudyTimer = (): StudyTimer => {
  const persisted = useMemo(() => readSettings(), []);

  const [mode, setMode] = useState<TimerMode>(persisted.mode);
  const [customDurations, setCustomDurations] = useState<CustomDurations>(persisted.custom);
  const [focusDuration, setFocusDuration] = useState<FocusDuration>(persisted.focus);

  const [phase, setPhase] = useState<TimerPhase>(mode === 'focus' ? 'focus' : 'work');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0);

  const getDurationForPhase = useCallback(
    (nextPhase: TimerPhase, sessions = completedWorkSessions) => {
      if (mode === 'pomodoro') {
        if (nextPhase === 'work') return minutesToMs(DEFAULTS.pomodoro.work);
        if (nextPhase === 'long-break') return minutesToMs(DEFAULTS.pomodoro.longBreak);
        return minutesToMs(DEFAULTS.pomodoro.shortBreak);
      }
      if (mode === 'custom') {
        if (nextPhase === 'custom-break') return minutesToMs(customDurations.break);
        return minutesToMs(customDurations.work);
      }
      return minutesToMs(focusDuration.duration);
    },
    [completedWorkSessions, customDurations.break, customDurations.work, focusDuration.duration, mode],
  );

  const [totalMs, setTotalMs] = useState(() => getDurationForPhase(phase));
  const [remainingMs, setRemainingMs] = useState(() => getDurationForPhase(phase));

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef = useRef(mode);
  const phaseRef = useRef(phase);

  const clearIntervalRef = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const schedulePhase = useCallback(
    (nextPhase: TimerPhase, autoStart = true) => {
      const duration = getDurationForPhase(nextPhase);
      setPhase(nextPhase);
      setTotalMs(duration);
      setRemainingMs(duration);
      setStatus(autoStart ? 'running' : 'idle');
    },
    [getDurationForPhase],
  );

  const handlePhaseCompletion = useCallback(() => {
    const activeMode = modeRef.current;
    const activePhase = phaseRef.current;

    if (activeMode === 'focus') {
      setStatus('idle');
      const duration = getDurationForPhase('focus');
      setTotalMs(duration);
      setRemainingMs(duration);
      return;
    }

    if (activeMode === 'custom') {
      if (activePhase === 'work') {
        schedulePhase('custom-break');
      } else {
        schedulePhase('work');
      }
      return;
    }

    if (activePhase === 'work') {
      const nextCount = completedWorkSessions + 1;
      setCompletedWorkSessions(nextCount);
      const needsLongBreak =
        nextCount % DEFAULTS.pomodoro.roundsBeforeLong === 0 && nextCount !== 0;
      schedulePhase(needsLongBreak ? 'long-break' : 'short-break');
      return;
    }

    if (activePhase === 'long-break') {
      setCompletedWorkSessions(0);
    }
    schedulePhase('work');
  }, [completedWorkSessions, getDurationForPhase, schedulePhase]);

  useEffect(() => {
    if (status !== 'running') {
      clearIntervalRef();
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearIntervalRef();
          handlePhaseCompletion();
          return 0;
        }
        return next;
      });
    }, 1000);

    return clearIntervalRef;
  }, [handlePhaseCompletion, status]);

  useEffect(() => {
    return clearIntervalRef;
  }, []);

  useEffect(() => {
    const payload: TimerSettings = {
      mode,
      custom: customDurations,
      focus: focusDuration,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [customDurations, focusDuration, mode]);

  const start = useCallback(() => {
    setStatus((prev) => {
      if (prev === 'running') return prev;
      if (remainingMs <= 0) {
        const duration = getDurationForPhase(phase);
        setRemainingMs(duration);
        setTotalMs(duration);
      }
      return 'running';
    });
  }, [getDurationForPhase, phase, remainingMs]);

  const pause = useCallback(() => {
    clearIntervalRef();
    setStatus((prev) => (prev === 'running' ? 'paused' : prev));
  }, []);

  const reset = useCallback(() => {
    clearIntervalRef();
    const initialPhase = mode === 'focus' ? 'focus' : 'work';
    setPhase(initialPhase);
    const duration = getDurationForPhase(initialPhase);
    setTotalMs(duration);
    setRemainingMs(duration);
    setStatus('idle');
    if (mode === 'pomodoro') {
      setCompletedWorkSessions(0);
    }
  }, [getDurationForPhase, mode]);

  const switchMode = useCallback(
    (nextMode: TimerMode) => {
      if (nextMode === mode) return;
      clearIntervalRef();
      setMode(nextMode);
      const initialPhase = nextMode === 'focus' ? 'focus' : 'work';
      setPhase(initialPhase);
      const duration =
        nextMode === 'pomodoro'
          ? minutesToMs(DEFAULTS.pomodoro.work)
          : nextMode === 'custom'
          ? minutesToMs(customDurations.work)
          : minutesToMs(focusDuration.duration);
      setTotalMs(duration);
      setRemainingMs(duration);
      setStatus('idle');
      setCompletedWorkSessions(0);
    },
    [customDurations.work, focusDuration.duration, mode],
  );

  const updateCustomDurations = useCallback(
    (next: CustomDurations) => {
      const nextDurations: CustomDurations = {
        work: clampMinutes(next.work, customDurations.work),
        break: clampMinutes(next.break, customDurations.break),
      };
      setCustomDurations(nextDurations);
      if (mode === 'custom') {
        clearIntervalRef();
        setPhase('work');
        const duration = minutesToMs(nextDurations.work);
        setTotalMs(duration);
        setRemainingMs(duration);
        setStatus('idle');
      }
    },
    [customDurations.break, customDurations.work, mode],
  );

  const updateFocusDuration = useCallback(
    (next: FocusDuration) => {
      const clamped = clampMinutes(next.duration, focusDuration.duration);
      setFocusDuration({ duration: clamped });
      if (mode === 'focus') {
        clearIntervalRef();
        setPhase('focus');
        const duration = minutesToMs(clamped);
        setTotalMs(duration);
        setRemainingMs(duration);
        setStatus('idle');
      }
    },
    [focusDuration.duration, mode],
  );

  const progress = useMemo(() => {
    if (totalMs <= 0) return 0;
    const ratio = 1 - remainingMs / totalMs;
    if (!Number.isFinite(ratio)) return 0;
    return Math.min(Math.max(ratio, 0), 1);
  }, [remainingMs, totalMs]);

  const label = useMemo(() => getPhaseLabel(phase, mode), [mode, phase]);

  return {
    mode,
    phase,
    status,
    remainingMs,
    totalMs,
    progress,
    completedWorkSessions,
    label,
    start,
    pause,
    reset,
    switchMode,
    updateCustomDurations,
    updateFocusDuration,
    settings: {
      mode,
      custom: customDurations,
      focus: focusDuration,
    },
  };
};


