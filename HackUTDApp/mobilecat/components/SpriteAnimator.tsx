import {
  Image,
  type ImageSourcePropType,
  PixelRatio,
  Platform,
  StyleSheet,
  type ImageStyle,
  View,
  type ViewProps,
} from 'react-native';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type PixelatedImageStyle = ImageStyle & {
  imageRendering?: 'auto' | 'pixelated' | 'crisp-edges';
  transformOrigin?: string;
};

type SpriteAnimatorProps = ViewProps & {
  source: ImageSourcePropType;
  frameWidth: number;
  frameHeight?: number;
  fps?: number;
  play?: boolean;
  loop?: boolean;
  scale?: number;
  accessibilityLabel?: string;
};

const clampFrame = (frame: number, max: number) => {
  if (max <= 1) {
    return 0;
  }
  if (frame < 0) {
    return 0;
  }
  if (frame >= max) {
    return max - 1;
  }
  return frame;
};

export default function SpriteAnimator({
  source,
  frameWidth,
  frameHeight,
  fps = 6,
  play = true,
  loop = true,
  scale = 4,
  accessibilityLabel,
  style,
  ...rest
}: SpriteAnimatorProps) {
  const [sheetHeight, setSheetHeight] = useState(frameHeight ?? frameWidth);
  const [frameCount, setFrameCount] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(0);

  const frameRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    frameRef.current = 0;
    setCurrentFrame(0);
  }, [source]);

  useEffect(() => {
    let cancelled = false;

    const handleResolvedSize = (width: number, height: number | undefined) => {
      if (cancelled) return;

      const derivedFrameCount = Math.max(1, Math.floor(width / frameWidth));
      setFrameCount(derivedFrameCount);
      if (frameHeight) {
        setSheetHeight(frameHeight);
      } else if (height) {
        setSheetHeight(height);
      } else {
        setSheetHeight(frameWidth);
      }
    };

    const resolved = Image.resolveAssetSource(source);
    if (resolved?.width) {
      handleResolvedSize(resolved.width, resolved.height);
    } else if (typeof source === 'string') {
      Image.getSize(
        source,
        (width, height) => handleResolvedSize(width, height),
        () => handleResolvedSize(frameWidth, frameHeight),
      );
    } else {
      handleResolvedSize(frameWidth, frameHeight);
    }

    return () => {
      cancelled = true;
    };
  }, [source, frameWidth, frameHeight]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!play || frameCount <= 1) {
      return undefined;
    }

    const intervalMs = 1000 / Math.max(1, fps);
    timerRef.current = setInterval(() => {
      frameRef.current += 1;

      if (frameRef.current >= frameCount) {
        if (loop) {
          frameRef.current = 0;
        } else {
          frameRef.current = frameCount - 1;
          setCurrentFrame(frameRef.current);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return;
        }
      }

      setCurrentFrame(clampFrame(frameRef.current, frameCount));
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [play, loop, frameCount, fps]);

  const layoutWidth = useMemo(
    () => PixelRatio.roundToNearestPixel(frameWidth * scale),
    [frameWidth, scale],
  );

  const layoutHeight = useMemo(
    () => PixelRatio.roundToNearestPixel(sheetHeight * scale),
    [sheetHeight, scale],
  );

  const pixelArtStyle = useMemo<PixelatedImageStyle>(
    () =>
      Platform.OS === 'web'
        ? { imageRendering: 'pixelated', transformOrigin: 'top left' }
        : {},
    [],
  );

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        width: layoutWidth,
        height: layoutHeight,
      },
      style,
    ],
    [layoutWidth, layoutHeight, style],
  );

  const sheetStyle = useMemo<PixelatedImageStyle>(() => {
    const base: PixelatedImageStyle = {
      width: frameCount * frameWidth * scale,
      height: sheetHeight * scale,
      transform: [{ translateX: -currentFrame * frameWidth * scale }],
    };

    if (Platform.OS === 'web') {
      base.transformOrigin = 'top left';
    }

    return base;
  }, [currentFrame, frameCount, frameWidth, scale, sheetHeight]);

  const sheetStyleArray = useMemo(
    () => [styles.sheet, pixelArtStyle, sheetStyle],
    [pixelArtStyle, sheetStyle],
  );

  return (
    <View
      style={containerStyle}
      accessible={accessibilityLabel !== undefined}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      {...rest}
    >
      <Image
        source={source}
        resizeMode="stretch"
        style={sheetStyleArray}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  sheet: {
    resizeMode: 'contain',
  },
});

