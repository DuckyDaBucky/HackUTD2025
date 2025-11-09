import { idle } from '@/assets/sprites/generated/idle';
import { idleAlt } from '@/assets/sprites/generated/idleAlt';
import { sleep } from '@/assets/sprites/generated/sleep';
import { sleepy } from '@/assets/sprites/generated/sleepy';
import { excited } from '@/assets/sprites/generated/excited';
import { surprised } from '@/assets/sprites/generated/surprised';
import { sad } from '@/assets/sprites/generated/sad';
import { waiting } from '@/assets/sprites/generated/waiting';
import { layDown } from '@/assets/sprites/generated/layDown';
import { shy } from '@/assets/sprites/generated/shy';
import { dance } from '@/assets/sprites/generated/dance';
import { sleepingAlt } from '@/assets/sprites/generated/sleepingAlt';
import type { SpriteSheetData } from '@/components/SpriteTypes';

export type PetAnimationState =
  | 'idle'
  | 'idle-alt'
  | 'sleep'
  | 'sleepy'
  | 'excited'
  | 'surprised'
  | 'sad'
  | 'waiting'
  | 'laydown'
  | 'shy'
  | 'dance'
  | 'sleeping'
  | 'sleeping-alt';

export type PetAnimationDefinition = {
  state: PetAnimationState;
  sheet: SpriteSheetData;
  fps: number;
};

export const petAnimations: readonly PetAnimationDefinition[] = [
  { state: 'idle', sheet: idle, fps: 8 },
  { state: 'idle-alt', sheet: idleAlt, fps: 8 },
  { state: 'sleep', sheet: sleep, fps: 6 },
  { state: 'sleepy', sheet: sleepy, fps: 6 },
  { state: 'excited', sheet: excited, fps: 10 },
  { state: 'surprised', sheet: surprised, fps: 9 },
  { state: 'sad', sheet: sad, fps: 6 },
  { state: 'waiting', sheet: waiting, fps: 7 },
  { state: 'laydown', sheet: layDown, fps: 12 },
  { state: 'shy', sheet: shy, fps: 10 },
  { state: 'dance', sheet: dance, fps: 12 },
  { state: 'sleeping', sheet: sleep, fps: 6 },
  { state: 'sleeping-alt', sheet: sleepingAlt, fps: 4 },
] as const;

export const DEFAULT_PET_STATE: PetAnimationState = 'idle';

export function getPetAnimation(state: PetAnimationState) {
  return (
    petAnimations.find((entry) => entry.state === state) ?? petAnimations[0]
  );
}


