/**
 * Dashboard layout — wraps all pages with Sidebar + Header + Content area.
 */

import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useBackendStatus } from '../hooks/useBackendStatus';

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Overview', subtitle: 'Dashboard home — understand your coverage at a glance' },
  '/policy': { title: 'Policy Analysis', subtitle: 'Upload and understand your health insurance policy' },
  '/treatment': { title: 'Treatment Estimate', subtitle: 'Explore potential treatment expenses and coverage' },
  '/about': { title: 'Sources & About', subtitle: 'How it works, data sources, and important information' },
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { status: connectionStatus } = useBackendStatus();

  const meta = pageMeta[location.pathname] || pageMeta['/'];

  return (
    <div className="layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        connectionStatus={connectionStatus}
      />

      <div className="layout__main">
        <header className="header">
          <div className="header__left">
            <h1 className="header__title">{meta.title}</h1>
            <p className="header__subtitle">{meta.subtitle}</p>
          </div>
          <button
            className="header__mobile-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
