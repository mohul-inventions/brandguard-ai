import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BrandAsset } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Palette,
  Upload,
  Plus,
  ShieldCheck,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('LOGO');
  const [description, setDescription] = useState('');
  const [usageRestrictions, setUsageRestrictions] = useState('');
  const [assetFile, setAssetFile] = useState<File | null>(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assets', {
        params: { assetType: typeFilter !== 'ALL' ? typeFilter : undefined },
      });
      setAssets(res.data);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [typeFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('assetType', assetType);
      formData.append('description', description);
      if (usageRestrictions) formData.append('usageRestrictions', usageRestrictions);
      if (assetFile) formData.append('assetFile', assetFile);

      await api.post('/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowModal(false);
      setName('');
      setDescription('');
      setUsageRestrictions('');
      setAssetFile(null);
      await fetchAssets();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create asset.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this brand asset?')) return;
    try {
      await api.delete(`/assets/${id}`);
      await fetchAssets();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete asset.');
    }
  };

  const canManage = ['BRAND_MANAGER', 'ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Brand Asset Library</h1>
          <p className="text-sm text-slate-400">
            Logos, color palettes, icons, and visual tokens verified for corporate publications.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Brand Asset</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#111827] border border-[#1F293D] overflow-x-auto">
        {['ALL', 'LOGO', 'COLOR_PALETTE', 'ICON', 'IMAGE', 'TYPOGRAPHY'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              typeFilter === t
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-[#1F293D]">
          <Palette className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No brand assets found</h3>
          <p className="text-xs text-slate-400 mt-1">Upload brand assets or logos to seed the library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {assets.map((a) => {
            let metadataObj: any = {};
            try {
              if (a.metadataJson) metadataObj = JSON.parse(a.metadataJson);
            } catch {}

            return (
              <div
                key={a.id}
                className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] hover:border-purple-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase">
                        {a.assetType}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5">{a.name}</h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        a.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : a.status === 'RETIRED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>

                  {/* Visual Preview / Color Swatches */}
                  {a.assetType === 'COLOR_PALETTE' && metadataObj.primary && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#080B14] border border-[#1F293D] mb-3">
                      {['primary', 'accent', 'background', 'card', 'success'].map((k) => (
                        <div key={k} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-8 h-8 rounded-lg shadow-md border border-white/10"
                            style={{ backgroundColor: metadataObj[k] || '#8B5CF6' }}
                            title={`${k}: ${metadataObj[k]}`}
                          />
                          <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase">
                            {metadataObj[k]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {a.assetType === 'LOGO' && (
                    <div className="h-28 rounded-xl bg-[#080B14] border border-[#1F293D] flex items-center justify-center p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-black text-sm">
                          N
                        </div>
                        <span className="text-base font-extrabold text-white tracking-wide">
                          NovaTech <span className="text-purple-400">Pulse</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{a.description}</p>

                  {a.usageRestrictions && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 mb-3">
                      <span className="font-bold">Usage Restrictions: </span>
                      {a.usageRestrictions}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#1F293D] flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[10px]">
                    Added {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-[#1F293D] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Upload Brand Asset</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Asset Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. NovaTech Pulse Primary Wordmark"
                  className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Asset Type *
                </label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                >
                  <option value="LOGO">Logo</option>
                  <option value="COLOR_PALETTE">Color Palette</option>
                  <option value="ICON">App Icon</option>
                  <option value="IMAGE">Approved Image</option>
                  <option value="TYPOGRAPHY">Typography Tokens</option>
                </select>
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
                  placeholder="Usage notes, dimensions, and specifications..."
                  className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Usage Restrictions (Optional)
                </label>
                <input
                  type="text"
                  value={usageRestrictions}
                  onChange={(e) => setUsageRestrictions(e.target.value)}
                  placeholder="e.g. Minimum 24px clear margin padding. Do not distort."
                  className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  File Attachment (SVG, PNG, JPG, WEBP)
                </label>
                <input
                  type="file"
                  accept=".svg,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAssetFile(e.target.files[0]);
                    }
                  }}
                  className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600/20 file:text-purple-300"
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
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
