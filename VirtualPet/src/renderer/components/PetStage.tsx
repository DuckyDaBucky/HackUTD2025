import { type CSSProperties } from 'react';
import SpriteAnimator, { type SpriteAnimatorProps } from './SpriteAnimator';

export type PetStageProps = {
  sprite: SpriteAnimatorProps;
  backgroundSrc?: string;
  hint?: string;
};

type StageStyle = CSSProperties & {
  '--stage-room'?: string;
};

export default function PetStage({
  sprite,
  backgroundSrc,
  hint,
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

  return (
    <section className="pet-panel" aria-label="Virtual pet">
      <div className="pet-stage" style={stageStyle}>
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
        {hintText ? <div className="pet-touch-hint">{hintText}</div> : null}
      </div>
    </section>
  );
}

PetStage.defaultProps = {
  backgroundSrc: undefined,
  hint: 'Tap to pet',
} satisfies Partial<PetStageProps>;
