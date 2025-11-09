import { useEffect, useRef, useState } from 'react';
import type { EmotionScore } from '../../shared/emotion';

type MoodStatus = 'idle' | 'loading' | 'ready' | 'error';

type MoodState = {
  status: MoodStatus;
  top?: EmotionScore;
  scores?: EmotionScore[];
  updatedAt?: number;
  nextRunInMs?: number;
  error?: string;
};

const DEFAULT_SIZE = 224;
const DEFAULT_INTERVAL_MS = 20000;

const captureConstraints: MediaStreamConstraints = {
  video: {
    width: { ideal: 320 },
    height: { ideal: 240 },
    facingMode: 'user',
  },
};

const clampMs = (value?: number) => {
  if (typeof value !== 'number') return undefined;
  return Math.max(value, 0);
};

export default function useMoodDetection(
  intervalMs = DEFAULT_INTERVAL_MS,
): MoodState {
  const [state, setState] = useState<MoodState>({ status: 'idle' });
  const detectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextRunAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let detecting = false;

    const video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setState({ status: 'error', error: 'Unable to prepare camera capture.' });
      return undefined;
    }

    const clearTimers = () => {
      if (detectTimerRef.current) {
        clearInterval(detectTimerRef.current);
        detectTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };

    const remainingMs = (): number | undefined =>
      nextRunAtRef.current != null
        ? nextRunAtRef.current - Date.now()
        : undefined;

    const updateCountdown = () => {
      setState((prev) => ({
        ...prev,
        nextRunInMs: clampMs(remainingMs()),
      }));
    };

    const stop = () => {
      clearTimers();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      video.pause();
      video.srcObject = null;
    };

    const detectMood = async () => {
      if (detecting || cancelled) return;
      detecting = true;
      nextRunAtRef.current = Date.now() + intervalMs;
      updateCountdown();

      setState((prev) => ({
        ...prev,
        status: prev.top ? 'ready' : 'loading',
        error: undefined,
      }));

      try {
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          detecting = false;
          return;
        }

        const width = video.videoWidth || DEFAULT_SIZE;
        const height = video.videoHeight || DEFAULT_SIZE;

        if (width === 0 || height === 0) {
          detecting = false;
          return;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        const response = await window.emotionAPI.detectEmotion(dataUrl);

        if (!response.ok) {
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: response.error,
            nextRunInMs: clampMs(remainingMs()),
          }));
        } else {
          setState({
            status: 'ready',
            top: response.top,
            scores: response.all.slice(0, 4),
            updatedAt: Date.now(),
            nextRunInMs: clampMs(remainingMs()),
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Mood detection failed.';
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: message,
          nextRunInMs: clampMs(remainingMs()),
        }));
      } finally {
        detecting = false;
      }
    };

    const init = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState({
          status: 'error',
          error: 'Camera access is unavailable.',
        });
        return;
      }

      setState({ status: 'loading' });

      try {
        stream = await navigator.mediaDevices.getUserMedia(captureConstraints);
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        video.srcObject = stream;
        await video.play().catch(() => undefined);

        await detectMood();
        detectTimerRef.current = setInterval(detectMood, intervalMs);
        if (!countdownTimerRef.current) {
          countdownTimerRef.current = setInterval(updateCountdown, 1000);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to access camera.';
        setState({
          status: 'error',
          error: message,
        });
      }
    };

    init().catch(() => undefined);

    return () => {
      cancelled = true;
      stop();
    };
  }, [intervalMs]);

  return state;
}
