import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  PlusCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Database,
  Sparkles
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import SuperAdminLogin from './components/SuperAdminLogin';
import DashboardView from './components/DashboardView';
import TenantsView from './components/TenantsView';
import PlansView from './components/PlansView';
import DatabaseView from './components/DatabaseView';
import AuditLogsView from './components/AuditLogsView';
import SettingsView from './components/SettingsView';
import DevicesView from './components/DevicesView';
import SubscriptionsView from './components/SubscriptionsView';
import BillingView from './components/BillingView';
import {
  ADMIN_API_URL,
  ADMIN_AUTH_URL,
  getStoredToken,
  getStoredAdmin,
  applyToken,
  saveSession,
  clearSession,
  logout as logoutSession,
  installAuthInterceptor
} from './authClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Light Theme by Default as requested!

  // Auth session state
  const [admin, setAdmin] = useState(getStoredAdmin());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);

  // New Shop Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    plan: 'starter',
    maxDevices: 2
  });

  const showNotification = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, tenantsRes, plansRes, logsRes] = await Promise.all([
        axios.get(`${ADMIN_API_URL}/stats`),
        axios.get(`${ADMIN_API_URL}/tenants`),
        axios.get(`${ADMIN_API_URL}/plans`),
        axios.get(`${ADMIN_API_URL}/audit-logs`)
      ]);
      setStats(statsRes.data.data);
      setTenants(tenantsRes.data.data);
      setPlans(plansRes.data.data);
      setAuditLogs(logsRes.data.data || []);
    } catch (err) {
      console.error('Failed to connect to Admin Backend:', err);
      // 401/403 is handled by the auth interceptor (it signs the operator out)
      if (![401, 403].includes(err.response?.status)) {
        showNotification('Could not connect to Master Backend server', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Force sign-out whenever the backend rejects the session
  useEffect(() => {
    return installAuthInterceptor((message) => {
      setIsAuthenticated(false);
      setAdmin(null);
      setActiveTab('dashboard');
      showNotification(message, 'error');
    });
  }, []);

  // Restore an existing session on reload (validates the token against /auth/me)
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }

    applyToken(token);

    (async () => {
      try {
        const res = await axios.get(`${ADMIN_AUTH_URL}/me`);
        setAdmin(res.data.admin);
        setIsAuthenticated(true);
      } catch {
        clearSession();
        setAdmin(null);
        setIsAuthenticated(false);
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  // Load platform data only once a session is established
  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const handleLoginSuccess = (token, adminProfile) => {
    saveSession(token, adminProfile);
    setAdmin(adminProfile);
    setIsAuthenticated(true);
    showNotification(`Welcome back, ${adminProfile.name}.`);
  };

  const handleLogout = async () => {
    await logoutSession();
    setIsAuthenticated(false);
    setAdmin(null);
    setActiveTab('dashboard');
    setStats(null);
    setTenants([]);
    setPlans([]);
    setAuditLogs([]);
  };

  // Update root html class for dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleCreateShop = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showNotification('Shop Name and Email are required.', 'error');
      return;
    }

    try {
      const res = await axios.post(`${ADMIN_API_URL}/tenants`, formData);
      if (res.data.success) {
        showNotification(res.data.message);
        setShowCreateModal(false);
        setFormData({ name: '', email: '', phone: '', plan: 'starter', maxDevices: 2 });
        fetchData();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to create shop.', 'error');
    }
  };

  const toggleTenantStatus = async (tenant) => {
    const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await axios.patch(`${ADMIN_API_URL}/tenants/${tenant.id}/status`, { status: newStatus });
      if (res.data.success) {
        showNotification(`Status updated for ${tenant.name}`);
        fetchData();
      }
    } catch (err) {
      showNotification('Failed to update status.', 'error');
    }
  };

  const handleUpdateTenant = async (id, updatePayload) => {
    try {
      const res = await axios.put(`${ADMIN_API_URL}/tenants/${id}`, updatePayload);
      if (res.data.success) {
        showNotification(res.data.message);
        fetchData();
      }
    } catch (err) {
      showNotification('Failed to update tenant details.', 'error');
    }
  };

  const handleUpdatePlan = async (id, planPayload) => {
    try {
      const res = await axios.put(`${ADMIN_API_URL}/plans/${id}`, planPayload);
      if (res.data.success) {
        showNotification(res.data.message);
        fetchData();
      }
    } catch (err) {
      showNotification('Failed to update plan.', 'error');
    }
  };

  const generateDbPreview = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return slug ? `tenant_db_${slug}` : 'tenant_db_...';
  };

  // --- AUTH GATE -----------------------------------------------------------

  if (authChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <img src="/Selsolve Logo.png" alt="SelSolve Logo" className="w-14 h-14 rounded-2xl object-contain shadow-2xl" />
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          Loading SelSolve Admin…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <SuperAdminLogin
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-3.5 ${
              toast.type === 'error' 
                ? 'bg-rose-900/90 border-rose-700 text-rose-100 shadow-rose-900/20' 
                : 'bg-emerald-900/90 border-emerald-700 text-emerald-100 shadow-emerald-900/20'
            }`}
          >
            {toast.type === 'error' ? <XCircle className="w-5 h-5 text-rose-300 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />}
            <span className="font-semibold text-xs tracking-wide">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        stats={stats}
        admin={admin}
        onLogout={handleLogout}
      />

      {/* Main Content Workspace Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Navbar Header */}
        <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
              {activeTab === 'dashboard' && 'Dashboard Analytics Overview'}
              {activeTab === 'tenants' && 'Tenants Directory'}
              {activeTab === 'devices' && 'Device Mapping & Licence Control'}
              {activeTab === 'subscriptions' && 'Subscriptions, Renewals & Trials'}
              {activeTab === 'plans' && 'SaaS Subscription Tier Matrix'}
              {activeTab === 'billing' && 'SaaS Billing & Razorpay Payments'}
              {activeTab === 'database' && 'Database Health & Pool Diagnostics'}
              {activeTab === 'audit' && 'Security & Action Audit Trail'}
              {activeTab === 'settings' && 'Platform Settings & Switches'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData} 
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Sync Platform Data"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
              {/* <span className="hidden sm:inline">Sync Platform</span>
              
              
              
              */}
            </button>

            {/* <button 
              onClick={() => setShowCreateModal(true)} 
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Provision Shop</span>
            </button> */}
          </div>
        </header>

        {/* Dynamic View Container */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
          {activeTab === 'dashboard' && (
            <DashboardView 
              stats={stats}
              tenants={tenants}
              plans={plans}
              auditLogs={auditLogs}
              loading={loading}
              onRefresh={fetchData}
              onOpenCreateModal={() => setShowCreateModal(true)}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'tenants' && (
            <TenantsView
              tenants={tenants}
              onToggleStatus={toggleTenantStatus}
              onUpdateTenant={handleUpdateTenant}
              onOpenCreateModal={() => setShowCreateModal(true)}
              showNotification={showNotification}
            />
          )}

          {activeTab === 'devices' && (
            <DevicesView isDarkMode={isDarkMode} showToast={showNotification} />
          )}

          {activeTab === 'subscriptions' && (
            <SubscriptionsView isDarkMode={isDarkMode} showToast={showNotification} onRefresh={fetchData} />
          )}

          {activeTab === 'plans' && (
            <PlansView
              plans={plans}
              onUpdatePlan={handleUpdatePlan}
            />
          )}

          {activeTab === 'billing' && (
            <BillingView isDarkMode={isDarkMode} showToast={showNotification} onRefresh={fetchData} />
          )}

          {activeTab === 'database' && (
            <DatabaseView />
          )}

          {activeTab === 'audit' && (
            <AuditLogsView auditLogs={auditLogs} />
          )}

          {activeTab === 'settings' && (
            <SettingsView showNotification={showNotification} />
          )}
        </main>
      </div>

      {/* Provision Shop Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="panel-light p-6 max-w-lg w-full rounded-3xl shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PlusCircle className="text-indigo-600 w-5 h-5" />
                  Provision Retail Shop & Database
                </h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateShop} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Shop Business Name *</label>
                  <input 
                    type="text"
                    placeholder="e.g. FreshMart Supermarket"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Owner Email (Passwordless OTP Login) *</label>
                  <input 
                    type="email"
                    placeholder="owner@freshmart.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Contact Phone Number</label>
                  <input 
                    type="text"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Subscription Plan</label>
                    <select
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
                    >
                      <option value="starter">Starter (2 Devices)</option>
                      <option value="pro">Pro Retailer (5 Devices)</option>
                      <option value="enterprise">Enterprise (25 Devices)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Max Terminals</label>
                    <input 
                      type="number"
                      min="1"
                      max="50"
                      value={formData.maxDevices}
                      onChange={(e) => setFormData({ ...formData, maxDevices: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* DB String Preview */}
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                  <span className="font-bold block mb-1">Dynamic Database String Preview:</span>
                  <code className="font-mono text-xs block bg-white dark:bg-slate-900 p-2 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    {generateDbPreview(formData.name)}
                  </code>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700"
                  >
                    Provision Shop & Database
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
