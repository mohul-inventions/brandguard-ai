import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ContentReview } from '../types';
import { useAuth } from '../context/AuthContext';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { StatusBadge } from '../components/common/Badge';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ContentReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal
  const [targetReview, setTargetReview] = useState<ContentReview | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews', {
        params: { status: 'ALL' },
      });
      // Filter for items needing review or revision
      const pending = res.data.filter((r: ContentReview) =>
        ['SUBMITTED', 'IN_REVIEW', 'REVISED', 'CHANGES_REQUESTED'].includes(r.status)
      );
      setReviews(pending);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const handleExecuteDecision = async () => {
    if (!targetReview || !decisionType) return;
    setErrorMsg(null);
    setSubmitting(true);

    try {
      if (decisionType === 'APPROVE') {
        await api.post(`/approvals/${targetReview.id}/approve`, { reason });
      } else if (decisionType === 'REQUEST_CHANGES') {
        if (!reason.trim()) {
          setErrorMsg('A detailed reason is required when requesting revisions.');
          setSubmitting(false);
          return;
        }
        await api.post(`/approvals/${targetReview.id}/request-changes`, { reason });
      } else if (decisionType === 'REJECT') {
        if (!reason.trim()) {
          setErrorMsg('A reason is required to reject content.');
          setSubmitting(false);
          return;
        }
        await api.post(`/approvals/${targetReview.id}/reject`, { reason });
      }

      setTargetReview(null);
      setDecisionType(null);
      setReason('');
      await fetchPendingReviews();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const isReviewerOrManager = ['REVIEWER', 'BRAND_MANAGER', 'ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Review Approvals Queue</h1>
          <p className="text-sm text-slate-400">
            Dedicated human governance gate. Inspect findings, request revisions, and sign off on publication.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 font-medium">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Active Approver: {user?.name} ({user?.role})</span>
        </div>
      </div>

      {!isReviewerOrManager && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold block">Creator Persona Active</span>
            <span>
              Creators can submit drafts and apply AI corrections, but final publication sign-off requires switching to Reviewer, Brand Manager, or Admin role in the top header.
            </span>
          </div>
        </div>
      )}

      {/* Approvals Queue */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-[#1F293D]">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">Approvals Queue is Clear!</h3>
          <p className="text-xs text-slate-400 mt-1">All submitted content reviews have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const isCreatorSelf = user?.id === r.creatorId;

            return (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] hover:border-purple-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <ScoreGauge score={r.complianceScore} size="md" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        onClick={() => navigate(`/reviews/${r.id}`)}
                        className="text-sm font-bold text-white hover:text-purple-300 cursor-pointer transition-colors"
                      >
                        {r.title}
                      </h3>
                      <StatusBadge status={r.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="font-mono text-purple-400">{r.contentType}</span>
                      <span>•</span>
                      <span>Submitted by {r.creator?.name || 'Creator'}</span>
                      <span>•</span>
                      <span>v{r.currentVersionNum}</span>
                    </div>

                    {r.criticalCount > 0 && (
                      <p className="text-xs text-red-400 font-semibold mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{r.criticalCount} critical compliance violation(s) must be resolved</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Approver Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <button
                    onClick={() => navigate(`/reviews/${r.id}`)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {isReviewerOrManager && !isCreatorSelf && (
                    <>
                      <button
                        onClick={() => {
                          setTargetReview(r);
                          setDecisionType('REQUEST_CHANGES');
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Request Changes</span>
                      </button>

                      <button
                        onClick={() => {
                          setTargetReview(r);
                          setDecisionType('APPROVE');
                        }}
                        disabled={r.criticalCount > 0}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all disabled:opacity-40"
                        title={r.criticalCount > 0 ? 'Resolve critical findings before approving' : 'Approve for publication'}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Modal */}
      {targetReview && decisionType && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-[#1F293D] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {decisionType === 'APPROVE' && 'Confirm Content Approval'}
                {decisionType === 'REQUEST_CHANGES' && 'Request Revisions'}
                {decisionType === 'REJECT' && 'Reject Submission'}
              </h3>
              <button
                onClick={() => {
                  setTargetReview(null);
                  setDecisionType(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <div>
              <span className="text-xs text-slate-400 block mb-1">Target Content:</span>
              <span className="text-xs font-bold text-white">{targetReview.title}</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                {decisionType === 'APPROVE' ? 'Approval Note (Optional)' : 'Reason *'}
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter feedback or explanation..."
                className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTargetReview(null);
                  setDecisionType(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDecision}
                disabled={submitting}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  decisionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {submitting ? 'Recording...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
