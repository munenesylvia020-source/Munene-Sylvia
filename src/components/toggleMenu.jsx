import React, { useState } from 'react';
import '../styles/toggleMenu.css'; 

const ToggleMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="menu-container">
      {/* Hamburger button */}
      <button
        className="nav-toggle"
        type="button"
        aria-label="Toggle menu"
        aria-controls="primary-menu"
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        <span className="nav-toggle-bar"></span>
        <span className="nav-toggle-bar"></span>
        <span className="nav-toggle-bar"></span>
      </button>

      {/* Menu container */}
      <div className={`header-menu ${isOpen ? 'is-open' : ''}`} id="primary-menu" >
        <nav className="nav" aria-label="Primary">
          <ul>
            <li><a href="/#main" className="nav-link-active">Home</a></li>
            <li><a href="/about">About us</a></li>
            <li><a href="/login">Login/Register</a></li>
            <li><a href="/partners">Our partners</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default ToggleMenu;
