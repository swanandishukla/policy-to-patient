/**
 * Treatment Estimate page — CGHS 2025 Treatment Rate Benchmark & Calculator (Phase 3).
 * Uses deterministic arithmetic lookup against traceable official CGHS rate dataset.
 */

import { useState, useEffect } from 'react';
import {
  Calculator,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { fetchProcedures, calculateEstimate } from '../services/api';
import type { ProcedureItem, TreatmentEstimateResponse } from '../types';

export default function TreatmentEstimatePage() {
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [sourceMetadata, setSourceMetadata] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form selections
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [accreditation, setAccreditation] = useState<string>('NABH');
  const [wardEntitlement, setWardEntitlement] = useState<string>('Semi-Private Ward');
  const [cityCategory] = useState<string>('Tier 1 (X City)');

  // Calculation result
  const [estimate, setEstimate] = useState<TreatmentEstimateResponse | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Load procedures list on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProcedures();
        setProcedures(data.procedures);
        setSourceMetadata(data.source_metadata);

        if (data.procedures.length > 0) {
          const first = data.procedures[0];
          setSelectedCode(first.procedure_code);
          if (first.hospital_accreditation_options.length > 0) {
            setAccreditation(first.hospital_accreditation_options.includes('NABH') ? 'NABH' : first.hospital_accreditation_options[0]);
          }
          if (first.ward_entitlement_options.length > 0) {
            setWardEntitlement(first.ward_entitlement_options.includes('Semi-Private Ward') ? 'Semi-Private Ward' : first.ward_entitlement_options[0]);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load treatment rate benchmark dataset.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update estimate whenever procedure or category selections change
  useEffect(() => {
    if (!selectedCode) {
      setEstimate(null);
      return;
    }

    const currentProc = procedures.find(p => p.procedure_code === selectedCode);
    if (!currentProc) return;

    // Validate that currently selected accreditation & ward exist for this procedure
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

    async function runCalculation() {
      try {
        setCalculating(true);
        setCalcError(null);
        const result = await calculateEstimate({
          procedure_code: selectedCode,
          hospital_accreditation: effectiveAccreditation,
          ward_entitlement: effectiveWard,
          city_category: cityCategory,
        });
        setEstimate(result);
      } catch (err: any) {
        setCalcError(err.message || 'No verified benchmark rate available for this selection');
        setEstimate(null);
      } finally {
        setCalculating(false);
      }
    }

    runCalculation();
  }, [selectedCode, accreditation, wardEntitlement, cityCategory, procedures]);

  const selectedProcedure = procedures.find(p => p.procedure_code === selectedCode);

  return (
    <div>
      {/* Hero Header */}
      <div className="page-hero" style={{ paddingBottom: 'var(--space-6)' }}>
        <h2 className="page-hero__title">Transparent Treatment Rate Benchmark Calculator</h2>
        <p className="page-hero__description">
          Select a verified medical procedure or investigation from our curated CGHS 2025 MVP benchmark subset to inspect
          traceable reference rates, ward entitlement rules, and exact line-item arithmetic logic.
        </p>
      </div>

      {/* Dataset & Scope Banner */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, rgba(20, 184, 166, 0.08) 100%)', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
        <div className="card__body" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--color-teal-500)', color: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} />
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-800)' }}>
                Curated MVP Reference Benchmark: CGHS Schedule 2025
              </h3>
              <span className="badge badge--teal">Curated Subset</span>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', marginTop: 'var(--space-1)', lineHeight: '1.5' }}>
              Document Ref: <strong>F.No.5-16/CGHS(HQ)/HEC/2024(Part I)</strong> • Effective Date: <strong>13 October 2025</strong> (may be subject to future official amendments) • Scope: <strong>Tier 1 / X Cities</strong>
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--space-1)' }}>
              Note: This dataset contains a curated MVP subset of 10 representative entries, not a complete hospital rate catalogue.
            </p>
            {sourceMetadata && (
              <a
                href={sourceMetadata.official_source_url}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--font-size-xs)', color: 'var(--color-teal-600)', fontWeight: 'var(--font-weight-semibold)', marginTop: 'var(--space-2)' }}
              >
                Inspect Official 2025 Schedule PDF <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>Loading verified procedure rate dataset…</p>
        </div>
      ) : error ? (
        <div className="info-box info-box--warning">
          <div className="info-box__icon"><AlertCircle size={18} /></div>
          <div className="info-box__content">
            <p className="info-box__title">Dataset Load Error</p>
            <p className="info-box__text">{error}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
          {/* Controls Form */}
          <div className="card">
            <div className="card__body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <div className="step__icon" style={{ width: '36px', height: '36px', margin: 0 }}>
                  <Calculator size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-800)' }}>
                    Select Treatment Scenario
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                    Choose a procedure and facility parameters
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Procedure Selection */}
                <div>
                  <label htmlFor="procedure-select" style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-700)', marginBottom: 'var(--space-1)' }}>
                    Treatment Procedure / Investigation ({procedures.length} curated entries)
                  </label>
                  <select
                    id="procedure-select"
                    value={selectedCode}
                    onChange={(e) => setSelectedCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-gray-300)',
                      backgroundColor: 'white',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-navy-900)',
                      cursor: 'pointer',
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
                  <label htmlFor="accreditation-select" style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-700)', marginBottom: 'var(--space-1)' }}>
                    Hospital Accreditation Type
                  </label>
                  <select
                    id="accreditation-select"
                    value={accreditation}
                    onChange={(e) => setAccreditation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-gray-300)',
                      backgroundColor: 'white',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-navy-900)',
                      cursor: 'pointer',
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
                  <label htmlFor="ward-select" style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-700)', marginBottom: 'var(--space-1)' }}>
                    Ward Entitlement Category
                  </label>
                  <select
                    id="ward-select"
                    value={wardEntitlement}
                    onChange={(e) => setWardEntitlement(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-gray-300)',
                      backgroundColor: 'white',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-navy-900)',
                      cursor: 'pointer',
                    }}
                  >
                    {selectedProcedure?.ward_entitlement_options.map((w) => (
                      <option key={w} value={w}>
                        {w} {w === 'General Ward' ? '(-5% package rate)' : w === 'Private Ward' ? '(+5% package rate)' : '(Base rate)'}
                      </option>
                    ))}
                  </select>
                  {!selectedProcedure?.is_ward_dependent && (
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-teal-700)', marginTop: 'var(--space-1)', fontStyle: 'italic' }}>
                      Note: Uniform investigation rate applies across all ward categories as per OM Rule 2(e).
                    </p>
                  )}
                </div>

                {/* City Category */}
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-700)', marginBottom: 'var(--space-1)' }}>
                    City Classification
                  </label>
                  <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-gray-100)', fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-800)', border: '1px solid var(--color-gray-200)' }}>
                    Tier 1 (X City: Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Output */}
          <div>
            {calculating ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>Calculating deterministic benchmark estimate…</p>
              </div>
            ) : calcError ? (
              <div className="card">
                <div className="card__body" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <AlertCircle size={32} color="var(--color-warning-500)" style={{ margin: '0 auto var(--space-3)' }} />
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-800)' }}>
                    No Verified Benchmark Rate Available
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', marginTop: 'var(--space-2)' }}>
                    {calcError}
                  </p>
                </div>
              </div>
            ) : estimate ? (
              <div className="card">
                <div className="card__body">
                  {/* Result Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-gray-200)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <div>
                      <span className="badge badge--navy" style={{ marginBottom: 'var(--space-1)' }}>
                        Code: {estimate.procedure_code}
                      </span>
                      <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-900)' }}>
                        {estimate.procedure_name}
                      </h3>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                        Speciality: {estimate.speciality} • {estimate.rate_unit_or_package_basis}
                      </p>
                    </div>
                  </div>

                  {/* Benchmark Price Hero */}
                  <div style={{ backgroundColor: 'var(--color-navy-900)', color: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', textAlign: 'center', marginBottom: 'var(--space-5)' }}>
                    <p style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)' }}>
                      Official CGHS Reference Benchmark Rate
                    </p>
                    <div style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-teal-300)', margin: 'var(--space-2) 0' }}>
                      ₹{estimate.final_benchmark_rate_inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                    </div>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.8)' }}>
                      Facility: {estimate.hospital_accreditation} • Ward: {estimate.ward_entitlement}
                    </p>
                  </div>

                  {/* Calculation Arithmetic Breakdown */}
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-800)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <FileText size={14} /> Calculation Arithmetic
                    </h4>
                    <div style={{ backgroundColor: 'var(--color-gray-50)', border: '1px solid var(--color-gray-200)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-900)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {estimate.calculation_breakdown}
                    </div>
                  </div>

                  {/* Source Provenance */}
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-800)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Building2 size={14} /> Source Provenance
                    </h4>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <div><strong>Document:</strong> {estimate.source_details.source_document}</div>
                      <div><strong>Location:</strong> {estimate.source_details.source_page_or_table}</div>
                      <div><strong>Effective From:</strong> {estimate.source_details.effective_from}</div>
                      <div><strong>Status:</strong> <span className="badge badge--teal">{estimate.source_details.verification_status}</span></div>
                    </div>
                  </div>

                  {/* Mandated Disclaimer */}
                  <div className="info-box info-box--warning" style={{ marginTop: 'var(--space-4)' }}>
                    <div className="info-box__icon"><AlertCircle size={16} /></div>
                    <div className="info-box__content">
                      <p className="info-box__title">Reference Disclaimer</p>
                      <p className="info-box__text">{estimate.disclaimer}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Distinction Info Card */}
      <div className="info-box info-box--accent" style={{ marginTop: 'var(--space-8)' }}>
        <div className="info-box__icon">
          <HelpCircle size={18} />
        </div>
        <div className="info-box__content">
          <p className="info-box__title">Phase 3 — Deterministic Benchmark & Separation of Concerns</p>
          <p className="info-box__text">
            This treatment-rate benchmark calculator operates strictly on verified deterministic rules from official CGHS schedules.
            It does not use machine learning or LLM models to predict hospital billing or insurance payouts. Policy Q&A analysis
            and treatment-rate benchmarking remain independent functions in this release.
          </p>
        </div>
      </div>
    </div>
  );
}
