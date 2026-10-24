import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { ApprovedSource } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  DatabaseZap,
  Search,
  Plus,
  ExternalLink,
  ShieldCheck,
  Calendar,
  User,
  Trash2,
  Clock,
} from 'lucide-react';

export const SourcesPage: React.FC = () => {
  const { user } = useAuth();
  const [sources, setSources] = useState<ApprovedSource[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add source modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState('PRODUCT_SPEC');
  const [content, setContent] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [owner, setOwner] = useState('');

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sources', {
        params: {
          sourceType: typeFilter !== 'ALL' ? typeFilter : undefined,
          search: searchQuery || undefined,
        },
      });
      setSources(res.data);
    } catch (err) {
      console.error('Failed to load sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [typeFilter, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/sources', {
        title,
        sourceType,
        content,
        referenceUrl: referenceUrl || undefined,
        owner,
      });
      setShowModal(false);
      setTitle('');
      setContent('');
      setReferenceUrl('');
      setOwner('');
      await fetchSources();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create source.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this approved source?')) return;
    try {
      await api.delete(`/sources/${id}`);
      await fetchSources();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete source.');
    }
  };

  const canManage = ['BRAND_MANAGER', 'ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Approved Sources & Facts</h1>
          <p className="text-sm text-slate-400">
            Authoritative corporate ground truth used to verify claims and prevent misinformation.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Approved Source</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 rounded-xl bg-[#111827] border border-[#1F293D]">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified facts, pricing, statistics..."
            className="w-full pl-9 pr-4 py-2 bg-[#0D1220] border border-[#1F293D] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500/60"
        >
          <option value="ALL">All Source Types</option>
          <option value="PRODUCT_SPEC">Product Specification</option>
          <option value="COMPANY_PROFILE">Company Profile</option>
          <option value="PRICING">Pricing & Plans</option>
          <option value="LEGAL_DISCLAIMER">Legal Disclaimer</option>
          <option value="STATISTIC">Verified Statistic</option>
        </select>
      </div>

      {/* Sources Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sources.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-[#1F293D]">
          <DatabaseZap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No approved sources found</h3>
          <p className="text-xs text-slate-400 mt-1">Add facts, specifications, or pricing models to seed verification.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
                        {s.sourceType}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {s.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{s.title}</h3>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete source"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="p-3 my-3 rounded-xl bg-[#080B14] border border-[#1F293D] text-xs text-slate-200 leading-relaxed font-mono">
                  "{s.content}"
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F293D] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Owner: {s.owner}</span>
                </div>

                {s.referenceUrl && (
                  <a
                    href={s.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium truncate max-w-[200px]"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate">{s.referenceUrl}</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Source Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111827] border border-[#1F293D] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add Authoritative Source</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Source Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Official 2026 Product Specification"
                  className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Source Type *
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                  >
                    <option value="PRODUCT_SPEC">Product Specification</option>
                    <option value="COMPANY_PROFILE">Company Profile</option>
                    <option value="PRICING">Pricing & Plans</option>
                    <option value="LEGAL_DISCLAIMER">Legal Disclaimer</option>
                    <option value="STATISTIC">Verified Statistic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Owner / Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="e.g. Finance Committee"
                    className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Authoritative Statement / Ground Truth *
                </label>
                <textarea
                  rows={3}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="The exact fact, specification, or claim verified by this source..."
                  className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Reference Documentation URL (Optional)
                </label>
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://novatech.io/pricing"
                  className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
                >
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
