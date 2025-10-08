import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import './Header.css';

export const Header = () => {
  const { user, isAuthenticated, logout } = useStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>InstallSure</h1>
        </Link>
        
        {isAuthenticated && (
          <nav className="nav">
            <Link 
              to="/dashboard" 
              className={isActive('/dashboard') ? 'active' : ''}
            >
              Dashboard
            </Link>
            <Link 
              to="/quotes" 
              className={isActive('/quotes') ? 'active' : ''}
            >
              Get Quote
            </Link>
            <Link 
              to="/policies" 
              className={isActive('/policies') ? 'active' : ''}
            >
              My Policies
            </Link>
          </nav>
        )}
        
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <span className="user-name">Welcome, {user?.name}</span>
              <button onClick={logout} className="btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">
              <button>Login</button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
