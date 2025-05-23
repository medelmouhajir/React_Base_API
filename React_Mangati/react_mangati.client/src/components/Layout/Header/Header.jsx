import { useState } from 'react';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <header className="header">
      <div className="header__container">
        {/* Logo */}
        <div className="header__logo">
          <a href="/" className="header__logo-link">
            <img src="https://placehold.co/40x40" alt="Mangati" className="header__logo-image" />
            <span className="header__logo-text">Mangati</span>
          </a>
        </div>

        {/* Navigation */}
        <nav className={`header__nav ${isMenuOpen ? 'header__nav--open' : ''}`}>
          <ul className="header__nav-list">
            <li className="header__nav-item">
              <a href="/dashboard" className="header__nav-link">Dashboard</a>
            </li>
            <li className="header__nav-item">
              <a href="/projects" className="header__nav-link">Projects</a>
            </li>
            <li className="header__nav-item">
              <a href="/tasks" className="header__nav-link">Tasks</a>
            </li>
            <li className="header__nav-item">
              <a href="/reports" className="header__nav-link">Reports</a>
            </li>
          </ul>
        </nav>

        {/* User Menu */}
        <div className="header__user">
          <div className="header__user-menu">
            <button 
              className="header__user-button"
              onClick={toggleUserMenu}
            >
              <img 
                src="https://placehold.co/50x50" 
                alt="User Avatar" 
                className="header__user-avatar"
              />
              <span className="header__user-name">John Doe</span>
              <svg 
                className={`header__user-arrow ${isUserMenuOpen ? 'header__user-arrow--open' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isUserMenuOpen && (
              <div className="header__user-dropdown">
                <a href="/profile" className="header__dropdown-item">
                  <svg className="header__dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </a>
                <a href="/settings" className="header__dropdown-item">
                  <svg className="header__dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </a>
                <div className="header__dropdown-divider"></div>
                <button className="header__dropdown-item header__dropdown-item--logout">
                  <svg className="header__dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="header__mobile-toggle"
          onClick={toggleMenu}
        >
          <span className={`header__hamburger ${isMenuOpen ? 'header__hamburger--open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;