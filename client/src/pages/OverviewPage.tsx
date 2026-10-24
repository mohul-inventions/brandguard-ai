import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DashboardSummary } from '../types';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import {
  FileCheck2,
  Clock,
  AlertTriangle,
  Award,
  ArrowRight,
  Sparkles,
  BookOpenCheck,
  ShieldAlert,
  Activity,
  Plus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading Governance Telemetry...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Brand Governance Overview
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              NovaTech Global
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Intelligent compliance telemetry, active violations, and human approval controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reviews/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Content Review</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reviews */}
        <div
          onClick={() => navigate('/reviews')}
          className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] hover:border-purple-500/50 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Reviews
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data.summary.totalReviews}</span>
            <span className="text-xs text-slate-500">audited items</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => navigate('/approvals')}
          className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] hover:border-amber-500/50 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{data.summary.pendingApprovals}</span>
            <span className="text-xs text-slate-500">awaiting reviewer</span>
          </div>
        </div>

        {/* Critical Issues */}
        <div
          onClick={() => navigate('/reviews?status=CHANGES_REQUESTED')}
          className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] hover:border-red-500/50 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Open Critical Issues
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-400">{data.summary.criticalIssues}</span>
            <span className="text-xs text-slate-500">blocks publication</span>
          </div>
        </div>

        {/* Average Compliance Score */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Avg Compliance
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">
                {data.summary.avgComplianceScore}%
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Deterministic index</span>
          </div>
          <ScoreGauge score={data.summary.avgComplianceScore} size="md" />
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Score Trend */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#111827] border border-[#1F293D]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Compliance Score Trajectory</h2>
              <p className="text-xs text-slate-400">Chronological review evaluations</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Score (0-100)</span>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.scoreTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="title" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1220', borderColor: '#1F293D', borderRadius: '8px' }}
                  labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Breakdown Bar */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D] flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Issues by Severity</h2>
            <p className="text-xs text-slate-400 mb-6">Active findings across repository</p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-red-400 font-medium">Critical (Immediate Block)</span>
                  <span className="font-bold text-white">{data.charts.severityBreakdown.CRITICAL}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${Math.min(100, data.charts.severityBreakdown.CRITICAL * 25)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-medium">High Severity</span>
                  <span className="font-bold text-white">{data.charts.severityBreakdown.HIGH}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, data.charts.severityBreakdown.HIGH * 20)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-purple-400 font-medium">Medium Severity</span>
                  <span className="font-bold text-white">{data.charts.severityBreakdown.MEDIUM}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${Math.min(100, data.charts.severityBreakdown.MEDIUM * 15)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cyan-400 font-medium">Low Severity</span>
                  <span className="font-bold text-white">{data.charts.severityBreakdown.LOW}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${Math.min(100, data.charts.severityBreakdown.LOW * 10)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 mt-6 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Governance Policy:</span> High score cannot bypass critical unresolved issues.
          </div>
        </div>
      </div>

      {/* 2 Columns: Recent Reviews & Common Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Content Reviews */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Recent Content Reviews</h2>
              <p className="text-xs text-slate-400">Live submissions and approval states</p>
            </div>
            <button
              onClick={() => navigate('/reviews')}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {data.recentReviews.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/reviews/${r.id}`)}
                className="p-3.5 rounded-xl bg-[#0D1220] border border-[#1F293D] hover:border-purple-500/40 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <ScoreGauge score={r.complianceScore} size="sm" showLabel={false} />
                  <div className="truncate">
                    <h3 className="text-xs font-bold text-white truncate">{r.title}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="uppercase font-mono text-[10px]">{r.contentType}</span>
                      <span>•</span>
                      <span>By {r.creator?.name || 'Creator'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Common Violations */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Frequent Brand Violations</h2>
              <p className="text-xs text-slate-400">Recurring patterns across team drafts</p>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Deep Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {data.commonViolations.map((v, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#0D1220] border border-[#1F293D] flex items-center justify-between gap-3"
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 truncate">{v.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="text-purple-400 font-mono">{v.category}</span>
                    <span>•</span>
                    <span>{v.count} occurrences detected</span>
                  </div>
                </div>
                <SeverityBadge severity={v.severity} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
