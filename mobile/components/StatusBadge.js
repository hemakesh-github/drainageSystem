import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';

const LABELS = {
  submitted: 'Submitted',
  under_review: 'Under review',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

export default function StatusBadge({ status }) {
  const bg = COLORS.status[status] || COLORS.muted;
  const label = LABELS[status] || status;

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
