import idle from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Idle.png';
import idle2 from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Idle2.png';
import sleep from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Sleep.png';
import sleepy from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Sleepy.png';
import excited from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Excited.png';
import surprised from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Surprised.png';
import sad from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Sad.png';
import waiting from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Waiting.png';
import layDown from '../../../assets/CatPackPaid/Sprites/Classical/Individual/LayDown.png';
import shy from '../../../assets/CatPackPaid/Sprites/Classical/Individual/shy.png';
import dance from '../../../assets/CatPackPaid/Sprites/Classical/Individual/Dance.png';
import catSleeping from '../../../assets/CatRoomPaid/CatSleeping.png';

export const petAnimations = [
  { state: 'idle', animationSrc: idle, fps: 8 },
  { state: 'idle-alt', animationSrc: idle2, fps: 8 },
  { state: 'sleep', animationSrc: sleep, fps: 6 },
  { state: 'sleepy', animationSrc: sleepy, fps: 6 },
  { state: 'excited', animationSrc: excited, fps: 10 },
  { state: 'surprised', animationSrc: surprised, fps: 9 },
  { state: 'sad', animationSrc: sad, fps: 6 },
  { state: 'waiting', animationSrc: waiting, fps: 7 },
  { state: 'laydown', animationSrc: layDown, fps: 12 },
  { state: 'shy', animationSrc: shy, fps: 10 },
  { state: 'dance', animationSrc: dance, fps: 12 },
  { state: 'sleeping', animationSrc: sleep, fps: 6 },
  { state: 'sleeping-alt', animationSrc: catSleeping, fps: 4 },
] as const;

export type PetAnimationDefinition = (typeof petAnimations)[number];
export type PetAnimationState = PetAnimationDefinition['state'];

export const DEFAULT_PET_STATE: PetAnimationState = 'idle';

export function getPetAnimation(state: string): PetAnimationDefinition {
  return (
    petAnimations.find((entry) => entry.state === state) ?? petAnimations[0]
  );
}
