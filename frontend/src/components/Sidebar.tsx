/**
 * Sidebar navigation component with brand, nav items, collapsing rail control, and backend status.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  FileSearch,
  Calculator,
  BookOpen,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { ConnectionStatus } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  connectionStatus: ConnectionStatus;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems = [
  { path: '/', label: 'Landing Page', icon: 'home', description: 'Public landing page' },
  { path: '/overview', label: 'Overview', icon: 'dashboard', description: 'Dashboard home' },
  { path: '/policy', label: 'Policy Analysis', icon: 'fileSearch', description: 'Upload and analyze policies' },
  { path: '/treatment', label: 'Treatment Estimate', icon: 'calculator', description: 'Cost estimation' },
  { path: '/about', label: 'Sources & About', icon: 'bookOpen', description: 'Information and sources' },
];

const iconMap: Record<string, React.ReactNode> = {
  home: <Home size={20} />,
  dashboard: <LayoutDashboard size={20} />,
  fileSearch: <FileSearch size={20} />,
  calculator: <Calculator size={20} />,
  bookOpen: <BookOpen size={20} />,
};

const statusLabels: Record<ConnectionStatus, string> = {
  loading: 'Connecting…',
  connected: 'Backend connected',
  disconnected: 'Backend offline',
};

export default function Sidebar({
  isOpen,
  onClose,
  connectionStatus,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const navigate = useNavigate();

  const handleBrandClick = () => {
    navigate('/overview');
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

      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}${isCollapsed ? ' sidebar--collapsed' : ''}`}>
        {/* Brand */}
        <div
          className="sidebar__brand"
          onClick={handleBrandClick}
          role="button"
          tabIndex={0}
          aria-label="Go to overview"
          onKeyDown={(e) => { if (e.key === 'Enter') handleBrandClick(); }}
          title="Policy-to-Patient Coverage Intelligence"
        >
          <div className="sidebar__logo-icon">
            <ShieldCheck size={20} />
          </div>
          {!isCollapsed && (
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-name">Policy-to-Patient</span>
              <span className="sidebar__brand-tagline">Coverage Intelligence</span>
            </div>
          )}
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
              title={isCollapsed ? item.label : undefined}
            >
              <span className="sidebar__nav-icon">{iconMap[item.icon]}</span>
              {!isCollapsed && <span className="sidebar__nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer — collapse toggle + connection status */}
        <div className="sidebar__footer">
          {onToggleCollapse && (
            <button
              className="sidebar__collapse-toggle"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              {!isCollapsed && <span>Collapse rail</span>}
            </button>
          )}

          <div className="sidebar__status">
            <span className={`sidebar__status-dot sidebar__status-dot--${connectionStatus}`} />
            {!isCollapsed && <span>{statusLabels[connectionStatus]}</span>}
          </div>
        </div>
      </aside>
    </>
  );
}

