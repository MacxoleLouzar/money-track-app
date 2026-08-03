import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart, Bus, UtensilsCrossed, Shirt, Sofa,
  Home, Sparkles, Package, Heart, MoreHorizontal,
  BarChart2, LogOut, Menu, House, Wallet, ListChecks, UserCircle
} from 'lucide-react';
import '../css/layout.css';

const navItems = [
  { to: '/home', icon: House, label: 'Home' },
  { to: '/dashboard', icon: BarChart2, label: 'Analytics' },
  { to: '/budget', icon: Wallet, label: 'My Budget' },
  { to: '/wishlist', icon: ListChecks, label: 'Wishlist' },
  { to: '/grocery', icon: ShoppingCart, label: 'Groceries' },
  { to: '/transport', icon: Bus, label: 'Transport' },
  { to: '/lunch', icon: UtensilsCrossed, label: 'Lunch' },
  { to: '/garment', icon: Shirt, label: 'Garments' },
  { to: '/furniture', icon: Sofa, label: 'Furniture' },
  { to: '/rent', icon: Home, label: 'Rent' },
  { to: '/cosmetic', icon: Sparkles, label: 'Cosmetics' },
  { to: '/takeout', icon: Package, label: 'Takeouts' },
  { to: '/date', icon: Heart, label: 'Dates' },
  { to: '/other', icon: MoreHorizontal, label: 'Other' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/signin'); };

  return (
    <div className="layout">
      {/* Overlay */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">💰 MoneyTrack</div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/profile" className="sidebar-profile-btn" onClick={() => setOpen(false)}>
            <div className="sidebar-avatar">{user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}</div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">{user?.name}</div>
              <div className="sidebar-profile-sub">View Profile</div>
            </div>
          </NavLink>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>

      {/* Mobile bottom bar — Home + Menu */}
      <nav className="mobile-bottom-bar">
        <NavLink to="/home" className={({ isActive }) => `bottom-bar-btn ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
          <House size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `bottom-bar-btn ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
          <div className="bottom-bar-avatar">{user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}</div>
          <span>Profile</span>
        </NavLink>
        <button className="bottom-bar-btn" onClick={() => setOpen(true)}>
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}
