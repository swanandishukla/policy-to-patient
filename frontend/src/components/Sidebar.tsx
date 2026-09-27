/**
 * Sidebar navigation component with brand, nav items, and backend status.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSearch,
  Calculator,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import type { ConnectionStatus } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  connectionStatus: ConnectionStatus;
}

const navItems = [
  { path: '/', label: 'Overview', icon: 'dashboard', description: 'Dashboard home' },
  { path: '/policy', label: 'Policy Analysis', icon: 'fileSearch', description: 'Upload and analyze policies' },
  { path: '/treatment', label: 'Treatment Estimate', icon: 'calculator', description: 'Cost estimation' },
  { path: '/about', label: 'Sources & About', icon: 'bookOpen', description: 'Information and sources' },
];

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={20} />,
  fileSearch: <FileSearch size={20} />,
  calculator: <Calculator size={20} />,
  bookOpen: <BookOpen size={20} />,
};

const statusLabels: Record<ConnectionStatus, string> = {
  loading: 'Connecting to backend…',
  connected: 'Backend connected',
  disconnected: 'Backend unavailable',
};

export default function Sidebar({ isOpen, onClose, connectionStatus }: SidebarProps) {
  const navigate = useNavigate();

  const handleBrandClick = () => {
    navigate('/');
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${isOpen ? ' sidebar-overlay--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        {/* Brand */}
        <div
          className="sidebar__brand"
          onClick={handleBrandClick}
          role="button"
          tabIndex={0}
          aria-label="Go to overview"
          onKeyDown={(e) => { if (e.key === 'Enter') handleBrandClick(); }}
        >
          <div className="sidebar__logo-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">Policy-to-Patient</span>
            <span className="sidebar__brand-tagline">Coverage Intelligence</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`
              }
              onClick={onClose}
              aria-label={item.description}
            >
              <span className="sidebar__nav-icon">{iconMap[item.icon]}</span>
              <span className="sidebar__nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer — connection status */}
        <div className="sidebar__footer">
          <div className="sidebar__status">
            <span className={`sidebar__status-dot sidebar__status-dot--${connectionStatus}`} />
            <span>{statusLabels[connectionStatus]}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
