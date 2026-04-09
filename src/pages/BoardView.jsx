import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";
import { Briefcase, Zap, Loader2, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STAGE_COLORS = {
  "Shortlist": "#94a3b8",
  "Avaliação": "#3b82f6",
  "Conexão": "#8b5cf6",
  "PoC": "#f59e0b",
  "Escala/Investimento": "#10b981",
  "Encerrado": "#6b7280",
};

export default function BoardView() {
  const { loading: accessLoading, corporate, corporateId, isAdmin } = useCorporateAccess();
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessLoading) return;
    const load = async () => {
      const filter = isAdmin ? {} : { corporate_id: corporateId };
      const [projs, sess] = await Promise.all([
        base44.entities.CRMProject.filter({ ...filter, is_active: true }),
        corporateId ? base44.entities.DiagnosticSession.filter({ corporate_id: corporateId, status: "completed" }) : Promise.resolve([]),
      ]);
      setProjects(projs);
      setSessions(sess);
      setLoading(false);
    };
    if (corporateId || isAdmin) load();
    else setLoading(false);
  }, [accessLoading, corporateId, isAdmin]);

  // Agrupa projetos por stage
  const stageData = Object.keys(STAGE_COLORS).map(stage => ({
    name: stage,
    value: projects.filter(p => p.stage === stage).length,
    color: STAGE_COLORS[stage],
  })).filter(d => d.value > 0);

  const latestSession = sessions.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];

  if (loading || accessLoading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>Board View</h1>
        <p className="text-sm mt-1" style={{ color: '#4B4F4B' }}>
          {corporate ? (corporate.trade_name || corporate.company_name) : "Visão consolidada da plataforma"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fce7ef' }}>
              <Briefcase className="w-5 h-5" style={{ color: '#E10867' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#4B4F4B' }}>Projetos Ativos</p>
          </div>
          <p className="text-3xl font-black" style={{ color: '#111111' }}>{projects.length}</p>
        </div>

        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#e8f0e6' }}>
              <TrendingUp className="w-5 h-5" style={{ color: '#2C4425' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#4B4F4B' }}>Em PoC ou Escala</p>
          </div>
          <p className="text-3xl font-black" style={{ color: '#111111' }}>
            {projects.filter(p => ["PoC", "Escala/Investimento"].includes(p.stage)).length}
          </p>
        </div>

        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fce7ef' }}>
              <Zap className="w-5 h-5" style={{ color: '#E10867' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#4B4F4B' }}>Maturidade</p>
          </div>
          <p className="text-3xl font-black" style={{ color: '#111111' }}>
            {latestSession ? `${latestSession.overall_score}` : "—"}
          </p>
          {latestSession && <p className="text-xs mt-1" style={{ color: '#4B4F4B' }}>{latestSession.maturity_level}</p>}
        </div>
      </div>

      {/* Pipeline Chart */}
      {stageData.length > 0 && (
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#A7ADA7' }}>
          <h2 className="font-semibold text-base mb-4" style={{ color: '#111111' }}>Pipeline por Etapa</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stageData} barSize={36}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B4F4B' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4B4F4B' }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {stageData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {projects.length === 0 && (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#A7ADA7' }}>
          <div className="text-4xl mb-3">📊</div>
          <h2 className="font-bold text-lg mb-2" style={{ color: '#111111' }}>Sem dados ainda</h2>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>Adicione projetos ao CRM para visualizar o board executivo.</p>
        </div>
      )}
    </div>
  );
}