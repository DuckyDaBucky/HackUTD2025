import { ElectronHandler, EmotionAPI } from '../main/preload';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
    emotionAPI: EmotionAPI;
    env: {
      GOOGLE_API_KEY?: string;
      GEMINI_API_KEY?: string;
    };
  }
}

export {};
