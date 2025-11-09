export type EmotionScore = {
  label: string;
  score: number;
};

export type EmotionDetectionResponse =
  | { ok: true; top: EmotionScore; all: EmotionScore[] }
  | { ok: false; error: string };
