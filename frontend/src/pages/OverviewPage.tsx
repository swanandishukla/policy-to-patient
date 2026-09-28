/**
 * Overview page — dashboard landing with real policy status and direct entry points.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Upload,
  Search,
  Calculator,
  ArrowRight,
  ShieldCheck,
  FileText,
  HelpCircle,
  CheckCircle2,
  FileCheck,
  BookOpen
} from 'lucide-react';
import { fetchActivePolicy } from '../services/api';
import type { ActiveDocumentInfo } from '../types';

export default function OverviewPage() {
  const navigate = useNavigate();
  const [activePolicy, setActivePolicy] = useState<ActiveDocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetchActivePolicy();
        if (isMounted) {
          setActivePolicy(res);
        }
      } catch {
        // Fallback on silent error
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStatus();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="overview-container">
      {/* Hero Header */}
      <div className="overview-hero">
        <div className="overview-hero__badge">
          <ShieldCheck size={14} />
          <span>Clinical Policy Intelligence</span>
        </div>
        <h2 className="overview-hero__title">
          Understand your insurance coverage and reference rates before hospital admission.
        </h2>
        <p className="overview-hero__subtitle">
          Upload your health insurance policy PDF to extract 6 key clause summary cards, ask plain-language questions grounded with physical PDF page citations, and perform CGHS 2025 reference-rate lookups with transparent coverage calculations.
        </p>
      </div>

      {/* Active Document Status Card */}
      <div className="card overview-status-card">
        <div className="card__body">
          <div className="overview-status-card__header">
            <div className="overview-status-card__left">
              {loading ? (
                <div className="overview-status-card__dot overview-status-card__dot--loading" />
              ) : activePolicy?.has_active_document ? (
                <div className="overview-status-card__dot overview-status-card__dot--active" />
              ) : (
                <div className="overview-status-card__dot overview-status-card__dot--empty" />
              )}
              <h3 className="overview-status-card__title">
                {loading
                  ? 'Checking active policy document status…'
                  : activePolicy?.has_active_document
                  ? 'Active Policy Document Loaded'
                  : 'No Active Policy Uploaded Yet'}
              </h3>
            </div>
            {!loading && (
              <span className={`badge ${activePolicy?.has_active_document ? 'badge--teal' : 'badge--neutral'}`}>
                {activePolicy?.has_active_document ? 'Ready for Q&A & Analysis' : 'Awaiting Upload'}
              </span>
            )}
          </div>

          {activePolicy?.has_active_document && activePolicy.filename ? (
            <div className="overview-status-card__details">
              <div className="overview-status-card__file-info">
                <FileText size={20} className="overview-status-card__file-icon" />
                <div>
                  <p className="overview-status-card__filename">{activePolicy.filename}</p>
                  <p className="overview-status-card__meta">
                    {activePolicy.total_pages} total pages extracted • Page-aware text indexing active
                  </p>
                </div>
              </div>

              <div className="overview-status-card__actions">
                <Link to="/policy" className="btn btn--primary btn--sm">
                  View Policy Summary & Q&A
                  <ArrowRight size={15} />
                </Link>
                <Link to="/treatment" className="btn btn--secondary btn--sm">
                  Estimate Treatment Costs
                </Link>
              </div>
            </div>
          ) : (
            <div className="overview-status-card__empty-state">
              <p className="overview-status-card__empty-text">
                Upload your health insurance policy wording PDF to unlock key clause summaries, waiting period breakdowns, co-payment checks, and page-cited Q&A.
              </p>
              <div className="overview-status-card__actions">
                <Link to="/policy" className="btn btn--primary btn--sm">
                  <Upload size={16} />
                  Upload Policy PDF
                </Link>
                <Link to="/treatment" className="btn btn--secondary btn--sm">
                  Browse CGHS Reference Rates
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3 Core Entry Point Cards */}
      <div className="overview-grid">
        <div className="card overview-card card--interactive" onClick={() => navigate('/policy')}>
          <div className="card__body">
            <div className="overview-card__icon-wrapper overview-card__icon-wrapper--teal">
              <FileText size={24} />
            </div>
            <h3 className="overview-card__title">1. Policy Analysis & Summaries</h3>
            <p className="overview-card__desc">
              Upload your policy PDF to extract 6 key clause summary cards: Waiting Periods, Room Rent Limits, Co-Payments, Key Exclusions, Pre-existing Disease, and Sum Insured.
            </p>
            <div className="overview-card__footer">
              <span>Open Policy Analysis</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        <div className="card overview-card card--interactive" onClick={() => navigate('/policy')}>
          <div className="card__body">
            <div className="overview-card__icon-wrapper overview-card__icon-wrapper--blue">
              <Search size={24} />
            </div>
            <h3 className="overview-card__title">2. Grounded Policy Q&A</h3>
            <p className="overview-card__desc">
              Ask plain-language questions and receive precise, evidence-grounded answers citing the exact physical PDF page number and clause section header.
            </p>
            <div className="overview-card__footer">
              <span>Ask Policy Questions</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        <div className="card overview-card card--interactive" onClick={() => navigate('/treatment')}>
          <div className="card__body">
            <div className="overview-card__icon-wrapper overview-card__icon-wrapper--emerald">
              <Calculator size={24} />
            </div>
            <h3 className="overview-card__title">3. CGHS 2025 Rate Lookup & Calculator</h3>
            <p className="overview-card__desc">
              Select supported medical procedures to perform a CGHS 2025 reference-rate lookup, reconcile policy wording clauses, and compute transparent out-of-pocket estimates.
            </p>
            <div className="overview-card__footer">
              <span>Calculate Treatment Costs</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* System Features Overview */}
      <div className="overview-features-section">
        <h3 className="overview-section-title">Core System Capabilities</h3>
        <div className="feature-grid">
          <div className="feature-item">
            <div className="feature-item__icon">
              <FileCheck size={20} />
            </div>
            <div>
              <p className="feature-item__label">Page-Aware PDF Extraction</p>
              <p className="feature-item__sublabel">Extracts text while preserving physical PDF page numbers for exact verification.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-item__icon">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="feature-item__label">6 Key Policy Summaries</p>
              <p className="feature-item__sublabel">Automated topic cards for Waiting Periods, Exclusions, Room Rent, and Co-Pay.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-item__icon">
              <Calculator size={20} />
            </div>
            <div>
              <p className="feature-item__label">CGHS 2025 Reference Lookup</p>
              <p className="feature-item__sublabel">Benchmark tariffs across NABH and non-NABH hospital accreditation levels.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-item__icon">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="feature-item__label">Rule-Based Out-of-Pocket Math</p>
              <p className="feature-item__sublabel">Step-by-step arithmetic trail for sum insured, co-pay, and sub-limit calculations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Governance & Informational Notice */}
      <div className="info-box info-box--notice">
        <div className="info-box__icon">
          <HelpCircle size={18} />
        </div>
        <div className="info-box__content">
          <p className="info-box__title">Informational Decision Support</p>
          <p className="info-box__text">
            Policy-to-Patient provides transparent, rule-based estimates combining official CGHS 2025 reference benchmark schedules with user-confirmed policy parameters. CGHS rates are reference benchmarks and do not represent live hospital pricing or guaranteed claim approval.
          </p>
        </div>
      </div>
    </div>
  );
}
