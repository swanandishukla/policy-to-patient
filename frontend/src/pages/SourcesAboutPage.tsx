/**
 * Sources & About page — user-friendly system documentation, dataset sources, and methodology.
 */

import {
  ShieldCheck,
  FileSearch,
  Database,
  AlertTriangle,
  Lock,
  CheckCircle2,
  ExternalLink,
  BookOpen
} from 'lucide-react';

const systemFeatures = [
  {
    title: '1. Policy PDF Upload & Page Indexing',
    desc: 'Extracts policy text page-by-page using PyMuPDF (fitz), preserving physical PDF page numbers, Table of Contents, and clause section headers.',
  },
  {
    title: '2. Automated 6-Category Summary Cards',
    desc: 'Analyzes active policy wording for Waiting Periods, Room Rent Limits, Co-Payment, Key Exclusions, Pre-existing Disease, and Sum Insured with page citations.',
  },
  {
    title: '3. Grounded Policy Q&A',
    desc: 'Answers user questions using lexical passage retrieval constrained strictly to policy text, citing exact physical PDF page numbers (e.g. [Page 31]).',
  },
  {
    title: '4. Official CGHS 2025 Reference Benchmark Dataset',
    desc: 'Includes verified reference rates from CGHS Rate List 2025 (F.No.5-16/CGHS(HQ)/HEC/2024(Part I)) with Tier 1 city and ward entitlement adjustments.',
  },
  {
    title: '5. Policy & Rate Reconciliation',
    desc: 'Retrieves relevant policy wording clauses for selected medical procedures and compares them against CGHS reference rates with TPA verification checklists.',
  },
  {
    title: '6. Rule-Based Coverage & Out-of-Pocket Estimator',
    desc: 'Calculates applicable baseline amounts, co-payment deductions, and estimated out-of-pocket expenses with step-by-step arithmetic reasoning trails.',
  },
];

