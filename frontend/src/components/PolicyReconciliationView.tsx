/**
 * PolicyReconciliationView — Phase 4 Policy-Rate Reconciliation Component.
 * Integrates POST /api/policy/reconcile endpoint to show CGHS benchmark alongside
 * active policy wording excerpts, physical PDF page citations, grounded summaries,
 * and neutral TPA verification checklists.
 */

import { useState, useEffect } from 'react';
import {
  GitCompare,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Building2,
  Layers,
} from 'lucide-react';
import { fetchProcedures, reconcilePolicy } from '../services/api';
import type { ProcedureItem, PolicyReconcileResponse } from '../types';

export default function PolicyReconciliationView() {
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState<boolean>(true);
  const [procError, setProcError] = useState<string | null>(null);

  // Form selections
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [accreditation, setAccreditation] = useState<string>('NABH');
  const [wardEntitlement, setWardEntitlement] = useState<string>('Semi-Private Ward');
  const [cityCategory] = useState<string>('Tier 1 (X City)');

  // Reconciliation API state
  const [reconcileResult, setReconcileResult] = useState<PolicyReconcileResponse | null>(null);
  const [reconciling, setReconciling] = useState<boolean>(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  // Load procedure dataset on mount
  useEffect(() => {
    async function loadDataset() {
      try {
        setLoadingProcedures(true);
        setProcError(null);
        const data = await fetchProcedures();
        setProcedures(data.procedures);

        if (data.procedures.length > 0) {
          const first = data.procedures[0];
          setSelectedCode(first.procedure_code);
          if (first.hospital_accreditation_options.length > 0) {
            setAccreditation(
              first.hospital_accreditation_options.includes('NABH')
                ? 'NABH'
                : first.hospital_accreditation_options[0]
            );
          }
          if (first.ward_entitlement_options.length > 0) {
            setWardEntitlement(
              first.ward_entitlement_options.includes('Semi-Private Ward')
                ? 'Semi-Private Ward'
                : first.ward_entitlement_options[0]
            );
          }
        }
      } catch (err: any) {
        setProcError(err.message || 'Failed to load treatment procedure dataset.');
      } finally {
        setLoadingProcedures(false);
      }
    }
    loadDataset();
  }, []);

  // Run reconciliation API call whenever selections change
  useEffect(() => {
    if (!selectedCode) {
      setReconcileResult(null);
      return;
    }

    const currentProc = procedures.find(p => p.procedure_code === selectedCode);
    if (!currentProc) return;

    // Validate selections against procedure allowed options
    let effectiveAccreditation = accreditation;
    if (!currentProc.hospital_accreditation_options.includes(accreditation)) {
      effectiveAccreditation = currentProc.hospital_accreditation_options[0] || 'NABH';
      setAccreditation(effectiveAccreditation);
    }

    let effectiveWard = wardEntitlement;
    if (!currentProc.ward_entitlement_options.includes(wardEntitlement)) {
      effectiveWard = currentProc.ward_entitlement_options[0] || 'Semi-Private Ward';
      setWardEntitlement(effectiveWard);
    }

    async function executeReconciliation() {
      try {
        setReconciling(true);
        setReconcileError(null);
        const res = await reconcilePolicy({
          procedure_code: selectedCode,
          hospital_accreditation: effectiveAccreditation,
          ward_entitlement: effectiveWard,
          city_category: cityCategory,
        });
        setReconcileResult(res);
      } catch (err: any) {
        setReconcileError(err.message || 'Failed to reconcile treatment with active policy.');
        setReconcileResult(null);
      } finally {
        setReconciling(false);
      }
    }

    executeReconciliation();
  }, [selectedCode, accreditation, wardEntitlement, cityCategory, procedures]);

  const selectedProcedure = procedures.find(p => p.procedure_code === selectedCode);

  return (
    <div className="reconciliation-view">
      {/* Intro Banner */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-6)',
          backgroundColor: 'var(--color-slate-50)',
          border: '1px solid var(--color-slate-200)',
          borderRadius: '0px'
        }}
      >
        <div
          className="card__body"
          style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}
        >
          <div
            style={{
              background: 'var(--color-slate-900)',
              color: 'var(--color-teal-400)',
              borderRadius: '0px',
              padding: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GitCompare size={24} />
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-slate-900)' }}>
                Policy Wording & CGHS Treatment Rate Reconciliation
              </h3>
              <span className="badge badge--teal">Policy & Rate Reconciliation</span>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-600)', marginTop: 'var(--space-1)', lineHeight: '1.5' }}>
              Select a procedure to compare its official CGHS reference benchmark rate against relevant clauses retrieved from your uploaded policy PDF.
            </p>
          </div>
        </div>
      </div>

      {loadingProcedures ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
            Loading procedure rate options…
          </p>
        </div>
      ) : procError ? (
        <div className="info-box info-box--warning">
          <div className="info-box__icon"><AlertCircle size={18} /></div>
          <div className="info-box__content">
            <p className="info-box__title">Dataset Load Error</p>
            <p className="info-box__text">{procError}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
          {/* Controls Form */}
          <div className="card" style={{ border: '1px solid #fde68a', borderTop: '3px solid #d97706', boxShadow: 'var(--shadow-sm)' }}>
            <div className="card__body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <div className="step__icon" style={{ width: '36px', height: '36px', margin: 0, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                  <Layers size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-800)' }}>
                    Reconciliation Parameters
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                    Select procedure and facility entitlement
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Procedure Selection */}
                <div>
                  <label
                    htmlFor="reconcile-proc-select"
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-navy-700)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Medical Procedure / Investigation ({procedures.length} entries)
                  </label>
                  <select
                    id="reconcile-proc-select"
                    value={selectedCode}
                    onChange={(e) => setSelectedCode(e.target.value)}
                    disabled={reconciling}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #cbd5e1',
                      backgroundColor: 'white',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-navy-900)',
                      cursor: reconciling ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {procedures.map((p) => (
                      <option key={p.procedure_code} value={p.procedure_code}>
                        [{p.procedure_code}] {p.procedure_name} ({p.speciality})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Facility Accreditation */}
                <div>
                  <label
                    htmlFor="reconcile-acc-select"
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-navy-700)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Hospital Accreditation
                  </label>
                  <select
                    id="reconcile-acc-select"
                    value={accreditation}
                    onChange={(e) => setAccreditation(e.target.value)}
                    disabled={reconciling}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #cbd5e1',
                      backgroundColor: 'white',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-navy-900)',
                      cursor: reconciling ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {selectedProcedure?.hospital_accreditation_options.map((acc) => (
                      <option key={acc} value={acc}>
                        {acc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ward Entitlement */}
                <div>
                  <label
                    htmlFor="reconcile-ward-select"
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-navy-700)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Ward Entitlement Category
                  </label>
                  <select
                    id="reconcile-ward-select"
                    value={wardEntitlement}
                    onChange={(e) => setWardEntitlement(e.target.value)}
                    disabled={reconciling}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #cbd5e1',
                      backgroundColor: 'white',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-navy-900)',
                      cursor: reconciling ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {selectedProcedure?.ward_entitlement_options.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City Category */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-navy-700)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    City Classification
                  </label>
                  <div
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-gray-100)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-navy-800)',
                      border: '1px solid var(--color-gray-200)',
                    }}
                  >
                    Tier 1 (X City: Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div>
            {reconciling ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                  Reconciling policy clauses with CGHS rate benchmark…
                </p>
              </div>
            ) : reconcileError ? (
              <div className="card" style={{ border: '1px solid #fecdd3' }}>
                <div className="card__body" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <AlertCircle size={32} color="var(--color-warning-500)" style={{ margin: '0 auto var(--space-3)' }} />
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-800)' }}>
                    Reconciliation Error
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', marginTop: 'var(--space-2)' }}>
                    {reconcileError}
                  </p>
                </div>
              </div>
            ) : reconcileResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* 1. CGHS Benchmark Section */}
                <div className="card" style={{ border: '1px solid #fde68a', borderLeft: '4px solid #d97706', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="card__body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                      <span className="badge" style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        CGHS Reference Benchmark Rate (13 Oct 2025)
                      </span>
                      <span className="badge badge--navy">[{reconcileResult.procedure_code}]</span>
                    </div>

                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-900)' }}>
                      {reconcileResult.procedure_name}
                    </h3>

                    {reconcileResult.benchmark_rate && (
                      <div
                        style={{
                          backgroundColor: '#022c22',
                          color: 'white',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-4)',
                          marginTop: 'var(--space-3)',
                          textAlign: 'center',
                          border: '1px solid #065f46'
                        }}
                      >
                        <p style={{ fontSize: 'var(--font-size-xs)', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Reference CGHS Benchmark Amount (MoHFW)
                        </p>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)', color: '#6ee7b7', margin: 'var(--space-1) 0', fontVariantNumeric: 'tabular-nums' }}>
                          ₹{reconcileResult.benchmark_rate.final_benchmark_rate_inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                        </div>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: '#ecfdf5' }}>
                          Facility: {reconcileResult.benchmark_rate.hospital_accreditation} • Ward: {reconcileResult.benchmark_rate.ward_entitlement}
                        </p>
                      </div>
                    )}
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--space-3)', fontStyle: 'italic' }}>
                      Informational Reference Benchmark: This rate reflects official CGHS 2025 standard rates, not an insurance payout or final hospital charge.
                    </p>
                  </div>
                </div>

                {/* 2. Active Policy Status & Retrieved Clauses Section */}
                <div className="card" style={{ border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="card__body">
                    <h4
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-navy-800)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 'var(--space-3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <BookOpen size={16} /> Policy Wording Clauses
                    </h4>

                    {!reconcileResult.has_active_policy ? (
                      <div className="info-box info-box--warning" style={{ margin: 0 }}>
                        <div className="info-box__icon"><AlertCircle size={18} /></div>
                        <div className="info-box__content">
                          <p className="info-box__title">No Active Policy Uploaded</p>
                          <p className="info-box__text">
                            No policy document is currently uploaded for comparison. Upload your health policy PDF in the Policy Analysis section to compare terms.
                          </p>
                        </div>
                      </div>
                    ) : !reconcileResult.has_relevant_clauses ? (
                      <div className="info-box info-box--accent" style={{ margin: 0 }}>
                        <div className="info-box__icon"><HelpCircle size={18} /></div>
                        <div className="info-box__content">
                          <p className="info-box__title">
                            Active Policy: {reconcileResult.policy_filename}
                          </p>
                          <p className="info-box__text">
                            No relevant clause was found in the passages retrieved for procedure query [{reconcileResult.procedure_code}]. Please inspect your complete policy schedule document or confirm terms with your insurer/TPA. This does not imply coverage or exclusion.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                          <span className="badge badge--teal">Active Policy: {reconcileResult.policy_filename}</span>
                          <span className="badge badge--navy">{reconcileResult.retrieved_policy_clauses.length} Clause(s) Found</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                          {reconcileResult.retrieved_policy_clauses.map((clause, idx) => (
                            <div
                              key={clause.chunk_id || idx}
                              style={{
                                border: '1px solid #fde68a',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-4)',
                                backgroundColor: '#fffbeb',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: '#92400e' }}>
                                  {clause.section_title}
                                </span>
                                <span className="badge badge--navy">Physical Page {clause.page_number}</span>
                              </div>
                              <blockquote
                                style={{
                                  fontSize: 'var(--font-size-xs)',
                                  color: 'var(--color-navy-900)',
                                  borderLeft: '3px solid #d97706',
                                  paddingLeft: 'var(--space-3)',
                                  margin: 0,
                                  fontStyle: 'normal',
                                  lineHeight: '1.6',
                                }}
                              >
                                "{clause.text}"
                              </blockquote>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Grounded Summary & Checklist */}
                <div className="card" style={{ border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="card__body">
                    <h4
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-navy-800)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 'var(--space-3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <FileText size={16} /> Grounded Reconciliation Summary
                    </h4>

                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-navy-800)',
                        lineHeight: '1.6',
                        backgroundColor: '#f0fdfa',
                        border: '1px solid #99f6e4',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-4)',
                        marginBottom: 'var(--space-5)',
                      }}
                    >
                      {reconcileResult.clause_summary}
                    </div>

                    <h4
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-navy-800)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 'var(--space-3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <Building2 size={16} /> Insurer / TPA Verification Checklist
                    </h4>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {reconcileResult.tpa_verification_checklist.map((item, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-navy-800)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 'var(--space-2)',
                            lineHeight: '1.5',
                          }}
                        >
                          <CheckCircle2 size={15} color="var(--color-teal-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4. Prominent Legal Disclaimer */}
                <div className="info-box info-box--warning">
                  <div className="info-box__icon"><ShieldCheck size={18} /></div>
                  <div className="info-box__content">
                    <p className="info-box__title">Important Notice & Disclaimer</p>
                    <p className="info-box__text">{reconcileResult.disclaimer}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
