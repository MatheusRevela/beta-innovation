import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { getMaturidadeLevel } from "@/components/ui/DesignTokens";
import { MaturityBadge } from "@/components/shared/StatusBadge";
import { Zap, Map, Briefcase, ChevronRight, Loader2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [corporate, setCorporate] = useState(null);
  const [session, setSession] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const me = await base44.auth.me();
    setUser(me);
    const [corpsByEmail, corpsByCreator, projs] = await Promise.all([
      base44.entities.Corporate.filter({ contact_email: me.email }),
      base44.entities.Corporate.filter({ created_by: me.email }),
      base44.entities.CRMProject.filter({ is_active: true })
    ]);
    const allCorps = [...corpsByEmail, ...corpsByCreator];
    const seen = new Set();
    const uniqueCorps = allCorps.filter(c => seen.has(c.id) ? false : seen.add(c.id));
    const corp = uniqueCorps[0];
    setCorporate(corp);
    setProjects(projs);
    if (corp) {
      const sessions = await base44.entities.DiagnosticSession.filter({ corporate_id: corp.id });
      const completed = sessions.filter(s => s.status === "completed").sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
      setSession(completed[0] || null);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  const matLevel = session ? getMaturidadeLevel(session.overall_score) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>
          Olá, {user?.full_name?.split(" ")[0] || "bem-vindo(a)"} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: '#4B4F4B' }}>
          {corporate ? corporate.trade_name || corporate.company_name : "Configure sua empresa para começar"}
        </p>
      </div>

      {/* No corporate yet */}
      {!corporate && (
        <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: '#A7ADA7' }}>
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="font-bold text-lg mb-2" style={{ color: '#111111' }}>Comece seu diagnóstico</h2>
          <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>
            Cadastre sua empresa e descubra o nível de maturidade em inovação em poucos minutos.
          </p>
          <Link to={createPageUrl("Onboarding")}>
            <Button className="text-white px-8" style={{ background: '#E10867', border: 'none' }}>
              Iniciar Onboarding <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Has corporate */}
      {corporate && (
        <div className="space-y-4">
          {/* Diagnostic card */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fce7ef' }}>
                  <Zap className="w-5 h-5" style={{ color: '#E10867' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#111111' }}>Diagnóstico de Maturidade</p>
                  <p className="text-xs" style={{ color: '#4B4F4B' }}>6 pilares de inovação</p>
                </div>
              </div>
              <Link to={createPageUrl("MyDiagnostics")}>
                <Button variant="ghost" size="sm" className="text-xs gap-1" style={{ color: '#6B2FA0' }}>
                  <ClipboardList className="w-3.5 h-3.5" /> Ver todos
                </Button>
              </Link>
            </div>
            {session ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl font-black" style={{ color: '#E10867' }}>{session.overall_score}</span>
                    <span className="text-sm" style={{ color: '#4B4F4B' }}>/ 100</span>
                  </div>
                  <MaturityBadge level={session.maturity_level} />
                </div>
                <Link to={createPageUrl("Diagnostic") + `?session_id=${session.id}&corporate_id=${corporate.id}`}>
                  <Button variant="outline" style={{ borderColor: '#A7ADA7' }}>Ver resultado</Button>
                </Link>
              </div>
            ) : (
              <Link to={createPageUrl("Diagnostic") + `?corporate_id=${corporate.id}`}>
                <Button className="text-white w-full" style={{ background: '#E10867', border: 'none' }}>
                  Iniciar diagnóstico <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>

          {/* Radar card */}
          {session && (
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#ECEEEA' }}>
                    <Map className="w-5 h-5" style={{ color: '#6B2FA0' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#111111' }}>Radar de Startups</p>
                    <p className="text-xs" style={{ color: '#4B4F4B' }}>Startups selecionadas pela IA</p>
                  </div>
                </div>
                <Link to={createPageUrl("StartupRadar") + `?session_id=${session.id}&corporate_id=${corporate.id}`}>
                  <Button variant="outline" style={{ borderColor: '#A7ADA7' }}>Ver radar</Button>
                </Link>
              </div>
            </div>
          )}

          {/* CRM card */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#ECEEEA' }}>
                  <Briefcase className="w-5 h-5" style={{ color: '#2C4425' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#111111' }}>Meu CRM</p>
                  <p className="text-xs" style={{ color: '#4B4F4B' }}>{projects.length} projeto{projects.length !== 1 ? "s" : ""} ativo{projects.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <Link to={createPageUrl("MyCRM")}>
                <Button variant="outline" style={{ borderColor: '#A7ADA7' }}>Abrir CRM</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}