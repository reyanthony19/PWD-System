import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import Header from './Header';

function Register() {
  const [form, setForm] = useState({
    username: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    role: 'member',       // default role
    status: 'approved',   // default status
    password: '',
    contact_number: '',
    birthdate: '',
    address: '',
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

      // Reset form but keep defaults for role/status
      setForm({
        username: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        role: 'member',
        status: 'approved',
        password: '',
        contact_number: '',
        birthdate: '',
        address: '',
      });

      setShowModal(true);
    } catch (err) {
      // Handle Laravel validation errors
      const errors = err.response?.data?.errors;
      const errorMessage = errors
        ? Object.values(errors).flat().join(', ')
        : err.response?.data?.message || 'Registration failed. Please try again.';
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
      <div className="login-body">
        <div className="wrapper">
          <form className="login-form" onSubmit={handleRegister}>
            <h1>Register</h1>
            {error && <div className="error-msg">{error}</div>}

            {/* Username */}
            <div className="input-box">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            {/* Personal Info */}
            <div className="input-box">
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={form.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-box">
              <input
                type="text"
                name="middle_name"
                placeholder="Middle Name"
                value={form.middle_name}
                onChange={handleChange}
              />
            </div>

            <div className="input-box">
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email & Password */}
            <div className="input-box">
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
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Contact Number */}
            <div className="input-box">
              <input
                type="text"
                name="contact_number"
                placeholder="Phone Number"
                value={form.contact_number}
                onChange={handleChange}
              />
            </div>

            {/* Birthdate */}
            <div className="input-box">
              <input
                type="date"
                name="birthdate"
                value={form.birthdate}
                onChange={handleChange}
              />
            </div>

            {/* Address */}
            <div className="input-box">
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleChange}
              />
            </div>

            {/* Role Selection */}
            <div className="input-box">
              <label htmlFor="role">Role</label>
              <select
                name="role"
                id="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
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
