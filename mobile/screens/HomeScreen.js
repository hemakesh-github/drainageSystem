import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { apiFetch, apiUrl } from '../constants/api';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(apiUrl('/complaints'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTotal(Array.isArray(data) ? data.length : 0);
    } catch {
      setTotal('—');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Namburu Drainage</Text>
      <Text style={styles.subtitle}>Report and track drainage issues in your village</Text>

      <View style={styles.stats}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <Text style={styles.statsText}>
            Total complaints: <Text style={styles.statsNum}>{total}</Text>
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Report')}>
        <Text style={styles.btnText}>Report Issue</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Track')}>
        <Text style={styles.btnText}>Track Complaint</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('All Complaints')}
      >
        <Text style={styles.btnText}>View All</Text>
      </TouchableOpacity>

      <View style={styles.flexSpacer} />

      <TouchableOpacity
        style={styles.adminLink}
        onPress={() => navigation.getParent()?.navigate('Admin')}
      >
        <Text style={styles.adminText}>Admin</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  stats: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  statsText: {
    fontSize: 16,
    color: COLORS.text,
  },
  statsNum: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  flexSpacer: {
    flex: 1,
    minHeight: 16,
  },
  adminLink: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  adminText: {
    color: COLORS.muted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
