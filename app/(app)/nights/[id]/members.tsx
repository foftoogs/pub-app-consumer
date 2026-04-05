import { View, Text, StyleSheet } from 'react-native';

export default function MembersPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Members — coming soon (TOO-29)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 16, color: '#999' },
});
