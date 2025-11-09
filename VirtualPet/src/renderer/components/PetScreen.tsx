import { useEffect, useMemo, useRef, useState } from 'react';
import baseRoomBackdrop from '../../../assets/CatRoomPaid/ExampleRooms/ExampleRoom 2.png';
import ContextPanel from './ContextPanel';
import PetStage from './PetStage';
import ClockDisplay from './ClockDisplay';
import {
  DEFAULT_PET_STATE,
  getPetAnimation,
  type PetAnimationDefinition,
  type PetAnimationState,
} from '../constants/petAnimations';
import { useRealtimeState } from '../state/realtimeState';
// import catSleepingBackdrop from '../../../assets/CatRoomPaid/CatSleeping.png';

type OptionTemplate = {
  label: string;
  variant?: 'primary' | 'secondary';
  targetState?: PetAnimationState;
};

export type OptionSet = {
  message: string;
  options: [OptionTemplate, OptionTemplate];
};

const optionSets: OptionSet[] = [
  {
    message: "It's time to stretch!",
    options: [
      { label: 'Take a break', variant: 'primary', targetState: 'excited' },
      { label: 'Keep focus', variant: 'secondary', targetState: 'waiting' },
    ],
  },
  {
    message: 'Room comfort looks good.',
    options: [
      { label: 'Yay', variant: 'primary', targetState: 'idle' },
      { label: 'Nice', variant: 'secondary', targetState: 'idle-alt' },
    ],
  },
  {
    message: 'Hydration check?',
    options: [
      { label: 'Sip water', variant: 'primary', targetState: 'surprised' },
      { label: 'Remind me later', variant: 'secondary', targetState: 'sleepy' },
    ],
  },
];

export default function PetScreen() {
  const currentSet = optionSets[0];
  const revertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { cat, updateCat, status } = useRealtimeState();
  const [petOverride, setPetOverride] = useState<PetAnimationDefinition | null>(
    null,
  );

  const remoteMood = cat?.mood ?? DEFAULT_PET_STATE;
  const activeAnimation = useMemo(
    () => getPetAnimation(remoteMood),
    [remoteMood],
  );
  const isSleeping = ['sleep', 'sleeping', 'sleeping-alt'].includes(remoteMood);

  const isPetting = petOverride !== null;

  const displayedAnimation = petOverride ?? activeAnimation;

  const sprite = {
    src: displayedAnimation.animationSrc,
    frameWidth: 32,
    frameHeight: 32,
    fps: displayedAnimation.fps ?? 8,
    scale: isSleeping ? 8.5 : 7,
    alt: `Pet is ${displayedAnimation.state.replace('-', ' ')}`,
  } as const;

  const displayMessage = (() => {
    if (status !== 'connected') {
      return 'Connecting to your study buddy...';
    }

    if (isPetting) {
      return 'The pet looks a bit shy but loves the attention!';
    }

    if (isSleeping) {
      return 'Lights are low. The pet is snoozing peacefully.';
    }

    return currentSet.message;
  })();

  const handlePet = () => {
    if (isSleeping) return;

    if (revertTimerRef.current) {
      clearTimeout(revertTimerRef.current);
    }

    setPetOverride(getPetAnimation('shy'));

    revertTimerRef.current = setTimeout(() => {
      setPetOverride(null);
      revertTimerRef.current = null;
    }, 1200);
  };

  const handleToggleSleep = () => {
    if (revertTimerRef.current) {
      clearTimeout(revertTimerRef.current);
      revertTimerRef.current = null;
    }

    setPetOverride(null);

    if (isSleeping) {
      updateCat({ mood: DEFAULT_PET_STATE });
      return;
    }

    updateCat({ mood: 'sleeping' });
  };

  useEffect(() => {
    return () => {
      if (revertTimerRef.current) {
        clearTimeout(revertTimerRef.current);
        revertTimerRef.current = null;
        setPetOverride(null);
      }
    };
  }, []);

  const roomBackdrop = isSleeping ? baseRoomBackdrop : baseRoomBackdrop;
  const shellClassName = ['pet-shell'];
  if (isSleeping) {
    shellClassName.push('is-dark');
  }
  if (!isSleeping) {
    shellClassName.push('is-bright');
  }

  const layoutClassName = ['pet-layout'];
  if (isSleeping) {
    layoutClassName.push('sleep-focus');
  }

  const fallbackFocusState: PetAnimationState = 'waiting';
  const fallbackBreakState: PetAnimationState = 'excited';
  const focusState: PetAnimationState =
    currentSet.options[1].targetState ?? fallbackFocusState;
  const breakState: PetAnimationState =
    currentSet.options[0].targetState ?? fallbackBreakState;

  const handleTimerStart = () => {
    if (isSleeping) return;
    updateCat({ mood: focusState });
  };

  const handleTimerPause = () => {
    if (isSleeping) return;
    updateCat({ mood: breakState });
  };

  const handleTimerReset = () => {
    if (isSleeping) return;
    updateCat({ mood: DEFAULT_PET_STATE });
  };

  return (
    <div className="app-root">
      <div className={shellClassName.join(' ')}>
        <ClockDisplay />
        <main className={layoutClassName.join(' ')}>
          <PetStage
            sprite={sprite}
            backgroundSrc={roomBackdrop}
            onPet={handlePet}
            isPetting={isPetting}
            disabled={isSleeping}
            hint={isSleeping ? '' : undefined}
            narration={displayMessage}
          />
          {isSleeping ? null : (
            <ContextPanel
              message=""
              onTimerStart={handleTimerStart}
              onTimerPause={handleTimerPause}
              onTimerReset={handleTimerReset}
            />
          )}
        </main>

        <button
          type="button"
          className={`sleep-toggle${isSleeping ? ' active' : ''}`}
          onClick={handleToggleSleep}
        >
          {isSleeping ? 'Turn Lights On' : 'Turn Lights Off'}
        </button>
      </div>
    </div>
  );
}

export { optionSets };
