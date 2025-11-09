import { type CSSProperties } from 'react';
import SpriteAnimator, { type SpriteAnimatorProps } from './SpriteAnimator';

export type PetStageProps = {
  sprite: SpriteAnimatorProps;
  backgroundSrc?: string;
  hint?: string;
  onPet?: () => void;
  isPetting?: boolean;
  disabled?: boolean;
};

type StageStyle = CSSProperties & {
  '--stage-room'?: string;
};

export default function PetStage({
  sprite,
  backgroundSrc,
  hint,
  onPet,
  isPetting = false,
  disabled = false,
}: PetStageProps) {
  const stageStyle: StageStyle = backgroundSrc
    ? { '--stage-room': `url(${backgroundSrc})` }
    : {};

  const hintText = hint ?? 'Tap to pet';

  const {
    src,
    frameWidth,
    frameHeight,
    fps,
    play,
    loop,
    scale,
    className,
    alt,
  } = sprite;

  const stageClassName = ['pet-stage'];
  if (isPetting) {
    stageClassName.push('is-petting');
  }
  if (onPet && !disabled) {
    stageClassName.push('is-interactive');
  }

  if (disabled) {
    stageClassName.push('sleep-locked');
  }

  return (
    <section className="pet-panel" aria-label="Virtual pet">
      {onPet && !disabled ? (
        <button
          type="button"
          className={stageClassName.join(' ')}
          style={stageStyle}
          onClick={onPet}
        >
          <SpriteAnimator
            key={src}
            src={src}
            frameWidth={frameWidth}
            frameHeight={frameHeight}
            fps={fps}
            play={play}
            loop={loop}
            scale={scale}
            className={className}
            alt={alt}
          />
          {!isPetting && hintText ? (
            <div className="pet-touch-hint">{hintText}</div>
          ) : null}
        </button>
      ) : (
        <div className={stageClassName.join(' ')} style={stageStyle}>
          <SpriteAnimator
            key={src}
            src={src}
            frameWidth={frameWidth}
            frameHeight={frameHeight}
            fps={fps}
            play={play}
            loop={loop}
            scale={scale}
            className={className}
            alt={alt}
          />
          {!isPetting && hintText ? (
            <div className="pet-touch-hint">{hintText}</div>
          ) : null}
        </div>
      )}
    </section>
  );
}

PetStage.defaultProps = {
  backgroundSrc: undefined,
  hint: 'Tap to pet',
  onPet: undefined,
  isPetting: false,
  disabled: false,
} satisfies Partial<PetStageProps>;
