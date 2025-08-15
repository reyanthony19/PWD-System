import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api';
import Header from './Header';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

function Dashboard() {
  const [admins, setAdmins] = useState([]);
  const [staff, setStaff] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
    const interval = setInterval(() => {
      fetchUsers();
      fetchCurrentUser();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      const allUsers = res.data;
      setAdmins(allUsers.filter(user => user.role === 'admin'));
      setStaff(allUsers.filter(user => user.role === 'staff'));
      setMembers(allUsers.filter(user => user.role === 'member'));
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/user');
      setCurrentUser(res.data);
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const chartData = [
    { role: 'Admins', count: admins.length },
    { role: 'Staff', count: staff.length },
    { role: 'Members', count: members.length }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Quick Actions */}
        <section className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-2">
            Welcome, {currentUser?.username || '...'}
          </h2>
          <h3 className="text-lg text-gray-600 mb-4">Quick Actions</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              to="/announcements"
              className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg shadow transition"
            >
              📢 Post Announcement
            </Link>
            <Link
              to="/staff"
              className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg shadow transition"
            >
              👨‍💼 Manage Staff
            </Link>
            <Link
              to="/members"
              className="flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg shadow transition"
            >
              👥 Manage Members
            </Link>
            <Link
              to="/events"
              className="flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg shadow transition"
            >
              📅 Manage Events
            </Link>
          </div>
        </section>

        {/* Chart */}
        <section className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Users Overview</h3>
          <div className="w-full h-72">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
