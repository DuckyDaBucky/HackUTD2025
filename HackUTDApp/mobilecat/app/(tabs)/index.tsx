import { StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Cat Box - 25% of screen */}
      <View style={styles.catBox}>
        {/* Cat will go here */}
      </View>

      {/* Body Content - 75% of screen */}
      <View style={styles.bodyBox}>
        {/* Buttons and content will go here */}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  catBox: {
    flex: 0.35,
    backgroundColor: '#E8F4F8',
    borderBottomWidth: 2,
    borderBottomColor: '#B0D4E3',
  },
  bodyBox: {
    flex: 0.65,
    backgroundColor: '#FFFFFF',
  },
});
