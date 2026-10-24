import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Shield,
  Sparkles,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setError(null);
    setLoading(true);

    try {
      await demoLogin(role);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts: {
    role: UserRole;
    name: string;
    email: string;
    title: string;
    desc: string;
    color: string;
  }[] = [
    {
      role: 'CREATOR',
      name: 'Alex Rivera',
      email: 'creator@novatech.io',
      title: 'Content Creator',
      desc: 'Drafts and submits content, applies AI suggestions, creates revisions.',
      color: 'border-blue-500/40 hover:border-blue-400 bg-blue-950/20',
    },
    {
      role: 'REVIEWER',
      name: 'Marcus Sterling',
      email: 'reviewer@novatech.io',
      title: 'Senior Compliance Reviewer',
      desc: 'Inspects findings, adds comments, requests changes, signs off on publication.',
      color: 'border-amber-500/40 hover:border-amber-400 bg-amber-950/20',
    },
    {
      role: 'BRAND_MANAGER',
      name: 'Elena Vance',
      email: 'manager@novatech.io',
      title: 'Brand Governance Manager',
      desc: 'Controls guidelines, manages approved facts and brand assets.',
      color: 'border-purple-500/40 hover:border-purple-400 bg-purple-950/20',
    },
    {
      role: 'ADMIN',
      name: 'Sarah Chen',
      email: 'admin@novatech.io',
      title: 'Platform Administrator',
      desc: 'Configures workspace, manages team roles and security policies.',
      color: 'border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20',
    },
  ];

  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-8">
        {/* Brand Logo & Wordmark */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-purple-900/40 mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">BRANDGUARD AI</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Intelligent brand governance, factual verification, and human-in-the-loop content approval.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 text-center">
            {error}
          </div>
        )}

        {/* FAST 1-CLICK DEMO LOGIN (Judges & Evaluators) */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-purple-500/30 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                1-Click Demo Evaluation Sign In
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
              NovaTech Global
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Select an authorized persona below to immediately explore the platform with populated data and role permissions:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {demoAccounts.map((d) => (
              <button
                key={d.role}
                onClick={() => handleDemoLogin(d.role)}
                disabled={loading}
                className={`p-3.5 rounded-xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between ${d.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{d.name}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      {d.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono mb-1">
                    {d.email}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {d.title}
                  </span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{d.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-purple-300 mt-2">
                  <span>Log in as {d.name.split(' ')[0]}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Standard Email Login */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Or Sign In With Account Credentials
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Default password: <span className="text-purple-400 font-bold">Password123!</span> or <span className="text-purple-400 font-bold">password123</span>
            </span>
          </div>

          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@novatech.io"
                className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
                className="w-full px-3 py-2 bg-[#0D1220] border border-[#1F293D] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
