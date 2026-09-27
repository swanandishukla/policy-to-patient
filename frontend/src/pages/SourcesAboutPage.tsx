/**
 * Sources & About page — product information, methodology, and development status.
 */

import {
  ShieldCheck,
  FileSearch,
  Database,
  AlertTriangle,
  Lock,
  Scale,
  CheckCircle2,
  Clock,
  Circle,
} from 'lucide-react';

const phases = [
  {
    name: 'Phase 0 — Foundation',
    desc: 'Application shell, design system, backend API, and responsive UI.',
    status: 'active',
  },
  {
    name: 'Phase 1 — Policy Upload & Extraction',
    desc: 'PDF upload, text extraction, page-aware chunking, and metadata.',
    status: 'pending',
  },
  {
    name: 'Phase 2 — AI & Retrieval',
    desc: 'LLM-powered Q&A with exact policy section citations.',
    status: 'pending',
  },
  {
    name: 'Phase 3 — Treatment Cost Data',
    desc: 'Verified treatment-rate dataset from official government sources.',
    status: 'pending',
  },
  {
    name: 'Phase 4 — Policy Rules & Calculator',
    desc: 'Deterministic coverage calculator with transparent assumptions.',
    status: 'pending',
  },
  {
    name: 'Phase 5 — Testing & Demonstration',
    desc: 'End-to-end verification with synthetic scenarios and public data.',
    status: 'pending',
  },
];

function PhaseIcon({ status }: { status: string }) {
  if (status === 'active') return <CheckCircle2 size={18} style={{ color: 'var(--color-teal-600)' }} />;
  if (status === 'pending') return <Clock size={18} style={{ color: 'var(--color-gray-400)' }} />;
  return <Circle size={18} style={{ color: 'var(--color-gray-300)' }} />;
}

export default function SourcesAboutPage() {
  return (
    <div>
      {/* Purpose */}
      <div className="about-section">
        <h2 className="about-section__title">
          <ShieldCheck size={20} style={{ color: 'var(--color-teal-600)' }} />
          What Policy-to-Patient does
        </h2>
        <p className="about-section__text">
          Policy-to-Patient is designed to be an AI-powered insurance policy intelligence
          assistant. It will help users understand health insurance coverage by extracting
          structured information from policy documents and answering questions with
          citations to the exact policy sections.
        </p>
        <p className="about-section__text">
          When fully operational, users will be able to select a treatment procedure and
          see a transparent reference cost alongside an illustrative estimate of potential
          insurer contribution and out-of-pocket expense.
        </p>
      </div>

      {/* Evidence System */}
      <div className="about-section">
        <h2 className="about-section__title">
          <FileSearch size={20} style={{ color: 'var(--color-teal-600)' }} />
          How the evidence system will work
        </h2>
        <p className="about-section__text">
          Every answer will cite specific pages, sections, or clauses from the uploaded
          policy document. The system will use retrieval-augmented generation (RAG) to
          find relevant policy text before formulating a response. If the policy does
          not contain sufficient information to answer a question, the system will say so
          explicitly rather than speculate.
        </p>
      </div>

      {/* Treatment Data */}
      <div className="about-section">
        <h2 className="about-section__title">
          <Database size={20} style={{ color: 'var(--color-teal-600)' }} />
          Treatment-rate reference data
        </h2>
        <p className="about-section__text">
          Treatment reference costs must be traceable to a specific source, version, and
          publication date. The application will use officially published tariff data
          (such as CGHS rates) rather than crowdsourced or unverified figures.
          Each rate entry will indicate the procedure definition, applicable city or
          category, and the tariff version it belongs to.
        </p>
      </div>

      {/* Not a Claim System */}
      <div className="about-section">
        <h2 className="about-section__title">
          <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
          Estimates are not claim settlements
        </h2>
        <p className="about-section__text">
          Coverage estimates produced by this tool are illustrative calculations based on
          the policy wording and reference cost data available. They are not claim
          approvals, guarantees of payment, or binding commitments by any insurer.
          Actual claim settlement depends on the insurer's assessment, policy terms,
          medical documentation, and applicable regulations.
        </p>
      </div>

      {/* Privacy */}
      <div className="about-section">
        <h2 className="about-section__title">
          <Lock size={20} style={{ color: 'var(--color-teal-600)' }} />
          Privacy and consent
        </h2>
        <p className="about-section__text">
          Do not upload someone else's private insurance policy document without their
          explicit permission. Health insurance policies contain personal information.
          This application processes documents locally for analysis and does not share
          policy content with third parties beyond what is needed for the language model
          to generate answers.
        </p>
      </div>

      {/* Distinctions */}
      <div className="about-section">
        <h2 className="about-section__title">
          <Scale size={20} style={{ color: 'var(--color-teal-600)' }} />
          Understanding the components
        </h2>
        <p className="about-section__text">
          This application works with four distinct types of information, and it is
          important to understand the difference between them:
        </p>
        <p className="about-section__text">
          <strong>Policy wording</strong> is the original text from your insurance document.
          <strong> Interpretation</strong> is what the AI model understands from that text, which
          may be imperfect. <strong>Reference treatment costs</strong> are published rates from
          official sources, separate from your policy. <strong>Illustrative calculations</strong> combine
          these inputs using deterministic rules, and their accuracy depends on the quality
          of each component.
        </p>
      </div>

      {/* Development Status */}
      <div className="about-section">
        <h2 className="about-section__title" style={{ marginBottom: 'var(--space-2)' }}>
          Development status
        </h2>
        <p className="about-section__text" style={{ marginBottom: 'var(--space-4)' }}>
          Policy-to-Patient is being built in incremental phases. Each phase will be
          tested and verified before proceeding.
        </p>

        <div className="phase-list">
          {phases.map((phase) => (
            <div className="phase-item" key={phase.name}>
              <div className="phase-item__status">
                <PhaseIcon status={phase.status} />
              </div>
              <div className="phase-item__content">
                <p className="phase-item__name">{phase.name}</p>
                <p className="phase-item__desc">{phase.desc}</p>
              </div>
              <span className={`status-badge status-badge--${phase.status}`}>
                {phase.status === 'active' ? 'Current' : 'Upcoming'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
