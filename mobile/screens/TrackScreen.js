import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { apiUrl, imageUrl } from '../constants/api';
import StatusBadge from '../components/StatusBadge';

const STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under review' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'resolved', label: 'Resolved' },
];

function stepIndex(status) {
  const order = ['submitted', 'under_review', 'in_progress', 'resolved'];
  const i = order.indexOf(status);
  return i >= 0 ? i : 0;
}

export default function TrackScreen() {
  const [query, setQuery] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    const id = query.trim();
    if (!id) {
      Alert.alert('Complaint ID', 'Enter a complaint ID (e.g. NMB-2026-0001)');
      return;
    }

    setLoading(true);
    setComplaint(null);
    try {
      const res = await fetch(apiUrl(`/complaints/${encodeURIComponent(id)}`));
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(text || `Server error (${res.status})`);
      }
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Complaint not found');
      }
      setComplaint(data);
    } catch (e) {
      Alert.alert('Error', e.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = complaint ? stepIndex(complaint.status) : -1;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.label}>Enter Complaint ID (e.g. NMB-2026-0001)</Text>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="NMB-2026-0001"
        autoCapitalize="characters"
      />
      <TouchableOpacity style={styles.btn} onPress={search} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Searching…' : 'Search'}</Text>
      </TouchableOpacity>

      {complaint ? (
        <View style={styles.card}>
          <Text style={styles.id}>{complaint.complaint_id}</Text>
          <StatusBadge status={complaint.status} />
          <Text style={styles.row}>
            <Text style={styles.k}>Name: </Text>
            {complaint.name}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.k}>Mobile: </Text>
            {complaint.mobile}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.k}>Location: </Text>
            {complaint.location}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.k}>Issue: </Text>
            {complaint.issue_type}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.k}>Description: </Text>
            {complaint.description}
          </Text>
          {complaint.image_path ? (
            <Image
              source={{ uri: imageUrl(complaint.image_path) }}
              style={styles.image}
            />
          ) : null}

          <Text style={styles.timelineTitle}>Progress</Text>
          <View style={styles.timeline}>
            {STEPS.map((step, idx) => {
              const done = idx <= currentStep;
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[styles.dot, done ? styles.dotDone : styles.dotPending]} />
                    {idx < STEPS.length - 1 ? (
                      <View style={[styles.line, done ? styles.lineDone : styles.linePending]} />
                    ) : null}
                  </View>
                  <Text style={[styles.stepLabel, !done && styles.stepLabelPending]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  id: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  row: {
    marginTop: 8,
    color: COLORS.text,
  },
  k: {
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: 12,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  timelineTitle: {
    marginTop: 20,
    fontWeight: '700',
    fontSize: 16,
    color: COLORS.text,
  },
  timeline: {
    marginTop: 12,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 36,
  },
  stepLeft: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  dotDone: {
    backgroundColor: COLORS.primary,
  },
  dotPending: {
    backgroundColor: '#ccc',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 2,
  },
  lineDone: {
    backgroundColor: COLORS.primary,
  },
  linePending: {
    backgroundColor: '#ddd',
  },
  stepLabel: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 8,
    color: COLORS.text,
    fontWeight: '600',
  },
  stepLabelPending: {
    color: COLORS.muted,
    fontWeight: '400',
  },
});
