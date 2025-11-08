import idleSheet from '../../assets/Idle.png';
import './App.css';
import SpriteAnimator from './components/SpriteAnimator';

type OptionPair = {
  message: string;
  primary: string;
  secondary: string;
};

const optionSets: OptionPair[] = [
  {
    message: "It's time to stretch!",
    primary: 'Take a break',
    secondary: 'Keep focus',
  },
  {
    message: 'Room comfort looks good.',
    primary: 'Yay',
    secondary: 'Nice',
  },
  {
    message: 'Hydration check?',
    primary: 'Sip water',
    secondary: 'Remind me later',
  },
];

function PetScreen() {
  const { message, primary, secondary } = optionSets[0];

  const idleAnimation = {
    src: idleSheet,
    frameWidth: 32,
    frameHeight: 32,
    fps: 6,
    scale: 7,
  };

  return (
    <div className="app-root">
      <div className="pet-shell">
        <main className="pet-layout">
          <section className="pet-panel" aria-label="Virtual pet">
            <div className="pet-stage">
              <SpriteAnimator
                src={idleAnimation.src}
                frameWidth={idleAnimation.frameWidth}
                frameHeight={idleAnimation.frameHeight}
                fps={idleAnimation.fps}
                scale={idleAnimation.scale}
                alt="Pet idling happily"
              />
              <div className="pet-touch-hint">Tap to pet</div>
            </div>
          </section>

          <aside className="context-panel" aria-label="Pet status and options">
            <div className="context-card">
              <p className="context-message">{message}</p>

              <div className="option-buttons">
                <button type="button" className="option-button primary">
                  {primary}
                </button>
                <button type="button" className="option-button secondary">
                  {secondary}
                </button>
              </div>
            </div>
          </aside>
        </main>

        <footer className="hardware-strip" aria-label="Physical controls mock">
          <div className="joystick">
            <span className="hardware-label">Joy</span>
          </div>
          <div className="option-pads">
            <button type="button" className="round-button">
              1
            </button>
            <button type="button" className="round-button">
              2
            </button>
          </div>
          <div className="power-pad">
            <button type="button" className="round-button power">
              ⏻
            </button>
          </div>
          <div className="knob-cluster">
            <div className="knob">
              <span className="hardware-label">Vol</span>
            </div>
            <div className="knob">
              <span className="hardware-label">Lux</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return <PetScreen />;
}
