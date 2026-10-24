import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { SeverityBadge } from '../components/common/Badge';
import {
  BarChart3,
  Lightbulb,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  RotateCcw,
  BookOpen,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics/overview', {
          params: { days: timeframe, category: categoryFilter },
        });
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe, categoryFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Computing Governance Intelligence Telemetry...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-white">Governance Analytics & Intelligence</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              IMPROVEMENT 3
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Identify recurring violations, detect ambiguous brand guidelines, and improve organizational compliance.
          </p>
        </div>

        {/* Timeframe & Category Selector */}
        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 bg-[#111827] border border-[#1F293D] rounded-xl text-xs text-slate-200 focus:outline-none"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {data.isPreliminary && (
        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center gap-2.5">
          <Info className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong>Preliminary Analysis:</strong> Calculated from {data.summary.totalReviewsAnalyzed} stored review records. Telemetry confidence increases as additional reviews are processed.
          </span>
        </div>
      )}

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Violations Flagged
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data.summary.totalViolationsFound}</span>
            <span className="text-xs text-slate-500">across repository</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Avg Revisions Per Review
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400">
              {data.summary.avgRevisionsPerReview}
            </span>
            <span className="text-xs text-slate-500">cycles to approval</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Frequent Terminology Error
          </span>
          <div className="truncate">
            <span className="text-lg font-bold text-amber-400 truncate block">
              {data.terminologyErrors[0]?.title || 'None'}
            </span>
            <span className="text-xs text-slate-500">
              {data.terminologyErrors[0]?.count || 0} occurrences detected
            </span>
          </div>
        </div>
      </div>

      {/* Actionable Governance Recommendations Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#111827] via-[#161d2d] to-[#111827] border border-cyan-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Actionable Governance Recommendations</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Automated recommendations generated by continuous compliance pattern matching:
        </p>

        <div className="space-y-3">
          {data.actionableRecommendations?.map((rec: string, idx: number) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#080B14] border border-[#1F293D] flex items-start gap-3 text-xs text-slate-200 leading-relaxed"
            >
              <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div>{rec}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequent Violations Bar Chart */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D]">
          <h2 className="text-base font-bold text-white mb-1">Top Flagged Issues</h2>
          <p className="text-xs text-slate-400 mb-6">Volume of violations by rule</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.frequentViolations.slice(0, 5)}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
              >
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis
                  dataKey="title"
                  type="category"
                  stroke="#94A3B8"
                  fontSize={10}
                  width={150}
                  tickFormatter={(val) => (val.length > 22 ? val.substring(0, 22) + '...' : val)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1220', borderColor: '#1F293D', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Type Breakdown */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D]">
          <h2 className="text-base font-bold text-white mb-1">Compliance by Content Channel</h2>
          <p className="text-xs text-slate-400 mb-6">Average score performance by publication type</p>

          <div className="space-y-4">
            {data.issuesByContentType.map((item: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-[#0D1220] border border-[#1F293D]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono font-bold text-slate-200">{item.contentType}</span>
                  <span className="font-bold text-purple-400">{item.avgComplianceScore}% avg</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                    style={{ width: `${item.avgComplianceScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {item.reviewCount} total review(s) analyzed
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
