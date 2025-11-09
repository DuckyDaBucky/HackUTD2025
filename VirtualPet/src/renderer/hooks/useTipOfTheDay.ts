import { useEffect, useMemo, useRef, useState } from 'react';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

type TipContext = {
  mood: string;
  confidence?: number;
  roomTemperature?: number;
  noise?: number;
  focus?: number;
  timerMethod?: string;
  isStudent?: boolean;
};

type TipStatus = 'idle' | 'loading' | 'ready' | 'error';

type TipResult = {
  tip: string | null;
  status: TipStatus;
  error?: string;
};

const parser = new StringOutputParser();

const template = PromptTemplate.fromTemplate(
  `You are a concise wellness coach. Using the provided context, offer one short actionable tip (maximum 2 sentences) that helps the user study or relax.
Context:
- Mood: {mood}
- Confidence: {confidence}
- Room Temperature (C): {roomTemperature}
- Noise Level: {noise}
- Focus Score (0-10): {focus}
- Preferred Study Timer Method: {timerMethod}
- Is Student Mode Enabled: {isStudent}

Respond with friendly, clear guidance and no additional commentary.`,
);

export function useTipOfTheDay(context: TipContext | null): TipResult {
  const [tip, setTip] = useState<string | null>(null);
  const [status, setStatus] = useState<TipStatus>('idle');
  const [error, setError] = useState<string | undefined>(undefined);
  const lastSignatureRef = useRef<string | null>(null);

  const signature = useMemo(() => {
    if (!context) {
      return null;
    }
    const dayKey = new Date().toDateString();
    return JSON.stringify({ dayKey, ...context });
  }, [context]);

  useEffect(() => {
    if (!signature) {
      setStatus('idle');
      setTip(null);
      setError(undefined);
      lastSignatureRef.current = null;
      return;
    }

    if (lastSignatureRef.current === signature && tip) {
      return;
    }

    const env =
      typeof process !== 'undefined' && process?.env ? process.env : undefined;

    const globalEnv =
      typeof window !== 'undefined' && (window as any)?.env
        ? (window as any).env
        : undefined;

    const apiKey =
      env?.GOOGLE_API_KEY ||
      env?.GEMINI_API_KEY ||
      globalEnv?.GOOGLE_API_KEY ||
      globalEnv?.GEMINI_API_KEY ||
      '';

    if (!apiKey) {
      setStatus('error');
      setTip(null);
      setError('Set GOOGLE_API_KEY to see daily tips.');
      lastSignatureRef.current = signature;
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setError(undefined);

    const model = new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-1.5-flash-latest',
      temperature: 0.35,
      maxOutputTokens: 128,
    });

    const invokeTip = async () => {
      try {
        const response = await template
          .pipe(model)
          .pipe(parser)
          .invoke({
            mood: context?.mood ?? 'unknown',
            confidence: context?.confidence?.toFixed(2) ?? 'unknown',
            roomTemperature: context?.roomTemperature ?? 'unknown',
            noise:
              typeof context?.noise === 'number'
                ? context.noise.toFixed(2)
                : 'unknown',
            focus: context?.focus ?? 'unknown',
            timerMethod: context?.timerMethod ?? 'pomodoro',
            isStudent: context?.isStudent ? 'yes' : 'no',
          });

        if (!cancelled) {
          lastSignatureRef.current = signature;
          setTip(response.trim());
          setStatus('ready');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[tip-of-day]', err);
          setStatus('error');
          setTip(null);
          setError('Unable to generate a tip right now.');
        }
      }
    };

    void invokeTip();

    return () => {
      cancelled = true;
    };
  }, [context, signature, tip]);

  return { tip, status, error };
}

export type { TipContext };

