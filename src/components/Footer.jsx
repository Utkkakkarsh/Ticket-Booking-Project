import React from 'react';
import { Link } from 'react-router-dom';
import { FaTicketAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="container footer-inner">
        <Link to="/" className="footer-brand" aria-label="TicketBook home">
          <span className="brand-mark"><FaTicketAlt /></span>
          <span>TicketBook</span>
        </Link>

        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/events">Explore events</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create an account</Link>
        </nav>

        <p className="footer-copy">© {new Date().getFullYear()} TICKETBOOK</p>
      </div>
    </footer>
  );
};

export default Footer;
