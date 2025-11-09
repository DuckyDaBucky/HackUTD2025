export type ContextOption = {
  label: string;
  variant?: 'primary' | 'secondary';
  onSelect?: () => void;
};

export type ContextPanelProps = {
  message: string;
  options: [ContextOption, ContextOption];
};

export default function ContextPanel({ message, options }: ContextPanelProps) {
  return (
    <aside className="context-panel" aria-label="Pet status and options">
      <div className="context-card">
        <p className="context-message">{message}</p>

        <div className="option-buttons">
          {options.map(({ label, variant = 'primary', onSelect }) => (
            <button
              key={label}
              type="button"
              className={`option-button ${variant}`}
              onClick={onSelect}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