export default function SourcesAboutPage() {
  return (
    <div className="about-container">
      {/* Product Overview Header */}
      <div className="card about-header-card" style={{ marginBottom: 'var(--space-6)', borderRadius: '0px' }}>
        <div className="card__body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '0px',
              backgroundColor: 'var(--color-teal-50)',
              color: 'var(--color-teal-600)'
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-family-heading)', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-slate-900)' }}>
                Policy-to-Patient Documentation
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)' }}>
                Insurance Coverage & Treatment Cost Intelligence Assistant
              </p>
            </div>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-slate-700)', lineHeight: '1.6' }}>
            Policy-to-Patient helps healthcare consumers and policyholders understand complex health insurance policy wording, identify waiting periods and room-rent caps, and estimate treatment expenses using official CGHS reference benchmark rates.
          </p>
        </div>
      </div>

      {/* How the System Works (User-Friendly Section) */}
      <div className="card about-section-card" style={{ marginBottom: 'var(--space-6)', borderRadius: '0px' }}>
        <div className="card__body">
          <h3 className="about-section__title" style={{ fontFamily: 'var(--font-family-heading)' }}>
            <BookOpen size={20} style={{ color: 'var(--color-teal-600)' }} />
            How the System Works
          </h3>
          <p className="about-section__text">
            Policy-to-Patient provides clear, evidence-grounded intelligence across policy analysis and treatment cost estimation:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            {systemFeatures.map((feat) => (
              <div
                key={feat.title}
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--color-slate-50)',
                  borderRadius: '0px',
                  border: '1px solid var(--color-slate-200)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <CheckCircle2 size={16} color="var(--color-teal-600)" />
                  <h4 style={{ fontFamily: 'var(--font-family-heading)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-slate-900)' }}>
                    {feat.title}
                  </h4>
                </div>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-600)', lineHeight: '1.5' }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Official CGHS 2025 Dataset Section */}
      <div className="card about-section-card" style={{ marginBottom: 'var(--space-6)', borderRadius: '0px' }}>
        <div className="card__body">
          <h3 className="about-section__title" style={{ fontFamily: 'var(--font-family-heading)' }}>
            <Database size={20} style={{ color: 'var(--color-teal-600)' }} />
            Official Treatment Benchmark Data Sources
          </h3>
          <p className="about-section__text">
            Treatment cost reference calculations are grounded in official government tariff schedules rather than crowdsourced estimates:
          </p>

          <div style={{
            backgroundColor: 'var(--color-slate-50)',
            border: '1px solid var(--color-slate-200)',
            borderRadius: '0px',
            padding: 'var(--space-4)',
            margin: 'var(--space-4) 0',
            fontSize: 'var(--font-size-xs)'
          }}>
            <p style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-slate-900)', marginBottom: 'var(--space-2)' }}>
              CGHS Rate Schedule Reference Metadata:
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', color: 'var(--color-slate-700)' }}>
              <li><strong>Source Document:</strong> CGHS Rates for Healthcare Organisations (Annexure-I Part A)</li>
              <li><strong>Document Reference:</strong> F.No.5-16/CGHS(HQ)/HEC/2024(Part I)</li>
              <li><strong>Issuing Authority:</strong> Directorate General of Central Government Health Scheme, MoHFW, Govt. of India</li>
              <li><strong>Effective Date:</strong> October 13, 2025</li>
              <li><strong>City Classification:</strong> Tier 1 (X Cities: Delhi NCR, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad, Pune, Ahmedabad)</li>
              <li><strong>Ward Adjustment Rules:</strong> Semi-Private Ward (Base Rate), General Ward (-5%), Private Ward (+5%). Consultations and diagnostic investigations remain uniform across ward entitlements.</li>
            </ul>
            <div style={{ marginTop: 'var(--space-3)' }}>
              <a
                href="https://dgehs.delhi.gov.in/sites/default/files/DGHS/universal/cghs_rate.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--secondary btn--sm"
                style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', borderRadius: '0px' }}
              >
                <span>View Official CGHS 2025 PDF Tariff Schedule</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
          <p className="about-section__text" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)' }}>
            Note: The current reference dataset contains verified entries for supported surgical and medical procedures (including Cataract Surgery, Knee Replacement, Appendectomy, Cholecystectomy, and Coronary Angioplasty).
          </p>
        </div>
      </div>

      {/* Evidence & Grounding Methodology */}
      <div className="card about-section-card" style={{ marginBottom: 'var(--space-6)', borderRadius: '0px' }}>
        <div className="card__body">
          <h3 className="about-section__title" style={{ fontFamily: 'var(--font-family-heading)' }}>
            <FileSearch size={20} style={{ color: 'var(--color-teal-600)' }} />
            Page-Aware Evidence Retrieval Methodology
          </h3>
          <p className="about-section__text">
            Policy-to-Patient uses lexical passage retrieval over page-indexed policy chunks. For every question asked, the system retrieves relevant clauses and provides exact physical PDF page number citations.
          </p>
          <p className="about-section__text">
            If the retrieved policy wording does not contain sufficient evidence to answer a specific query, the system explicitly states that insufficient evidence was found rather than hallucinating insurance terms.
          </p>
        </div>
      </div>

      {/* Limitations & Legal Disclaimers */}
      <div className="info-box info-box--warning" style={{ marginBottom: 'var(--space-6)', borderRadius: '0px' }}>
        <div className="info-box__icon">
          <AlertTriangle size={18} />
        </div>
        <div className="info-box__content">
          <p className="info-box__title">Informational Scope & Disclaimers</p>
          <p className="info-box__text">
            Estimates and calculations produced by Policy-to-Patient are illustrative decision-support figures based on policy wording passages and CGHS reference benchmark schedules. They do not constitute formal insurance claim approval, guaranteed reimbursement quotes, or binding financial commitments. Final claim settlement depends entirely on your insurer/TPA evaluation and policy schedule terms.
          </p>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="card about-section-card" style={{ borderRadius: '0px' }}>
        <div className="card__body">
          <h3 className="about-section__title" style={{ fontFamily: 'var(--font-family-heading)' }}>
            <Lock size={20} style={{ color: 'var(--color-teal-600)' }} />
            Data Privacy & Security
          </h3>
          <p className="about-section__text">
            Uploaded policy documents are parsed locally for session analysis. The system extracts text to enable page-cited Q&A without storing personal policy records for external commercial data harvesting.
          </p>
        </div>
      </div>
    </div>
  );
}
