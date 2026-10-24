import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck2,
  FilePlus2,
  BookOpenCheck,
  DatabaseZap,
  Palette,
  CheckCircle2,
  BarChart3,
  Users2,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Content Reviews', to: '/reviews', icon: FileCheck2 },
    { label: 'New Review', to: '/reviews/new', icon: FilePlus2 },
    { label: 'Brand Guidelines', to: '/guidelines', icon: BookOpenCheck },
    { label: 'Approved Sources', to: '/sources', icon: DatabaseZap },
    { label: 'Brand Assets', to: '/assets', icon: Palette },
    { label: 'Review Approvals', to: '/approvals', icon: CheckCircle2 },
    { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Team & Roles', to: '/team', icon: Users2 },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-[#1F293D] bg-[#0D1220] transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#1F293D]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 shadow-lg shadow-purple-900/30 shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                BRANDGUARD
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-cyan-400">
                Governance AI
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Engine Badge */}
      {!collapsed ? (
        <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-[#111827] to-[#182235] border border-purple-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            <span className="text-xs font-semibold text-slate-200">Governance Engine</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Deterministic rule-based checks active. Evidence-backed guidelines.
          </p>
        </div>
      ) : (
        <div className="flex justify-center p-3 border-t border-[#1F293D]">
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>
      )}
    </aside>
  );
};
