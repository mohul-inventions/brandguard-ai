import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Settings,
  Cpu,
  ShieldAlert,
  Lock,
  Sliders,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    api.get('/health').then((res) => setHealthData(res.data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-[#1F293D]">
        <h1 className="text-2xl font-extrabold text-white">Workspace & Engine Settings</h1>
        <p className="text-sm text-slate-400">
          Configure AI provider adapters, scoring parameters, and privacy compliance.
        </p>
      </div>

      {/* AI Provider Status Card */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">AI Engine Adapter Configuration</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            {healthData?.mode || 'Deterministic Demo Engine'}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          BrandGuard AI supports pluggable AI provider adapters (OpenAI, Gemini, Anthropic, or Local Deterministic Demo). 
          In standard Hackathon evaluation mode, the platform executes a 100% reproducible, verifiable deterministic compliance engine. 
          No fabricated AI responses or mock external network calls are performed.
        </p>

        <div className="p-4 rounded-xl bg-[#080B14] border border-[#1F293D] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">Configured Provider:</span>
            <span className="font-bold text-purple-400">{healthData?.aiProvider || 'DEMO'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Engine Version:</span>
            <span className="font-bold text-slate-200">v1.0.0-hackathon</span>
          </div>
        </div>
      </div>

      {/* Compliance Scoring Methodology */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Compliance Scoring Algorithm</h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Content reviews begin with a baseline index of 100 points. Penalties are weighted strictly by finding severity:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-center">
            <span className="text-xs font-bold text-red-400 block">Critical</span>
            <span className="text-lg font-black text-white">-25 pts</span>
            <span className="text-[10px] text-slate-400 block mt-1">Blocks approval</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-center">
            <span className="text-xs font-bold text-amber-400 block">High</span>
            <span className="text-lg font-black text-white">-15 pts</span>
            <span className="text-[10px] text-slate-400 block mt-1">Major violation</span>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-center">
            <span className="text-xs font-bold text-purple-300 block">Medium</span>
            <span className="text-lg font-black text-white">-8 pts</span>
            <span className="text-[10px] text-slate-400 block mt-1">Tone & clarity</span>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-center">
            <span className="text-xs font-bold text-cyan-300 block">Low</span>
            <span className="text-lg font-black text-white">-3 pts</span>
            <span className="text-[10px] text-slate-400 block mt-1">Advisory notice</span>
          </div>
        </div>
      </div>

      {/* Privacy and Security Transparency Notice */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-4">
        <div className="flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Privacy, Security & Responsible AI</h2>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            • <strong>Local Data Sovereignty:</strong> All content submissions, version histories, and audit records are safely stored inside your local SQLite database (`dev.db`).
          </p>
          <p>
            • <strong>Zero External Leakage in Demo Mode:</strong> In Demo mode, submitted copy and corporate brand guidelines never leave your local environment.
          </p>
          <p>
            • <strong>Human-in-the-Loop Safeguards:</strong> AI recommendations are advisory. High scores do not bypass review requirements, and only human reviewers can approve content for release.
          </p>
        </div>
      </div>
    </div>
  );
};
