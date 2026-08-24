import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaShieldAlt, FaTicketAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please fill in all fields');
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Logged in successfully!');

      if (from) {
        navigate(from);
      } else if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user?.role === 'organiser') {
        navigate('/organiser/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check credentials.');
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
            <p className="auth-kicker">WELCOME BACK</p>
            <h1>More moments are waiting for you.</h1>
            <p>Sign in to manage your tickets, pick up where you left off, and make your next plan feel effortless.</p>
          </div>
          <div className="auth-aside-note">
            <FaShieldAlt size={13} /> SECURE ACCOUNT ACCESS
          </div>
        </aside>

        <div className="auth-panel">
          <h2 className="auth-panel-heading">Sign in</h2>
          <p className="auth-panel-copy">Enter your details to continue to your account.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label auth-label" htmlFor="login-email">Email address</label>
              <div className="input-group auth-input-group">
                <span className="input-group-text"><FaEnvelope size={14} /></span>
                <input
                  id="login-email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label auth-label" htmlFor="login-password">Password</label>
              <div className="input-group auth-input-group">
                <span className="input-group-text"><FaLock size={14} /></span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-group-text"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
            </div>

            <div className="text-end mb-4">
              <Link to="/forgot-password" className="auth-subtle-link small">Forgot password?</Link>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="mt-4 mb-0 text-center text-muted small">
            New to TicketBook? <Link to="/register" className="auth-subtle-link">Create an account</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
