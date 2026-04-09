import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";
import { useAuth } from "@/lib/AuthContext";

import { MaturityBadge } from "@/components/shared/StatusBadge";
import { Zap, Map, Briefcase, ChevronRight, Loader2, ClipboardList, Lightbulb, Brain, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading: accessLoading, corporate, corporateId } = useCorporateAccess();
  const [session, setSession] = useState(null);
  const [projects, setProjects] = useState([]);
  const [theses, setTheses] = useState([]);
  const [aiAssessment, setAiAssessment] = useState(null);
  const [activeTab, setActiveTab] = useState('diagnostico');
  const [loading, setLoading] = useState(true);

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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
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
        <div className="max-w-6xl mx-auto px-4 pb-12">
          {/* Tabs Navigation */}
          <div className="flex gap-0.5 mb-8 border-b overflow-x-auto" style={{ borderColor: '#A7ADA7' }}>
            {[
              { id: 'diagnostico', label: 'Diagnóstico de Maturidade', icon: Zap, color: '#E10867' },
              { id: 'ai', label: 'AI Readiness', icon: Brain, color: '#6B2FA0' },
              { id: 'teses', label: 'Teses de Inovação', icon: Lightbulb, color: '#E10867' },
              { id: 'crm', label: 'Meu CRM', icon: Briefcase, color: '#2C4425' }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
                  style={{
                    borderColor: isActive ? tab.color : 'transparent',
                    color: isActive ? tab.color : '#4B4F4B'
                  }}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab: Diagnóstico */}
          {activeTab === 'diagnostico' && (
            <div className="space-y-4">
              {session ? (
                <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#A7ADA7' }}>
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#fce7ef' }}>
                        <Zap className="w-5 h-5" style={{ color: '#E10867' }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#111111' }}>Score de Maturidade</p>
                        <p className="text-xs" style={{ color: '#4B4F4B' }}>Conclusão em {session.completed_at ? new Date(session.completed_at).toLocaleDateString('pt-BR') : 'data não disponível'}</p>
                      </div>
                    </div>
                    <Link to={createPageUrl("Diagnostic") + `?session_id=${session.id}&corporate_id=${corporate.id}`}>
                      <Button variant="outline" size="sm" style={{ borderColor: '#A7ADA7' }}>Ver detalhes</Button>
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-4xl font-black mb-1" style={{ color: '#E10867' }}>{session.overall_score}</p>
                      <p className="text-xs" style={{ color: '#4B4F4B' }}>/ 100</p>
                      <div className="mt-2">
                        <MaturityBadge level={session.maturity_level} />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="h-3 rounded-full mb-2" style={{ background: '#ECEEEA' }}>
                        <div className="h-full rounded-full" style={{ width: `${session.overall_score}%`, background: '#E10867' }} />
                      </div>
                      <p className="text-xs" style={{ color: '#4B4F4B' }}>{session.overall_score}% de maturidade</p>
                    </div>
                  </div>
                  
                  {/* Next steps */}
                  <div className="pt-4 border-t" style={{ borderColor: '#ECEEEA' }}>
                    {aiAssessment ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: '#2C4425' }}>✓ AI Readiness realizado</p>
                          <p className="text-xs mt-1" style={{ color: '#4B4F4B' }}>Última avaliação: {new Date(aiAssessment.created_date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded" style={{ background: '#e8f5e9', color: '#2C4425' }}>Refazer em 90 dias</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold" style={{ color: '#111111' }}>Próximo passo:</p>
                        <Link to={createPageUrl("AIReadinessScan")}>
                          <Button className="text-white w-full text-xs h-8" style={{ background: '#6B2FA0', border: 'none' }}>Iniciar AI Readiness →</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  {session.pillar_scores && Object.keys(session.pillar_scores).length > 0 && (
                    <div className="pt-4 border-t mt-4" style={{ borderColor: '#ECEEEA' }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#A7ADA7' }}>Principais falhas:</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {Object.entries(session.pillar_scores || {})
                          .sort((a, b) => a[1] - b[1])
                          .slice(0, 3)
                          .map(([pillar, score]) => (
                            <span key={pillar} className="px-2 py-0.5 rounded-lg text-xs font-medium" 
                              style={{ background: '#FFF3E0', color: '#E65100' }}>
                              {pillar}: {Math.round(score)}/100
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to={createPageUrl("Diagnostic") + `?corporate_id=${corporate.id}`}>
                  <Button className="text-white w-full h-12" style={{ background: '#E10867', border: 'none' }}>
                    Iniciar Diagnóstico <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Tab: AI Readiness */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {aiAssessment ? (
                <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#A7ADA7' }}>
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#F3EEF8' }}>
                        <Brain className="w-5 h-5" style={{ color: '#6B2FA0' }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#111111' }}>AI Readiness Scan</p>
                        <p className="text-xs" style={{ color: '#4B4F4B' }}>9 dimensões críticas</p>
                      </div>
                    </div>
                    <Link to={createPageUrl("AIReadinessScan")}>
                      <Button variant="outline" size="sm" style={{ borderColor: '#A7ADA7' }}>Ver completo</Button>
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-4xl font-black mb-1" style={{ color: '#6B2FA0' }}>{Math.round(aiAssessment.global_score)}</p>
                      <p className="text-xs" style={{ color: '#4B4F4B' }}>/ 100</p>
                      <p className="text-xs font-semibold mt-2" style={{ color: '#6B2FA0' }}>
                        {aiAssessment.global_score >= 70 ? "Avançado" : aiAssessment.global_score >= 50 ? "Intermediário" : "Inicial"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <div className="h-3 rounded-full mb-2" style={{ background: '#ECEEEA' }}>
                        <div className="h-full rounded-full" style={{ width: `${aiAssessment.global_score}%`, background: '#6B2FA0' }} />
                      </div>
                      <p className="text-xs" style={{ color: '#4B4F4B' }}>{Math.round(aiAssessment.global_score)}% de prontidão</p>
                    </div>
                  </div>
                  
                  {Object.entries(aiAssessment.dimension_scores || {}).length > 0 && (
                    <div className="pt-4 border-t space-y-2" style={{ borderColor: '#ECEEEA' }}>
                      <p className="text-xs font-semibold" style={{ color: '#A7ADA7' }}>Gaps principais:</p>
                      {Object.entries(aiAssessment.dimension_scores || {})
                        .sort((a, b) => a[1] - b[1])
                        .slice(0, 2)
                        .map(([dim, score]) => (
                          <div key={dim} className="flex items-center justify-between text-xs">
                            <span style={{ color: '#4B4F4B' }}>{dim}</span>
                            <span className="font-semibold" style={{ color: '#E65100' }}>{Math.round(score)}/100</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link to={createPageUrl("AIReadinessScan")}>
                  <Button className="text-white w-full h-12" style={{ background: '#6B2FA0', border: 'none' }}>
                    Iniciar AI Readiness <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Tab: Teses */}
          {activeTab === 'teses' && (
            <div className="space-y-4">
              {theses.length > 0 ? (
                <>
                  {theses.map((thesis, i) => (
                    <div key={thesis.id} className="bg-white rounded-2xl border p-6" style={{ borderColor: '#A7ADA7' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#fce7ef' }}>
                            <Award className="w-5 h-5" style={{ color: '#E10867' }} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: '#111111' }}>Tese {i + 1}</p>
                            <p className="text-xs" style={{ color: '#4B4F4B' }}>Criada em {thesis.created_date ? new Date(thesis.created_date).toLocaleDateString('pt-BR') : 'data não disponível'}</p>
                          </div>
                        </div>
                        <Link to={createPageUrl("InnovationTheses")}>
                          <Button variant="outline" size="sm" style={{ borderColor: '#A7ADA7' }}>Ver tese</Button>
                        </Link>
                      </div>
                      
                      <p className="text-sm leading-relaxed mb-3" style={{ color: '#4B4F4B' }}>
                        {thesis.thesis_text?.substring(0, 120)}...
                      </p>
                      
                      {thesis.macro_categories && thesis.macro_categories.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {thesis.macro_categories.map(cat => (
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
                    <Button variant="outline" className="w-full" style={{ borderColor: '#A7ADA7' }}>Ver todas ({theses.length})</Button>
                  </Link>
                </>
              ) : (
                <Link to={createPageUrl("InnovationTheses")}>
                  <Button className="text-white w-full h-12" style={{ background: '#E10867', border: 'none' }}>
                    Criar Tese de Inovação <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Tab: CRM */}
          {activeTab === 'crm' && (
            <div className="space-y-4">
              {projects.length > 0 ? (
                <>
                  {projects.slice(0, 5).map(proj => (
                    <div key={proj.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: '#A7ADA7' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: '#111111' }}>{proj.project_name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>Tipo: {proj.type || 'N/A'}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2"
                          style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                          {proj.stage || 'Shortlist'}
                        </span>
                      </div>
                      
                      {proj.description && (
                        <p className="text-xs mt-2 leading-relaxed" style={{ color: '#4B4F4B' }}>
                          {proj.description.substring(0, 80)}...
                        </p>
                      )}
                    </div>
                  ))}
                  
                  <Link to={createPageUrl("MyCRM")}>
                    <Button className="w-full text-white" style={{ background: '#2C4425', border: 'none' }}>
                      Abrir CRM completo ({projects.length} projetos) <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to={createPageUrl("MyCRM")}>
                  <Button className="text-white w-full h-12" style={{ background: '#2C4425', border: 'none' }}>
                    Abrir CRM <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}