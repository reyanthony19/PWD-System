import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity  
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      // Send POST request to Laravel API
      const res = await api.post('/login', { email, password });

      // Debug: log full API response
      console.log('API Response:', res.data);

      const user = res.data.user;

      // Role check — only allow staff
      if (!user || user.role !== 'staff') {
        Alert.alert('Invalid Credentials');
        return;
      }

      // Save token and user info
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Navigate to Dashboard
      navigation.replace('Dashboard');
    } catch (err) {
      // Debug: log errors
      console.log('Login error:', err.response?.data || err.message);
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Login" onPress={handleLogin} />

      {/* Link to Member Login */}
      <TouchableOpacity onPress={() => navigation.navigate('MemberLogin')} style={{ marginTop: 20 }}>
        <Text style={{ color: '#2196F3', textAlign: 'center' }}>Login as Member here</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
});
