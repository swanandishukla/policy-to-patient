/**
 * CoverageCalculatorView — Milestone B Rule-Based Coverage & Out-of-Pocket Calculator.
 * Combines CGHS benchmark rates with user-confirmed policy terms (Sum Insured, Co-pay, Sub-limit)
 * to produce transparent payable/out-of-pocket estimates and arithmetic reasoning trails.
 */

import { useState, useEffect } from 'react';
import {
  Calculator,
  ShieldCheck,
  FileText,
  AlertCircle,
  Building2,
  DollarSign,
} from 'lucide-react';
import { fetchProcedures, calculateCoverage } from '../services/api';
import type { ProcedureItem, CoverageCalculateResponse } from '../types';

export default function CoverageCalculatorView() {
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState<boolean>(true);
  const [procError, setProcError] = useState<string | null>(null);

  // Form selections
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [accreditation, setAccreditation] = useState<string>('NABH');
  const [wardEntitlement, setWardEntitlement] = useState<string>('Semi-Private Ward');
  const [cityCategory] = useState<string>('Tier 1 (X City)');

  // User-confirmed policy values
  const [sumInsured, setSumInsured] = useState<string>('500000');
  const [coPayPercent, setCoPayPercent] = useState<string>('10');
  const [copayClauseRef, setCopayClauseRef] = useState<string>('Section C.4, Page 18');
  const [subLimit, setSubLimit] = useState<string>('10000');
  const [sublimitClauseRef, setSublimitClauseRef] = useState<string>('Section C.1.b, Page 31');

  // Calculation result state
  const [coverageResult, setCoverageResult] = useState<CoverageCalculateResponse | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [calcError, setCalcError] = useState<string | null>(null);

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

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const sumInsuredNum = parseFloat(sumInsured);
    const coPayNum = parseFloat(coPayPercent);
    const subLimitNum = subLimit.trim() ? parseFloat(subLimit) : null;

    if (isNaN(sumInsuredNum) || sumInsuredNum <= 0) {
      setCalcError('Please enter a valid positive Sum Insured amount in INR.');
      return;
    }

    if (isNaN(coPayNum) || coPayNum < 0 || coPayNum > 100) {
      setCalcError('Please enter a valid Co-pay percentage between 0 and 100.');
      return;
    }

    if (subLimitNum !== null && (isNaN(subLimitNum) || subLimitNum <= 0)) {
      setCalcError('Sub-limit must be a positive number if provided, or left blank.');
      return;
    }

    try {
      setCalculating(true);
      setCalcError(null);
      const res = await calculateCoverage({
        procedure_code: selectedCode,
        hospital_accreditation: accreditation,
        ward_entitlement: wardEntitlement,
        city_category: cityCategory,
        sum_insured: sumInsuredNum,
        co_pay_percent: coPayNum,
        applicable_sub_limit: subLimitNum,
        copay_clause_reference: copayClauseRef,
        sublimit_clause_reference: sublimitClauseRef,
      });
      setCoverageResult(res);
    } catch (err: any) {
      setCalcError(err.message || 'Coverage calculation failed.');
      setCoverageResult(null);
    } finally {
      setCalculating(false);
    }
  };

  // Auto-calculate on initial dataset load once selectedCode is available
  useEffect(() => {
    if (selectedCode && !coverageResult && !calculating) {
      handleCalculate();
    }
  }, [selectedCode]);

  const selectedProcedure = procedures.find((p) => p.procedure_code === selectedCode);

  return (
    <div className="coverage-calculator-view">
      {/* Intro Banner */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-6)',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.05) 0%, rgba(13, 148, 136, 0.06) 100%)',
          border: '1px solid rgba(13, 148, 136, 0.25)',
        }}
      >
        <div
          className="card__body"
          style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}
        >
          <div
            style={{
              background: 'var(--color-teal-600)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DollarSign size={24} />
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-900)' }}>
                Rule-Based Coverage & Out-of-Pocket Estimator
              </h3>
              <span className="badge badge--teal">Rule-Based Estimator</span>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', marginTop: 'var(--space-1)', lineHeight: '1.5' }}>
              Combines official CGHS treatment reference benchmarks with your user-confirmed policy parameters (Sum Insured, Co-pay %, Sub-limits) to generate transparent out-of-pocket estimates and step-by-step arithmetic reasoning trails.
            </p>
          </div>
        </div>
      </div>

      {loadingProcedures ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
            Loading treatment procedure dataset…
          </p>
        </div>
      ) : procError ? (
        <div className="info-box info-box--warning">
          <div className="info-box__icon"><AlertCircle size={18} /></div>
          <div className="info-box__content">
            <p className="info-box__title">Dataset Error</p>
            <p className="info-box__text">{procError}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
          {/* Form Controls */}
          <div className="card">
            <div className="card__body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <div className="step__icon" style={{ width: '36px', height: '36px', margin: 0 }}>
                  <Calculator size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-800)' }}>
                    Input Parameters
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                    Enter user-confirmed policy values
                  </p>
                </div>
              </div>

              <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Procedure Selection */}
                <div>
                  <label
                    htmlFor="cov-proc-select"
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-navy-700)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Treatment Procedure / Investigation
                  </label>
                  <select
                    id="cov-proc-select"
                    value={selectedCode}
                    onChange={(e) => setSelectedCode(e.target.value)}
                    disabled={calculating}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-gray-300)',
                      backgroundColor: 'white',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-navy-900)',
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
                    htmlFor="cov-acc-select"
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
                    id="cov-acc-select"
                    value={accreditation}
                    onChange={(e) => setAccreditation(e.target.value)}
                    disabled={calculating}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-gray-300)',
                      backgroundColor: 'white',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-navy-900)',
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
                    htmlFor="cov-ward-select"
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
                    id="cov-ward-select"
                    value={wardEntitlement}
                    onChange={(e) => setWardEntitlement(e.target.value)}
                    disabled={calculating}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-gray-300)',
                      backgroundColor: 'white',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-navy-900)',
                    }}
                  >
                    {selectedProcedure?.ward_entitlement_options.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sum Insured (Required) */}
                <div>
                  <label
                    htmlFor="cov-sum-insured"
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-navy-700)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Policy Sum Insured (INR) *
                  </label>
                  <input
                    id="cov-sum-insured"
                    type="number"
                    value={sumInsured}
                    onChange={(e) => setSumInsured(e.target.value)}
                    placeholder="e.g. 500000"
                    disabled={calculating}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-gray-300)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  />
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: '2px', display: 'block' }}>
                    User-confirmed from policy schedule
                  </span>
                </div>

                {/* Co-Pay Percentage */}
                <div>
                  <label
                    htmlFor="cov-copay"
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-navy-700)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Co-Payment Percentage (0 to 100%)
                  </label>
                  <input
                    id="cov-copay"
                    type="number"
                    value={coPayPercent}
                    onChange={(e) => setCoPayPercent(e.target.value)}
                    placeholder="e.g. 10"
                    disabled={calculating}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-gray-300)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  />
                </div>

                {/* Co-Pay Clause Reference */}
                <div>
                  <label
                    htmlFor="cov-copay-ref"
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-navy-700)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Co-Pay Section / Page Reference (Optional)
                  </label>
                  <input
                    id="cov-copay-ref"
                    type="text"
                    value={copayClauseRef}
                    onChange={(e) => setCopayClauseRef(e.target.value)}
                    placeholder="e.g. Section C.4, Page 18"
                    disabled={calculating}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-gray-300)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  />
                </div>

                {/* Procedure Sub-Limit */}
                <div>
                  <label
                    htmlFor="cov-sublimit"
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-navy-700)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Procedure Sub-Limit Amount in INR (Optional)
                  </label>
                  <input
                    id="cov-sublimit"
                    type="number"
                    value={subLimit}
                    onChange={(e) => setSubLimit(e.target.value)}
                    placeholder="Leave blank if no sub-limit applies"
                    disabled={calculating}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-gray-300)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  />
                </div>

                {/* Sub-Limit Clause Reference */}
                <div>
                  <label
                    htmlFor="cov-sublimit-ref"
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-navy-700)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Sub-Limit Section / Page Reference (Optional)
                  </label>
                  <input
                    id="cov-sublimit-ref"
                    type="text"
                    value={sublimitClauseRef}
                    onChange={(e) => setSublimitClauseRef(e.target.value)}
                    placeholder="e.g. Section C.1.b, Page 31"
                    disabled={calculating}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-gray-300)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={calculating}
                  className="btn btn--primary"
                  style={{ marginTop: 'var(--space-2)', width: '100%' }}
                >
                  {calculating ? 'Calculating Coverage…' : 'Calculate Estimated Out-of-Pocket'}
                </button>
              </form>
            </div>
          </div>

          {/* Results Output Panel */}
          <div>
            {calculating ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                  Calculating rule-based coverage estimate…
                </p>
              </div>
            ) : calcError ? (
              <div className="card">
                <div className="card__body" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <AlertCircle size={32} color="var(--color-warning-500)" style={{ margin: '0 auto var(--space-3)' }} />
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-800)' }}>
                    Calculation Error
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', marginTop: 'var(--space-2)' }}>
                    {calcError}
                  </p>
                </div>
              </div>
            ) : coverageResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* Estimate Summary Hero Card */}
                <div className="card" style={{ backgroundColor: 'var(--color-navy-900)', color: 'white' }}>
                  <div className="card__body">
                    <span className="badge badge--teal" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Rule-Based Coverage Estimate
                    </span>
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'white', marginTop: 'var(--space-2)' }}>
                      [{coverageResult.procedure_code}] {coverageResult.procedure_name}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                      <div style={{ backgroundColor: 'rgba(13, 148, 136, 0.2)', border: '1px solid rgba(20, 184, 166, 0.4)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', textAlign: 'center' }}>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-teal-200)', textTransform: 'uppercase' }}>
                          Estimated Insurer Payable
                        </p>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-teal-300)', marginTop: '4px' }}>
                          ₹{coverageResult.estimated_insurer_payable_inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                        </div>
                      </div>

                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', textAlign: 'center' }}>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: '#fca5a5', textTransform: 'uppercase' }}>
                          Estimated Patient Out-of-Pocket
                        </p>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-bold)', color: '#f87171', marginTop: '4px' }}>
                          ₹{coverageResult.estimated_out_of_pocket_inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
                      CGHS Benchmark Rate: <strong>₹{coverageResult.benchmark_amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR</strong> • Applicable Baseline: <strong>₹{coverageResult.applicable_amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR</strong>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Reasoning Trail */}
                <div className="card">
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
                      <FileText size={16} /> Transparent Reasoning Trail & Arithmetic
                    </h4>

                    <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {coverageResult.reasoning_trail.map((step, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-navy-900)',
                            backgroundColor: 'var(--color-gray-50)',
                            border: '1px solid var(--color-gray-200)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-3)',
                            lineHeight: '1.6',
                          }}
                        >
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Provenance & Disclaimers */}
                <div className="card">
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
                      <Building2 size={16} /> Input Provenance & Policy Values
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)' }}>
                      <div><strong>Sum Insured:</strong> {coverageResult.provenance_notes.sum_insured}</div>
                      <div><strong>Co-Payment:</strong> {coverageResult.provenance_notes.co_pay}</div>
                      <div><strong>Procedure Sub-Limit:</strong> {coverageResult.provenance_notes.sub_limit}</div>
                      <div><strong>Verification Status:</strong> <span className="badge badge--navy">{coverageResult.provenance_notes.verification_status}</span></div>
                    </div>
                  </div>
                </div>

                {/* Mandated Disclaimer */}
                <div className="info-box info-box--warning">
                  <div className="info-box__icon"><ShieldCheck size={18} /></div>
                  <div className="info-box__content">
                    <p className="info-box__title">Informational Estimate Disclaimer</p>
                    <p className="info-box__text">{coverageResult.disclaimer}</p>
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
