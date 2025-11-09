import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type SpriteAnimatorProps = {
  src: string;
  frameWidth: number;
  frameHeight?: number;
  fps?: number;
  play?: boolean;
  loop?: boolean;
  scale?: number;
  className?: string;
  alt?: string;
};

const clampFrame = (frame: number, max: number) => {
  if (max <= 0) {
    return 0;
  }
  if (frame < 0) {
    return max - 1;
  }
  if (frame >= max) {
    return max - 1;
  }
  return frame;
};

function SpriteAnimator(props: SpriteAnimatorProps) {
  const {
    src,
    frameWidth,
    frameHeight,
    fps = 6,
    play = true,
    loop = true,
    scale = 6,
    className,
    alt,
  } = props;
  const [frameCount, setFrameCount] = useState(1);
  const [sheetHeight, setSheetHeight] = useState(frameHeight ?? frameWidth);
  const [currentFrame, setCurrentFrame] = useState(0);

  const frameRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  const effectiveFps = Math.max(1, fps);

  useEffect(() => {
    frameRef.current = 0;
    setCurrentFrame(0);
  }, [src]);

  useEffect(() => {
    const image = new Image();
    image.src = src;

    const handleLoad = () => {
      const naturalWidth = image.naturalWidth || frameWidth;
      const naturalHeight = image.naturalHeight || frameHeight || frameWidth;
      const derivedCount = Math.max(1, Math.floor(naturalWidth / frameWidth));

      setFrameCount(derivedCount);
      setSheetHeight(frameHeight ?? naturalHeight);
    };

    if (image.complete) {
      handleLoad();
    } else {
      image.addEventListener('load', handleLoad);
      return () => image.removeEventListener('load', handleLoad);
    }

    return undefined;
  }, [src, frameWidth, frameHeight]);

  useEffect(() => {
    if (!play || frameCount <= 1) {
      return undefined;
    }

    let lastFrameTime = performance.now();
    const frameDuration = 1000 / effectiveFps;

    const tick = (now: number) => {
      if (!play) {
        return;
      }

      if (now - lastFrameTime >= frameDuration) {
        lastFrameTime = now;
        frameRef.current += 1;

        if (frameRef.current >= frameCount) {
          if (loop) {
            frameRef.current = 0;
          } else {
            frameRef.current = frameCount - 1;
          }
        }

        setCurrentFrame(clampFrame(frameRef.current, frameCount));

        if (!loop && frameRef.current === frameCount - 1) {
          return;
        }
      }

      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [play, loop, frameCount, effectiveFps]);

  const wrapperClassName = useMemo(() => {
    return ['sprite-animator', className].filter(Boolean).join(' ');
  }, [className]);

  const containerStyle: CSSProperties = {
    width: frameWidth * scale,
    height: sheetHeight * scale,
  };

  const sheetStyle: CSSProperties = {
    width: frameWidth,
    height: sheetHeight,
    backgroundImage: `url(${src})`,
    backgroundPosition: `-${currentFrame * frameWidth}px 0`,
    backgroundRepeat: 'no-repeat',
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
  };

  return (
    <div
      className={wrapperClassName}
      style={containerStyle}
      role={alt ? 'img' : undefined}
      aria-label={alt}
    >
      <div className="sprite-animator__sheet" style={sheetStyle} />
    </div>
  );
}

SpriteAnimator.defaultProps = {
  frameHeight: undefined,
  fps: 6,
  play: true,
  loop: true,
  scale: 6,
  className: undefined,
  alt: undefined,
} satisfies Partial<SpriteAnimatorProps>;

export default SpriteAnimator;
