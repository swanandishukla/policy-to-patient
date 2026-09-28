/**
 * Public Landing Page — Policy-to-Patient
 * Refined two-column hero layout, single CTA button, contained image panel, 4 USP feature cards, and subtle ambient motion.
 */

import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  Calculator,
  ArrowRight,
  Lock,
  Search,
  CheckCircle2,
} from 'lucide-react';
import bgImage from '../assets/landing_bg.jpg';
import '../styles/pages.css';

export default function LandingPage() {
  return (
    <div className="landing-v2">
      {/* Subtle Ambient Background Motion Layer */}
      <div className="landing-v2__ambient-bg" aria-hidden="true" />

      {/* Horizontal Top Header */}
      <header className="landing-v2__header">
        <div className="landing-v2__header-inner">
          <div className="landing-v2__brand">
            <div className="landing-v2__logo-icon">
              <ShieldCheck size={22} />
            </div>
            <span className="landing-v2__brand-name">Policy-to-Patient</span>
          </div>

          <div className="landing-v2__header-action">
            <Link to="/overview" className="landing-v2__header-cta">
              <span>Open Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="landing-v2__main">
        <div className="landing-v2__container">
          {/* Two-Column Hero Section */}
          <section className="landing-v2__hero">
            {/* Left Hero Column */}
            <div className="landing-v2__hero-left">
              <div className="landing-v2__badge">
                <span className="landing-v2__badge-dot" />
                <span>HEALTHCARE COVERAGE & POLICY BENCHMARKS</span>
              </div>

              <h1 className="landing-v2__title">
                Policy-to-Patient
              </h1>

              <p className="landing-v2__description">
                Review health-insurance policy wording with physical PDF page citations and consult CGHS 2025 reference benchmarks before care.
              </p>

              <div className="landing-v2__cta-wrap">
                <Link to="/overview" className="landing-v2__primary-btn">
                  <span>Explore Your Coverage</span>
                  <ArrowRight size={18} className="landing-v2__btn-icon" />
                </Link>
              </div>

              <div className="landing-v2__trust-list">
                <span className="landing-v2__trust-item">
                  <CheckCircle2 size={14} className="landing-v2__check-icon" /> Physical PDF page citations
                </span>
                <span className="landing-v2__trust-item">
                  <CheckCircle2 size={14} className="landing-v2__check-icon" /> CGHS 2025 reference benchmarks
                </span>
                <span className="landing-v2__trust-item">
                  <CheckCircle2 size={14} className="landing-v2__check-icon" /> Grounded passage search
                </span>
              </div>
            </div>

            {/* Right Hero Column: Contained Image Panel */}
            <div className="landing-v2__hero-right">
              <div className="landing-v2__image-panel">
                <img
                  src={bgImage}
                  alt="Healthcare policy paperwork and financial analysis"
                  className="landing-v2__hero-img"
                />
                <div className="landing-v2__image-caption">
                  <span className="landing-v2__caption-title">Policy & Benchmark Verification</span>
                  <span className="landing-v2__caption-sub">Automated clause matching & rate reference</span>
                </div>
              </div>
            </div>
          </section>

          {/* 4 Compact USP Feature Cards */}
          <section className="landing-v2__usps">
            <div className="landing-v2__usp-grid">
              <div className="landing-v2__usp-card" tabIndex={0}>
                <div className="landing-v2__usp-icon-box">
                  <FileText size={20} />
                </div>
                <div className="landing-v2__usp-content">
                  <h3 className="landing-v2__usp-title">Physical PDF Page Citations</h3>
                  <p className="landing-v2__usp-desc">Direct page references to policy wording and clauses.</p>
                </div>
              </div>

              <div className="landing-v2__usp-card" tabIndex={0}>
                <div className="landing-v2__usp-icon-box">
                  <Calculator size={20} />
                </div>
                <div className="landing-v2__usp-content">
                  <h3 className="landing-v2__usp-title">CGHS 2025 Reference Benchmarks</h3>
                  <p className="landing-v2__usp-desc">Reference rates with source and effective date.</p>
                </div>
              </div>

              <div className="landing-v2__usp-card" tabIndex={0}>
                <div className="landing-v2__usp-icon-box">
                  <Search size={20} />
                </div>
                <div className="landing-v2__usp-content">
                  <h3 className="landing-v2__usp-title">Grounded Policy Passage Search</h3>
                  <p className="landing-v2__usp-desc">Answers linked directly to retrieved policy passages.</p>
                </div>
              </div>

              <div className="landing-v2__usp-card" tabIndex={0}>
                <div className="landing-v2__usp-icon-box">
                  <Lock size={20} />
                </div>
                <div className="landing-v2__usp-content">
                  <h3 className="landing-v2__usp-title">Privacy-First Processing</h3>
                  <p className="landing-v2__usp-desc">In-memory document processing during policy analysis.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Clean Compact Footer */}
      <footer className="landing-v2__footer">
        <div className="landing-v2__footer-inner">
          <p className="landing-v2__footer-text">
            <strong>Disclaimer:</strong> Policy-to-Patient provides informational decision support using CGHS 2025 reference benchmarks. Verify actual coverage with your insurer prior to treatment.
          </p>
          <span className="landing-v2__footer-copy">© 2026 Policy-to-Patient • HackMatrix 5.0 (FIN-01)</span>
        </div>
      </footer>
    </div>
  );
}
