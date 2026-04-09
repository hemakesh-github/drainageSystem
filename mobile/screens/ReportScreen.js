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
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../constants/colors';
import { apiFetch, apiUrl, formatFailedResponse } from '../constants/api';

const ISSUE_TYPES = [
  { value: 'blocked', label: 'Blocked Drain' },
  { value: 'overflow', label: 'Overflow' },
  { value: 'open_drain', label: 'Open Drain' },
  { value: 'stagnant', label: 'Stagnant Water' },
];

export default function ReportScreen() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState('');
  const [issueType, setIssueType] = useState('blocked');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to attach an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        setPhoto(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Image picker', e.message || 'Could not open library');
    }
  };

  const clearForm = () => {
    setName('');
    setMobile('');
    setLocation('');
    setIssueType('blocked');
    setDescription('');
    setPhoto(null);
  };

  const submit = async () => {
    if (!name.trim() || !mobile.trim() || !location.trim() || !issueType || !description.trim()) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    let complaintId = null;

    const createUrl = apiUrl('/complaints');
    try {
      const res = await apiFetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          location: location.trim(),
          issue_type: issueType,
          description: description.trim(),
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(text ? `${text}\nURL: ${createUrl}` : `Server error (${res.status})\nURL: ${createUrl}`);
      }

      if (!res.ok) {
        throw new Error(formatFailedResponse(res, data, createUrl));
      }

      complaintId = data.complaint_id;

      if (photo?.uri) {
        const form = new FormData();
        form.append('file', {
          uri: photo.uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        });

        const uploadUrl = apiUrl(`/complaints/${complaintId}/upload`);
        const up = await apiFetch(uploadUrl, {
          method: 'POST',
          body: form,
        });
        const upText = await up.text();
        if (!up.ok) {
          let parsed = {};
          try {
            parsed = upText ? JSON.parse(upText) : {};
          } catch {
            /* keep text */
          }
          const detail = formatFailedResponse(up, parsed, uploadUrl);
          Alert.alert(
            'Complaint created',
            `Your ID is ${complaintId}, but the photo upload failed:\n${detail}`
          );
          clearForm();
          return;
        }
      }

      Alert.alert('Success', `Your complaint ID is ${complaintId}`);
      clearForm();
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.label}>Full Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />

      <Text style={styles.label}>Mobile Number *</Text>
      <TextInput
        style={styles.input}
        value={mobile}
        onChangeText={setMobile}
        placeholder="Mobile"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Village / Area *</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Location"
      />

      <Text style={styles.label}>Issue Type *</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={issueType} onValueChange={setIssueType}>
          {ISSUE_TYPES.map((t) => (
            <Picker.Item key={t.value} label={t.label} value={t.value} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe the problem"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Photo (optional)</Text>
      <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
        <Text style={styles.photoBtnText}>{photo ? 'Change photo' : 'Choose photo'}</Text>
      </TouchableOpacity>
      {photo?.uri ? (
        <Image source={{ uri: photo.uri }} style={styles.thumb} />
      ) : null}

      <TouchableOpacity
        style={[styles.submit, submitting && styles.submitDisabled]}
        onPress={submit}
        disabled={submitting}
      >
        <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit'}</Text>
      </TouchableOpacity>
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
    marginBottom: 6,
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  multiline: {
    minHeight: 100,
  },
  pickerWrap: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  photoBtn: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 10,
    alignItems: 'center',
  },
  photoBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  thumb: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  submit: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
