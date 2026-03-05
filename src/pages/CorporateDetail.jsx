import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaturityBadge, StageBadge } from "@/components/shared/StatusBadge";
import { PIPELINE_STAGES, STAGE_COLORS, CRM_TYPES } from "@/components/ui/DesignTokens";
import TaskDrawer from "@/components/crm/TaskDrawer";
import {
  Loader2, ArrowLeft, Building2, Zap, Users, Briefcase, Star, Map,
  ExternalLink, Eye, EyeOff, Shield, User, Trash2, X, ChevronRight,
  Lightbulb, CheckCircle2, Calendar, Plus, Check, Clock, Mail
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TABS = [
  { id: "overview", label: "Visão Geral", icon: Building2 },
  { id: "diagnostics", label: "Diagnósticos", icon: Zap },
  { id: "theses", label: "Teses & Radar", icon: Star },
  { id: "crm", label: "SuperCRM", icon: Briefcase },
  { id: "team", label: "Equipe", icon: Users },
];

export default function CorporateDetail() {
  const params = new URLSearchParams(window.location.search);
  const corporateId = params.get("corporate_id");

  const [currentUser, setCurrentUser] = useState(null);
  const [corporate, setCorporate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Data per tab
  const [sessions, setSessions] = useState([]);
  const [theses, setTheses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [startups, setStartups] = useState({});
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [matches, setMatches] = useState({});

  // CRM selected
  const [selectedProject, setSelectedProject] = useState(null);
  const [movingStage, setMovingStage] = useState(null);
  const [filterStage, setFilterStage] = useState("all");

  // Team management state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("usuario");
  const [inviting, setInviting] = useState(false);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
    if (corporateId) loadAll();
  }, [corporateId]);

  const loadAll = async () => {
    setLoading(true);
    const [corp, sesses, thes, projs, ss, mems, ms] = await Promise.all([
      base44.entities.Corporate.filter({ id: corporateId }).then(r => r[0]),
      base44.entities.DiagnosticSession.filter({ corporate_id: corporateId }, "-created_date"),
      base44.entities.InnovationThesis.filter({ corporate_id: corporateId }, "-created_date"),
      base44.entities.CRMProject.filter({ corporate_id: corporateId }, "-created_date"),
      base44.entities.Startup.filter({ is_deleted: false }),
      base44.entities.CorporateMember.filter({ corporate_id: corporateId }),
      base44.entities.StartupMatch.filter({ corporate_id: corporateId }, "-fit_score", 200),
    ]);
    setCorporate(corp);
    setSessions(sesses);
    setTheses(thes);
    setProjects(projs);
    const sMap = {};
    ss.forEach(s => { sMap[s.id] = s; });
    setStartups(sMap);
    setMembers(mems.filter(m => m.status === "active"));
    setPendingRequests(mems.filter(m => m.status === "pending"));
    const mMap = {};
    ms.forEach(m => {
      if (!mMap[m.startup_id] || (m.fit_score || 0) > (mMap[m.startup_id].fit_score || 0)) {
        mMap[m.startup_id] = m;
      }
    });
    setMatches(mMap);
    setLoading(false);
  };

  const inviteMember = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setInviting(true);
    const existing = members.find(m => m.email?.toLowerCase() === email) ||
      pendingRequests.find(m => m.email?.toLowerCase() === email);
    if (!existing) {
      const newMember = await base44.entities.CorporateMember.create({
        corporate_id: corporateId,
        email,
        role: inviteRole,
        super_crm_access: true,
        status: "active",
        invited_by: currentUser?.email
      });
      base44.users.inviteUser(email, "user").catch(() => {});
      setMembers(prev => [...prev, newMember]);
    }
    setInviteEmail("");
    setInviting(false);
  };

  const toggleSuperCRM = async (mem) => {
    setSavingId(mem.id);
    const updated = await base44.entities.CorporateMember.update(mem.id, { super_crm_access: !mem.super_crm_access });
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    setSavingId(null);
  };

  const changeRole = async (mem, role) => {
    setSavingId(mem.id);
    const updated = await base44.entities.CorporateMember.update(mem.id, { role });
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    setSavingId(null);
  };

  const removeMember = async (mem) => {
    await base44.entities.CorporateMember.delete(mem.id);
    setMembers(prev => prev.filter(m => m.id !== mem.id));
  };

  const approveRequest = async (req) => {
    setSavingId(req.id);
    const updated = await base44.entities.CorporateMember.update(req.id, { status: "active" });
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    setMembers(prev => [...prev, updated]);
    setSavingId(null);
  };

  const rejectRequest = async (req) => {
    await base44.entities.CorporateMember.update(req.id, { status: "rejected" });
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const moveStage = async (proj, stage) => {
    setMovingStage(proj.id);
    const updated = await base44.entities.CRMProject.update(proj.id, { stage });
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (selectedProject?.id === proj.id) setSelectedProject(updated);
    setMovingStage(null);
  };

  if (!corporateId) return (
    <div className="flex items-center justify-center min-h-64 text-sm" style={{ color: '#4B4F4B' }}>
      Nenhuma empresa selecionada. <Link to={createPageUrl("CorporateManagement")} className="ml-2 underline" style={{ color: '#E10867' }}>Voltar</Link>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  if (!corporate) return (
    <div className="flex items-center justify-center min-h-64 text-sm" style={{ color: '#4B4F4B' }}>
      Empresa não encontrada.
    </div>
  );

  const latestSession = sessions.filter(s => s.status === "completed")[0];
  const activeProjects = projects.filter(p => p.include_in_super_crm !== false);

  return (
    <div className="max-w-full px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to={createPageUrl("CorporateManagement")}
          className="inline-flex items-center gap-1.5 text-sm mb-4 hover:opacity-75 transition-opacity"
          style={{ color: '#4B4F4B' }}>
          <ArrowLeft className="w-4 h-4" /> Voltar para Empresas
        </Link>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0"
            style={{ background: '#fce7ef', color: '#E10867' }}>
            {(corporate.trade_name || corporate.company_name)?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>
              {corporate.trade_name || corporate.company_name}
            </h1>
            <p className="text-sm" style={{ color: '#4B4F4B' }}>{corporate.company_name}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {corporate.sector && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#ECEEEA', color: '#4B4F4B' }}>{corporate.sector}</span>}
              {corporate.size && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#ECEEEA', color: '#4B4F4B' }}>{corporate.size}</span>}
              {latestSession && <MaturityBadge level={latestSession.maturity_level} />}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to={createPageUrl("StartupRadar") + `?corporate_id=${corporate.id}${latestSession ? `&session_id=${latestSession.id}` : ""}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Map className="w-3.5 h-3.5" /> Abrir Radar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Diagnósticos", value: sessions.filter(s => s.status === "completed").length, icon: Zap, color: '#E10867' },
          { label: "Teses de Inovação", value: theses.length, icon: Star, color: '#6B2FA0' },
          { label: "Projetos no CRM", value: activeProjects.length, icon: Briefcase, color: '#2C4425' },
          { label: "Membros de Equipe", value: members.length, icon: Users, color: '#B4D1D7' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: '#A7ADA7' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: stat.color + '22' }}>
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: '#111111' }}>{stat.value}</p>
              <p className="text-xs" style={{ color: '#4B4F4B' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto" style={{ borderColor: '#A7ADA7' }}>
        {TABS.map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${activeTab === tab.id ? 'border-magenta' : 'border-transparent hover:border-gray-200'}`}
            style={{ color: activeTab === tab.id ? '#E10867' : '#4B4F4B', borderBottomColor: activeTab === tab.id ? '#E10867' : 'transparent' }}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#111111' }}>Dados da Empresa</h3>
            <div className="space-y-2.5 text-sm">
              {[
                ["Razão Social", corporate.company_name],
                ["Nome Fantasia", corporate.trade_name],
                ["CNPJ", corporate.cnpj],
                ["Setor", corporate.sector],
                ["Porte", corporate.size],
                ["Website", corporate.website],
                ["Estado", corporate.state],
                ["País", corporate.country],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span style={{ color: '#A7ADA7' }}>{k}</span>
                  {k === "Website" ? (
                    <a href={v} target="_blank" rel="noreferrer" className="font-medium truncate flex items-center gap-1" style={{ color: '#E10867' }}>
                      {v} <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-medium text-right" style={{ color: '#111111' }}>{v}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#111111' }}>Contato Principal</h3>
            <div className="space-y-2.5 text-sm">
              {[
                ["Nome", corporate.contact_name],
                ["E-mail", corporate.contact_email],
                ["Cargo", corporate.contact_role],
                ["Telefone", corporate.contact_phone],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span style={{ color: '#A7ADA7' }}>{k}</span>
                  <span className="font-medium text-right" style={{ color: '#111111' }}>{v}</span>
                </div>
              ))}
            </div>
            {corporate.notes && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#ECEEEA' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#4B4F4B' }}>Notas internas</p>
                <p className="text-sm" style={{ color: '#4B4F4B' }}>{corporate.notes}</p>
              </div>
            )}
          </div>
          {corporate.innovation_objectives?.length > 0 && (
            <div className="bg-white rounded-2xl border p-5 md:col-span-2" style={{ borderColor: '#A7ADA7' }}>
              <h3 className="font-semibold text-sm mb-3" style={{ color: '#111111' }}>Objetivos de Inovação</h3>
              <div className="flex flex-wrap gap-2">
                {corporate.innovation_objectives.map(obj => (
                  <span key={obj} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                    style={{ background: '#fce7ef', color: '#E10867' }}>
                    <CheckCircle2 className="w-3 h-3" /> {obj}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Diagnostics */}
      {activeTab === "diagnostics" && (
        <div className="space-y-3">
          {sessions.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color: '#A7ADA7' }}>Nenhum diagnóstico realizado.</div>
          )}
          {sessions.map(sess => (
            <div key={sess.id} className="bg-white rounded-2xl border p-4 flex items-center gap-4 flex-wrap" style={{ borderColor: '#A7ADA7' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sess.status === 'completed' ? '' : 'opacity-60'}`}
                    style={{ background: sess.status === 'completed' ? '#ECEEEA' : '#fff7ed', color: sess.status === 'completed' ? '#2C4425' : '#9a3412' }}>
                    {sess.status === "completed" ? "Concluído" : sess.status === "in_progress" ? "Em andamento" : sess.status}
                  </span>
                  {sess.maturity_level && <MaturityBadge level={sess.maturity_level} />}
                  {sess.version > 1 && <span className="text-xs" style={{ color: '#A7ADA7' }}>v{sess.version}</span>}
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: '#4B4F4B' }}>
                  {sess.overall_score != null && (
                    <span>Score: <span className="font-bold" style={{ color: '#E10867' }}>{sess.overall_score}%</span></span>
                  )}
                  {sess.completed_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(sess.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
              {sess.status === "completed" && (
                <Link to={createPageUrl("Diagnostic") + `?session_id=${sess.id}&corporate_id=${corporate.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Ver Resultado
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Theses & Radar */}
      {activeTab === "theses" && (
        <div className="space-y-3">
          {theses.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color: '#A7ADA7' }}>Nenhuma tese de inovação gerada ainda.</div>
          )}
          {theses.map(thesis => (
            <div key={thesis.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: '#A7ADA7' }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1.5" style={{ color: '#111111' }}>
                    {thesis.thesis_text?.slice(0, 120)}…
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {thesis.macro_categories?.map(c => (
                      <span key={c} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: '#f3e8ff', color: '#6B2FA0' }}>{c}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: '#A7ADA7' }}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(thesis.created_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {thesis.matching_ran && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Matching realizado</span>}
                  </div>
                </div>
                <Link to={createPageUrl("StartupRadar") + `?corporate_id=${corporate.id}&session_id=${thesis.session_id || ""}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
                    <Map className="w-3.5 h-3.5" /> Ver Radar
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: SuperCRM */}
      {activeTab === "crm" && (
        <div>
          <div className="flex gap-2 mb-5 flex-wrap">
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm" style={{ borderColor: '#A7ADA7' }}>
              <option value="all">Todos os estágios</option>
              {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {PIPELINE_STAGES.map(stage => {
                const cols = activeProjects
                  .filter(p => filterStage === "all" || p.stage === filterStage)
                  .filter(p => p.stage === stage);
                const stageColor = STAGE_COLORS[stage];
                return (
                  <div key={stage} className="w-60 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: stageColor }} />
                      <span className="font-semibold text-xs" style={{ color: '#111111' }}>{stage}</span>
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#ECEEEA', color: '#4B4F4B' }}>{cols.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {cols.map(proj => {
                        const startup = startups[proj.startup_id];
                        return (
                          <div key={proj.id}
                            className="bg-white rounded-xl border p-3 cursor-pointer hover:shadow-md transition-shadow"
                            style={{ borderColor: '#A7ADA7' }}
                            onClick={() => setSelectedProject(proj)}>
                            <div className="flex items-center gap-2 mb-1.5">
                              {startup?.logo_url ? (
                                <img src={startup.logo_url} className="w-6 h-6 rounded-lg object-contain border" />
                              ) : (
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{ background: '#fce7ef', color: '#E10867' }}>
                                  {startup?.name?.[0] || "?"}
                                </div>
                              )}
                              <p className="font-medium text-xs truncate" style={{ color: '#111111' }}>{proj.project_name}</p>
                            </div>
                            <p className="text-xs truncate" style={{ color: '#4B4F4B' }}>{startup?.name || "—"}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-xs" style={{ color: '#A7ADA7' }}>{proj.type}</span>
                              {proj.fit_score && <span className="text-xs font-bold" style={{ color: '#E10867' }}>{proj.fit_score}%</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project drawer */}
          {selectedProject && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedProject(null)} />
              <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-base" style={{ color: '#111111' }}>{selectedProject.project_name}</h2>
                    <button onClick={() => setSelectedProject(null)}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
                  </div>
                  <StageBadge stage={selectedProject.stage} />
                  <div className="mt-4 mb-4">
                    <p className="text-xs font-semibold mb-2" style={{ color: '#4B4F4B' }}>Mover para:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PIPELINE_STAGES.filter(s => s !== selectedProject.stage).map(s => (
                        <button key={s}
                          onClick={() => moveStage(selectedProject, s)}
                          disabled={movingStage === selectedProject.id}
                          className="px-2.5 py-1 rounded-full text-xs border transition-all hover:bg-gray-50"
                          style={{ borderColor: '#A7ADA7', color: '#4B4F4B' }}>
                          {movingStage === selectedProject.id ? "…" : s}
                        </button>
                      ))}
                    </div>
                  </div>
                  {startups[selectedProject.startup_id] && (() => {
                    const s = startups[selectedProject.startup_id];
                    const match = matches[selectedProject.startup_id];
                    return (
                      <div className="p-4 rounded-xl mb-4" style={{ background: '#ECEEEA' }}>
                        <div className="flex items-center gap-3">
                          {s.logo_url ? (
                            <img src={s.logo_url} className="w-9 h-9 rounded-lg object-contain border" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
                              style={{ background: '#fce7ef', color: '#E10867' }}>{s.name?.[0]}</div>
                          )}
                          <div>
                            <p className="font-semibold text-sm">{s.name}</p>
                            <p className="text-xs" style={{ color: '#4B4F4B' }}>{s.category}</p>
                          </div>
                          {match?.fit_score && (
                            <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#fce7ef', color: '#E10867' }}>{match.fit_score}%</span>
                          )}
                        </div>
                        {s.description && <p className="text-xs mt-2" style={{ color: '#4B4F4B' }}>{s.description}</p>}
                      </div>
                    );
                  })()}
                  <TaskDrawer project={selectedProject} showHeader={true} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Team */}
      {activeTab === "team" && (
        <div className="max-w-3xl space-y-5">
          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <div className="rounded-2xl border p-5" style={{ borderColor: '#fed7aa', background: '#fff7ed' }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" style={{ color: '#ea580c' }} />
                <h2 className="font-semibold text-sm" style={{ color: '#9a3412' }}>
                  {pendingRequests.length} solicitação(ões) pendentes
                </h2>
              </div>
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between gap-3 bg-white rounded-xl p-3 border" style={{ borderColor: '#fed7aa' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: '#fce7ef', color: '#E10867' }}>
                        {req.email?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>{req.email}</p>
                        <p className="text-xs" style={{ color: '#4B4F4B' }}>Quer se vincular como {req.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => approveRequest(req)} disabled={savingId === req.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                        style={{ background: '#2C4425' }}>
                        <Check className="w-3.5 h-3.5" /> Aprovar
                      </button>
                      <button onClick={() => rejectRequest(req)} disabled={savingId === req.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border"
                        style={{ borderColor: '#A7ADA7', color: '#4B4F4B' }}>
                        <X className="w-3.5 h-3.5" /> Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite new member */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <h2 className="font-semibold text-sm mb-4" style={{ color: '#111111' }}>Convidar novo membro</h2>
            <div className="flex gap-2 flex-wrap">
              <Input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="email@empresa.com"
                type="email"
                className="flex-1 min-w-48"
                onKeyDown={e => e.key === "Enter" && inviteMember()}
              />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#A7ADA7' }}>
                <option value="usuario">Usuário</option>
                <option value="gestor">Gestor</option>
              </select>
              <Button onClick={inviteMember} disabled={inviting || !inviteEmail.trim()}
                className="text-white gap-2" style={{ background: '#E10867', border: 'none' }}>
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Adicionar
              </Button>
            </div>
          </div>

          {/* Members list */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <h2 className="font-semibold text-sm mb-4" style={{ color: '#111111' }}>Membros ativos ({members.length})</h2>
            <div className="space-y-3">
              {members.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: '#A7ADA7' }}>Nenhum membro ainda.</p>
              )}
              {members.map(mem => (
                <div key={mem.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: '#ECEEEA' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: mem.role === "gestor" ? '#fce7ef' : '#ECEEEA', color: mem.role === "gestor" ? '#E10867' : '#4B4F4B' }}>
                    {mem.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>{mem.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: mem.role === "gestor" ? '#fce7ef' : '#f3e8ff', color: mem.role === "gestor" ? '#E10867' : '#6B2FA0' }}>
                        {mem.role === "gestor" ? "🛡 Gestor" : "👤 Usuário"}
                      </span>
                      <span className="text-xs flex items-center gap-0.5"
                        style={{ color: mem.super_crm_access !== false ? '#2C4425' : '#A7ADA7' }}>
                        {mem.super_crm_access !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        SuperCRM
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleSuperCRM(mem)} disabled={savingId === mem.id}
                      title={mem.super_crm_access !== false ? "Revogar acesso ao SuperCRM" : "Liberar acesso ao SuperCRM"}
                      className="p-1.5 rounded-lg border transition-all hover:bg-gray-50" style={{ borderColor: '#ECEEEA' }}>
                      {savingId === mem.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                        mem.super_crm_access !== false ? <Eye className="w-3.5 h-3.5" style={{ color: '#2C4425' }} /> : <EyeOff className="w-3.5 h-3.5" style={{ color: '#A7ADA7' }} />}
                    </button>
                    <button onClick={() => changeRole(mem, mem.role === "gestor" ? "usuario" : "gestor")}
                      disabled={savingId === mem.id}
                      title={mem.role === "gestor" ? "Rebaixar para usuário" : "Promover a gestor"}
                      className="p-1.5 rounded-lg border transition-all hover:bg-gray-50" style={{ borderColor: '#ECEEEA' }}>
                      {mem.role === "gestor" ? <User className="w-3.5 h-3.5" style={{ color: '#6B2FA0' }} /> : <Shield className="w-3.5 h-3.5" style={{ color: '#E10867' }} />}
                    </button>
                    <button onClick={() => removeMember(mem)}
                      className="p-1.5 rounded-lg border transition-all hover:bg-red-50" style={{ borderColor: '#ECEEEA' }}>
                      <Trash2 className="w-3.5 h-3.5" style={{ color: '#A7ADA7' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}