import roomBackdrop from '../../../assets/CatRoomPaid/Rooms/Room3.png';
import ContextPanel, { type ContextOption } from './ContextPanel';
import HardwareStrip from './HardwareStrip';
import PetStage from './PetStage';
import { usePetAnimation } from '../hooks/usePetAnimation';

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
  const { animation: activeAnimation, togglePetAnimation } = usePetAnimation();
  const sprite = {
    src: activeAnimation.animationSrc,
    frameWidth: 32,
    frameHeight: 32,
    fps: activeAnimation.fps ?? 8,
    scale: 7,
    alt: `Pet is ${activeAnimation.state.replace('-', ' ')}`,
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

  return (
    <div className="app-root">
      <div className="pet-shell">
        <main className="pet-layout">
          <PetStage sprite={sprite} backgroundSrc={roomBackdrop} />

          <ContextPanel message={currentSet.message} options={contextOptions} />
        </main>

        <HardwareStrip />
      </div>
    </div>
  );
}

export { optionSets };
