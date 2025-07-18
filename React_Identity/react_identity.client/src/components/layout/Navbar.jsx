import React from 'react';

const Navbar = () => {
  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar__logo">
        <a href="/">React Identity</a>
      </div>
      {/* Navigation Links */}
      <ul className="navbar__links">
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/profile">Profile</a></li>
        <li><a href="/settings">Settings</a></li>
      </ul>
      {/* Authentication Actions */}
      <div className="navbar__auth">
        <a href="/login" className="navbar__login">Login</a>
        <a href="/register" className="navbar__register">Register</a>
      </div>
    </nav>
  );
};

export default Navbar;