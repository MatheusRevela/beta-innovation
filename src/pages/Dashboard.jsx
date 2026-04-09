import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";
import { useAuth } from "@/lib/AuthContext";

import { MaturityBadge } from "@/components/shared/StatusBadge";
import { Zap, Map, Briefcase, ChevronRight, Loader2, ClipboardList, Lightbulb, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading: accessLoading, corporate, corporateId } = useCorporateAccess();
  const [session, setSession] = useState(null);
  const [projects, setProjects] = useState([]);
  const [theses, setTheses] = useState([]);
  const [aiAssessment, setAiAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect by role without full reload
  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") navigate(createPageUrl("AdminDashboard"), { replace: true });
    else if (user.role === "startup_user") navigate(createPageUrl("StartupPortal"), { replace: true });
  }, [user]);

  useEffect(() => {
    if (!accessLoading && corporateId) loadCorpData();
    else if (!accessLoading) setLoading(false);
  }, [accessLoading, corporateId]);

  const loadCorpData = async () => {
    try {
      const [sessions, thesesData, projs, aiData] = await Promise.all([
        base44.entities.DiagnosticSession.filter({ corporate_id: corporateId }),
        base44.entities.InnovationThesis.filter({ corporate_id: corporateId }),
        base44.entities.CRMProject.filter({ corporate_id: corporateId }),
        base44.entities.AIAssessment.filter({ corporate_id: corporateId }),
      ]);
      const completed = sessions
        .filter(s => s.status === "completed")
        .sort((a, b) => {
          const da = a.completed_at ? new Date(a.completed_at).getTime() : 0;
          const db = b.completed_at ? new Date(b.completed_at).getTime() : 0;
          return db - da;
        });
      setSession(completed[0] || null);
      setTheses(thesesData);
      setProjects(projs.filter(p => p.is_active !== false));
      setAiAssessment(aiData[0] || null);
    } catch (_) {
      // mostra estado vazio em caso de erro de rede
    } finally {
      setLoading(false);
    }
  };

  if (loading || accessLoading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );



  return (
    <div className="min-h-screen" style={{ background: '#ECEEEA' }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#111111' }}>
            Olá, {user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "bem-vindo(a)"} 👋
          </h1>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>
            {corporate ? `${corporate.trade_name || corporate.company_name}` : "Configure sua empresa para começar"}
          </p>
        </div>
        
        {!corporate && (
          <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: '#A7ADA7' }}>
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="font-bold text-xl mb-3" style={{ color: '#111111' }}>Comece seu diagnóstico</h2>
            <p className="text-sm mb-6" style={{ color: '#4B4F4B' }}>
              Cadastre sua empresa e descubra seu nível de maturidade em inovação.
            </p>
            <Link to={createPageUrl("Onboarding")}>
              <Button className="text-white px-8" style={{ background: '#E10867', border: 'none' }}>
                Iniciar Onboarding <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {corporate && (
        <div className="max-w-7xl mx-auto px-4 pb-12">

          {/* Diagnóstico Section */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#111111' }}>Diagnóstico de Maturidade</h2>
                <p className="text-sm" style={{ color: '#4B4F4B' }}>Avaliação de 6 pilares de inovação</p>
              </div>
              <Link to={createPageUrl("MyDiagnostics")}>
                <Button variant="ghost" size="sm" style={{ color: '#6B2FA0' }}>Ver todos →</Button>
              </Link>
            </div>
            
            {session ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Main diagnostic card */}
                <div className="bg-white rounded-2xl border p-6 md:col-span-2" style={{ borderColor: '#A7ADA7' }}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#fce7ef' }}>
                        <Zap className="w-6 h-6" style={{ color: '#E10867' }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: '#111111' }}>Score de Maturidade</p>
                        <p className="text-xs" style={{ color: '#4B4F4B' }}>Conclusão em {session.completed_at ? new Date(session.completed_at).toLocaleDateString('pt-BR') : 'data não disponível'}</p>
                      </div>
                    </div>
                    <Link to={createPageUrl("Diagnostic") + `?session_id=${session.id}&corporate_id=${corporate.id}`}>
                      <Button variant="outline" size="sm" style={{ borderColor: '#A7ADA7' }}>Ver detalhes</Button>
                    </Link>
                  </div>
                  
                  <div className="flex items-end gap-6">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-black" style={{ color: '#E10867' }}>{session.overall_score}</span>
                        <span className="text-lg" style={{ color: '#4B4F4B' }}>/ 100</span>
                      </div>
                      <MaturityBadge level={session.maturity_level} />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 rounded-full" style={{ background: '#ECEEEA' }}>
                        <div className="h-full rounded-full" style={{ width: `${session.overall_score}%`, background: '#E10867' }} />
                      </div>
                      <p className="text-xs mt-2" style={{ color: '#4B4F4B' }}>{session.overall_score}% de maturidade</p>
                    </div>
                  </div>
                  
                  {/* Pillar scores */}
                  {session.pillar_scores && Object.keys(session.pillar_scores).length > 0 && (
                    <div className="mt-6 pt-6 border-t" style={{ borderColor: '#ECEEEA' }}>
                      <p className="text-xs font-semibold mb-3" style={{ color: '#A7ADA7' }}>Principais falhas:</p>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(session.pillar_scores || {})
                          .sort((a, b) => a[1] - b[1])
                          .slice(0, 3)
                          .map(([pillar, score]) => (
                            <span key={pillar} className="px-2.5 py-1 rounded-lg text-xs font-medium" 
                              style={{ background: '#FFF3E0', color: '#E65100' }}>
                              {pillar.charAt(0).toUpperCase() + pillar.slice(1)}: {Math.round(score)}/100
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link to={createPageUrl("Diagnostic") + `?corporate_id=${corporate.id}`}>
                <Button className="text-white w-full h-14" style={{ background: '#E10867', border: 'none' }}>
                  Iniciar Diagnóstico <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>

          {/* AI Readiness + Teses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
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

          {/* AI Readiness Scan */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#A7ADA7' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F3EEF8' }}>
                  <Brain className="w-5 h-5" style={{ color: '#6B2FA0' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#111111' }}>AI Readiness Scan</p>
                  <p className="text-xs" style={{ color: '#4B4F4B' }}>9 dimensões de IA</p>
                </div>
              </div>
            </div>

            {aiAssessment ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F3EEF8' }}>
                    <div className="text-center">
                      <div className="text-2xl font-black" style={{ color: '#6B2FA0' }}>{Math.round(aiAssessment.global_score)}</div>
                      <p className="text-xs mt-0.5" style={{ color: '#6B2FA0' }}>/ 100</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: '#111111' }}>
                      {aiAssessment.global_score >= 70 ? "Avançado" : aiAssessment.global_score >= 50 ? "Intermediário" : "Inicial"}
                    </p>
                    <div className="h-2 rounded-full mt-2" style={{ background: '#ECEEEA' }}>
                      <div className="h-full rounded-full" style={{ width: `${aiAssessment.global_score}%`, background: '#6B2FA0' }} />
                    </div>
                  </div>
                </div>

                {Object.entries(aiAssessment.dimension_scores || {}).length > 0 && (
                  <div className="pt-3 border-t" style={{ borderColor: '#ECEEEA' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#111111' }}>Gaps principais:</p>
                    {Object.entries(aiAssessment.dimension_scores || {})
                      .sort((a, b) => a[1] - b[1])
                      .slice(0, 2)
                      .map(([dim, score]) => (
                        <div key={dim} className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: '#4B4F4B' }}>{dim}</span>
                          <span className="font-semibold" style={{ color: '#E65100' }}>{Math.round(score)}/100</span>
                        </div>
                      ))}
                  </div>
                )}

                <Link to={createPageUrl("AIReadinessScan")}>
                  <Button variant="outline" className="w-full" style={{ borderColor: '#A7ADA7' }}>Ver resultado completo</Button>
                </Link>
              </div>
            ) : (
              <Link to={createPageUrl("AIReadinessScan")}>
                <Button className="text-white w-full" style={{ background: '#6B2FA0', border: 'none' }}>
                  Iniciar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>

          {/* Teses de Inovação */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#A7ADA7' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fce7ef' }}>
                  <Lightbulb className="w-5 h-5" style={{ color: '#E10867' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#111111' }}>Teses de Inovação</p>
                  <p className="text-xs" style={{ color: '#4B4F4B' }}>{theses.length} tese{theses.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>

            {theses.length > 0 ? (
              <div className="space-y-3">
                {theses.slice(0, 2).map((thesis, i) => (
                  <div key={thesis.id} className="p-3 rounded-lg" style={{ background: '#FAFAFA' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#111111' }}>Tese {i + 1}</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#4B4F4B' }}>
                      {thesis.thesis_text?.substring(0, 80)}...
                    </p>
                    {thesis.macro_categories && thesis.macro_categories.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {thesis.macro_categories.slice(0, 2).map(cat => (
                          <span key={cat} className="text-xs px-2 py-0.5 rounded-full" 
                            style={{ background: '#fce7ef', color: '#E10867' }}>
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <Link to={createPageUrl("InnovationTheses")}>
                  <Button variant="outline" className="w-full" style={{ borderColor: '#A7ADA7' }}>Ver todas as teses</Button>
                </Link>
              </div>
            ) : (
              <Link to={createPageUrl("InnovationTheses")}>
                <Button className="text-white w-full" style={{ background: '#E10867', border: 'none' }}>
                  Criar Tese <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
          </div>

          {/* CRM Section */}
          <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#111111' }}>Meu CRM</h2>
              <p className="text-sm" style={{ color: '#4B4F4B' }}>Projetos ativos</p>
            </div>
            <Link to={createPageUrl("MyCRM")}>
              <Button variant="ghost" size="sm" style={{ color: '#2C4425' }}>Ver todos →</Button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#A7ADA7' }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ECEEEA' }}>
                <Briefcase className="w-6 h-6" style={{ color: '#2C4425' }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-3xl font-black" style={{ color: '#2C4425' }}>{projects.length}</span>
                  <span style={{ color: '#4B4F4B' }}>projeto{projects.length !== 1 ? "s" : ""} ativo{projects.length !== 1 ? "s" : ""}</span>
                </div>
                <p className="text-sm" style={{ color: '#4B4F4B' }}>em pipeline</p>
              </div>
            </div>

            {projects.length > 0 && (
              <div className="space-y-2 mb-4 pt-4 border-t" style={{ borderColor: '#ECEEEA' }}>
                {projects.slice(0, 3).map(proj => (
                  <div key={proj.id} className="flex items-center justify-between text-xs">
                    <span style={{ color: '#111111' }}>{proj.project_name?.substring(0, 30)}...</span>
                    <span className="px-2 py-0.5 rounded-full" 
                      style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                      {proj.stage || 'Shortlist'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link to={createPageUrl("MyCRM")}>
              <Button className="w-full text-white" style={{ background: '#2C4425', border: 'none' }}>
                Abrir CRM <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          </div>
          </div>
          )}
    </div>
  );
}