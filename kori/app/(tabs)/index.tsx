import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sprite } from '@/components/Sprite';
import { catIdle } from '@/assets/sprites/generated/catIdle';

const MOOD_STATES = [
  { label: 'Surprised', confidence: 74 },
  { label: 'Playful', confidence: 81 },
  { label: 'Sleepy', confidence: 66 },
  { label: 'Curious', confidence: 72 },
];

const metrics = [
  {
    id: 'temperature',
    label: 'Temperature',
    value: '74 F',
    status: 'Comfortable',
    helper: 'Tap to switch units',
    accent: '#4ADE80',
  },
  {
    id: 'humidity',
    label: 'Humidity',
    value: '43%',
    status: 'Comfortable',
    helper: 'Ideal: 40% - 50%',
    accent: '#34D399',
  },
  {
    id: 'airQuality',
    label: 'Air Quality',
    value: '130',
    status: 'Sensitive',
    helper: 'PM2.5 45 ug/m3, CO2 850 ppm',
    accent: '#F97316',
  },
  {
    id: 'barometric',
    label: 'Barometric',
    value: '1013',
    status: 'Stable',
    helper: 'Sea level reference',
    accent: '#60A5FA',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const frameCount = useMemo(() => catIdle.frames.length, []);
  const [frameIndex, setFrameIndex] = useState(0);
  const mood = MOOD_STATES[0];

  useEffect(() => {
    if (frameCount <= 1) {
      return undefined;
    }

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frameCount);
    }, 180);

    return () => clearInterval(interval);
  }, [frameCount]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.appTitle}>Ambient Companion</Text>
        <Text style={styles.subtitle}>VirtualPet energy. Mobile senses.</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.largeCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Cat Habitat</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{mood.label.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.spriteShell}>
              <Sprite sheet={catIdle} frameIndex={frameIndex} scale={3} />
            </View>
          </View>

          <View style={styles.cardStatsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Confidence</Text>
              <Text style={styles.statValue}>{mood.confidence}%</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Updated</Text>
              <Text style={styles.statValue}>Just now</Text>
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
          <Text style={styles.emotionLabel}>Fearful</Text>
          <Text style={styles.emotionConfidence}>93% Confidence</Text>
          <Text style={styles.metricHelper}>Updated just now</Text>
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
