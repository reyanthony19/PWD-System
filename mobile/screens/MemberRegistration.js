import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // For role selection
import api from '../api/api';

export default function MemberRegistration({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'member', // default
    password: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await api.post('/register', form);
      Alert.alert('Success', 'Your account has been created.', [
        { text: 'Go to Login', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={form.name}
        onChangeText={(value) => handleChange('name', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={(value) => handleChange('email', value)}
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Role</Text>
        <Picker
          selectedValue={form.role}
          onValueChange={(value) => handleChange('role', value)}
          style={styles.picker}
        >
          <Picker.Item label="Member" value="member" />
          <Picker.Item label="Staff" value="staff" />
          <Picker.Item label="Admin" value="admin" />
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={form.password}
        onChangeText={(value) => handleChange('password', value)}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 15, backgroundColor: '#fff' },
  pickerContainer: { marginBottom: 15, backgroundColor: '#fff', borderRadius: 8 },
  label: { marginLeft: 10, marginTop: 5, marginBottom: 5, fontWeight: 'bold' },
  picker: { height: 50, width: '100%' },
  button: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
