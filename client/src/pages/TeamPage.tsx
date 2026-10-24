import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Users2,
  Shield,
  Check,
  X,
  UserCheck,
  Building,
} from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    try {
      await api.patch(`/users/${targetUserId}/role`, { role: newRole });
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user role.');
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  // Permission Matrix Definition
  const permissions = [
    { capability: 'Submit Content for Brand Review', creator: true, manager: true, reviewer: true, admin: true },
    { capability: 'Accept / Edit Suggested AI Corrections', creator: true, manager: true, reviewer: true, admin: true },
    { capability: 'Participate & Reply in Review Threads', creator: true, manager: true, reviewer: true, admin: true },
    { capability: 'Request Revisions from Creator', creator: false, manager: true, reviewer: true, admin: true },
    { capability: 'Formally Approve Content for Publication', creator: false, manager: true, reviewer: true, admin: true },
    { capability: 'Create & Version Brand Guidelines', creator: false, manager: true, reviewer: false, admin: true },
    { capability: 'Manage Approved Facts & Sources', creator: false, manager: true, reviewer: false, admin: true },
    { capability: 'Upload & Retire Brand Assets', creator: false, manager: true, reviewer: false, admin: true },
    { capability: 'Manage Workspace Users & Permissions', creator: false, manager: false, reviewer: false, admin: true },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-[#1F293D]">
        <h1 className="text-2xl font-extrabold text-white">Team Members & Role Governance</h1>
        <p className="text-sm text-slate-400">
          Enforce role-based access control, separation of duties, and workspace authorization.
        </p>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="p-5 rounded-2xl bg-[#111827] border border-[#1F293D] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                  alt={u.name}
                  className="w-12 h-12 rounded-xl object-cover border border-purple-500/40"
                />
                <div className="truncate">
                  <h3 className="text-sm font-bold text-white truncate">{u.name}</h3>
                  <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 my-3 pt-2 border-t border-[#1F293D]">
                <div className="flex justify-between">
                  <span>Reviews Authored:</span>
                  <span className="font-bold text-white">{u._count?.createdReviews || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Approval Decisions:</span>
                  <span className="font-bold text-white">{u._count?.approvalDecisions || 0}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1F293D]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Assigned Role
              </label>
              {isAdmin ? (
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                  className="w-full px-2.5 py-1.5 bg-[#0D1220] border border-[#1F293D] rounded-lg text-xs font-semibold text-purple-300 focus:outline-none"
                >
                  <option value="CREATOR">CREATOR</option>
                  <option value="REVIEWER">REVIEWER</option>
                  <option value="BRAND_MANAGER">BRAND_MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              ) : (
                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {u.role}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Role Permission Matrix */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F293D]">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Role Governance Permission Matrix</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Backend authorization enforces segregation of duties to prevent self-approvals and unauthorized changes.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1F293D] text-slate-400 font-bold uppercase">
                <th className="pb-3">Action / Capability</th>
                <th className="pb-3 text-center">Creator</th>
                <th className="pb-3 text-center">Brand Manager</th>
                <th className="pb-3 text-center">Reviewer</th>
                <th className="pb-3 text-center">Administrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]">
              {permissions.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20">
                  <td className="py-3 text-slate-200 font-medium">{p.capability}</td>
                  <td className="py-3 text-center">
                    {p.creator ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="py-3 text-center">
                    {p.manager ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="py-3 text-center">
                    {p.reviewer ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="py-3 text-center">
                    {p.admin ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
