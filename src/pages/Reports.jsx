import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import { Loader2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DIAGNOSTIC_PILLARS } from "@/components/diagnostic/DiagnosticQuestions";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [startups, setStartups] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [ss, st, pr] = await Promise.all([
      base44.entities.DiagnosticSession.filter({ status: "completed" }),
      base44.entities.Startup.filter({ is_deleted: false }),
      base44.entities.CRMProject.list()
    ]);
    setSessions(ss);
    setStartups(st);
    setProjects(pr);
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  // Maturity distribution
  const maturityDist = ["Iniciante", "Inicial", "Intermediário", "Avançado", "Líder"].map(level => ({
    name: level,
    count: sessions.filter(s => s.maturity_level === level).length
  })).filter(d => d.count > 0);

  // Avg pillar scores across all sessions
  const pillarAvgs = DIAGNOSTIC_PILLARS.map(p => {
    const scores = sessions.map(s => s.pillar_scores?.[p.id] || 0).filter(v => v > 0);
    return {
      name: p.name.split(" ")[0],
      avg: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    };
  });

  // Startup categories
  const catCount = {};
  startups.forEach(s => { if (s.category) catCount[s.category] = (catCount[s.category] || 0) + 1; });
  const catData = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));

  const COLORS = ['#E10867', '#6B2FA0', '#2C4425', '#B4D1D7', '#3B145A', '#A7ADA7', '#FDE68A', '#fce7ef'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader title="Relatórios" subtitle="Visão analítica da plataforma" />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Diagnósticos", value: sessions.length },
          { label: "Score médio", value: sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.overall_score || 0), 0) / sessions.length) + "%" : "—" },
          { label: "Startups ativas", value: startups.filter(s => s.is_active !== false).length },
          { label: "Projetos CRM", value: projects.length },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border p-4" style={{ borderColor: '#A7ADA7' }}>
            <p className="text-2xl font-black" style={{ color: '#E10867' }}>{stat.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pillar avg scores */}
        {sessions.length > 0 && (
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <p className="font-semibold text-sm mb-4" style={{ color: '#111111' }}>Score médio por pilar</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pillarAvgs} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEEEA" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#4B4F4B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#4B4F4B' }} domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, "Score médio"]} />
                <Bar dataKey="avg" fill="#E10867" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Maturity distribution */}
        {maturityDist.length > 0 && (
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <p className="font-semibold text-sm mb-4" style={{ color: '#111111' }}>Distribuição de maturidade</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={maturityDist} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, count }) => `${name}: ${count}`}>
                  {maturityDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Startup categories */}
        {catData.length > 0 && (
          <div className="bg-white rounded-2xl border p-5 lg:col-span-2" style={{ borderColor: '#A7ADA7' }}>
            <p className="font-semibold text-sm mb-4" style={{ color: '#111111' }}>Top categorias de startups</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEEEA" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#4B4F4B' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#4B4F4B' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6B2FA0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {sessions.length === 0 && startups.length === 0 && (
          <div className="lg:col-span-2 text-center py-16 bg-white rounded-2xl border" style={{ borderColor: '#A7ADA7' }}>
            <BarChart3 className="w-10 h-10 mx-auto mb-3" style={{ color: '#A7ADA7' }} />
            <p className="font-semibold" style={{ color: '#111111' }}>Sem dados suficientes</p>
            <p className="text-sm mt-1" style={{ color: '#4B4F4B' }}>Os gráficos aparecerão conforme a plataforma for sendo usada.</p>
          </div>
        )}
      </div>
    </div>
  );
}