import { StyleSheet, View, Image, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useState } from 'react';

export default function HomeScreen() {
  const [catState, setCatState] = useState('idle');
  const [isCelsius, setIsCelsius] = useState(false);
  
  // Sample data - will be replaced with real sensor data later
  const [temperature, setTemperature] = useState(72); // °F
  const [humidity, setHumidity] = useState(45); // %
  const [pressure, setPressure] = useState(1013); // hPa
  const [aqi, setAqi] = useState(150);
  const [pm25, setPm25] = useState(45);
  const [co2, setCo2] = useState(850);

  // Emotion data - will be replaced with real camera/AI data later
  const [emotion, setEmotion] = useState('Happy');
  const [emotionEmoji, setEmotionEmoji] = useState('😊');
  const [emotionConfidence, setEmotionConfidence] = useState(87);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  // Convert F to C
  const fahrenheitToCelsius = (f: number) => Math.round((f - 32) * 5 / 9);
  
  // Get display temperature
  const getDisplayTemp = () => {
    return isCelsius ? fahrenheitToCelsius(temperature) : temperature;
  };
  
  // Get temperature for color (always use Fahrenheit internally)
  const getTempForColor = () => {
    return temperature;
  };

  // Function to get color based on AQI value
  const getAQIColor = (value: number) => {
    if (value <= 50) return '#00e400';
    if (value <= 100) return '#ffff00';
    if (value <= 150) return '#ff7e00';
    if (value <= 200) return '#ff0000';
    if (value <= 300) return '#8f3f97';
    return '#7e0023';
  };

  // Function to get color based on temperature
  const getTempColor = (tempF: number) => {
    if (tempF < 10) return '#255C99';
    if (tempF <= 32) return '#4682B4';
    if (tempF <= 50) return '#ADD8E6';
    if (tempF <= 65) return '#90EE90';
    if (tempF <= 75) return '#7FD87F';
    if (tempF <= 95) return '#FFD700';
    return '#FF8C00';
  };

  // Function to get temperature status
  const getTempStatus = (tempF: number) => {
    if (tempF < 10) return 'Dangerously Cold';
    if (tempF <= 32) return 'Freezing';
    if (tempF <= 50) return 'Cold';
    if (tempF <= 65) return 'Cool';
    if (tempF <= 75) return 'Comfortable';
    if (tempF <= 95) return 'Warm';
    return 'Hot';
  };

  // Function to get AQI status
  const getAQIStatus = (value: number) => {
    if (value <= 50) return 'Good';
    if (value <= 100) return 'Moderate';
    if (value <= 150) return 'Unhealthy for Sensitive';
    if (value <= 200) return 'Unhealthy';
    if (value <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  // Function to get color based on humidity
  const getHumidityColor = (value: number) => {
    if (value < 30) return '#D0AE8B'; // Very Dry - Tan/Beige
    if (value <= 60) return '#ADD8E6'; // Comfortable - Light Blue
    return '#4682B4'; // Very Moist - Steel Blue
  };

  // Function to get humidity status
  const getHumidityStatus = (value: number) => {
    if (value < 30) return 'Very Dry';
    if (value <= 60) return 'Comfortable';
    return 'Very Moist';
  };

  // Function to get color based on pressure
  const getPressureColor = (value: number) => {
    if (value < 1000) return '#EE3E32'; // Low - Red/Red-Orange (stormy)
    if (value <= 1020) return '#F5F5F5'; // Normal - Off-White/Light Gray
    return '#255C99'; // High - Dark Blue (fair/stable)
  };

  // Function to get pressure status
  const getPressureStatus = (value: number) => {
    if (value < 1000) return 'Low (Stormy)';
    if (value <= 1020) return 'Normal';
    return 'High (Fair)';
  };

  // Function to get emotion color - Modern, vibrant, lighthearted palette
  const getEmotionColor = (emotionName: string) => {
    const colors: { [key: string]: string } = {
      'Happy': '#FFE66D',      // Sunny Yellow - warm and cheerful
      'Sad': '#A0C4FF',        // Soft Blue - gentle and calming
      'Angry': '#FF6B6B',      // Coral Red - intense but friendly
      'Fearful': '#C3B1E1',    // Lavender Purple - soft and dreamy
      'Surprised': '#FFB4A2',  // Peach - playful and energetic
      'Neutral': '#E3E3E3',    // Light Gray - clean and minimal
      'Disgusted': '#B4F8C8',  // Mint Green - fresh and light
    };
    return colors[emotionName] || '#E3E3E3';
  };

  // Mock function to simulate continuous emotion detection (will be replaced with real camera/AI stream)
  // In production, this will be replaced with a real-time video stream analysis
  const simulateEmotionDetection = () => {
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
    const randomConfidence = Math.floor(Math.random() * 30) + 70; // 70-99%
    
    setEmotion(randomEmotion.name);
    setEmotionEmoji(randomEmotion.emoji);
    setEmotionConfidence(randomConfidence);
    setLastUpdated('Just now');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Cat Box - 25% of screen */}
      <View style={styles.catBox}>
        <Image 
          source={require('@/assets/CatPackPaid/CatPackPaid/Sprites/Classical/Individual/Idle.png')}
          style={styles.catImage}
          resizeMode="contain"
        />
      </View>

      {/* Body Content - 75% of screen */}
      <View style={styles.bodyBox}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.cardsContainer}>
            {/* Temperature Card */}
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: '#FFF3E0' }]}
              activeOpacity={0.7}
              onPress={() => setIsCelsius(!isCelsius)}
            >
              <Text style={styles.cardTitle}>Temperature</Text>
              <View style={styles.cardContent}>
                <View style={styles.dataSection}>
                  <Text style={styles.mainValue}>
                    {getDisplayTemp()}°{isCelsius ? 'C' : 'F'}
                  </Text>
                  <Text style={styles.statusText}>{getTempStatus(getTempForColor())}</Text>
                  <Text style={styles.tapHint}>Tap to switch</Text>
                </View>
                <View style={[styles.colorBar, { backgroundColor: getTempColor(getTempForColor()) }]} />
              </View>
            </TouchableOpacity>

            {/* Humidity Card */}
            <View style={[styles.card, { backgroundColor: '#E0F7F4' }]}>
              <Text style={styles.cardTitle}>Humidity</Text>
              <View style={styles.cardContent}>
                <View style={styles.dataSection}>
                  <Text style={styles.mainValue}>{humidity}%</Text>
                  <Text style={styles.statusText}>{getHumidityStatus(humidity)}</Text>
                </View>
                <View style={[styles.colorBar, { backgroundColor: getHumidityColor(humidity) }]} />
              </View>
            </View>

            {/* Air Quality Card */}
            <View style={[styles.card, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.cardTitle}>Air Quality</Text>
              <View style={styles.cardContent}>
                <View style={styles.dataSection}>
                  <Text style={styles.mainValue}>{aqi}</Text>
                  <Text style={styles.subValue}>AQI</Text>
                  <Text style={styles.statusText}>{getAQIStatus(aqi)}</Text>
                  <Text style={styles.detailText}>PM2.5: {pm25} μg/m³</Text>
                  <Text style={styles.detailText}>CO2: {co2} ppm</Text>
                </View>
                <View style={[styles.colorBar, { backgroundColor: getAQIColor(aqi) }]} />
              </View>
            </View>

            {/* Barometric Pressure Card */}
            <View style={[styles.card, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.cardTitle}>Pressure</Text>
              <View style={styles.cardContent}>
                <View style={styles.dataSection}>
                  <Text style={styles.mainValue}>{pressure}</Text>
                  <Text style={styles.subValue}>hPa</Text>
                  <Text style={styles.statusText}>{getPressureStatus(pressure)}</Text>
                </View>
                <View style={[styles.colorBar, { backgroundColor: getPressureColor(pressure) }]} />
              </View>
            </View>

            {/* Emotion Card - Takes 2 spaces */}
            <View style={[styles.emotionCard, { backgroundColor: getEmotionColor(emotion) }]}>
              <Text style={styles.cardTitle}>Emotion Analysis</Text>
              <View style={styles.emotionContent}>
                <View style={styles.cameraIndicator}>
                  <Text style={styles.cameraIcon}>📹</Text>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                <Text style={styles.emotionEmoji}>{emotionEmoji}</Text>
                <Text style={styles.emotionName}>{emotion.toUpperCase()}</Text>
                <Text style={styles.emotionConfidence}>{emotionConfidence}% Confidence</Text>
                <Text style={styles.lastUpdated}>Updated: {lastUpdated}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4f311dff',
  },
  catBox: {
    flex: 0.45,
    backgroundColor: '#E8F4F8',
    margin: '5%',
    borderWidth: 10,
    borderColor: '#52f652ff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catImage: {
    width: 200,
    height: 200,
  },
  bodyBox: {
    flex: 0.75,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    maxWidth: 570,
  },
  card: {
    width: 270,
    height: 270,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
  },
  mainValue: {
    fontSize: 48,
    fontWeight: '200',
    color: '#000',
  },
  subValue: {
    fontSize: 16,
    color: '#666',
    marginTop: -5,
  },
  statusText: {
    fontSize: 18,
    color: '#555',
    marginTop: 5,
  },
  tapHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
  detailText: {
    fontSize: 15,
    color: '#777',
    marginTop: 3,
  },
  colorBar: {
    width: 35,
    height: '100%',
    borderRadius: 15,
    marginLeft: 15,
  },
  emotionCard: {
    width: 555, // Takes 2 card spaces (270 + 270 + 15 gap)
    height: 270,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emotionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emotionEmoji: {
    fontSize: 72,
    marginBottom: 10,
  },
  emotionName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2C3E50',
    letterSpacing: 1,
  },
  emotionConfidence: {
    fontSize: 18,
    color: '#34495E',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  cameraIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4757',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  cameraIcon: {
    fontSize: 14,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginTop: 8,
  },
  captureButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
