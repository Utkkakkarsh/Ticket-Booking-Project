import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCalendarCheck, FaEnvelope, FaLock, FaTicketAlt, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  });
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, role } = formData;

    if (!name || !email || !password || !confirmPassword) {
      return toast.error('Please fill in all fields');
    }

    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      const user = await register(name, email, password, role);
      toast.success('Registration successful!');

      if (user?.role === 'organiser') {
        navigate('/organiser/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <div>
            <div className="auth-brand-line">
              <span className="brand-mark"><FaTicketAlt /></span>
              <span>TicketBook</span>
            </div>
            <p className="auth-kicker">YOUR CALENDAR, UPGRADED</p>
            <h1>Make room for the good stuff.</h1>
            <p>Join TicketBook to discover standout experiences, keep every ticket in one place, and plan your next outing with confidence.</p>
          </div>
          <div className="auth-aside-note">
            <FaCalendarCheck size={13} /> EVENTS, TICKETS, ONE ACCOUNT
          </div>
        </aside>

        <div className="auth-panel">
          <h2 className="auth-panel-heading">Create account</h2>
          <p className="auth-panel-copy">A few details and you will be ready to book.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label auth-label" htmlFor="register-name">Full name</label>
              <div className="input-group auth-input-group">
                <span className="input-group-text"><FaUser size={14} /></span>
                <input id="register-name" type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} placeholder="Your name" autoComplete="name" required />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label auth-label" htmlFor="register-email">Email address</label>
              <div className="input-group auth-input-group">
                <span className="input-group-text"><FaEnvelope size={14} /></span>
                <input id="register-email" type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} placeholder="name@example.com" autoComplete="email" required />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label auth-label" htmlFor="register-password">Password</label>
                <div className="input-group auth-input-group">
                  <span className="input-group-text"><FaLock size={14} /></span>
                  <input id="register-password" type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} placeholder="6+ characters" autoComplete="new-password" required />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label auth-label" htmlFor="register-confirm-password">Confirm password</label>
                <div className="input-group auth-input-group">
                  <span className="input-group-text"><FaLock size={14} /></span>
                  <input id="register-confirm-password" type="password" name="confirmPassword" className="form-control" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" autoComplete="new-password" required />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label auth-label" htmlFor="register-role">I want to join as</label>
              <select id="register-role" name="role" className="form-select" value={formData.role} onChange={handleChange}>
                <option value="customer">Customer — book events</option>
                <option value="organiser">Organiser — host events</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 mb-0 text-center text-muted small">
            Already have an account? <Link to="/login" className="auth-subtle-link">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;
