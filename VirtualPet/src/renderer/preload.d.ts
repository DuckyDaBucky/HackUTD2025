import { ElectronHandler, EmotionAPI } from '../main/preload';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
    emotionAPI: EmotionAPI;
  }
}

export {};
