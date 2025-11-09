import { useEffect, useRef, useState } from 'react';
import roomBackdrop from '../../../assets/CatRoomPaid/ExampleRooms/ExampleRoom 2.png';
import ContextPanel, { type ContextOption } from './ContextPanel';
import PetStage from './PetStage';
import { usePetAnimation } from '../hooks/usePetAnimation';
import {
  getPetAnimation,
  type PetAnimationDefinition,
} from '../constants/petAnimations';

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
  const isPetting = petOverride !== null;

  const displayedAnimation = petOverride ?? activeAnimation;

  const sprite = {
    src: displayedAnimation.animationSrc,
    frameWidth: 32,
    frameHeight: 32,
    fps: displayedAnimation.fps ?? 8,
    scale: 7,
    alt: `Pet is ${displayedAnimation.state.replace('-', ' ')}`,
  } as const;

  const contextOptions: [ContextOption, ContextOption] = [
    {
      label: currentSet.options[0].label,
      variant: currentSet.options[0].variant,
      onSelect: () => togglePetAnimation(currentSet.options[0].targetState),
    },
    {
      label: currentSet.options[1].label,
      variant: currentSet.options[1].variant,
      onSelect: () => togglePetAnimation(currentSet.options[1].targetState),
    },
  ];

  const displayMessage = isPetting
    ? 'The pet looks a bit shy but loves the attention!'
    : currentSet.message;

  const handlePet = () => {
    if (revertTimerRef.current) {
      clearTimeout(revertTimerRef.current);
    }

    setPetOverride(getPetAnimation('shy'));

    revertTimerRef.current = setTimeout(() => {
      setPetOverride(null);
      revertTimerRef.current = null;
    }, 1200);
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

  return (
    <div className="app-root">
      <div className="pet-shell">
        <main className="pet-layout">
          <PetStage
            sprite={sprite}
            backgroundSrc={roomBackdrop}
            onPet={handlePet}
            isPetting={isPetting}
          />

          <ContextPanel message={displayMessage} options={contextOptions} />
        </main>
      </div>
    </div>
  );
}

export { optionSets };
