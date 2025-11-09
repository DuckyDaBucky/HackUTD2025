import { ipcMain } from 'electron';
import { Buffer } from 'buffer';
import type { EmotionDetectionResponse, EmotionScore } from '../shared/emotion';

const HF_MODEL_ID = 'prithivMLmods/Facial-Emotion-Detection-SigLIP2';
const HF_INFERENCE_BASE =
  process.env.HF_INFERENCE_URL ?? 'https://router.huggingface.co/hf-inference';
const HF_API_URL = `${HF_INFERENCE_BASE}/models/${HF_MODEL_ID}`;
const HF_TOKEN = process.env.HF_TOKEN ?? '';

if (!HF_TOKEN) {
  console.warn(
    '[emotion] HF_TOKEN is missing. Facial emotion detection will not work.',
  );
}

const CHANNEL = 'emotion:detect';

const parsePayload = (payload: EmotionScore[] | EmotionScore[][]) => {
  if (Array.isArray(payload[0])) {
    return [...(payload as EmotionScore[][])[0]];
  }
  return [...(payload as EmotionScore[])];
};

ipcMain.handle(
  CHANNEL,
  async (_event, imageDataUrl: string): Promise<EmotionDetectionResponse> => {
    if (!HF_TOKEN) {
      return {
        ok: false,
        error: 'Missing HF_TOKEN environment variable.',
      };
    }

    try {
      if (typeof imageDataUrl !== 'string') {
        throw new Error('Image payload must be a data URL string.');
      }

      const base64 = imageDataUrl.split(',')[1];
      if (!base64) {
        throw new Error('Invalid image data URL.');
      }

      const body = Buffer.from(base64, 'base64');

      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
        body,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`HF API error ${response.status}: ${message}`);
      }

      const payload = (await response.json()) as
        | EmotionScore[]
        | EmotionScore[][];

      const list = parsePayload(payload).sort((a, b) => b.score - a.score);

      if (list.length === 0) {
        throw new Error('No predictions returned.');
      }

      return {
        ok: true,
        top: list[0],
        all: list,
      };
    } catch (error) {
      console.error('emotion:detect failed', error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred.';
      return {
        ok: false,
        error: message,
      };
    }
  },
);
