import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Building2,
  Bell,
  Search,
  LogOut,
  UserCheck,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, switchRole, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const demoRoles: { role: UserRole; name: string; title: string; color: string }[] = [
    { role: 'CREATOR', name: 'Alex Rivera', title: 'Content Creator', color: 'text-blue-400' },
    { role: 'REVIEWER', name: 'Marcus Sterling', title: 'Senior Reviewer', color: 'text-amber-400' },
    { role: 'BRAND_MANAGER', name: 'Elena Vance', title: 'Brand Manager', color: 'text-purple-400' },
    { role: 'ADMIN', name: 'Sarah Chen', title: 'Administrator', color: 'text-cyan-400' },
  ];

  return (
    <header className="h-16 px-6 bg-[#0D1220]/90 backdrop-blur border-b border-[#1F293D] flex items-center justify-between sticky top-0 z-20">
      {/* Left: Workspace Selector & Search */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#111827] border border-[#1F293D]">
          <Building2 className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-slate-200">
            {user?.workspaceName || 'NovaTech Global'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
            LIVE
          </span>
        </div>

        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reviews, guidelines, sources..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#111827] border border-[#1F293D] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Right: Demo Role Switcher, Notifications, User Menu */}
      <div className="flex items-center gap-4">
        {/* Demo Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 text-xs text-purple-200 hover:border-purple-500/60 transition-colors"
            title="Switch demo persona to test role permissions"
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline font-medium">Demo Role:</span>
            <span className="font-bold text-white uppercase">{user?.role}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#111827] border border-[#1F293D] shadow-2xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-[#1F293D] mb-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Persona (Demo Mode)
                </span>
              </div>
              {demoRoles.map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    switchRole(item.role);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors hover:bg-slate-800 ${
                    user?.role === item.role ? 'bg-purple-600/15 text-white font-semibold' : 'text-slate-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-200">{item.name}</span>
                    <span className={`text-[10px] ${item.color}`}>{item.title}</span>
                  </div>
                  {user?.role === item.role && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300">
                      ACTIVE
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#111827] border border-[#1F293D] shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1F293D]">
                <span className="text-xs font-semibold text-slate-300">Governance Alerts</span>
                <span className="text-[10px] text-purple-400 font-medium">2 Unread</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-slate-300">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-0.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Changes Requested</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Review "Q4 Social Campaign" flagged with 2 critical violations.
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-300">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-0.5">
                    <span>Approved for Publication</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    "Email Newsletter - Distributed Work" approved by Marcus.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-[#1F293D]">
          <div className="flex items-center gap-2">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover border border-purple-500/40"
            />
            <div className="hidden lg:flex flex-col">
              <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
              <span className="text-[10px] text-slate-400">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
