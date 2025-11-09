import type { ImageSourcePropType } from 'react-native';
import {
  Animated,
  Easing,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import SpriteAnimator from '@/components/SpriteAnimator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

const SPRITE_FRAME_SIZE = 32;
const SPRITE_BASE_SCALE = 7;

type SpriteDefinition = {
  source: ImageSourcePropType;
  fps: number;
  scale?: number;
};

const CAT_SPRITES = {
  idle: {
    source: require('../assets/CatPackPaid/CatPackPaid/Sprites/Classical/Individual/Idle.png'),
    fps: 8,
  },
  excited: {
    source: require('../assets/CatPackPaid/CatPackPaid/Sprites/Classical/Individual/Excited.png'),
    fps: 10,
  },
  sad: {
    source: require('../assets/CatPackPaid/CatPackPaid/Sprites/Classical/Individual/Sad.png'),
    fps: 6,
  },
  surprised: {
    source: require('../assets/CatPackPaid/CatPackPaid/Sprites/Classical/Individual/Surprised.png'),
    fps: 9,
  },
  sleepy: {
    source: require('../assets/CatPackPaid/CatPackPaid/Sprites/Classical/Individual/Sleepy.png'),
    fps: 6,
    scale: 7.5,
  },
  waiting: {
    source: require('../assets/CatPackPaid/CatPackPaid/Sprites/Classical/Individual/Waiting.png'),
    fps: 7,
  },
  sick: {
    source: require('../assets/CatPackPaid/CatPackPaid/Sprites/Classical/Individual/catsick1.png'),
    fps: 6,
  },
} as const satisfies Record<string, SpriteDefinition>;

type CatStateKey = keyof typeof CAT_SPRITES;

const EMOTION_TO_CAT_STATE: Record<string, CatStateKey> = {
  Happy: 'excited',
  Sad: 'sad',
  Angry: 'surprised',
  Fearful: 'surprised',
  Surprised: 'surprised',
  Neutral: 'idle',
  Disgusted: 'sick',
};

const STAGE_BACKDROP = require('../assets/CatRoomPaid/CatRoomPaid/Rooms/Room7.png');

type EmotionTheme = {
  background: string;
  accent: string;
  badgeBackground: string;
  border: string;
  shadow: string;
};

const EMOTION_THEMES: Record<string, EmotionTheme> = {
  Happy: {
    background: 'rgba(120, 166, 255, 0.18)',
    accent: '#74d4ff',
    badgeBackground: 'rgba(116, 212, 255, 0.16)',
    border: 'rgba(116, 212, 255, 0.35)',
    shadow: 'rgba(116, 212, 255, 0.35)',
  },
  Sad: {
    background: 'rgba(96, 115, 182, 0.2)',
    accent: '#9bb4ff',
    badgeBackground: 'rgba(155, 180, 255, 0.16)',
    border: 'rgba(155, 180, 255, 0.28)',
    shadow: 'rgba(155, 180, 255, 0.28)',
  },
  Angry: {
    background: 'rgba(255, 100, 132, 0.22)',
    accent: '#ff6484',
    badgeBackground: 'rgba(255, 100, 132, 0.16)',
    border: 'rgba(255, 100, 132, 0.32)',
    shadow: 'rgba(255, 100, 132, 0.28)',
  },
  Fearful: {
    background: 'rgba(150, 132, 255, 0.22)',
    accent: '#c7b6ff',
    badgeBackground: 'rgba(199, 182, 255, 0.16)',
    border: 'rgba(199, 182, 255, 0.32)',
    shadow: 'rgba(199, 182, 255, 0.28)',
  },
  Surprised: {
    background: 'rgba(120, 166, 255, 0.2)',
    accent: '#78a6ff',
    badgeBackground: 'rgba(120, 166, 255, 0.16)',
    border: 'rgba(120, 166, 255, 0.32)',
    shadow: 'rgba(120, 166, 255, 0.28)',
  },
  Neutral: {
    background: 'rgba(88, 108, 156, 0.2)',
    accent: '#a8b6ff',
    badgeBackground: 'rgba(168, 182, 255, 0.16)',
    border: 'rgba(168, 182, 255, 0.24)',
    shadow: 'rgba(168, 182, 255, 0.2)',
  },
  Disgusted: {
    background: 'rgba(108, 249, 192, 0.2)',
    accent: '#6cf9c0',
    badgeBackground: 'rgba(108, 249, 192, 0.16)',
    border: 'rgba(108, 249, 192, 0.28)',
    shadow: 'rgba(108, 249, 192, 0.24)',
  },
};

const DEFAULT_EMOTION_THEME: EmotionTheme = {
  background: 'rgba(120, 166, 255, 0.18)',
  accent: '#74d4ff',
  badgeBackground: 'rgba(116, 212, 255, 0.16)',
  border: 'rgba(116, 212, 255, 0.28)',
  shadow: 'rgba(116, 212, 255, 0.24)',
};

export default function HomeScreen() {
  const [catState, setCatState] = useState<CatStateKey>('idle');
  const [isCelsius, setIsCelsius] = useState(false);

  const [temperature] = useState(72); // °F
  const [humidity] = useState(45); // %
  const [pressure] = useState(1013); // hPa
  const [aqi] = useState(150);
  const [pm25] = useState(45);
  const [co2] = useState(850);

  const [emotion, setEmotion] = useState('Happy');
  const [emotionEmoji, setEmotionEmoji] = useState('😊');
  const [emotionConfidence, setEmotionConfidence] = useState(87);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -12,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [floatAnim]);

  const simulateEmotionDetection = useCallback(() => {
    const emotions = [
      { name: 'Happy', emoji: '😊' },
      { name: 'Sad', emoji: '😢' },
      { name: 'Angry', emoji: '😠' },
      { name: 'Fearful', emoji: '😨' },
      { name: 'Surprised', emoji: '😮' },
      { name: 'Neutral', emoji: '😐' },
      { name: 'Disgusted', emoji: '🤢' },
    ];

    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const randomConfidence = Math.floor(Math.random() * 30) + 70;

    setEmotion(randomEmotion.name);
    setEmotionEmoji(randomEmotion.emoji);
    setEmotionConfidence(randomConfidence);
    setLastUpdated('Just now');
  }, []);

  useEffect(() => {
    const interval = setInterval(simulateEmotionDetection, 12000);
    return () => clearInterval(interval);
  }, [simulateEmotionDetection]);

  useEffect(() => {
    const mapped = EMOTION_TO_CAT_STATE[emotion];
    if (mapped && mapped !== catState) {
      setCatState(mapped);
    }
  }, [catState, emotion]);

  const activeSprite = CAT_SPRITES[catState];
  const spriteScale = activeSprite.scale ?? SPRITE_BASE_SCALE;
  const spriteDimensions = useMemo(
    () => ({
      width: SPRITE_FRAME_SIZE * spriteScale,
      height: SPRITE_FRAME_SIZE * spriteScale,
    }),
    [spriteScale],
  );

  const emotionTheme = useMemo<EmotionTheme>(() => {
    return EMOTION_THEMES[emotion] ?? DEFAULT_EMOTION_THEME;
  }, [emotion]);

  const fahrenheitToCelsius = (f: number) => Math.round(((f - 32) * 5) / 9);

  const getDisplayTemp = () => (isCelsius ? fahrenheitToCelsius(temperature) : temperature);

  const getTempColor = (tempF: number) => {
    if (tempF <= 45) return '#5a7cff';
    if (tempF <= 60) return '#74d4ff';
    if (tempF <= 75) return '#6cf9c0';
    if (tempF <= 90) return '#fca34c';
    return '#ff6484';
  };

  const getTempStatus = (tempF: number) => {
    if (tempF < 45) return 'Chilly';
    if (tempF <= 60) return 'Cool';
    if (tempF <= 75) return 'Comfortable';
    if (tempF <= 90) return 'Warm';
    return 'Hot';
  };

  const getAQIColor = (value: number) => {
    if (value <= 50) return Colors.dark.accentSecondary;
    if (value <= 100) return Colors.dark.accentTertiary;
    if (value <= 150) return '#fca34c';
    if (value <= 200) return '#ff6484';
    if (value <= 300) return '#c38cff';
    return '#ff6484';
  };

  const getAQIStatus = (value: number) => {
    if (value <= 50) return 'Excellent';
    if (value <= 100) return 'Moderate';
    if (value <= 150) return 'Sensitive';
    if (value <= 200) return 'Unhealthy';
    if (value <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getHumidityColor = (value: number) => {
    if (value < 30) return '#fca34c';
    if (value <= 60) return Colors.dark.accentSecondary;
    return Colors.dark.accentPrimary;
  };

  const getHumidityStatus = (value: number) => {
    if (value < 30) return 'Very Dry';
    if (value <= 60) return 'Comfortable';
    return 'Humid';
  };

  const getPressureColor = (value: number) => {
    if (value < 1000) return '#ff6484';
    if (value <= 1020) return Colors.dark.accentTertiary;
    return Colors.dark.accentPrimary;
  };

  const getPressureStatus = (value: number) => {
    if (value < 1000) return 'Storm Risk';
    if (value <= 1020) return 'Stable';
    return 'Fair';
  };

  const pixelStageImageStyle = useMemo(
    () =>
      Platform.OS === 'web'
        ? ({ imageRendering: 'pixelated' } as Record<string, unknown>)
        : {},
    [],
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.backgroundGlowPrimary} pointerEvents="none" />
      <View style={styles.backgroundGlowSecondary} pointerEvents="none" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.shell}>
          <View style={styles.headerRow}>
            <ThemedText type="title" style={styles.title}>
              Ambient Companion
            </ThemedText>
            <ThemedText style={styles.subtitle}>VirtualPet energy. Mobile senses.</ThemedText>
          </View>

          <View style={styles.stageCard}>
            <View style={styles.stageHeader}>
              <ThemedText style={styles.stageTitle}>Cat Habitat</ThemedText>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: emotionTheme.badgeBackground,
                    borderColor: emotionTheme.border,
                  },
                ]}
              >
                <ThemedText style={[styles.badgeText, { color: emotionTheme.accent }]}>
                  {emotion.toUpperCase()}
                </ThemedText>
              </View>
            </View>
            <ImageBackground
              source={STAGE_BACKDROP}
              style={styles.stageSurface}
              imageStyle={[styles.stageSurfaceImage, pixelStageImageStyle]}
            >
              <View style={styles.stageSurfaceOverlay}>
                <Animated.View
                  style={[
                    styles.catSpriteWrapper,
                    spriteDimensions,
                    { transform: [{ translateY: floatAnim }] },
                  ]}
                >
                  <SpriteAnimator
                    source={activeSprite.source}
                    frameWidth={SPRITE_FRAME_SIZE}
                    frameHeight={SPRITE_FRAME_SIZE}
                    fps={activeSprite.fps}
                    scale={spriteScale}
                    accessibilityLabel={`Cat mood ${emotion.toLowerCase()}`}
                  />
                </Animated.View>
                <View style={styles.touchHint}>
                  <ThemedText style={styles.touchHintText}>Stay curious, stay cozy.</ThemedText>
                </View>
              </View>
            </ImageBackground>
            <View style={styles.stageMeta}>
              <View style={styles.metaColumn}>
                <ThemedText style={styles.metaLabel}>Confidence</ThemedText>
                <ThemedText style={styles.metaValue}>{emotionConfidence}%</ThemedText>
              </View>
              <View style={styles.metaColumn}>
                <ThemedText style={styles.metaLabel}>Updated</ThemedText>
                <ThemedText style={styles.metaValue}>{lastUpdated}</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.metaAction}
                onPress={simulateEmotionDetection}
                activeOpacity={0.75}
              >
                <ThemedText style={styles.metaActionText}>Refresh mood</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <TouchableOpacity
              style={styles.metricCard}
              activeOpacity={0.82}
              onPress={() => setIsCelsius((prev) => !prev)}
            >
              <ThemedText style={styles.cardTitle}>Temperature</ThemedText>
              <View style={styles.metricPrimaryRow}>
                <ThemedText style={styles.primaryValue}>
                  {getDisplayTemp()}°{isCelsius ? 'C' : 'F'}
                </ThemedText>
                <ThemedText style={styles.statusText}>{getTempStatus(temperature)}</ThemedText>
              </View>
              <ThemedText style={styles.cardFooter}>Tap to switch units</ThemedText>
              <View
                style={[
                  styles.accentBar,
                  {
                    backgroundColor: getTempColor(temperature),
                  },
                ]}
              />
            </TouchableOpacity>

            <View style={styles.metricCard}>
              <ThemedText style={styles.cardTitle}>Humidity</ThemedText>
              <View style={styles.metricPrimaryRow}>
                <ThemedText style={styles.primaryValue}>{humidity}%</ThemedText>
                <ThemedText style={styles.statusText}>{getHumidityStatus(humidity)}</ThemedText>
              </View>
              <ThemedText style={styles.cardFooter}>Ideal: 40% – 50%</ThemedText>
              <View
                style={[
                  styles.accentBar,
                  {
                    backgroundColor: getHumidityColor(humidity),
                  },
                ]}
              />
            </View>

            <View style={styles.metricCard}>
              <ThemedText style={styles.cardTitle}>Air Quality</ThemedText>
              <View style={styles.metricPrimaryRow}>
                <ThemedText style={styles.primaryValue}>{aqi}</ThemedText>
                <ThemedText style={styles.statusText}>{getAQIStatus(aqi)}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailText}>PM2.5 {pm25} μg/m³</ThemedText>
                <ThemedText style={styles.detailText}>CO₂ {co2} ppm</ThemedText>
              </View>
              <View
                style={[
                  styles.accentBar,
                  {
                    backgroundColor: getAQIColor(aqi),
                  },
                ]}
              />
            </View>

            <View style={styles.metricCard}>
              <ThemedText style={styles.cardTitle}>Barometric</ThemedText>
              <View style={styles.metricPrimaryRow}>
                <ThemedText style={styles.primaryValue}>{pressure}</ThemedText>
                <ThemedText style={styles.statusText}>{getPressureStatus(pressure)}</ThemedText>
              </View>
              <ThemedText style={styles.cardFooter}>Sea level reference</ThemedText>
              <View
                style={[
                  styles.accentBar,
                  {
                    backgroundColor: getPressureColor(pressure),
                  },
                ]}
              />
            </View>

            <View
              style={[
                styles.metricCard,
                styles.metricCardFull,
                {
                  backgroundColor: emotionTheme.background,
                  borderColor: emotionTheme.border,
                  shadowColor: emotionTheme.shadow,
                },
              ]}
            >
              <View style={styles.emotionHeader}>
                <View style={styles.livePill}>
                  <ThemedText style={styles.liveLabel}>LIVE</ThemedText>
                </View>
                <ThemedText style={[styles.cardTitle, styles.emotionTitle]}>Emotion Feed</ThemedText>
              </View>
              <View style={styles.emotionBody}>
                <ThemedText style={[styles.emotionEmoji, { color: emotionTheme.accent }]}>
                  {emotionEmoji}
                </ThemedText>
                <ThemedText style={styles.emotionName}>{emotion.toUpperCase()}</ThemedText>
                <ThemedText style={[styles.emotionConfidence, { color: emotionTheme.accent }]}>
                  {emotionConfidence}% Confidence
                </ThemedText>
                <ThemedText style={styles.lastUpdated}>Updated {lastUpdated}</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  backgroundGlowPrimary: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 180,
    backgroundColor: 'rgba(120, 166, 255, 0.24)',
    opacity: 0.85,
    shadowColor: 'rgba(120, 166, 255, 0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 80,
  },
  backgroundGlowSecondary: {
    position: 'absolute',
    bottom: -160,
    left: -110,
    width: 340,
    height: 340,
    borderRadius: 200,
    backgroundColor: 'rgba(108, 249, 192, 0.18)',
    opacity: 0.6,
    shadowColor: 'rgba(108, 249, 192, 0.35)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 80,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 80,
  },
  shell: {
    gap: 24,
  },
  headerRow: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 0.6,
  },
  subtitle: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  stageCard: {
    borderRadius: 32,
    padding: 24,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: 'rgba(12, 14, 20, 0.75)',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 36,
    elevation: 18,
    gap: 18,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  stageSurface: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: Colors.dark.surfaceSecondary,
  },
  stageSurfaceImage: {
    resizeMode: 'cover',
    opacity: 0.45,
  },
  stageSurfaceOverlay: {
    paddingVertical: 42,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 22, 0.55)',
  },
  catSpriteWrapper: {
    width: SPRITE_FRAME_SIZE * SPRITE_BASE_SCALE,
    height: SPRITE_FRAME_SIZE * SPRITE_BASE_SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchHint: {
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  touchHintText: {
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.dark.textMuted,
  },
  stageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  metaColumn: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: Colors.dark.textMuted,
  },
  metaValue: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  metaAction: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.accentPrimary,
    backgroundColor: 'rgba(120, 166, 255, 0.12)',
  },
  metaActionText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Colors.dark.accentPrimary,
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    flexBasis: '48%',
    minWidth: 260,
    borderRadius: 28,
    padding: 22,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: 'rgba(12, 14, 20, 0.6)',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 12,
    gap: 14,
  },
  metricCardFull: {
    flexBasis: '100%',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  metricPrimaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  primaryValue: {
    fontSize: 40,
    fontWeight: '200',
    letterSpacing: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textMuted,
    letterSpacing: 0.6,
  },
  cardFooter: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  accentBar: {
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.dark.accentPrimary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  emotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(12, 14, 24, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  emotionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emotionBody: {
    alignItems: 'center',
    gap: 8,
  },
  emotionEmoji: {
    fontSize: 72,
    marginTop: 8,
  },
  emotionName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  emotionConfidence: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    letterSpacing: 0.6,
  },
});
