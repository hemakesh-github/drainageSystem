import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import StatusBadge from './StatusBadge';

const ISSUE_LABELS = {
  blocked: 'Blocked drain',
  overflow: 'Overflow',
  open_drain: 'Open drain',
  stagnant: 'Stagnant water',
};

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ComplaintCard({ complaint }) {
  const issueLabel = ISSUE_LABELS[complaint.issue_type] || complaint.issue_type;

  return (
    <View style={styles.card}>
      <Text style={styles.id}>{complaint.complaint_id}</Text>
      <Text style={styles.line}>{issueLabel}</Text>
      <Text style={styles.line} numberOfLines={2}>
        {complaint.location}
      </Text>
      <View style={styles.row}>
        <StatusBadge status={complaint.status} />
        <Text style={styles.date}>{formatDate(complaint.created_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  id: {
    fontWeight: '700',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 6,
  },
  line: {
    color: COLORS.text,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  date: {
    fontSize: 12,
    color: COLORS.muted,
    flex: 1,
    textAlign: 'right',
  },
});
