import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ContentReview, Finding, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  MessageSquare,
  History,
  FileCheck2,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  Layers,
  HelpCircle,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export const ReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [review, setReview] = useState<ContentReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'FINDINGS' | 'WORKFLOW' | 'COMMENTS' | 'VERSIONS'>('FINDINGS');

  // Draft editing state
  const [draftContent, setDraftContent] = useState('');
  const [revisionSummary, setRevisionSummary] = useState('');
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [isSavingRevision, setIsSavingRevision] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // Approval actions modal
  const [showApprovalModal, setShowApprovalModal] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [replyParentId, setReplyParentId] = useState<string | null>(null);

  const fetchReview = async (version?: number) => {
    try {
      const res = await api.get(`/reviews/${id}`, {
        params: { version },
      });
      setReview(res.data);
      const activeVer = res.data.activeVersion;
      if (activeVer) {
        setSelectedVersionNum(activeVer.versionNum);
        setDraftContent(activeVer.contentBody);
      }
    } catch (err) {
      console.error('Failed to load review:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReview();
    }
  }, [id]);

  // Apply a suggested correction to the active draft content
  const handleApplyCorrection = async (finding: Finding) => {
    if (!finding.suggestedCorrection) return;

    try {
      await api.post(`/findings/${finding.id}/apply-correction`);

      // Replace excerpt in draft content
      if (draftContent.includes(finding.excerpt)) {
        const updated = draftContent.replace(finding.excerpt, finding.suggestedCorrection);
        setDraftContent(updated);
        setIsEditingDraft(true);
      }

      await fetchReview(selectedVersionNum);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to apply correction.');
    }
  };

  // Accept All Safe Corrections
  const handleApplyAllSafe = async () => {
    if (!review?.activeFindings) return;

    let updatedContent = draftContent;
    const safeFindings = review.activeFindings.filter(
      (f) => f.status === 'OPEN' && f.suggestedCorrection && !f.isUnverified
    );

    if (safeFindings.length === 0) {
      alert('No safe corrections available to apply.');
      return;
    }

    if (!window.confirm(`Apply ${safeFindings.length} verified corrections to the working draft?`)) {
      return;
    }

    for (const f of safeFindings) {
      if (f.suggestedCorrection && updatedContent.includes(f.excerpt)) {
        updatedContent = updatedContent.replace(f.excerpt, f.suggestedCorrection);
        await api.patch(`/findings/${f.id}`, { status: 'ACCEPTED' });
      }
    }

    setDraftContent(updatedContent);
    setIsEditingDraft(true);
    await fetchReview(selectedVersionNum);
  };

  // Save new revised version
  const handleSaveRevision = async () => {
    if (!draftContent.trim()) {
      alert('Content cannot be empty.');
      return;
    }

    setIsSavingRevision(true);
    try {
      await api.post(`/reviews/${id}/revise`, {
        revisedContent: draftContent,
        summaryOfChanges: revisionSummary || `Revision with applied AI brand corrections`,
      });

      setIsEditingDraft(false);
      setRevisionSummary('');
      await fetchReview(); // loads newest version
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save revision.');
    } finally {
      setIsSavingRevision(false);
    }
  };

  // Re-run AI review analysis
  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      await api.post(`/reviews/${id}/analyze`);
      await fetchReview(selectedVersionNum);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to re-analyze.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Execute approval decision
  const handleExecuteDecision = async () => {
    if (!showApprovalModal) return;
    setActionError(null);
    setIsSubmittingDecision(true);

    try {
      if (showApprovalModal === 'APPROVE') {
        await api.post(`/approvals/${id}/approve`, { reason: decisionReason });
      } else if (showApprovalModal === 'REQUEST_CHANGES') {
        if (!decisionReason.trim()) {
          setActionError('A detailed reason is required when requesting changes.');
          setIsSubmittingDecision(false);
          return;
        }
        await api.post(`/approvals/${id}/request-changes`, { reason: decisionReason });
      } else if (showApprovalModal === 'REJECT') {
        if (!decisionReason.trim()) {
          setActionError('A reason is required to reject content.');
          setIsSubmittingDecision(false);
          return;
        }
        await api.post(`/approvals/${id}/reject`, { reason: decisionReason });
      }

      setShowApprovalModal(null);
      setDecisionReason('');
      await fetchReview();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Action failed.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Submit comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await api.post(`/reviews/${id}/comments`, {
        content: commentText,
        parentId: replyParentId,
      });
      setCommentText('');
      setReplyParentId(null);
      await fetchReview(selectedVersionNum);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post comment.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading AI Correction Workspace...</p>
        </div>
      </div>
    );
  }

  if (!review) return null;

  const isCreatorOfThisReview = user?.id === review.creatorId;
  const canApproveOrReview = ['REVIEWER', 'BRAND_MANAGER', 'ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Metadata Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1F293D]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reviews')}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to reviews"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-black text-white">{review.title}</h1>
              <StatusBadge status={review.status} />
              {review.isDemoRecord && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Demo Fixture
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="font-mono text-purple-400">{review.contentType}</span>
              <span>•</span>
              <span>By {review.creator?.name || 'Creator'}</span>
              <span>•</span>
              <span>Version {selectedVersionNum} of {review.currentVersionNum}</span>
              {review.channel && (
                <>
                  <span>•</span>
                  <span>Channel: {review.channel}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Workspace Quick Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleReanalyze}
            disabled={isReanalyzing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            title="Re-run compliance evaluation against latest guidelines"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
            <span>Re-run Review</span>
          </button>

          {/* Workflow Action Trigger for Reviewer */}
          {canApproveOrReview && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowApprovalModal('REQUEST_CHANGES')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Request Changes</span>
              </button>

              <button
                onClick={() => setShowApprovalModal('APPROVE')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition-all"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Approve Review</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compliance Overview Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#111827] via-[#151f33] to-[#111827] border border-[#1F293D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ScoreGauge score={review.complianceScore} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">Brand Compliance Status</span>
              {review.criticalCount > 0 ? (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  {review.criticalCount} Critical Issue(s) Block Publication
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  No Critical Violations
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic rule scoring: Critical (-25), High (-15), Medium (-8), Low (-3). High score cannot hide critical issues.
            </p>
          </div>
        </div>

        {/* Version Picker */}
        <div className="flex items-center gap-2 bg-[#0D1220] p-1.5 rounded-xl border border-[#1F293D]">
          <span className="text-xs text-slate-400 font-semibold px-2">Version:</span>
          {review.versions?.map((v) => (
            <button
              key={v.versionNum}
              onClick={() => {
                setSelectedVersionNum(v.versionNum);
                setDraftContent(v.contentBody);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                selectedVersionNum === v.versionNum
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              v{v.versionNum}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL (Col 6): Content & Highlighting */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] flex flex-col h-[750px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1F293D]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Content Editor & Highlights (v{selectedVersionNum})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isEditingDraft && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Draft Modified
                  </span>
                )}
              </div>
            </div>

            {/* Editable Draft Body with Highlights */}
            <div className="flex-1 flex flex-col min-h-0">
              <textarea
                value={draftContent}
                onChange={(e) => {
                  setDraftContent(e.target.value);
                  setIsEditingDraft(true);
                }}
                className="flex-1 w-full p-4 rounded-xl bg-[#080B14] border border-[#1F293D] font-mono text-xs md:text-sm text-slate-200 leading-relaxed resize-none focus:outline-none focus:border-purple-500/60"
                placeholder="Draft content..."
              />
            </div>

            {/* Attached Image Preview if exists */}
            {review.imageAttachmentUrl && (
              <div className="mt-3 p-3 rounded-xl bg-[#0D1220] border border-[#1F293D] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-mono text-xs">
                    IMG
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Attached Brand Graphic
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs block">
                      {review.imageAttachmentUrl}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                  Format Verified
                </span>
              </div>
            )}

            {/* Save New Revision Bar */}
            <div className="mt-4 pt-3 border-t border-[#1F293D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <input
                type="text"
                value={revisionSummary}
                onChange={(e) => setRevisionSummary(e.target.value)}
                placeholder="Summary of changes (e.g. Applied approved product naming and pricing)"
                className="flex-1 px-3 py-1.5 bg-[#0D1220] border border-[#1F293D] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
              />
              <button
                onClick={handleSaveRevision}
                disabled={isSavingRevision}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-900/30 transition-all shrink-0 disabled:opacity-50"
              >
                {isSavingRevision ? 'Saving Revision...' : `Save as v${review.currentVersionNum + 1}`}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (Col 6): Findings, Evidence & Approval Workspace */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] flex flex-col h-[750px]">
            {/* Tabs Header */}
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#1F293D] overflow-x-auto">
              <button
                onClick={() => setActiveTab('FINDINGS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'FINDINGS'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Findings ({review.activeFindings?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('WORKFLOW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'WORKFLOW'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Approval Workflow</span>
              </button>

              <button
                onClick={() => setActiveTab('COMMENTS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'COMMENTS'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion ({review.comments?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('VERSIONS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'VERSIONS'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History ({review.versions?.length || 0})</span>
              </button>
            </div>

            {/* TAB 1: FINDINGS & AI CORRECTIONS */}
            {activeTab === 'FINDINGS' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Batch Actions Bar */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1F293D] shrink-0">
                  <span className="text-xs text-slate-400 font-medium">
                    Evidence-linked findings for v{selectedVersionNum}
                  </span>
                  <button
                    onClick={handleApplyAllSafe}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Apply All Safe Corrections</span>
                  </button>
                </div>

                {/* Findings List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {review.activeFindings?.length === 0 ? (
                    <div className="p-8 text-center bg-[#0D1220] rounded-xl border border-[#1F293D]">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-white">Zero Compliance Violations!</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Content adheres to all active NovaTech brand guidelines and approved sources.
                      </p>
                    </div>
                  ) : (
                    review.activeFindings?.map((f) => (
                      <div
                        key={f.id}
                        className={`p-4 rounded-xl border transition-all ${
                          f.status === 'ACCEPTED' || f.status === 'FIXED'
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : f.severity === 'CRITICAL'
                            ? 'bg-red-950/20 border-red-500/40'
                            : f.severity === 'HIGH'
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : 'bg-[#0D1220] border-[#1F293D]'
                        }`}
                      >
                        {/* Header: Severity, Category, Title */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <SeverityBadge severity={f.severity} />
                              <span className="text-[11px] font-mono text-purple-400">{f.category}</span>
                              {f.isUnverified && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded font-semibold">
                                  Unverified Claim
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-white">{f.title}</h4>
                          </div>

                          <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            f.status === 'OPEN' ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {f.status}
                          </span>
                        </div>

                        {/* Excerpt */}
                        <div className="p-2.5 rounded-lg bg-[#080B14] border border-[#1F293D] text-xs font-mono text-red-300 mb-2">
                          <span className="text-[10px] text-slate-500 block font-sans uppercase font-bold">
                            Detected Text Excerpt:
                          </span>
                          "{f.excerpt}"
                        </div>

                        {/* Explanation */}
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          {f.explanation}
                        </p>

                        {/* Citations: Guideline and/or Approved Source */}
                        <div className="space-y-1.5 mb-3 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          {f.guidelineRef && (
                            <div className="flex items-center gap-1.5 text-purple-300">
                              <BookOpen className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-semibold">Guideline:</span>
                              <span className="truncate">{f.guidelineRef}</span>
                            </div>
                          )}
                          {f.sourceRef && (
                            <div className="flex items-center gap-1.5 text-cyan-300">
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-semibold">Source Citation:</span>
                              <span className="truncate">{f.sourceRef}</span>
                            </div>
                          )}
                          <div className="text-slate-400 text-[10px]">
                            <span className="font-semibold text-slate-300">Evidence:</span> {f.evidence}
                          </div>
                        </div>

                        {/* Suggested Correction */}
                        {f.suggestedCorrection && (
                          <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-3">
                            <div className="overflow-hidden">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                                AI Proposed Correction:
                              </span>
                              <span className="text-xs font-medium text-emerald-200">
                                "{f.suggestedCorrection}"
                              </span>
                            </div>

                            {f.status === 'OPEN' && (
                              <button
                                onClick={() => handleApplyCorrection(f)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 shadow-md transition-colors"
                              >
                                Accept & Apply
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: APPROVAL WORKFLOW & AUDIT TRAIL */}
            {activeTab === 'WORKFLOW' && (
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                <div className="p-4 rounded-xl bg-[#0D1220] border border-[#1F293D]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                    Governance Status & Approver Controls
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-[#1F293D]">
                      <span className="text-slate-400">Current Review Status:</span>
                      <StatusBadge status={review.status} />
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#1F293D]">
                      <span className="text-slate-400">Assigned Reviewer:</span>
                      <span className="font-semibold text-white">
                        {review.reviewer?.name || 'Marcus Sterling (Default Reviewer)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#1F293D]">
                      <span className="text-slate-400">Critical Blockers:</span>
                      <span className={review.criticalCount > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {review.criticalCount} open critical findings
                      </span>
                    </div>
                  </div>

                  {/* Role Restriction Banner */}
                  <div className="p-3 mt-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      <span>Segregation of Duties Enforced</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Content Creators cannot approve their own submissions. Approval requires a Reviewer, Brand Manager, or Administrator.
                    </p>
                  </div>
                </div>

                {/* Audit Decisions History */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                    Formal Approval Decisions Log
                  </h4>
                  <div className="space-y-2.5">
                    {review.approvalDecisions?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No formal approval decisions recorded yet.</p>
                    ) : (
                      review.approvalDecisions?.map((d) => (
                        <div key={d.id} className="p-3 rounded-xl bg-[#0D1220] border border-[#1F293D] text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white">{d.decidedBy?.name || 'Reviewer'}</span>
                            <StatusBadge status={d.decision} />
                          </div>
                          {d.reason && (
                            <p className="text-slate-300 text-[11px] mt-1 bg-slate-900/50 p-2 rounded">
                              "{d.reason}"
                            </p>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            {new Date(d.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COMMENTS & THREADED FEEDBACK */}
            {activeTab === 'COMMENTS' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
                  {review.comments?.length === 0 ? (
                    <div className="p-8 text-center bg-[#0D1220] rounded-xl border border-[#1F293D]">
                      <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">No comments yet. Start the discussion below.</p>
                    </div>
                  ) : (
                    review.comments?.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-[#0D1220] border border-[#1F293D] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{c.author.name}</span>
                            <span className="text-[10px] font-mono text-purple-400 uppercase">
                              [{c.author.role}]
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(c.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">{c.content}</p>

                        {/* Nested Replies */}
                        {c.replies?.map((reply) => (
                          <div key={reply.id} className="ml-4 pl-3 border-l-2 border-purple-500/40 mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-200">{reply.author.name}</span>
                              <span className="text-[10px] font-mono text-cyan-400 uppercase">
                                [{reply.author.role}]
                              </span>
                            </div>
                            <p className="text-xs text-slate-300">{reply.content}</p>
                          </div>
                        ))}

                        <button
                          onClick={() => setReplyParentId(c.id)}
                          className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold mt-1"
                        >
                          Reply to thread
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Box */}
                <form onSubmit={handleAddComment} className="pt-2 border-t border-[#1F293D] flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={replyParentId ? 'Replying to comment...' : 'Add a governance comment or question...'}
                    className="flex-1 px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: VERSION HISTORY */}
            {activeTab === 'VERSIONS' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {review.versions?.map((v) => (
                  <div
                    key={v.versionNum}
                    className={`p-3.5 rounded-xl border transition-all ${
                      selectedVersionNum === v.versionNum
                        ? 'bg-purple-950/20 border-purple-500/40'
                        : 'bg-[#0D1220] border-[#1F293D]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">Version v{v.versionNum}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mb-2">
                      {v.summaryOfChanges || 'Content revision'}
                    </p>
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedVersionNum(v.versionNum);
                          setDraftContent(v.contentBody);
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                      >
                        Inspect Version v{v.versionNum} →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decision Modal (Approve / Request Changes / Reject) */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-[#1F293D] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {showApprovalModal === 'APPROVE' && 'Approve Content for Publication'}
                {showApprovalModal === 'REQUEST_CHANGES' && 'Request Revision from Creator'}
                {showApprovalModal === 'REJECT' && 'Reject Content Submission'}
              </h3>
              <button
                onClick={() => {
                  setShowApprovalModal(null);
                  setActionError(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-300">
                {actionError}
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              {showApprovalModal === 'APPROVE' &&
                'Confirming this action marks the review as APPROVED. Compliance score and findings will be sealed in the audit trail.'}
              {showApprovalModal === 'REQUEST_CHANGES' &&
                'Specify the mandatory updates or corrections required before this content can be approved.'}
              {showApprovalModal === 'REJECT' &&
                'State the reason for rejecting this submission.'}
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                {showApprovalModal === 'APPROVE' ? 'Approval Note (Optional)' : 'Reason *'}
              </label>
              <textarea
                rows={3}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Enter explanation..."
                className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowApprovalModal(null);
                  setActionError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDecision}
                disabled={isSubmittingDecision}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  showApprovalModal === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : showApprovalModal === 'REQUEST_CHANGES'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {isSubmittingDecision ? 'Processing...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
