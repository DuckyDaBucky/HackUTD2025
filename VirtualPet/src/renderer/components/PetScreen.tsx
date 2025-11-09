import { useEffect, useRef, useState } from 'react';
import baseRoomBackdrop from '../../../assets/CatRoomPaid/ExampleRooms/ExampleRoom 2.png';
import ContextPanel, { type ContextOption } from './ContextPanel';
import PetStage from './PetStage';
import { usePetAnimation } from '../hooks/usePetAnimation';
import {
  getPetAnimation,
  type PetAnimationDefinition,
} from '../constants/petAnimations';
// import catSleepingBackdrop from '../../../assets/CatRoomPaid/CatSleeping.png';

type OptionTemplate = {
  label: string;
  variant?: 'primary' | 'secondary';
  targetState?: string;
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
  const { animation: activeAnimation, togglePetAnimation } = usePetAnimation();
  const [petOverride, setPetOverride] = useState<PetAnimationDefinition | null>(
    null,
  );
  const [isSleeping, setIsSleeping] = useState(false);

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

  const contextOptions: [ContextOption, ContextOption] = [
    {
      label: currentSet.options[0].label,
      variant: currentSet.options[0].variant,
      onSelect: () =>
        !isSleeping && togglePetAnimation(currentSet.options[0].targetState),
    },
    {
      label: currentSet.options[1].label,
      variant: currentSet.options[1].variant,
      onSelect: () =>
        !isSleeping && togglePetAnimation(currentSet.options[1].targetState),
    },
  ];

  const displayMessage = (() => {
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
    if (isSleeping) {
      setIsSleeping(false);
      setPetOverride(null);
      return;
    }

    if (revertTimerRef.current) {
      clearTimeout(revertTimerRef.current);
      revertTimerRef.current = null;
    }

    setPetOverride(null);
    setIsSleeping(true);
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

  useEffect(() => {
    if (isSleeping) {
      setPetOverride(getPetAnimation('sleeping'));
    }
  }, [isSleeping]);

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

  return (
    <div className="app-root">
      <div className={shellClassName.join(' ')}>
        <main className={layoutClassName.join(' ')}>
          <PetStage
            sprite={sprite}
            backgroundSrc={roomBackdrop}
            onPet={handlePet}
            isPetting={isPetting}
            disabled={isSleeping}
            hint={isSleeping ? '' : undefined}
          />
          {isSleeping ? null : (
            <ContextPanel message={displayMessage} options={contextOptions} />
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
