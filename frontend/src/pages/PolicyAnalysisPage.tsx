/**
 * Policy Analysis page — interactive PDF upload, TOC breakdown, body clause explorer, neutral term mentions,
 * and Phase 2 RAG Question-Answering.
 */

import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Clock,
  Banknote,
  Search,
  BookOpen,
  RefreshCw,
  Eye,
  Info,
  ListOrdered,
  FileSearch,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { uploadPolicy, askPolicyQuestion, fetchActivePolicy } from '../services/api';
import type {
  PolicyUploadResponse,
  PolicySection,
  TermMention,
  PolicyQAResponse,
  EvidencePassage,
} from '../types';

const extractionFeatures = [
  { icon: <Shield size={18} />, label: 'Page-by-Page Text', sublabel: 'Preserves PDF page order and text' },
  { icon: <ListOrdered size={18} />, label: 'TOC Detection', sublabel: 'Separates contents from body clauses' },
  { icon: <FileSearch size={18} />, label: 'Term Mentions', sublabel: 'Locates mentions with page references' },
  { icon: <MessageSquare size={18} />, label: 'RAG Policy Q&A', sublabel: 'Grounded answers with page citations' },
  { icon: <Clock size={18} />, label: 'Waiting Periods', sublabel: 'Identifies clause page references' },
  { icon: <Banknote size={18} />, label: 'Sub-limits & Rent', sublabel: 'Scans for room capping terms' },
];

const sampleQuestions = [
  'What is the waiting period for pre-existing diseases?',
  'Is there a room rent limit or capping mentioned?',
  'What are the standard exclusions in this policy?',
  'What does the policy wording say about pre- and post-hospitalization?',
];

