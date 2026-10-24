import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ContentType } from '../types';
import {
  Sparkles,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

export const NewReviewPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<ContentType>('SOCIAL_MEDIA');
  const [targetAudience, setTargetAudience] = useState('');
  const [channel, setChannel] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [notes, setNotes] = useState('');

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One-click demo test loader for judges
  const loadDemoContent = () => {
    setTitle('Q4 Global Ad - NovaTech Pulse Distributed Launch');
    setContentType('ADVERTISEMENT');
    setTargetAudience('Tech Executives, Engineering Leaders & Remote Teams');
    setChannel('LinkedIn Sponsored Posts & Google Display Ads');
    setContentBody(
      `Introducing Nova Tech Pulse - the world's number one productivity platform! 🚀

Tired of clunky collaboration tools? With our mind-blowing synergy, your distributed team will achieve insane speed and 100% guarantee of zero missed deadlines.

Upgrade to our Pro tier today for only $10/user and unleash distributed workflow mastery. Sign up now!`
    );
    setNotes('Demo campaign copy prepared for NovaTech Pulse v3.2 market launch.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('Title is required.');
      return;
    }
    if (!contentBody && !documentFile) {
      setError('Please provide content body text or upload a document file (TXT, MD, PDF, DOCX).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('contentType', contentType);
      if (targetAudience) formData.append('targetAudience', targetAudience);
      if (channel) formData.append('channel', channel);
      if (contentBody) formData.append('contentBody', contentBody);
      if (notes) formData.append('notes', notes);

      if (documentFile) {
        formData.append('document', documentFile);
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await api.post('/reviews', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const createdReviewId = res.data.review.id;
      // Navigate straight to the AI Correction Workspace
      navigate(`/reviews/${createdReviewId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to submit content review.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <h1 className="text-2xl font-extrabold text-white">New Content Review</h1>
          <p className="text-sm text-slate-400">
            Submit copy or upload documents for real-time brand guideline and fact compliance analysis.
          </p>
        </div>

        {/* Demo Fast-Load Button */}
        <button
          type="button"
          onClick={loadDemoContent}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-cyan-900/40 border border-purple-500/40 hover:border-purple-400 text-xs font-semibold text-purple-200 transition-all hover:scale-[1.02] shadow-sm"
          title="Pre-fills the form with NovaTech sample content containing brand naming, superlative, and pricing issues"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Load NovaTech Demo Content</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Content Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Social Campaign - NovaTech Pulse Launch"
              className="w-full px-4 py-2.5 bg-[#0D1220] border border-[#1F293D] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
            />
          </div>

          {/* Grid: Content Type & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Content Type *
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full px-4 py-2.5 bg-[#0D1220] border border-[#1F293D] rounded-xl text-sm text-white focus:outline-none focus:border-purple-500/60"
              >
                <option value="SOCIAL_MEDIA">Social Media Post</option>
                <option value="ADVERTISEMENT">Advertisement / Banner</option>
                <option value="BLOG">Blog Post / Article</option>
                <option value="EMAIL">Email Copy / Newsletter</option>
                <option value="WEBSITE_COPY">Website Copy / Landing Page</option>
                <option value="PRESS_RELEASE">Press Release</option>
                <option value="OTHER">Other Promotional Material</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Publication Channel
              </label>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="e.g. LinkedIn, X, Corporate Blog, Email Blast"
                className="w-full px-4 py-2.5 bg-[#0D1220] border border-[#1F293D] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Engineering Directors, Remote Team Leads, Enterprise IT"
              className="w-full px-4 py-2.5 bg-[#0D1220] border border-[#1F293D] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
            />
          </div>

          {/* Content Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Content Body *
              </label>
              <span className="text-[11px] text-slate-500">
                Paste draft copy below, or upload TXT/MD/PDF/DOCX
              </span>
            </div>
            <textarea
              rows={8}
              value={contentBody}
              onChange={(e) => setContentBody(e.target.value)}
              placeholder="Enter your draft copy here for brand compliance inspection..."
              className="w-full px-4 py-3 bg-[#0D1220] border border-[#1F293D] rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500/60 leading-relaxed"
            />
          </div>

          {/* File Uploads: Document and Image Attachment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Document Upload */}
            <div className="p-4 rounded-xl bg-[#0D1220] border border-dashed border-[#1F293D] hover:border-purple-500/40 transition-colors">
              <div className="flex items-center gap-2 mb-2 text-slate-300 text-xs font-semibold">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Upload Document (TXT, MD, PDF, DOCX)</span>
              </div>
              <input
                type="file"
                accept=".txt,.md,.markdown,.pdf,.docx,.doc"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocumentFile(e.target.files[0]);
                  }
                }}
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30"
              />
              {documentFile && (
                <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                  ✓ Selected: {documentFile.name}
                </p>
              )}
            </div>

            {/* Image Attachment */}
            <div className="p-4 rounded-xl bg-[#0D1220] border border-dashed border-[#1F293D] hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center gap-2 mb-2 text-slate-300 text-xs font-semibold">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Attach Visual Asset (PNG, JPG, SVG, WEBP)</span>
              </div>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                  }
                }}
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600/20 file:text-cyan-300 hover:file:bg-cyan-600/30"
              />
              {imageFile && (
                <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                  ✓ Selected: {imageFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Creator Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Rush turnaround requested for partner co-marketing announcement"
              className="w-full px-4 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/reviews')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-purple-900/40 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing Governance Rules...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Submit & Run AI Compliance Review</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
