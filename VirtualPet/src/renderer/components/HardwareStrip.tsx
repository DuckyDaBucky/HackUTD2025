export default function HardwareStrip() {
  return (
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

      <div className="study-controls">
        <button type="button" className="round-button start">
          ▶
        </button>
        <button type="button" className="round-button stop">
          ■
        </button>
        <span className="hardware-label">Study</span>
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
  );
}
