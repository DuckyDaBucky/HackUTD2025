import idle from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Idle.png';
import idle2 from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Idle2.png';
import sleep from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Sleep.png';
import sleepy from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Sleepy.png';
import excited from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Excited.png';
import surprised from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Surprised.png';
import sad from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Sad.png';
import waiting from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Waiting.png';

export type PetAnimationDefinition = {
  state: string;
  animationSrc: string;
  fps?: number;
};

export const DEFAULT_PET_STATE = 'idle';

export const petAnimations: PetAnimationDefinition[] = [
  { state: 'idle', animationSrc: idle, fps: 8 },
  { state: 'idle-alt', animationSrc: idle2, fps: 8 },
  { state: 'sleep', animationSrc: sleep, fps: 4 },
  { state: 'sleepy', animationSrc: sleepy, fps: 6 },
  { state: 'excited', animationSrc: excited, fps: 10 },
  { state: 'surprised', animationSrc: surprised, fps: 9 },
  { state: 'sad', animationSrc: sad, fps: 6 },
  { state: 'waiting', animationSrc: waiting, fps: 7 },
];

export function getPetAnimation(state: string): PetAnimationDefinition {
  return petAnimations.find((entry) => entry.state === state) ?? petAnimations[0];
}
