import { memo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import type { SpriteSheetData } from './SpriteTypes';

type SpriteProps = {
  sheet: SpriteSheetData;
  frameIndex?: number;
  scale?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const clampIndex = (index: number, max: number) => {
  if (max <= 0) {
    return 0;
  }

  const wrapped = index % max;
  return wrapped < 0 ? wrapped + max : wrapped;
};

function SpriteComponent({
  sheet,
  frameIndex = 0,
  scale = 2,
  style,
  accessibilityLabel,
}: SpriteProps) {
  const { frameWidth, frameHeight, frames } = sheet;
  const clampedIndex = clampIndex(frameIndex, frames.length);
  const pixels = frames[clampedIndex] ?? frames[0] ?? [];

  const containerStyle: StyleProp<ViewStyle> = [
    {
      width: frameWidth * scale,
      height: frameHeight * scale,
      overflow: 'hidden',
    },
    style,
  ];

  return (
    <View style={containerStyle} accessibilityLabel={accessibilityLabel}>
      <Svg
        width={frameWidth * scale}
        height={frameHeight * scale}
        viewBox={`0 0 ${frameWidth} ${frameHeight}`}
      >
        {pixels.map((pixel, index) => (
          <Rect
            key={`pixel-${clampedIndex}-${index}`}
            x={pixel.x}
            y={pixel.y}
            width={1}
            height={1}
            fill={pixel.color}
            fillOpacity={pixel.opacity}
          />
        ))}
      </Svg>
    </View>
  );
}

const Sprite = memo(SpriteComponent);
Sprite.displayName = 'Sprite';

export type { SpriteProps };
export { Sprite };
