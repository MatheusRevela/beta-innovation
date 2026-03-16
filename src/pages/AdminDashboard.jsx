import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Database, Building2, Briefcase, Zap, TrendingUp, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(me => {
      if (me?.role !== 'admin') navigate(createPageUrl('Dashboard'));
      else loadStats();
    });
  }, []);

  const loadStats = async () => {
    const [startups, corps, sessions, projects] = await Promise.all([
      base44.entities.Startup.filter({ is_deleted: false }),
      base44.entities.Corporate.list(),
      base44.entities.DiagnosticSession.filter({ status: "completed" }),
      base44.entities.CRMProject.filter({ is_active: true })
    ]);
    setStats({
      startups: startups.length,
      startupsActive: startups.filter(s => s.is_active !== false).length,
      corporates: corps.length,
      sessions: sessions.length,
      avgScore: sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.overall_score || 0), 0) / sessions.length) : 0,
      projects: projects.length,
    });
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  const cards = [
    { label: "Startups cadastradas", value: stats.startups, sub: `${stats.startupsActive} ativas`, icon: Database, color: '#fce7ef', iconColor: '#E10867', link: "StartupManagement" },
    { label: "Empresas corporates", value: stats.corporates, sub: "registradas", icon: Building2, color: '#ECEEEA', iconColor: '#6B2FA0', link: "CorporateManagement" },
    { label: "Diagnósticos concluídos", value: stats.sessions, sub: `Score médio: ${stats.avgScore}`, icon: Zap, color: '#ECEEEA', iconColor: '#2C4425', link: null },
    { label: "Projetos no CRM", value: stats.projects, sub: "ativos", icon: Briefcase, color: '#ECEEEA', iconColor: '#3B145A', link: "CRMBoard" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader title="Console Admin" subtitle="Visão geral da plataforma Beta-i Innovation OS" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(card => {
          const Icon = card.icon;
          const content = (
            <div className="bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow"
              style={{ borderColor: '#A7ADA7' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.color }}>
                  <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                </div>
                {card.link && <TrendingUp className="w-3.5 h-3.5" style={{ color: '#A7ADA7' }} />}
              </div>
              <p className="text-2xl font-black" style={{ color: '#111111' }}>{card.value}</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: '#111111' }}>{card.label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>{card.sub}</p>
            </div>
          );
          return card.link
            ? <Link key={card.label} to={createPageUrl(card.link)}>{content}</Link>
            : <div key={card.label}>{content}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Gerenciar Startups", desc: "CRUD, enriquecimento IA, duplicatas", page: "StartupManagement", icon: "🗄️" },
          { label: "Empresas Corporates", desc: "Visualizar onboardings e diagnósticos", page: "CorporateManagement", icon: "🏢" },
          { label: "CRM Board", desc: "Pipeline consolidado de projetos", page: "CRMBoard", icon: "📋" },
          { label: "Relatórios", desc: "Métricas e exportações", page: "Reports", icon: "📊" },
          { label: "Audit Log", desc: "Histórico de ações na plataforma", page: "AuditLogs", icon: "📝" },
        ].map(item => (
          <Link key={item.page} to={createPageUrl(item.page)}>
            <div className="bg-white rounded-2xl border p-4 hover:shadow-md transition-shadow cursor-pointer"
              style={{ borderColor: '#A7ADA7' }}>
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-semibold text-sm" style={{ color: '#111111' }}>{item.label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}