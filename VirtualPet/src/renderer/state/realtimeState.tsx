import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_PET_STATE,
  petAnimations,
  type PetAnimationState,
} from '../constants/petAnimations';

type TimerMethod = 'pomodoro' | 'custom' | 'focus';

type CatState = {
  mood: PetAnimationState;
  energy: number;
  hunger: number;
  lastUpdated: string;
};

type UserPreferences = {
  isStudent: boolean;
  theme: string;
  timerMethod: TimerMethod;
  lastUpdated: string;
};

type UserStats = {
  mood: string;
  roomTemperature: number;
  focusLevel: number;
  confidenceMap: Partial<Record<PetAnimationState, number>> | null;
  lastUpdated: string;
};

type CatUpdatePayload = Partial<{
  mood: PetAnimationState;
  energy: number;
  hunger: number;
}>;

type PreferencesUpdatePayload = Partial<{
  is_student: boolean;
  theme: string;
  timer_method: TimerMethod;
}>;

type StatsUpdatePayload = Partial<{
  mood: string;
  room_temperature: number;
  focus_level: number;
  confidence: number;
}>;

type ClientMessage =
  | { type: 'ping' }
  | { type: 'cat:get_state' }
  | { type: 'cat:update_state'; payload: CatUpdatePayload }
  | { type: 'prefs:get' }
  | { type: 'prefs:update'; payload: PreferencesUpdatePayload }
  | { type: 'stats:get' }
  | { type: 'stats:update'; payload: StatsUpdatePayload };

type RealtimeContextValue = {
  status: 'connecting' | 'connected' | 'disconnected';
  cat: CatState | null;
  preferences: UserPreferences | null;
  stats: UserStats | null;
  error: string | null;
  refreshAll: () => void;
  updateCat: (patch: CatUpdatePayload) => void;
  updatePreferences: (
    patch: Partial<{
      isStudent?: boolean;
      theme?: string;
      timerMethod?: TimerMethod;
    }>,
  ) => void;
  updateStats: (
    patch: Partial<{
      mood?: string;
      roomTemperature?: number;
      focusLevel?: number;
      confidence?: number;
    }>,
  ) => void;
};

const DEFAULT_WS_URL = (() => {
  if (
    typeof process !== 'undefined' &&
    typeof process.env?.WS_URL === 'string' &&
    process.env.WS_URL.length > 0
  ) {
    return process.env.WS_URL;
  }

  if (
    typeof window !== 'undefined' &&
    typeof (window as { WS_URL?: string }).WS_URL === 'string' &&
    (window as { WS_URL?: string }).WS_URL!.length > 0
  ) {
    return (window as { WS_URL?: string }).WS_URL as string;
  }

  return 'ws://localhost:4000';
})();

const VALID_CAT_STATES = new Set<PetAnimationState>(
  petAnimations.map((entry) => entry.state) as PetAnimationState[],
);

