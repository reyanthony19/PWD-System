import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

export default function MemberLogin({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        try {
            const res = await api.post('/login', { email, password });

            console.log('API Response:', res.data);

            const user = res.data.user;

            if (!user) {
                Alert.alert('Login Failed', 'Invalid credentials');
                return;
            }

            if (user.role !== 'member') {
                Alert.alert('Login Failed', 'Please use the correct login for your role');
                return;
            }

            if (user.status !== 'approved') {
                Alert.alert('Account Pending', 'Your account is not yet Verified. Please go to PDAO for verification.');
                return;
            }

            // Save token and user info
            await AsyncStorage.setItem('token', res.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            // Navigate to Dashboard
            navigation.replace('Dashboard');
        } catch (err) {
            console.log('Login error:', err.response?.data || err.message);
            Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Member Login</Text>

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

            <TouchableOpacity onPress={() => navigation.navigate('MemberRegistration')} style={{ marginTop: 20 }}>
                <Text style={{ color: '#2196F3', textAlign: 'center' }}>Don't Have an Account? Register Here</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 20 }}>
                <Text style={{ color: '#2196F3', textAlign: 'center' }}>Login as Staff</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
});
