import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaArrowRight, FaSignOutAlt, FaTicketAlt } from 'react-icons/fa';

const navLinkClass = ({ isActive }) => `nav-link nav-link-app${isActive ? ' active' : ''}`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg app-navbar">
      <div className="container">
        <NavLink className="navbar-brand app-brand" to="/" aria-label="TicketBook home">
          <span className="brand-mark"><FaTicketAlt /></span>
          <span>TicketBook</span>
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto align-items-lg-center">
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/">Discover</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/events">Browse events</NavLink>
            </li>

            {user?.role === 'customer' && (
              <>
                <li className="nav-item">
                  <NavLink className={navLinkClass} to="/bookings">My tickets</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={navLinkClass} to="/waitlist">Waitlist</NavLink>
                </li>
              </>
            )}

            {user?.role === 'organiser' && (
              <>
                <li className="nav-item">
                  <NavLink className={navLinkClass} to="/organiser/dashboard">Dashboard</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={navLinkClass} to="/organiser/events">My events</NavLink>
                </li>
              </>
            )}

            {user?.role === 'admin' && (
              <li className="nav-item">
                <NavLink className={navLinkClass} to="/admin/dashboard">Dashboard</NavLink>
              </li>
            )}
          </ul>

          <ul className="navbar-nav align-items-lg-center">
            {!user ? (
              <>
                <li className="nav-item navbar-action">
                  <NavLink className={navLinkClass} to="/login">Sign in</NavLink>
                </li>
                <li className="nav-item navbar-action navbar-action-register">
                  <NavLink className={navLinkClass} to="/register">
                    Get started <FaArrowRight size={12} />
                  </NavLink>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item navbar-action">
                  <NavLink className={navLinkClass} to="/profile">Account</NavLink>
                </li>
                <li className="nav-item navbar-action">
                  <button className="nav-link nav-logout btn btn-link" onClick={handleLogout}>
                    Sign out <FaSignOutAlt size={13} />
                  </button>
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
