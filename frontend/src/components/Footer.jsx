import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <img src="/TC.png" alt="Company Logo" className="footer-icon" />
          <span className="company-name">ToonConnect</span>
        </div>
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} ToonConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;