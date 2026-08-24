import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem 1rem',
      }}
    >
      <div
        className="card border-0 shadow-lg"
        style={{
          maxWidth: '420px',
          width: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2rem 2.5rem 3rem',
            textAlign: 'center',
            color: '#fff',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
            }}
          >
            🔒
          </div>
          <h2 className="fw-bold mb-1">Welcome Back</h2>
          <p className="mb-0" style={{ opacity: 0.85 }}>
            Sign in to continue to your account
          </p>
        </div>

        <div
          className="card-body bg-white p-4 p-md-5"
          style={{ marginTop: '-1.5rem', borderRadius: '20px 20px 0 0' }}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-secondary fw-semibold small text-uppercase" style={{ letterSpacing: '0.03em' }}>
                Email Address
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  ✉️
                </span>
                <input
                  type="email"
                  className="form-control form-control-lg border-start-0 bg-light"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label text-secondary fw-semibold small text-uppercase" style={{ letterSpacing: '0.03em' }}>
                Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  🔑
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control form-control-lg border-start-0 border-end-0 bg-light"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="input-group-text bg-light border-start-0"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  style={{ cursor: 'pointer' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="text-end mb-4">
              <Link to="/forgot-password" className="small text-decoration-none text-primary fw-semibold">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-lg w-100 fw-bold text-white shadow-sm"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem',
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="mb-0 text-muted">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary fw-bold text-decoration-none">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;