function isPetState(value: unknown): value is PetAnimationState {
  return VALID_CAT_STATES.has(value as PetAnimationState);
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(
  undefined,
);

function toCatState(payload: any): CatState {
  const candidate = payload?.mood;
  const mood = VALID_CAT_STATES.has(candidate)
    ? (candidate as PetAnimationState)
    : DEFAULT_PET_STATE;

  const energy = Number.isFinite(payload?.energy)
    ? Number(payload.energy)
    : 100;
  const hunger = Number.isFinite(payload?.hunger) ? Number(payload.hunger) : 0;
  const lastUpdated =
    typeof payload?.last_updated === 'string'
      ? payload.last_updated
      : new Date().toISOString();

  return { mood, energy, hunger, lastUpdated };
}

function toUserPreferences(payload: any): UserPreferences {
  const isStudent =
    payload?.is_student === 1 || payload?.is_student === true
      ? true
      : Boolean(payload?.isStudent);

  const theme =
    typeof payload?.theme === 'string' && payload.theme.length > 0
      ? payload.theme
      : 'light';

  const timerMethod: TimerMethod =
    payload?.timer_method === 'custom' || payload?.timer_method === 'focus'
      ? payload.timer_method
      : 'pomodoro';

  const lastUpdated =
    typeof payload?.last_updated === 'string'
      ? payload.last_updated
      : new Date().toISOString();

  return { isStudent, theme, timerMethod, lastUpdated };
}

function toUserStats(payload: any): UserStats {
  const mood =
    typeof payload?.mood === 'string' && payload.mood.length > 0
      ? payload.mood
      : 'ok';

  let roomTemperature: number;
  if (Number.isFinite(payload?.room_temperature)) {
    roomTemperature = Number(payload.room_temperature);
  } else if (Number.isFinite(payload?.roomTemperature)) {
    roomTemperature = Number(payload.roomTemperature);
  } else {
    roomTemperature = 22;
  }

  let focusLevel: number;
  if (Number.isFinite(payload?.focus_level)) {
    focusLevel = Number(payload.focus_level);
  } else if (Number.isFinite(payload?.focusLevel)) {
    focusLevel = Number(payload.focusLevel);
  } else {
    focusLevel = 5;
  }

  const lastUpdated =
    typeof payload?.last_updated === 'string'
      ? payload.last_updated
      : new Date().toISOString();

  const confidenceMap: Partial<Record<PetAnimationState, number>> | null =
    payload && typeof payload === 'object' && payload.confidence_map
      ? Object.entries(payload.confidence_map).reduce(
          (acc, [key, value]) => {
            if (isPetState(key) && typeof value === 'number') {
              acc[key] = value;
            }
            return acc;
          },
          {} as Partial<Record<PetAnimationState, number>>,
        )
      : null;

  return { mood, roomTemperature, focusLevel, confidenceMap, lastUpdated };
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] =
    useState<RealtimeContextValue['status']>('connecting');
  const [cat, setCat] = useState<CatState | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }
    socket.send(JSON.stringify(message));
  }, []);

  const refreshAll = useCallback(() => {
    sendMessage({ type: 'cat:get_state' });
    sendMessage({ type: 'prefs:get' });
    sendMessage({ type: 'stats:get' });
  }, [sendMessage]);

  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function handleOpen() {
      if (!isMounted) return;
      setStatus('connected');
      setError(null);
      refreshAll();
    }

    function handleMessage(event: MessageEvent) {
      if (!isMounted) return;
      try {
        const message = JSON.parse(event.data);
        switch (message?.type) {
          case 'cat:state':
            setCat(toCatState(message.payload));
            break;
          case 'prefs:state':
            setPreferences(toUserPreferences(message.payload));
            break;
          case 'stats:state':
            setStats(toUserStats(message.payload));
            break;
          case 'error':
            setError(
              typeof message.payload === 'string'
                ? message.payload
                : 'Server error',
            );
            break;
          default:
            break;
        }
      } catch {
        // swallow invalid JSON
      }
    }

    function handleError() {
      if (!isMounted) return;
      setError('WebSocket connection error');
    }

    function connect() {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      setStatus('connecting');

      const socket = new WebSocket(DEFAULT_WS_URL);
      socketRef.current = socket;

      const handleClose = () => {
        if (!isMounted) return;
        setStatus('disconnected');
        reconnectTimer = setTimeout(() => connect(), 1500);
      };

      socket.addEventListener('open', handleOpen);
      socket.addEventListener('message', handleMessage);
      socket.addEventListener('error', handleError);
      socket.addEventListener('close', handleClose);
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [refreshAll]);

  const updateCat = useCallback<RealtimeContextValue['updateCat']>(
    (patch) => {
      const payload: CatUpdatePayload = {};

      if (patch.mood) {
        payload.mood = VALID_CAT_STATES.has(patch.mood)
          ? patch.mood
          : DEFAULT_PET_STATE;
      }
      if (typeof patch.energy === 'number') {
        payload.energy = patch.energy;
      }
      if (typeof patch.hunger === 'number') {
        payload.hunger = patch.hunger;
      }

      sendMessage({ type: 'cat:update_state', payload });
    },
    [sendMessage],
  );

  const updatePreferences = useCallback<
    RealtimeContextValue['updatePreferences']
  >(
    (patch) => {
      const payload: PreferencesUpdatePayload = {};
      if (patch.isStudent !== undefined) {
        payload.is_student = patch.isStudent;
      }
      if (patch.theme !== undefined) {
        payload.theme = patch.theme;
      }
      if (patch.timerMethod !== undefined) {
        payload.timer_method = patch.timerMethod;
      }
      sendMessage({ type: 'prefs:update', payload });
    },
    [sendMessage],
  );

  const updateStats = useCallback<RealtimeContextValue['updateStats']>(
    (patch) => {
      const payload: StatsUpdatePayload = {};
      if (patch.mood !== undefined) {
        payload.mood = patch.mood;
      }
      if (patch.roomTemperature !== undefined) {
        payload.room_temperature = patch.roomTemperature;
      }
      if (patch.focusLevel !== undefined) {
        payload.focus_level = patch.focusLevel;
      }
      if (patch.confidence !== undefined) {
        payload.confidence = patch.confidence;
      }
      sendMessage({ type: 'stats:update', payload });
    },
    [sendMessage],
  );

  const contextValue = useMemo<RealtimeContextValue>(
    () => ({
      status,
      cat,
      preferences,
      stats,
      error,
      refreshAll,
      updateCat,
      updatePreferences,
      updateStats,
    }),
    [
      status,
      cat,
      preferences,
      stats,
      error,
      refreshAll,
      updateCat,
      updatePreferences,
      updateStats,
    ],
  );

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeState(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeState must be used within a RealtimeProvider');
  }
  return context;
}
