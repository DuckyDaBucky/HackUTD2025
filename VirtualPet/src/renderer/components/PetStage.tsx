import { type CSSProperties } from 'react';
import SpriteAnimator, { type SpriteAnimatorProps } from './SpriteAnimator';

export type PetStageProps = {
  sprite: SpriteAnimatorProps;
  backgroundSrc?: string;
  hint?: string;
  onPet?: () => void;
  isPetting?: boolean;
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
  if (onPet) {
    stageClassName.push('is-interactive');
  }

  return (
    <section className="pet-panel" aria-label="Virtual pet">
      {onPet ? (
        <button
          type="button"
          className={stageClassName.join(' ')}
          style={stageStyle}
          onClick={onPet}
        >
          <SpriteAnimator
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
} satisfies Partial<PetStageProps>;
