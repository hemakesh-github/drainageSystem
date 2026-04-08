import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import StatusBadge from '../components/StatusBadge';
import { COLORS } from '../constants/colors';
import { apiUrl } from '../constants/api';

const ADMIN_PASSWORD = 'admin123';
const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function AdminScreen() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(apiUrl('/complaints'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }, []);

  const onListRefresh = useCallback(async () => {
    try {
      setLoading(true);
      await load();
    } catch (e) {
      Alert.alert('Load failed', e.message || 'Could not refresh');
    } finally {
      setLoading(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (!unlocked) return undefined;
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          await load();
        } catch (e) {
          if (!cancelled) Alert.alert('Load failed', e.message || 'Could not load complaints');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [unlocked, load])
  );

  const tryLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setUnlocked(true);
      setPassword('');
    } else {
      Alert.alert('Incorrect password', 'Try again.');
    }
  };

  const setStatus = async (complaintId, status) => {
    try {
      const res = await fetch(apiUrl(`/complaints/${encodeURIComponent(complaintId)}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(text || `HTTP ${res.status}`);
      }
      if (!res.ok) {
        throw new Error(data.detail || data.message || `Failed (${res.status})`);
      }
      Alert.alert('Updated', `Status set to ${status.replace(/_/g, ' ')}`);
      await load();
    } catch (e) {
      Alert.alert('Error', e.message || 'Update failed');
    }
  };

  if (!unlocked) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Admin</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.btn} onPress={tryLogin}>
          <Text style={styles.btnText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={items}
      keyExtractor={(item) => item.complaint_id}
      refreshing={loading}
      onRefresh={onListRefresh}
      ListHeaderComponent={
        <TouchableOpacity style={styles.lockOut} onPress={() => setUnlocked(false)}>
          <Text style={styles.lockOutText}>Lock admin</Text>
        </TouchableOpacity>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.id}>{item.complaint_id}</Text>
          <StatusBadge status={item.status} />
          <Text style={styles.meta}>{item.name} · {item.mobile}</Text>
          <Text style={styles.meta}>{item.location}</Text>
          <Text style={styles.meta}>{item.issue_type}</Text>
          <Text style={styles.desc}>{item.description}</Text>
          <View style={styles.actions}>
            {STATUS_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.smallBtn, item.status === s.value && styles.smallBtnActive]}
                onPress={() => setStatus(item.complaint_id, s.value)}
              >
                <Text
                  style={[
                    styles.smallBtnText,
                    item.status === s.value && styles.smallBtnTextActive,
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  btn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
  list: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  lockOut: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  lockOutText: {
    color: COLORS.muted,
    textDecorationLine: 'underline',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  id: {
    fontWeight: '800',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 6,
  },
  meta: {
    color: COLORS.text,
    marginTop: 4,
  },
  desc: {
    marginTop: 8,
    color: COLORS.muted,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  smallBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#e8f5f1',
  },
  smallBtnText: {
    fontSize: 12,
    color: COLORS.text,
  },
  smallBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
