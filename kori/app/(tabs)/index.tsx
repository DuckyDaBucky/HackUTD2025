import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sprite } from '@/components/Sprite';
import { DEFAULT_PET_STATE } from '@/constants/petAnimations';
import { usePetAnimation } from '@/hooks/usePetAnimation';
import { useRealtimeState } from '@/state/realtimeState';

const METRIC_CONFIG = {
  comfortable: {
    label: 'Comfortable',
    accent: '#4ADE80',
  },
  warning: {
    label: 'Needs attention',
    accent: '#F97316',
  },
};

function formatUpdated(timestamp?: string) {
  if (!timestamp) {
    return 'Just now';
  }
  const updated = new Date(timestamp).getTime();
  if (Number.isNaN(updated)) {
    return 'Just now';
  }
  const diff = Date.now() - updated;
  if (diff < 45_000) {
    return 'Just now';
  }
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}

function toTitleCase(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { status, cat, stats, error } = useRealtimeState();
  const activeMood = cat?.mood ?? DEFAULT_PET_STATE;
  const { animation } = usePetAnimation(activeMood);

  const frameCount = useMemo(() => animation.sheet.frames.length || 1, [animation]);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    setFrameIndex(0);
    if (frameCount <= 1) {
      return undefined;
    }

    const frameDuration = 1000 / animation.fps;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frameCount);
    }, frameDuration);

    return () => clearInterval(interval);
  }, [animation, frameCount]);

  const confidence = Math.round(cat?.energy ?? 72);
  const hunger = Math.round(cat?.hunger ?? 15);
  const temperature = stats?.roomTemperature ?? 22;
  const focus = stats?.focusLevel ?? 5;

  const metrics = [
    {
      id: 'temperature',
      label: 'Temperature',
      value: `${Math.round(temperature)} °C`,
      status: temperature >= 18 && temperature <= 24 ? METRIC_CONFIG.comfortable.label : METRIC_CONFIG.warning.label,
      helper: 'Tap to switch units',
      accent: METRIC_CONFIG.comfortable.accent,
    },
    {
      id: 'energy',
      label: 'Energy',
      value: `${confidence}%`,
      status: confidence > 60 ? METRIC_CONFIG.comfortable.label : METRIC_CONFIG.warning.label,
      helper: 'Tracks companion stamina',
      accent: '#34D399',
    },
    {
      id: 'focus',
      label: 'Focus Level',
      value: `${focus}/10`,
      status: focus >= 6 ? 'Engaged' : 'Wandering',
      helper: 'Higher suggests better study flow',
      accent: '#F97316',
    },
    {
      id: 'hunger',
      label: 'Hunger',
      value: `${hunger}%`,
      status: hunger <= 40 ? METRIC_CONFIG.comfortable.label : METRIC_CONFIG.warning.label,
      helper: 'Lower is better — offer snacks if high',
      accent: '#60A5FA',
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.appTitle}>Ambient Companion</Text>
        <Text style={styles.subtitle}>VirtualPet energy. Mobile senses.</Text>
        <Text style={styles.statusText}>
          {status === 'connected' ? 'Live link active' : status === 'connecting' ? 'Connecting…' : 'Offline mode'}
          {error ? ` · ${error}` : ''}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.largeCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Cat Habitat</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{toTitleCase(activeMood).toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.spriteShell}>
              <Sprite sheet={animation.sheet} frameIndex={frameIndex} scale={3} />
            </View>
          </View>

          <View style={styles.cardStatsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Confidence</Text>
              <Text style={styles.statValue}>{confidence}%</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Updated</Text>
              <Text style={styles.statValue}>{formatUpdated(cat?.lastUpdated)}</Text>
            </View>
          </View>
        </View>

        {metrics.map((metric) => (
          <View key={metric.id} style={styles.metricCard}>
            <View>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
            </View>
            <View style={styles.metricMeta}>
              <Text style={styles.metricStatus}>{metric.status}</Text>
              <Text style={styles.metricHelper}>{metric.helper}</Text>
              <View style={[styles.metricBar, { backgroundColor: metric.accent }]} />
            </View>
          </View>
        ))}

        <View style={styles.emotionCard}>
          <Text style={styles.emotionBadge}>Live emotion feed</Text>
          <Text style={styles.emotionLabel}>{toTitleCase(stats?.mood ?? 'Fearful')}</Text>
          <Text style={styles.emotionConfidence}>{`${confidence}% Confidence`}</Text>
          <Text style={styles.metricHelper}>Updated {formatUpdated(stats?.lastUpdated)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050A1A',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  subtitle: {
    marginTop: 8,
    color: '#9CA3AF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  statusText: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 24,
    gap: 16,
  },
  largeCard: {
    backgroundColor: '#0C142C',
    borderRadius: 28,
    padding: 24,
    gap: 24,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1F2A44',
  },
  pillText: {
    color: '#7DD3FC',
    fontSize: 12,
    letterSpacing: 1,
  },
  spriteShell: {
    width: 112,
    height: 112,
    borderRadius: 24,
    backgroundColor: '#111A30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
  },
  cardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBlock: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValue: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '600',
  },
  metricCard: {
    backgroundColor: '#071022',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  metricLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  metricValue: {
    color: '#F3F4F6',
    fontSize: 24,
    fontWeight: '700',
  },
  metricMeta: {
    alignItems: 'flex-end',
    gap: 8,
    flex: 1,
  },
  metricStatus: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  metricHelper: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
  },
  metricBar: {
    height: 4,
    width: '100%',
    borderRadius: 999,
  },
  emotionCard: {
    backgroundColor: '#1F1D3A',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  emotionBadge: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#C4B5FD',
    letterSpacing: 1,
  },
  emotionLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E0E7FF',
  },
  emotionConfidence: {
    color: '#C4B5FD',
    fontSize: 14,
  },
});
