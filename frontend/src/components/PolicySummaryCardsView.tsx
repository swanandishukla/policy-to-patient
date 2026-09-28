/**
 * PolicySummaryCardsView — Automatic Policy Summary Cards.
 * Automatically retrieves 6 key policy topic categories (Waiting Periods, Room Rent, Co-Pay,
 * Key Exclusions, PED, Sum Insured) from the active policy PDF with physical PDF page citations.
 */

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Clock,
  Home,
  Percent,
  ShieldOff,
  Activity,
  FileCheck,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  FileText
} from 'lucide-react';
import { fetchPolicySummary } from '../services/api';
import type { PolicySummaryResponse, PolicySummaryCategory } from '../types';

const categoryIcons: Record<string, React.ReactNode> = {
  waiting_periods: <Clock size={18} />,
  room_rent_limit: <Home size={18} />,
  co_payment: <Percent size={18} />,
  key_exclusions: <ShieldOff size={18} />,
  pre_existing_disease: <Activity size={18} />,
  sum_insured: <FileCheck size={18} />,
};

export default function PolicySummaryCardsView() {
  const [summaryData, setSummaryData] = useState<PolicySummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPolicySummary();
      setSummaryData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load policy summary cards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
        <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-slate-600)' }}>
          Extracting evidence-grounded summary cards from active policy PDF…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="info-box info-box--warning" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="info-box__icon"><AlertCircle size={18} /></div>
        <div className="info-box__content">
          <p className="info-box__title">Summary Loading Error</p>
          <p className="info-box__text">{error}</p>
          <button
            onClick={loadSummary}
            className="btn btn--secondary"
            style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-xs)' }}
          >
            <RefreshCw size={14} /> Retry Summary Extraction
          </button>
        </div>
      </div>
    );
  }

  if (!summaryData || !summaryData.has_active_policy) {
    return (
      <div className="card" style={{ marginBottom: 'var(--space-6)', backgroundColor: 'var(--color-slate-50)' }}>
        <div className="card__body" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
          <FileText size={32} color="var(--color-slate-400)" style={{ margin: '0 auto var(--space-3)' }} />
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate-800)' }}>
            No Active Policy Document Uploaded
          </h4>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-600)', marginTop: 'var(--space-2)' }}>
            Upload a health policy PDF in the section above to automatically generate 6 evidence-grounded policy summary cards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="policy-summary-section" style={{ marginBottom: 'var(--space-8)' }}>
      {/* Section Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-slate-900)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <BookOpen size={20} color="var(--color-teal-600)" /> Key Policy Clause Summaries
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)', marginTop: '2px' }}>
            Automated topic analysis grounded in active document: <strong>{summaryData.filename}</strong> ({summaryData.total_pages} pages)
          </p>
        </div>

        <button
          onClick={loadSummary}
          className="btn btn--secondary"
          style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-xs)', gap: 'var(--space-1)' }}
        >
          <RefreshCw size={14} /> Refresh Cards
        </button>
      </div>

      {/* 6 Category Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
        {summaryData.categories.map((cat: PolicySummaryCategory) => (
          <div
            key={cat.category_key}
            className="card"
            style={{
              borderLeft: cat.has_evidence ? '4px solid var(--color-teal-500)' : '4px solid var(--color-slate-300)',
              backgroundColor: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: cat.has_evidence ? 'var(--color-teal-50)' : 'var(--color-slate-100)',
                      color: cat.has_evidence ? 'var(--color-teal-600)' : 'var(--color-slate-500)'
                    }}>
                      {categoryIcons[cat.category_key] || <HelpCircle size={18} />}
                    </div>
                    <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate-900)' }}>
                      {cat.category_label}
                    </h4>
                  </div>

                  {cat.has_evidence ? (
                    <span className="badge badge--teal" style={{ fontSize: '11px', fontWeight: 600 }}>
                      PDF Page {cat.page_number}
                    </span>
                  ) : (
                    <span className="badge badge--neutral" style={{ fontSize: '11px' }}>
                      No Evidence
                    </span>
                  )}
                </div>

                {cat.section_title && (
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-teal-700)', marginBottom: 'var(--space-2)' }}>
                    {cat.section_title}
                  </div>
                )}

                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-800)', lineHeight: '1.6', marginBottom: 'var(--space-3)' }}>
                  {cat.summary_text}
                </p>

                {cat.evidence_snippet && (
                  <blockquote
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-slate-600)',
                      borderLeft: '2px solid var(--color-teal-500)',
                      backgroundColor: 'var(--color-slate-50)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      margin: '0 0 var(--space-3) 0',
                      fontStyle: 'italic',
                      lineHeight: '1.5',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    }}
                  >
                    "{cat.evidence_snippet}"
                  </blockquote>
                )}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--color-slate-400)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-slate-100)' }}>
                {cat.disclaimer_note || 'Evidence navigation aid'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

