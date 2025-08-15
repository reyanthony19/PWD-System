import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

export default function MemberDashboardScreen({ navigation }) {
  const [user, setUser] = useState({});
  const [stats, setStats] = useState({
    members: 0,
    events: 0,
    attendance: 0,
    benefits: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    loadUser();
    fetchDashboardData();
  }, []);

  const loadUser = async () => {
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Example API call — adjust to match your backend routes
      const res = await api.get('/');
      setStats(res.data.stats);
      setRecentActivities(res.data.recentActivities);
    } catch (err) {
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('MemberLogin');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome, {user.name || 'Staff'}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardNumber}>{stats.members}</Text>
          <Text style={styles.cardLabel}>Members</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardNumber}>{stats.events}</Text>
          <Text style={styles.cardLabel}>Events</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardNumber}>{stats.attendance}</Text>
          <Text style={styles.cardLabel}>Attendance</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardNumber}>{stats.benefits}</Text>
          <Text style={styles.cardLabel}>Benefits</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Members')}>
          <Text style={styles.actionText}>View Members</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Events')}>
          <Text style={styles.actionText}>Manage Events</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <FlatList
        data={recentActivities}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.activityItem}>
            <Text>{item.activity}</Text>
            <Text style={styles.activityDate}>{item.date}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f9f9f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  logout: { color: 'red', fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 15 },
  card: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 15,
    margin: '1%',
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  cardNumber: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  cardLabel: { fontSize: 14, color: '#555' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionBtn: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center'
  },
  actionText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  activityItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 5,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  activityDate: { fontSize: 12, color: '#999' }
});
