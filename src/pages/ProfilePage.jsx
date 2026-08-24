import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="bg-primary text-white p-5 text-center">
              <div className="d-inline-flex justify-content-center align-items-center bg-white text-primary rounded-circle shadow" style={{ width: '80px', height: '80px', fontSize: '32px', fontWeight: 'bold' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="fw-bold mt-3 mb-1">{user.name}</h3>
              <span className="badge bg-light text-primary text-uppercase px-3 py-2 rounded-pill mt-2">
                {user.role}
              </span>
            </div>
            
            <div className="card-body p-4 p-md-5">
              <h5 className="fw-bold text-muted mb-4 border-bottom pb-2">Profile Information</h5>
              
              <div className="mb-3 row">
                <div className="col-sm-4 text-muted fw-semibold">Email Address</div>
                <div className="col-sm-8">{user.email}</div>
              </div>
              
              <div className="mb-3 row">
                <div className="col-sm-4 text-muted fw-semibold">Member Since</div>
                <div className="col-sm-8">{new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              
              <div className="mb-3 row">
                <div className="col-sm-4 text-muted fw-semibold">Account Status</div>
                <div className="col-sm-8"><span className="text-success fw-bold"><i className="bi bi-check-circle-fill me-1"></i> Active</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
