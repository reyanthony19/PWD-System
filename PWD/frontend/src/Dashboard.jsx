import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api';
import Header from './Header';

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
      console.error("Error loading users:", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/user');
      console.log("Current user data:", res.data); // Debug line
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  return (
    <div className="admin-body">
      <Header />

      <main className="main-content">
        <div className="dashboard-header">
          <h2>
            Welcome {currentUser?.name || '......'}
          </h2>
        </div>

        <section className="dashboard-grid">
          <div className="card">
            <h3>Admins</h3>
            <p>{admins.length} Admin{admins.length !== 1 ? 's' : ''}</p>

            <h3>Staff</h3>
            <p>{staff.length} Staff Member{staff.length !== 1 ? 's' : ''}</p>

            <h3>Members</h3>
            <p>{members.length} Member{members.length !== 1 ? 's' : ''}</p>

            <p className="register-link">
              Add Account <Link to="/register">Register here</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
