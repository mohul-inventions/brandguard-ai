import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BrandGuideline, GuidelineCategory, IssueSeverity } from '../types';
import { SeverityBadge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import {
  BookOpenCheck,
  Search,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  History,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export const GuidelinesPage: React.FC = () => {
  const { user } = useAuth();
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GuidelineCategory>('TERMINOLOGY');
  const [severity, setSeverity] = useState<IssueSeverity>('HIGH');
  const [description, setDescription] = useState('');
  const [ruleDetails, setRuleDetails] = useState('');
  const [examplesToAvoid, setExamplesToAvoid] = useState('');
  const [preferredReplacements, setPreferredReplacements] = useState('');

  // History modal
  const [historyGuideline, setHistoryGuideline] = useState<BrandGuideline | null>(null);

  const fetchGuidelines = async () => {
    setLoading(true);
    try {
      const res = await api.get('/guidelines', {
        params: {
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          severity: severityFilter !== 'ALL' ? severityFilter : undefined,
          search: searchQuery || undefined,
        },
      });
      setGuidelines(res.data);
    } catch (err) {
      console.error('Failed to load guidelines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuidelines();
  }, [categoryFilter, severityFilter, searchQuery]);

  const handleToggleActive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/guidelines/${id}/toggle-active`);
      await fetchGuidelines();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle guideline status.');
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setCategory('TERMINOLOGY');
    setSeverity('HIGH');
    setDescription('');
    setRuleDetails('');
    setExamplesToAvoid('');
    setPreferredReplacements('');
    setShowModal(true);
  };

  const handleOpenEdit = (g: BrandGuideline) => {
    setEditingId(g.id);
    setTitle(g.title);
    setCategory(g.category);
    setSeverity(g.severity);
    setDescription(g.description);
    setRuleDetails(g.ruleDetails);
    setExamplesToAvoid(g.examplesToAvoid || '');
    setPreferredReplacements(g.preferredReplacements || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/guidelines/${editingId}`, {
          title,
          category,
          severity,
          description,
          ruleDetails,
          examplesToAvoid,
          preferredReplacements,
          changeSummary: `Updated rule configuration to v+1`,
        });
      } else {
        await api.post('/guidelines', {
          title,
          category,
          severity,
          description,
          ruleDetails,
          examplesToAvoid,
          preferredReplacements,
        });
      }

      setShowModal(false);
      await fetchGuidelines();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save guideline.');
    }
  };

  const handleViewHistory = async (g: BrandGuideline) => {
    try {
      const res = await api.get(`/guidelines/${g.id}`);
      setHistoryGuideline(res.data);
    } catch (err) {
      console.error('Failed to get guideline history:', err);
    }
  };

  const canManage = ['BRAND_MANAGER', 'ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Brand Guidelines</h1>
          <p className="text-sm text-slate-400">
            Define, version, and enforce voice, terminology, and messaging standards across the workspace.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Guideline</span>
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
            placeholder="Search guidelines or rules..."
            className="w-full pl-9 pr-4 py-2 bg-[#0D1220] border border-[#1F293D] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500/60"
          >
            <option value="ALL">All Categories</option>
            <option value="BRAND_VOICE">Brand Voice</option>
            <option value="TERMINOLOGY">Terminology</option>
            <option value="FACTUAL_ACCURACY">Factual Accuracy</option>
            <option value="PROMOTIONAL_CLAIMS">Promotional Claims</option>
            <option value="BRAND_MESSAGING">Brand Messaging</option>
            <option value="VISUAL_COMPLIANCE">Visual Compliance</option>
            <option value="ACCESSIBILITY">Accessibility</option>
            <option value="CONFIDENTIALITY">Confidentiality</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500/60"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Guidelines Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : guidelines.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-[#1F293D]">
          <BookOpenCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No brand guidelines found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting the filters above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guidelines.map((g) => (
            <div
              key={g.id}
              className={`p-5 rounded-2xl border transition-all ${
                g.isActive
                  ? 'bg-[#111827] border-[#1F293D] hover:border-purple-500/40'
                  : 'bg-[#0D1220] border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={g.severity} />
                    <span className="text-[11px] font-mono text-purple-400">{g.category}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      v{g.version}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{g.title}</h3>
                </div>

                {canManage && (
                  <button
                    onClick={(e) => handleToggleActive(g.id, e)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      g.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                    title="Toggle active rule enforcement"
                  >
                    {g.isActive ? 'Active' : 'Inactive'}
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-300 mb-3">{g.description}</p>

              <div className="p-3 rounded-xl bg-[#080B14] border border-[#1F293D] text-xs text-slate-400 space-y-1.5 mb-4">
                <div>
                  <span className="font-semibold text-slate-300">Rule Details: </span>
                  {g.ruleDetails}
                </div>
                {g.examplesToAvoid && (
                  <div className="text-[11px] text-red-300">
                    <span className="font-semibold text-slate-400">Forbidden: </span>
                    {g.examplesToAvoid}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1F293D] text-xs">
                <button
                  onClick={() => handleViewHistory(g)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-purple-300 font-semibold"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Version History</span>
                </button>

                {canManage && (
                  <button
                    onClick={() => handleOpenEdit(g)}
                    className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Rule</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Guideline Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111827] border border-[#1F293D] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingId ? 'Edit Brand Guideline' : 'Create New Brand Guideline'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Official Product Naming & Spelling"
                  className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GuidelineCategory)}
                    className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                  >
                    <option value="BRAND_VOICE">Brand Voice</option>
                    <option value="TERMINOLOGY">Terminology</option>
                    <option value="FACTUAL_ACCURACY">Factual Accuracy</option>
                    <option value="PROMOTIONAL_CLAIMS">Promotional Claims</option>
                    <option value="BRAND_MESSAGING">Brand Messaging</option>
                    <option value="VISUAL_COMPLIANCE">Visual Compliance</option>
                    <option value="ACCESSIBILITY">Accessibility</option>
                    <option value="CONFIDENTIALITY">Confidentiality</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Severity *
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                    className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                  >
                    <option value="CRITICAL">Critical (-25 pts)</option>
                    <option value="HIGH">High (-15 pts)</option>
                    <option value="MEDIUM">Medium (-8 pts)</option>
                    <option value="LOW">Low (-3 pts)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of what this guideline governs..."
                  className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Rule Enforcement Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={ruleDetails}
                  onChange={(e) => setRuleDetails(e.target.value)}
                  placeholder="Exact conditions and rationale for flagging..."
                  className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Prohibited Patterns / Phrases to Avoid (JSON Array)
                </label>
                <input
                  type="text"
                  value={examplesToAvoid}
                  onChange={(e) => setExamplesToAvoid(e.target.value)}
                  placeholder='["Nova Tech", "Pulse AI"]'
                  className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Preferred Replacements (JSON Map)
                </label>
                <input
                  type="text"
                  value={preferredReplacements}
                  onChange={(e) => setPreferredReplacements(e.target.value)}
                  placeholder='{"Nova Tech": "NovaTech Pulse"}'
                  className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500/60"
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
                  Save Guideline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {historyGuideline && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-[#1F293D] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Version History: {historyGuideline.title}
              </h3>
              <button onClick={() => setHistoryGuideline(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {historyGuideline.versions?.map((v) => (
                <div key={v.id} className="p-3 rounded-xl bg-[#0D1220] border border-[#1F293D] text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-purple-400 font-mono">v{v.version}</span>
                    <span className="text-[10px] text-slate-400">{new Date(v.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-300 text-xs mb-1">{v.changeSummary}</p>
                  <p className="text-[11px] text-slate-500 italic">Changed by {v.changedBy?.name || 'Brand Manager'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
