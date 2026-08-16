import React from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Sparkles, 
  Database, 
  ShieldCheck, 
  Settings, 
  Sun, 
  Moon, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Cpu, 
  UserCheck,
  Activity,
  Users,
  LogOut
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed, 
  isDarkMode,
  setIsDarkMode,
  stats,
  admin,
  onLogout
}) {
  const adminName = admin?.name || 'Super Admin';
  const adminEmail = admin?.email || '—';
  const initials = adminName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'SA';

  // Console user management is itself a privilege: only a role that carries it
  // sees the entry. The backend refuses the calls regardless, so hiding the tab
  // is about not offering a dead end.
  const canManageUsers = admin?.permissions?.canManageUsers ?? admin?.role === 'SuperAdmin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, badge: null },
    { id: 'tenants', label: 'Shops Directory', icon: Store, badge: stats ? stats.totalShops : 0 },
    { id: 'devices', label: 'Devices & Licences', icon: Cpu, badge: null },
    { id: 'subscriptions', label: 'Subscriptions', icon: UserCheck, badge: null },
    { id: 'plans', label: 'SaaS Plans & Pricing', icon: Sparkles, badge: null },
    { id: 'billing', label: 'Billing & Payments', icon: Activity, badge: null },
    { id: 'database', label: 'Database Health', icon: Database, badge: null },
    { id: 'audit', label: 'Audit & Security Logs', icon: ShieldCheck, badge: null },
    ...(canManageUsers ? [{ id: 'users', label: 'Console Users & Access', icon: Users, badge: null }] : []),
    { id: 'settings', label: 'Platform Settings', icon: Settings, badge: null }
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-900 border-r border-slate-800 text-slate-100' 
          : 'bg-white border-r border-slate-200 text-slate-800 shadow-sm'
      } ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <img src="/Selsolve Logo.png" alt="SelSolve Logo" className="w-8 h-8 rounded-xl object-contain shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="tracking-tight text-base text-slate-900 dark:text-white">
                <span className="font-black">Sel</span><span className="font-light">Solve</span>
              </span>
              <span className="text-[10px] font-mono font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                Enterprise Admin
              </span>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Main Management
          </div>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                isActive 
                  ? isDarkMode 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

             
            </button>
          );
        })}
      </div>

      {/* Theme Toggle & Platform Status */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
        {/* Theme Switcher Button */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
            isDarkMode 
              ? 'bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-700' 
              : 'bg-slate-100 text-indigo-900 border border-slate-200 hover:bg-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isDarkMode ? <Moon className="w-4 h-4 text-amber-400 shrink-0" /> : <Sun className="w-4 h-4 text-amber-500 shrink-0" />}
            {!isCollapsed && <span>{isDarkMode ? 'Dark Theme' : 'Light Theme'}</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 uppercase font-mono">
              Toggle
            </span>
          )}
        </button>

        {/* Admin User Footer */}
        <div className="pt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden" title={adminEmail}>
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{adminName}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{adminEmail}</span>
                <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 truncate">
                  {admin?.permissions?.roleLabel || admin?.role || 'Super Admin'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            title="Sign out"
            className={`p-2 rounded-xl shrink-0 transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:text-rose-300 hover:bg-rose-950/50'
                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
            }`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
