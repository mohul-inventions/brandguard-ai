import React from 'react';
import { IssueSeverity, ReviewStatus } from '../../types';

export const SeverityBadge: React.FC<{ severity: IssueSeverity | string }> = ({ severity }) => {
  const styles: Record<string, string> = {
    CRITICAL: 'bg-red-500/15 text-red-400 border border-red-500/30',
    HIGH: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    MEDIUM: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    LOW: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
  };

  const style = styles[severity.toUpperCase()] || 'bg-slate-700/50 text-slate-300 border border-slate-600';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${style}`}>
      {severity}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ReviewStatus | string }> = ({ status }) => {
  const styles: Record<string, string> = {
    DRAFT: 'bg-slate-700/50 text-slate-300 border border-slate-600',
    SUBMITTED: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    IN_REVIEW: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 animate-pulse',
    CHANGES_REQUESTED: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    REVISED: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    APPROVED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    REJECTED: 'bg-red-500/15 text-red-400 border border-red-500/30',
    ARCHIVED: 'bg-gray-800 text-gray-400 border border-gray-700',
  };

  const formatted = status.replace(/_/g, ' ');
  const style = styles[status] || 'bg-slate-700/50 text-slate-300 border border-slate-600';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {formatted}
    </span>
  );
};
