/**
 * Overview page — dashboard landing with product introduction and key actions.
 */

import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Search,
  DollarSign,
  ArrowRight,
  Info,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

export default function OverviewPage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero */}
      <div className="page-hero">
        <h2 className="page-hero__title">
          Understand your health insurance<br />before treatment.
        </h2>
        <p className="page-hero__description">
          Policy-to-Patient helps you explore your health insurance policy's coverage,
          identify potential gaps, and see transparent reference costs for common treatments
          — so you can make more informed decisions.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
          <button
            className="btn btn--primary"
            onClick={() => navigate('/policy')}
          >
            Analyze a policy
            <ArrowRight size={18} />
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => navigate('/about')}
          >
            <BookOpen size={16} />
            Explore how it works
          </button>
        </div>
      </div>

      {/* Three Steps */}
      <div className="steps">
        <div className="step card">
          <div className="step__icon">
            <Upload size={28} />
          </div>
          <h3 className="step__title">Upload your policy</h3>
          <p className="step__text">
            Share your health insurance policy document. We extract coverage details,
            exclusions, waiting periods, and more.
          </p>
        </div>

        <div className="step card">
          <div className="step__icon">
            <Search size={28} />
          </div>
          <h3 className="step__title">Understand your coverage</h3>
          <p className="step__text">
            Ask questions in plain language and receive answers with references
            to specific sections of your policy.
          </p>
        </div>

        <div className="step card">
          <div className="step__icon">
            <DollarSign size={28} />
          </div>
          <h3 className="step__title">Explore treatment costs</h3>
          <p className="step__text">
            See reference treatment costs from verified sources and understand
            your potential out-of-pocket expenses.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="how-it-works">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <ShieldCheck size={22} style={{ color: 'var(--color-teal-600)' }} />
          <h3 className="how-it-works__title" style={{ marginBottom: 0 }}>Evidence-backed answers</h3>
        </div>
        <p className="how-it-works__text">
          Policy-to-Patient is designed to cite the exact section or page of your policy
          for every answer. Treatment cost references will indicate their source, version,
          and applicable conditions. Every estimate will clearly state what has been verified
          and what has been assumed.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="info-box">
        <div className="info-box__icon">
          <Info size={18} />
        </div>
        <div className="info-box__content">
          <p className="info-box__title">Important</p>
          <p className="info-box__text">
            Policy-to-Patient is an informational decision-support tool. It does not process
            insurance claims, guarantee coverage amounts, or replace professional advice.
            Actual coverage, claim approval, and settlement depend entirely on your insurer
            and the specific terms of your policy.
          </p>
        </div>
      </div>
    </div>
  );
}
