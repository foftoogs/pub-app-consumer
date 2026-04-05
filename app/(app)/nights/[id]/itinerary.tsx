import { View, Text, StyleSheet } from 'react-native';

export default function ItineraryPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Itinerary — coming soon (TOO-30)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 16, color: '#999' },
});
