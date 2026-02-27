import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Zap, Map, Briefcase, Settings,
  ChevronLeft, ChevronRight, LogOut, User, Menu, X,
  Building2, Star, Database, BarChart3, FileText, Bell
} from "lucide-react";

const NAV_ITEMS = {
  admin: [
    { section: "Dashboard" },
    { label: "Dashboard", icon: LayoutDashboard, page: "AdminDashboard" },
    { section: "Visão do Usuário" },
    { label: "Diagnósticos", icon: Zap, page: "MyDiagnostics" },
    { label: "Teses de Inovação", icon: Star, page: "InnovationTheses" },
    { label: "Radar de Startups", icon: Map, page: "StartupRadar" },
    { label: "CRM por Tese", icon: FileText, page: "DiagnosticCRM" },
    { label: "SuperCRM", icon: Briefcase, page: "MyCRM" },
    { label: "Notificações", icon: Bell, page: "Notifications" },
    { section: "Gestão" },
    { label: "Startups", icon: Database, page: "StartupManagement" },
    { label: "Corporates", icon: Building2, page: "CorporateManagement" },
    { label: "CRM Board", icon: Briefcase, page: "CRMBoard" },
    { label: "Relatórios", icon: BarChart3, page: "Reports" },
    { label: "Audit Log", icon: FileText, page: "AuditLogs" },
  ],
  user: [
    { label: "Início", icon: LayoutDashboard, page: "Dashboard" },
    { label: "Diagnósticos", icon: Zap, page: "MyDiagnostics" },
    { label: "Teses de Inovação", icon: Star, page: "InnovationTheses" },
    { label: "Radar", icon: Map, page: "StartupRadar" },
    { label: "CRM por Tese", icon: FileText, page: "DiagnosticCRM" },
    { label: "SuperCRM", icon: Briefcase, page: "MyCRM" },
    { label: "Notificações", icon: Bell, page: "Notifications" },
  ],
};

const PORTAL_PAGES = ["Dashboard", "Diagnostic", "StartupRadar", "MyCRM", "Onboarding"];
const ADMIN_PAGES = ["AdminDashboard", "StartupManagement", "CorporateManagement", "CRMBoard", "Reports", "AuditLogs", "AdminSettings"];
const NO_LAYOUT_PAGES = ["Onboarding", "Login", "Register", "Home", "AdminLogin"];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (NO_LAYOUT_PAGES.includes(currentPageName)) {
    return <div className="min-h-screen" style={{ background: '#ECEEEA' }}>{children}</div>;
  }

  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? NAV_ITEMS.admin : NAV_ITEMS.user;
  const portalLabel = isAdmin ? "Console Admin" : "Portal Corporates";
  const portalColor = isAdmin ? "#1E0B2E" : "#2C4425";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#ECEEEA' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 flex flex-col h-full transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ background: portalColor, borderRight: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: '#E10867' }}>
                <Star className="w-4 h-4 text-white" />
              </div>
              <div className="truncate">
                <p className="text-white font-semibold text-sm leading-tight">Beta-i</p>
                <p className="text-white/60 text-xs leading-tight">{portalLabel}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto"
              style={{ background: '#E10867' }}>
              <Star className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item, idx) => {
            if (item.section) {
              if (collapsed) return null;
              return (
                <p key={`section-${idx}`} className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-widest text-white/30 select-none">
                  {item.section}
                </p>
              );
            }
            const { label, icon: Icon, page } = item;
            const isActive = currentPageName === page;
            return (
              <Link
                key={page}
                to={createPageUrl(page)}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                  }
                `}
                style={isActive ? { background: '#E10867' } : {}}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User + collapse */}
        <div className="border-t border-white/10 p-3 space-y-2 flex-shrink-0">
          {!collapsed && user && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#E10867' }}>
                <span className="text-white text-xs font-bold">
                  {(user.full_name || user.email || 'U')[0].toUpperCase()}
                </span>
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-xs font-medium truncate">{user.full_name || 'Usuário'}</p>
                <p className="text-white/50 text-xs truncate">{user.role || 'user'}</p>
              </div>
            </div>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => base44.auth.logout(createPageUrl("Home"))}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
              {!collapsed && <span>Sair</span>}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex ml-auto items-center justify-center w-7 h-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center h-14 px-4 border-b bg-white flex-shrink-0"
          style={{ borderColor: '#A7ADA7' }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" style={{ color: '#111111' }} />
          </button>
          <div className="ml-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: '#E10867' }}>
              <Star className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm" style={{ color: '#111111' }}>Beta-i Innovation OS</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}