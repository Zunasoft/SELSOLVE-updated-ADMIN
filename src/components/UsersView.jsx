import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Pencil,
  Ban,
  RotateCcw,
  Trash2,
  X,
  Clock,
  Lock,
  Mail,
  CheckCircle2,
  Info
} from 'lucide-react';

import { ADMIN_API_URL } from '../authClient';

const emptyForm = { name: '', email: '', role: 'Admin' };

const roleStyles = {
  SuperAdmin: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  Admin: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  Viewer: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
};

const roleIcons = { SuperAdmin: ShieldCheck, Admin: ShieldAlert, Viewer: Eye };

export default function UsersView({ showNotification, currentAdmin, onSessionChanged }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState(emptyForm);

  // The user currently open in the edit dialog, or null when it is closed.
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: 'Admin' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${ADMIN_API_URL}/users`);
      setUsers(res.data.data || []);
      setRoles(res.data.roles || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to load console users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleGrant = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post(`${ADMIN_API_URL}/users`, grantForm);
      showNotification(res.data.message);
      setShowGrantModal(false);
      setGrantForm(emptyForm);
      fetchUsers();
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to grant console access.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user) => {
    setEditing(user);
    setEditForm({ name: user.name, role: user.role });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put(`${ADMIN_API_URL}/users/${editing.id}`, editForm);
      showNotification(res.data.message);
      setEditing(null);
      fetchUsers();
      // Renaming yourself changes what the sidebar shows.
      if (editing.isSelf) onSessionChanged?.();
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to update this account.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAccess = async (user) => {
    const revoking = user.status === 'active';
    const question = revoking
      ? `Revoke console access for ${user.name}?\n\nThey are signed out immediately and can no longer request a login code.`
      : `Restore console access for ${user.name}?`;
    if (!window.confirm(question)) return;

    try {
      const res = await axios.patch(`${ADMIN_API_URL}/users/${user.id}/status`, {
        status: revoking ? 'revoked' : 'active'
      });
      showNotification(res.data.message);
      fetchUsers();
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to change access.', 'error');
    }
  };

  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `Permanently delete ${user.name} <${user.email}>?\n\nThis removes the account entirely. To keep the record but block sign-in, revoke access instead.`
      )
    ) {
      return;
    }

    try {
      const res = await axios.delete(`${ADMIN_API_URL}/users/${user.id}`);
      showNotification(res.data.message);
      fetchUsers();
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to delete this account.', 'error');
    }
  };

  const canManage = currentAdmin?.permissions?.canManageUsers !== false;
  const selectedGrantRole = roles.find((r) => r.id === grantForm.role);
  const selectedEditRole = roles.find((r) => r.id === editForm.role);

  const formatDate = (value) => (value ? new Date(value).toLocaleString() : null);

  const RoleBadge = ({ role, label }) => {
    const Icon = roleIcons[role] || ShieldAlert;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
          roleStyles[role] || roleStyles.Viewer
        }`}
      >
        <Icon className="w-3 h-3" />
        {label || role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Console Users & Login Access
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Everyone allowed to sign in to this admin console. Sign-in is passwordless — an address listed here can
            request a one-time code at the login screen.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowGrantModal(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Grant Login Access
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Total Accounts</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            {summary ? summary.total : 0}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Active Logins</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {summary ? summary.active : 0}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Revoked</span>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <Ban className="w-4 h-4" />
            {summary ? summary.revoked : 0}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Super Admins</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            {summary ? summary.superAdmins : 0}
          </div>
        </div>
      </div>

      

      {/* Users Table */}
      <div className="panel-light rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 px-5">User</th>
                <th className="py-4 px-5">Role</th>
                <th className="py-4 px-5">Login Access</th>
                <th className="py-4 px-5">Last Sign-in</th>
                <th className="py-4 px-5">Trail</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 dark:text-slate-400">
                    Loading console users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No console users yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 shadow-sm ${
                            u.status === 'active' ? 'bg-indigo-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {u.name
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((w) => w[0].toUpperCase())
                            .join('')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            {u.name}
                            {u.isSelf && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold uppercase">
                                You
                              </span>
                            )}
                           
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <RoleBadge role={u.role} label={u.roleLabel} />
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          u.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        ></span>
                        {u.status === 'active' ? 'Allowed' : 'Revoked'}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(u.lastLoginAt) || 'Never signed in'}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {u.createdBy && <div>Granted by {u.createdBy}</div>}
                      {u.status !== 'active' && u.revokedBy && (
                        <div className="text-rose-600 dark:text-rose-400">Revoked by {u.revokedBy}</div>
                      )}
                      {!u.createdBy && !u.revokedBy && <span>—</span>}
                    </td>

                    <td className="py-4 px-5 text-right space-x-2 whitespace-nowrap">
                      {canManage ? (
                        <>
                          <button
                            onClick={() => openEdit(u)}
                            title="Edit name & role"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 font-bold text-xs transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleAccess(u)}
                            disabled={u.isSelf}
                            title={u.isSelf ? 'You cannot revoke your own access' : undefined}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.status === 'active'
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'active' ? (
                              <>
                                <Ban className="w-3.5 h-3.5" />
                                Revoke
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5" />
                                Restore
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDelete(u)}
                            disabled={!u.canDelete}
                            title={
                              u.isSelf
                                ? 'You cannot delete your own account'
                                : u.isSeedAccount
                                  ? 'The seed account is re-created on every restart — revoke it instead'
                                  : 'Delete account'
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400">View only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel-light p-6 max-w-lg w-full rounded-3xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="text-indigo-600 w-5 h-5" />
                Grant Console Login Access
              </h3>
              <button
                onClick={() => setShowGrantModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrant} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={grantForm.name}
                  onChange={(e) => setGrantForm({ ...grantForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Work Email (their login) *
                </label>
                <input
                  type="email"
                  placeholder="priya@zunasoft.com"
                  value={grantForm.email}
                  onChange={(e) => setGrantForm({ ...grantForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Role *</label>
                <select
                  value={grantForm.role}
                  onChange={(e) => setGrantForm({ ...grantForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {selectedGrantRole && (
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">{selectedGrantRole.description}</p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  No password is created. They open the console, enter this address and receive a 6-digit code by email.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Granting…' : 'Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel-light p-6 max-w-lg w-full rounded-3xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="text-indigo-600 w-5 h-5" />
                Edit Console User
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Email (login credential)
                </label>
                <input
                  type="email"
                  value={editing.email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  The address is the login itself, so it cannot be edited. Revoke this account and grant access to the
                  new address instead.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Role *</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  disabled={editing.isSelf}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {editing.isSelf ? (
                  <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                    You cannot change your own role — ask another Super Admin.
                  </p>
                ) : (
                  selectedEditRole && (
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">{selectedEditRole.description}</p>
                  )
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