export default function PolicyAnalysisPage() {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [result, setResult] = useState<PolicyUploadResponse | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Filtering & view states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<PolicySection | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<TermMention | null>(null);
  const [activeTab, setActiveTab] = useState<'qa' | 'sections' | 'toc' | 'pages'>('qa');
  const [selectedPageNum, setSelectedPageNum] = useState<number>(1);

  // Q&A states
  const [questionInput, setQuestionInput] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [qaResponse, setQaResponse] = useState<PolicyQAResponse | null>(null);
  const [qaError, setQaError] = useState<string | null>(null);
  const [expandedPassageId, setExpandedPassageId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check active document on mount
  useEffect(() => {
    fetchActivePolicy()
      .then((active) => {
        if (active.has_active_document && active.filename) {
          // Document exists on backend
        }
      })
      .catch(() => {});
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are supported. Please select a valid .pdf document.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 15 MB.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setQaResponse(null);
    setQaError(null);

    try {
      const data = await uploadPolicy(file);
      setResult(data);
      if (data.sections.length > 0) {
        setSelectedSection(data.sections[0]);
      }
      setActiveTab('qa');
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred while processing the PDF file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isUploading) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isUploading && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleQuestionSubmit = async (e?: FormEvent, presetQuestion?: string) => {
    if (e) e.preventDefault();
    const q = presetQuestion || questionInput;

    if (!q || !q.trim()) {
      setQaError('Please enter a question to ask your policy.');
      return;
    }

    if (!result) {
      setQaError('Please upload a policy PDF first before asking questions.');
      return;
    }

    setIsAsking(true);
    setQaError(null);

    try {
      const res = await askPolicyQuestion(q.trim());
      setQaResponse(res);
      setQuestionInput(q);
    } catch (err: any) {
      setQaError(err.message || 'Failed to answer question.');
    } finally {
      setIsAsking(false);
    }
  };

  const filteredSections = result?.sections.filter((s) =>
    s.section_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.text_preview.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedPageData = result?.pages.find((p) => p.page === selectedPageNum);

  return (
    <div>
      {/* Hero */}
      <div className="page-hero" style={{ paddingBottom: 'var(--space-6)' }}>
        <h2 className="page-hero__title">Analyze your health insurance policy</h2>
        <p className="page-hero__description">
          Upload your policy PDF to extract sections, Table of Contents, and ask natural language questions with page citations.
        </p>
      </div>

      {/* Phase 2 Disclaimer Notice */}
      <div className="info-box info-box--accent" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="info-box__icon">
          <Info size={18} />
        </div>
        <div className="info-box__content">
          <p className="info-box__title">Phase 2 Document Intelligence Scope</p>
          <p className="info-box__text">
            Question-answering uses Retrieval-Augmented Generation (RAG) to locate source passages and provide cited answers.
            It does <strong>not</strong> make formal claim approval decisions or replace official insurance advice.
          </p>
        </div>
      </div>

      {/* Upload Box */}
      {!result && (
        <div
          className={`upload-area ${isDragOver ? 'upload-area--dragover' : ''}`}
          role="region"
          aria-label="Policy document upload"
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragOver ? '2px dashed var(--color-primary-500)' : '2px dashed var(--color-border-subtle)',
            backgroundColor: isDragOver ? 'var(--color-primary-50)' : 'var(--color-surface)',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            opacity: isUploading ? 0.7 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept=".pdf"
            disabled={isUploading}
            style={{ display: 'none' }}
          />

          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-primary-600)' }} />
              <p className="upload-area__title">Extracting & indexing policy document...</p>
              <p className="upload-area__text">Parsing PDF pages, Table of Contents, and preparing Q&A chunks with PyMuPDF</p>
            </div>
          ) : (
            <>
              <div className="upload-area__icon">
                <UploadCloud size={32} />
              </div>
              <p className="upload-area__title">Click to upload or drag & drop policy PDF</p>
              <p className="upload-area__text">
                Supports Indian Health Insurance PDFs (Max 15 MB)
              </p>
              <button
                type="button"
                className="btn btn--primary"
                disabled={isUploading}
                style={{ marginTop: 'var(--space-4)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Select PDF File
              </button>
            </>
          )}
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="info-box info-box--danger" style={{ marginTop: 'var(--space-4)' }}>
          <div className="info-box__icon">
            <AlertCircle size={20} color="var(--color-danger-600)" />
          </div>
          <div className="info-box__content">
            <p className="info-box__title">Upload Error</p>
            <p className="info-box__text">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Header Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
              padding: 'var(--space-4) var(--space-6)',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <CheckCircle2 size={24} color="var(--color-success-600)" />
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{result.filename}</h3>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {result.message}
                </p>
              </div>
            </div>
            <button
              className="btn btn--secondary"
              onClick={() => {
                setResult(null);
                setUploadError(null);
                setQaResponse(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <RefreshCw size={16} /> Upload Another Policy
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="metric-card">
              <span className="metric-card__label">Total Pages</span>
              <span className="metric-card__value">{result.total_pages}</span>
            </div>
            <div className="metric-card">
              <span className="metric-card__label">Body Sections</span>
              <span className="metric-card__value">{result.sections_count}</span>
            </div>
            <div className="metric-card">
              <span className="metric-card__label">TOC Entries</span>
              <span className="metric-card__value">{result.toc_entries.length}</span>
            </div>
            <div className="metric-card">
              <span className="metric-card__label">Extracted Characters</span>
              <span className="metric-card__value">{result.total_characters.toLocaleString()}</span>
            </div>
          </div>

          {/* Term Mentions */}
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 600 }}>
                Term Mention Analysis (Neutral Search)
              </h4>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                Click a badge to view source snippets
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {Object.values(result.term_mentions).map((tm) => {
                const isSelected = selectedTerm?.key === tm.key;
                return (
                  <button
                    key={tm.key}
                    onClick={() => setSelectedTerm(isSelected ? null : tm)}
                    style={{
                      padding: 'var(--space-1) var(--space-3)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--color-primary-600)' : '1px solid var(--color-border-subtle)',
                      backgroundColor: tm.is_mentioned ? 'var(--color-primary-50)' : 'var(--color-neutral-100)',
                      color: tm.is_mentioned ? 'var(--color-primary-800)' : 'var(--color-text-tertiary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{tm.label}</span>
                    <span
                      style={{
                        backgroundColor: tm.is_mentioned ? 'var(--color-primary-200)' : 'var(--color-neutral-200)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                      }}
                    >
                      {tm.in_toc_only
                        ? 'TOC Mention Only'
                        : tm.is_mentioned
                        ? `${tm.page_references.length} Pg${tm.page_references.length > 1 ? 's' : ''}`
                        : 'Not Found'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Term Snippets Detail */}
            {selectedTerm && (
              <div
                style={{
                  marginTop: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--color-neutral-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                    Source Snippets for "{selectedTerm.label}" (Total Mentions: {selectedTerm.mention_count})
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    Referenced Pages: {selectedTerm.page_references.join(', ') || 'None'}
                  </span>
                </div>
                {selectedTerm.snippets.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {selectedTerm.snippets.map((snip, idx) => (
                      <div key={idx} style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace', color: 'var(--color-text-main)' }}>
                        <strong style={{ color: 'var(--color-primary-600)' }}>Page {snip.page}:</strong> {snip.snippet}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', margin: 0 }}>
                    Term appears in Table of Contents index only.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border-subtle)', gap: 'var(--space-6)' }}>
            <button
              onClick={() => setActiveTab('qa')}
              style={{
                padding: 'var(--space-3) 0',
                fontSize: 'var(--font-size-md)',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === 'qa' ? '3px solid var(--color-primary-600)' : '3px solid transparent',
                color: activeTab === 'qa' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <MessageSquare size={18} /> Ask This Policy (RAG Q&A)
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              style={{
                padding: 'var(--space-3) 0',
                fontSize: 'var(--font-size-md)',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === 'sections' ? '3px solid var(--color-primary-600)' : '3px solid transparent',
                color: activeTab === 'sections' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <BookOpen size={18} /> Body Sections ({result.sections.length})
            </button>
            <button
              onClick={() => setActiveTab('toc')}
              style={{
                padding: 'var(--space-3) 0',
                fontSize: 'var(--font-size-md)',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === 'toc' ? '3px solid var(--color-primary-600)' : '3px solid transparent',
                color: activeTab === 'toc' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <ListOrdered size={18} /> Table of Contents ({result.toc_entries.length})
            </button>
            <button
              onClick={() => setActiveTab('pages')}
              style={{
                padding: 'var(--space-3) 0',
                fontSize: 'var(--font-size-md)',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === 'pages' ? '3px solid var(--color-primary-600)' : '3px solid transparent',
                color: activeTab === 'pages' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Eye size={18} /> Raw Page Text ({result.pages.length} Pages)
            </button>
          </div>

          {/* TAB 1: RAG Question-Answering Interface */}
          {activeTab === 'qa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Question Input Card */}
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <Sparkles size={20} style={{ color: 'var(--color-primary-600)' }} />
                  <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 600 }}>
                    Ask a question about {result.filename}
                  </h3>
                </div>

                {/* Sample Prompt Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', alignSelf: 'center' }}>
                    Try asking:
                  </span>
                  {sampleQuestions.map((sq, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setQuestionInput(sq);
                        handleQuestionSubmit(undefined, sq);
                      }}
                      disabled={isAsking}
                      style={{
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        backgroundColor: 'var(--color-neutral-100)',
                        border: '1px solid var(--color-border-subtle)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {sq}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleQuestionSubmit} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Ask what your policy says about room rent, waiting periods, exclusions..."
                    disabled={isAsking}
                    style={{
                      flex: 1,
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-subtle)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={isAsking || !questionInput.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: '120px' }}
                  >
                    {isAsking ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Asking...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Ask Policy
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Q&A Error */}
              {qaError && (
                <div className="info-box info-box--danger">
                  <div className="info-box__icon">
                    <AlertCircle size={18} />
                  </div>
                  <div className="info-box__content">
                    <p className="info-box__title">Question Error</p>
                    <p className="info-box__text">{qaError}</p>
                  </div>
                </div>
              )}

              {/* Q&A Answer & Evidence Results */}
              {qaResponse && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  {/* Answer Box */}
                  <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid var(--color-primary-300)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Sparkles size={18} color="var(--color-primary-600)" />
                        <h4 style={{ margin: 0, fontWeight: 600, fontSize: 'var(--font-size-md)' }}>
                          Grounded Policy Answer
                        </h4>
                      </div>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          padding: '2px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 600,
                          backgroundColor: qaResponse.llm_configured ? 'var(--color-primary-100)' : 'var(--color-warning-100)',
                          color: qaResponse.llm_configured ? 'var(--color-primary-800)' : 'var(--color-warning-800)',
                          border: `1px solid ${qaResponse.llm_configured ? 'var(--color-primary-300)' : 'var(--color-warning-300)'}`,
                        }}
                      >
                        {qaResponse.llm_configured ? 'AI Grounded Answer' : 'Offline Evidence Retrieval Mode'}
                      </span>
                    </div>

                    {/* Warning Notice if LLM key not configured */}
                    {!qaResponse.llm_configured && (
                      <div className="info-box info-box--warning" style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="info-box__icon">
                          <Info size={18} />
                        </div>
                        <div className="info-box__content">
                          <p className="info-box__title">Gemini API Key Unconfigured</p>
                          <p className="info-box__text">
                            <code>GEMINI_API_KEY</code> is not configured in <code>backend/.env</code>.
                            Top relevant source passages with physical page citations were retrieved below.
                            To enable Gemini AI text generation, set your API key in <code>.env</code> and restart backend.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Insufficient Evidence Warning */}
                    {!qaResponse.has_sufficient_evidence && (
                      <div className="info-box info-box--warning" style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="info-box__icon">
                          <AlertCircle size={18} />
                        </div>
                        <div className="info-box__content">
                          <p className="info-box__title">Insufficient Evidence in Policy</p>
                          <p className="info-box__text">
                            No highly relevant policy passages were found matching this question.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Main Answer Text */}
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontSize: 'var(--font-size-sm)',
                        lineHeight: 1.7,
                        color: 'var(--color-text-main)',
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--color-neutral-50)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-subtle)',
                        marginBottom: 'var(--space-4)',
                      }}
                    >
                      {qaResponse.answer}
                    </div>

                    {/* Page Citations */}
                    {qaResponse.citations && qaResponse.citations.length > 0 && (
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 'var(--space-2)' }}>
                          Cited Physical PDF Pages & Sections:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                          {qaResponse.citations.map((cite, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: 'var(--font-size-xs)',
                                padding: '3px 10px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--color-primary-50)',
                                color: 'var(--color-primary-800)',
                                border: '1px solid var(--color-primary-300)',
                                fontWeight: 500,
                              }}
                            >
                              📌 {cite}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Evidence Passages Cards */}
                  <div className="card" style={{ padding: 'var(--space-6)' }}>
                    <h4 style={{ margin: '0 0 var(--space-4) 0', fontWeight: 600 }}>
                      Retrieved Evidence Passages ({qaResponse.evidence_passages.length} Passages)
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {qaResponse.evidence_passages.map((passage: EvidencePassage) => {
                        const isExpanded = expandedPassageId === passage.chunk_id;
                        return (
                          <div
                            key={passage.chunk_id}
                            style={{
                              padding: 'var(--space-4)',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <span
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    backgroundColor: 'var(--color-primary-100)',
                                    color: 'var(--color-primary-800)',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontWeight: 600,
                                  }}
                                >
                                  Physical Page {passage.page_number}
                                </span>
                                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-main)' }}>
                                  {passage.section_title}
                                </span>
                              </div>
                              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                                Relevance Score: {(passage.relevance_score * 100).toFixed(0)}%
                              </span>
                            </div>

                            <pre
                              style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontFamily: 'monospace',
                                fontSize: 'var(--font-size-xs)',
                                lineHeight: 1.6,
                                color: 'var(--color-text-main)',
                                backgroundColor: 'var(--color-neutral-50)',
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-sm)',
                                margin: 0,
                                maxHeight: isExpanded ? 'none' : '100px',
                                overflow: 'hidden',
                                border: '1px solid var(--color-border-subtle)',
                              }}
                            >
                              {passage.text}
                            </pre>

                            {passage.text.length > 200 && (
                              <button
                                onClick={() => setExpandedPassageId(isExpanded ? null : passage.chunk_id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--color-primary-600)',
                                  fontSize: 'var(--font-size-xs)',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  marginTop: 'var(--space-2)',
                                  padding: 0,
                                }}
                              >
                                {isExpanded ? 'Collapse Passage' : 'Show Full Passage'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Body Sections */}
          {activeTab === 'sections' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
              <div>
                <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
                  <Search
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 'var(--space-3)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-tertiary)',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search body sections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-8)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-subtle)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: '600px', overflowY: 'auto' }}>
                  {filteredSections.map((sec, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedSection(sec)}
                      style={{
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: selectedSection === sec ? 'var(--color-primary-50)' : 'var(--color-surface)',
                        border: selectedSection === sec ? '1px solid var(--color-primary-500)' : '1px solid var(--color-border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-main)' }}>
                          {sec.section_title}
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            backgroundColor: 'var(--color-neutral-100)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--color-text-secondary)',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Physical Pg {sec.page_number}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.5,
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {sec.text_preview}
                      </p>
                    </div>
                  ))}
                  {filteredSections.length === 0 && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 'var(--space-6)' }}>
                      No sections matching "{searchTerm}".
                    </p>
                  )}
                </div>
              </div>

              <div>
                {selectedSection ? (
                  <div className="card" style={{ padding: 'var(--space-6)', height: '100%', maxHeight: '660px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-3)' }}>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)', fontWeight: 600, textTransform: 'uppercase' }}>
                          Physical PDF Page {selectedSection.page_number} Body Clause
                        </span>
                        <h3 style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--font-size-md)', fontWeight: 600 }}>
                          {selectedSection.section_title}
                        </h3>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                        {selectedSection.char_count} chars
                      </span>
                    </div>

                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: 'var(--font-size-xs)',
                        lineHeight: 1.6,
                        color: 'var(--color-text-main)',
                        backgroundColor: 'var(--color-neutral-50)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      {selectedSection.full_text}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-tertiary)' }}>
                    Select a section from the left list to view full body text.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Table of Contents Outline */}
          {activeTab === 'toc' && (
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600 }}>Table of Contents Index (Parsed from Page 1)</h4>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    Printed page numbers as referenced in the document's contents index.
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-3)' }}>
                {result.toc_entries.map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-neutral-50)',
                      border: '1px solid var(--color-border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-main)' }}>
                      {entry.title}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        backgroundColor: 'var(--color-primary-100)',
                        color: 'var(--color-primary-800)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600,
                      }}
                    >
                      Printed Pg {entry.printed_page}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Raw Page Text */}
          {activeTab === 'pages' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <label style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Select Physical PDF Page:</label>
                <select
                  value={selectedPageNum}
                  onChange={(e) => setSelectedPageNum(Number(e.target.value))}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {result.pages.map((p) => (
                    <option key={p.page} value={p.page}>
                      Page {p.page} {p.has_text ? `(${p.character_count} chars)` : '(No Text / Scanned Page)'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPageData && (
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                    <h4 style={{ margin: 0, fontWeight: 600 }}>Raw Page Text — Physical Page {selectedPageData.page}</h4>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                      {selectedPageData.character_count} characters
                    </span>
                  </div>

                  {!selectedPageData.has_text ? (
                    <div className="info-box info-box--warning">
                      <div className="info-box__icon">
                        <AlertCircle size={18} />
                      </div>
                      <div className="info-box__content">
                        <p className="info-box__title">No Extractable Text Found on Page {selectedPageData.page}</p>
                        <p className="info-box__text">
                          This page appears to be empty, image-only, or contains non-standard text.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: 'var(--font-size-xs)',
                        lineHeight: 1.6,
                        color: 'var(--color-text-main)',
                        backgroundColor: 'var(--color-neutral-50)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        maxHeight: '500px',
                        overflowY: 'auto',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      {selectedPageData.text}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Feature Overview when no result */}
      {!result && (
        <div className="section" style={{ marginTop: 'var(--space-8)' }}>
          <div className="section__header">
            <h3 className="section__title">Phase 2 Policy Intelligence Capabilities</h3>
            <p className="section__description">
              Upload any health insurance policy PDF to extract structural data and ask natural language questions with physical page citations.
            </p>
          </div>

          <div className="feature-grid">
            {extractionFeatures.map((feature) => (
              <div className="feature-item" key={feature.label}>
                <div className="feature-item__icon">{feature.icon}</div>
                <div>
                  <p className="feature-item__label">{feature.label}</p>
                  <p className="feature-item__sublabel">{feature.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
