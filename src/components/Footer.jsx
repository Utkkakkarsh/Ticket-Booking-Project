import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <div className="container text-center">
        <p className="mb-0">&copy; {new Date().getFullYear()} Ticket Booking System. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
