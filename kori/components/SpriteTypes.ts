export type SpritePixel = {
  x: number;
  y: number;
  color: string;
  opacity: number;
};

export type SpriteSheetData = {
  frameWidth: number;
  frameHeight: number;
  frames: readonly SpritePixel[][];
};

