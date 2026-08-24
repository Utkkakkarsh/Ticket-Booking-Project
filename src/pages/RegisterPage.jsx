import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-lg border-0" style={{ maxWidth: '500px', width: '100%', borderRadius: '15px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary mb-2">Create Account</h2>
            <p className="text-muted">Join us to start booking events</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted fw-semibold">Full Name</label>
              <input type="text" name="name" className="form-control form-control-lg" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
            </div>
            
            <div className="mb-3">
              <label className="form-label text-muted fw-semibold">Email Address</label>
              <input type="email" name="email" className="form-control form-control-lg" value={formData.email} onChange={handleChange} placeholder="name@example.com" required />
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label text-muted fw-semibold">Password</label>
                <input type="password" name="password" className="form-control form-control-lg" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
              </div>
              <div className="col-md-6 mt-3 mt-md-0">
                <label className="form-label text-muted fw-semibold">Confirm Password</label>
                <input type="password" name="confirmPassword" className="form-control form-control-lg" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted fw-semibold">I want to register as a:</label>
              <select name="role" className="form-select form-select-lg" value={formData.role} onChange={handleChange}>
                <option value="customer">Customer (Book Events)</option>
                <option value="organiser">Organiser (Host Events)</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold rounded-pill shadow-sm" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="mb-0 text-muted">Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none">Log in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
