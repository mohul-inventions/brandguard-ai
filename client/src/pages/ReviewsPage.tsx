import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { ContentReview } from '../types';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { StatusBadge } from '../components/common/Badge';
import {
  Search,
  Filter,
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
  User as UserIcon,
  FileText,
} from 'lucide-react';

export const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviews, setReviews] = useState<ContentReview[]>([]);
  const [loading, setLoading] = useState(true);

  const statusFilter = searchParams.get('status') || 'ALL';
  const typeFilter = searchParams.get('type') || 'ALL';
  const searchQuery = searchParams.get('q') || '';

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews', {
        params: {
          status: statusFilter,
          contentType: typeFilter,
          search: searchQuery || undefined,
        },
      });
      setReviews(res.data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, typeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header and New Review CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Content Reviews</h1>
          <p className="text-sm text-slate-400">
            Submit, evaluate, and track brand governance across organizational content.
          </p>
        </div>
        <button
          onClick={() => navigate('/reviews/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Review</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 rounded-xl bg-[#111827] border border-[#1F293D]">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchParams((prev) => {
                if (e.target.value) prev.set('q', e.target.value);
                else prev.delete('q');
                return prev;
              });
            }}
            placeholder="Search by title, audience, channel..."
            className="w-full pl-9 pr-4 py-2 bg-[#0D1220] border border-[#1F293D] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setSearchParams((prev) => {
                prev.set('status', e.target.value);
                return prev;
              });
            }}
            className="px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500/60"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="CHANGES_REQUESTED">Changes Requested</option>
            <option value="REVISED">Revised</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Content Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setSearchParams((prev) => {
                prev.set('type', e.target.value);
                return prev;
              });
            }}
            className="px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500/60"
          >
            <option value="ALL">All Types</option>
            <option value="BLOG">Blog Post</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="ADVERTISEMENT">Advertisement</option>
            <option value="EMAIL">Email Copy</option>
            <option value="WEBSITE_COPY">Website Copy</option>
            <option value="PRESS_RELEASE">Press Release</option>
          </select>
        </div>
      </div>

      {/* Reviews Table / Cards */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-[#1F293D]">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No content reviews found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Try adjusting your search criteria or submit a new review.
          </p>
          <button
            onClick={() => navigate('/reviews/new')}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
          >
            Create New Review
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              onClick={() => navigate(`/reviews/${r.id}`)}
              className="p-4 rounded-xl bg-[#111827] border border-[#1F293D] hover:border-purple-500/50 cursor-pointer transition-all hover:bg-[#141d2e] flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <ScoreGauge score={r.complianceScore} size="md" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white hover:text-purple-300 transition-colors">
                      {r.title}
                    </h3>
                    {r.isDemoRecord && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        Demo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="font-mono text-purple-400">{r.contentType}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3" />
                      {r.creator?.name || 'Creator'}
                    </span>
                    <span>•</span>
                    <span>Version v{r.currentVersionNum}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  {r.criticalCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold">
                      {r.criticalCount} Critical
                    </span>
                  )}
                  {r.highCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {r.highCount} High
                    </span>
                  )}
                </div>

                <StatusBadge status={r.status} />

                <ArrowRight className="w-4 h-4 text-slate-500 hover:text-white transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
