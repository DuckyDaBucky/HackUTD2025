import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Sprite } from '@/components/Sprite';

const FRAME_SIZE = 32;
const SCALE = 2;
const spriteSheet = require('@/assets/sprites/cat_idle.png');

export function PixelArtTestScreen() {
  const frameCount = useMemo(() => {
    const asset = Image.resolveAssetSource(spriteSheet);
    return Math.max(1, Math.floor((asset?.width ?? FRAME_SIZE) / FRAME_SIZE));
  }, []);

  const [frameIndex, setFrameIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pixel Art Preview</Text>
      <Sprite
        source={spriteSheet}
        frameIndex={frameIndex}
        frameSize={FRAME_SIZE}
        scale={SCALE}
        accessibilityLabel={`Cat sprite idle frame ${frameIndex + 1}`}
      />
      <Pressable
        onPress={() => setFrameIndex((prev) => (prev + 1) % frameCount)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{`Next frame (${frameIndex + 1}/${frameCount})`}</Text>
      </Pressable>
      <Text style={styles.helper}>
        Tap to step through frames. Using integer sizing ({FRAME_SIZE}px × {SCALE}) keeps the
        sprite crisp without relying on fractional transforms.
      </Text>
      <Text style={styles.helper}>
        We set `resizeMode="stretch"` on the sheet because we explicitly control width and height,
        so the image scales with nearest-neighbor style when the source also provides @2x/@3x
        variants.
      </Text>
    </View>
  );
}

export default PixelArtTestScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4B5563',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helper: {
    textAlign: 'center',
    color: '#4B5563',
    lineHeight: 20,
  },
});

