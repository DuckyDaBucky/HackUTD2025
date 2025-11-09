import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FEATURE_FLAGS = [
  { id: 'alerts', label: 'Ambient alerts', helper: 'Notify me when readings drift outside comfort range.' },
  { id: 'moodPush', label: 'Mood push updates', helper: 'Send quick push notes when the cat mood shifts.' },
  { id: 'lowPower', label: 'Low power visuals', helper: 'Reduce animation cadence when battery is below 20%.' },
];

const ACCESSIBILITY = [
  { id: 'highContrast', label: 'High-contrast HUD', helper: 'Boost contrast for dim lighting environments.' },
  { id: 'reduceMotion', label: 'Reduce motion', helper: 'Slow down or pause idle animations automatically.' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    alerts: true,
    moodPush: false,
    lowPower: false,
    highContrast: false,
    reduceMotion: false,
  });

  const handleToggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 32, paddingTop: insets.top + 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Tune alerts, visuals, and accessibility for your ambient companion.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {FEATURE_FLAGS.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowHelper}>{item.helper}</Text>
            </View>
            <Switch
              value={toggles[item.id]}
              onValueChange={() => handleToggle(item.id)}
              thumbColor={toggles[item.id] ? '#60A5FA' : '#1F2937'}
              trackColor={{ false: '#111827', true: '#1E3A8A' }}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessibility</Text>
        {ACCESSIBILITY.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowHelper}>{item.helper}</Text>
            </View>
            <Switch
              value={toggles[item.id]}
              onValueChange={() => handleToggle(item.id)}
              thumbColor={toggles[item.id] ? '#34D399' : '#1F2937'}
              trackColor={{ false: '#111827', true: '#065F46' }}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050A1A',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  subtitle: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginTop: 32,
    borderRadius: 28,
    backgroundColor: '#0C142C',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowLabel: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '600',
  },
  rowHelper: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
  },
});
