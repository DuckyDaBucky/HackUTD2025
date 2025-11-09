import { ScrollView, StyleSheet, Switch, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRealtimeState } from '@/state/realtimeState';

const TIMER_METHOD_OPTIONS = [
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'custom', label: 'Custom' },
  { id: 'focus', label: 'Focus' },
] as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { preferences, updatePreferences, stats, updateStats } = useRealtimeState();

  const isStudent = preferences?.isStudent ?? false;
  const isDark = (preferences?.theme ?? 'light') === 'dark';
  const reduceMotion = stats?.focusLevel !== undefined ? stats.focusLevel < 4 : false;
  const timerMethod = preferences?.timerMethod ?? 'pomodoro';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 32, paddingTop: insets.top + 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Tune alerts, visuals, and accessibility for your ambient companion.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Student mode</Text>
            <Text style={styles.rowHelper}>Blend study timers, breaks, and encouragement.</Text>
          </View>
          <Switch
            value={isStudent}
            onValueChange={(next) => updatePreferences({ isStudent: next })}
            thumbColor={isStudent ? '#60A5FA' : '#1F2937'}
            trackColor={{ false: '#111827', true: '#1E3A8A' }}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Dark interface</Text>
            <Text style={styles.rowHelper}>Match the desktop aesthetic and dim bright surfaces.</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(next) => updatePreferences({ theme: next ? 'dark' : 'light' })}
            thumbColor={isDark ? '#FDE68A' : '#1F2937'}
            trackColor={{ false: '#111827', true: '#92400E' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessibility</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Reduce motion</Text>
            <Text style={styles.rowHelper}>Tone down idle loops when focus level drops.</Text>
          </View>
          <Switch
            value={reduceMotion}
            onValueChange={(next) => updateStats({ focusLevel: next ? 3 : 6 })}
            thumbColor={reduceMotion ? '#34D399' : '#1F2937'}
            trackColor={{ false: '#111827', true: '#065F46' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Study Timer Method</Text>
        <Text style={styles.sectionHelper}>Choose how the timer behaves across devices.</Text>
        <View style={styles.methodRow}>
          {TIMER_METHOD_OPTIONS.map((option) => {
            const selected = option.id === timerMethod;
            return (
              <Pressable
                key={option.id}
                onPress={() => updatePreferences({ timerMethod: option.id })}
                style={[styles.methodButton, selected && styles.methodButtonActive]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.methodButtonText, selected && styles.methodButtonTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
  sectionHelper: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
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
  methodRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    backgroundColor: '#0F172A',
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#3B82F6',
  },
  methodButtonText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
  },
  methodButtonTextActive: {
    color: '#FFFFFF',
  },
});
