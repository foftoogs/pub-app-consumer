import { View, Text, StyleSheet } from 'react-native';

export default function InvitePlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Invites — coming soon (TOO-31)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 16, color: '#999' },
});
