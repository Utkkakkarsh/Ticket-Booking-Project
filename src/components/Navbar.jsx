import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaTicketAlt } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <NavLink className="navbar-brand d-flex align-items-center gap-2" to="/">
          <FaTicketAlt /> TicketBook
        </NavLink>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/events">Events</NavLink>
            </li>
            
            {user?.role === 'customer' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/bookings">My Bookings</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/waitlist">Waitlist</NavLink>
                </li>
              </>
            )}

            {user?.role === 'organiser' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/organiser/dashboard">Dashboard</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/organiser/events">My Events</NavLink>
                </li>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/dashboard">Dashboard</NavLink>
                </li>
              </>
            )}
          </ul>

          <ul className="navbar-nav">
            {!user ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">Login</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/register">Register</NavLink>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/profile">Profile</NavLink>
                </li>
                <li className="nav-item">
                  <button className="nav-link btn btn-link" onClick={handleLogout}>Logout</button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
