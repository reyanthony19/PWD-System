import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import Header from './Header';

function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'member',  // default to 'member'
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/register', form);
      setShowModal(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeModalAndRedirect = () => {
    setShowModal(false);
    navigate('/login');
  };

  return (
    <center>
      <Header />
      <div className='login-body'>
        <div className="wrapper">
          <form className="login-form" onSubmit={handleRegister}>
            <h1>Register</h1>
            {error && <div className="error-msg">{error}</div>}

            <div className="input-box">
              <box-icon type="solid" name="user"></box-icon>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-box">
              <box-icon type="solid" name="envelope"></box-icon>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-box">
              <label htmlFor="role">Role</label>
              <select
                name="role"
                id="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="member">Member</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="input-box">
              <box-icon type="solid" name="lock"></box-icon>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Registration Successful</h3>
            <p>Your account has been created.</p>
            <div className="modal-buttons">
              <button className="btn-confirm" onClick={closeModalAndRedirect}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </center>
  );
}

export default Register;
