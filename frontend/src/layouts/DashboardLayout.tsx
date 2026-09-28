/**
 * Dashboard layout — wraps all pages with Sidebar + Header + Content area.
 */

import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Menu, FileText, CheckCircle2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useBackendStatus } from '../hooks/useBackendStatus';
import { fetchActivePolicy } from '../services/api';
import type { ActiveDocumentInfo } from '../types';

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Overview', subtitle: 'Understand your health coverage and reference rates at a glance' },
  '/policy': { title: 'Policy Intelligence', subtitle: 'Upload policy document, view automated summary cards, and ask cited questions' },
  '/treatment': { title: 'Treatment Estimate & Coverage', subtitle: 'Calculate rule-based out-of-pocket estimates and CGHS reference benchmarks' },
  '/about': { title: 'Data Sources & Documentation', subtitle: 'Methodology, official CGHS reference schedules, and disclaimers' },
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState<ActiveDocumentInfo | null>(null);
  const location = useLocation();
  const { status: connectionStatus } = useBackendStatus();

  useEffect(() => {
    let isMounted = true;
    const fetchActive = async () => {
      try {
        const res = await fetchActivePolicy();
        if (isMounted) {
          setActivePolicy(res);
        }
      } catch {
        // Ignore silent status errors
      }
    };
    fetchActive();
    return () => { isMounted = false; };
  }, [location.pathname]);

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

          <div className="header__right">
            {activePolicy?.has_active_document && activePolicy.filename ? (
              <Link to="/policy" className="header__active-policy-pill" title="View active policy analysis">
                <CheckCircle2 size={15} className="header__active-policy-icon" />
                <span className="header__active-policy-label">
                  Active: <strong>{activePolicy.filename}</strong> ({activePolicy.total_pages} pages)
                </span>
              </Link>
            ) : (
              <Link to="/policy" className="header__no-policy-pill" title="Upload a policy PDF to begin">
                <FileText size={15} />
                <span>Upload Policy</span>
              </Link>
            )}

            <button
              className="header__mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

