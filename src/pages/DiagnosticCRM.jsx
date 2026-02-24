import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { PIPELINE_STAGES, STAGE_COLORS, CRM_TYPES } from "@/components/ui/DesignTokens";
import { StageBadge } from "@/components/shared/StatusBadge";
import { MaturityBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Loader2, X, ExternalLink, Check, Trash2,
  ChevronLeft, ChevronRight, Zap, ToggleLeft, ToggleRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DiagnosticCRM() {
  const navigate = useNavigate();
  const [corporate, setCorporate] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [projects, setProjects] = useState([]);
  const [startups, setStartups] = useState({});
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selected, setSelected] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [movingStage, setMovingStage] = useState(null);
  const [togglingCrm, setTogglingCrm] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const me = await base44.auth.me();
    const corps = await base44.entities.Corporate.filter({ contact_email: me.email });
    const corp = corps[0];
    setCorporate(corp);
    if (corp) {
      const allSessions = await base44.entities.DiagnosticSession.filter(
        { corporate_id: corp.id, status: "completed" }, "-created_date"
      );
      setSessions(allSessions);
      if (allSessions.length > 0) {
        await loadSession(allSessions[0], corp.id);
      }
    }
    setLoading(false);
  };

  const loadSession = async (session, corpId) => {
    setSelectedSession(session);
    setLoadingProjects(true);
    const [ps, ss, theses] = await Promise.all([
      base44.entities.CRMProject.filter({ corporate_id: corpId || corporate?.id, session_id: session.id }),
      base44.entities.Startup.filter({ is_deleted: false }),
      base44.entities.InnovationThesis.filter({ session_id: session.id })
    ]);
    setProjects(ps);
    const map = {};
    ss.forEach(s => { map[s.id] = s; });
    setStartups(map);
    setThesis(theses[0] || null);
    setLoadingProjects(false);
    setSelected(null);
  };

  const openProject = async (proj) => {
    setSelected(proj);
    const t = await base44.entities.CRMTask.filter({ project_id: proj.id });
    setTasks(t);
  };

  const addTask = async () => {
    if (!newTask.trim() || !selected) return;
    const t = await base44.entities.CRMTask.create({
      project_id: selected.id,
      corporate_id: selected.corporate_id,
      title: newTask.trim()
    });
    setTasks(prev => [...prev, t]);
    setNewTask("");
  };

  const toggleTask = async (task) => {
    const updated = await base44.entities.CRMTask.update(task.id, {
      status: task.status === "done" ? "pending" : "done"
    });
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const deleteTask = async (taskId) => {
    await base44.entities.CRMTask.delete(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const moveStage = async (proj, stage) => {
    setMovingStage(proj.id);
    const updated = await base44.entities.CRMProject.update(proj.id, { stage });
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (selected?.id === proj.id) setSelected(updated);
    setMovingStage(null);
  };

  const toggleSuperCRM = async (proj) => {
    setTogglingCrm(proj.id);
    const updated = await base44.entities.CRMProject.update(proj.id, {
      include_in_super_crm: !proj.include_in_super_crm
    });
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (selected?.id === proj.id) setSelected(updated);
    setTogglingCrm(null);
  };

  const stageGroups = {};
  PIPELINE_STAGES.forEach(s => { stageGroups[s] = []; });
  projects.forEach(p => {
    if (stageGroups[p.stage]) stageGroups[p.stage].push(p);
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="animate-spin w-6 h-6" style={{ color: '#E10867' }} />
    </div>
  );

  if (!corporate) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="text-4xl mb-3">🚀</div>
      <h2 className="font-bold text-lg mb-2">Configure sua empresa primeiro</h2>
      <Button onClick={() => navigate(createPageUrl("Onboarding"))} className="text-white" style={{ background: '#E10867', border: 'none' }}>
        Iniciar Onboarding
      </Button>
    </div>
  );

  if (sessions.length === 0) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fce7ef' }}>
        <Zap className="w-7 h-7" style={{ color: '#E10867' }} />
      </div>
      <h2 className="font-bold text-lg mb-2" style={{ color: '#111111' }}>Nenhum diagnóstico concluído</h2>
      <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>
        Conclua um diagnóstico para começar a construir seu CRM de inovação.
      </p>
      <Button onClick={() => navigate(createPageUrl("MyDiagnostics"))} className="text-white" style={{ background: '#E10867', border: 'none' }}>
        Ver diagnósticos
      </Button>
    </div>
  );

  return (
    <div className="max-w-full px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>CRM por Diagnóstico</h1>
          <p className="text-sm mt-1" style={{ color: '#4B4F4B' }}>
            Pipeline de startups gerado a partir da tese de cada diagnóstico
          </p>
        </div>
        <Button
          onClick={() => navigate(createPageUrl("MyCRM"))}
          variant="outline"
          className="gap-2 text-sm"
          style={{ borderColor: '#6B2FA0', color: '#6B2FA0' }}
        >
          Ver SuperCRM →
        </Button>
      </div>

      {/* Session selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {sessions.map(s => (
          <button
            key={s.id}
            onClick={() => loadSession(s)}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all"
            style={{
              background: selectedSession?.id === s.id ? '#1E0B2E' : '#fff',
              borderColor: selectedSession?.id === s.id ? '#1E0B2E' : '#A7ADA7',
              color: selectedSession?.id === s.id ? '#fff' : '#111111'
            }}
          >
            <span className="block text-xs opacity-70 mb-0.5">
              {format(new Date(s.completed_at || s.created_date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
            Score {s.overall_score || "—"} · {s.maturity_level || ""}
          </button>
        ))}
      </div>

      {/* Thesis summary */}
      {thesis && (
        <div className="bg-white rounded-2xl border p-4 mb-6 flex items-start gap-3" style={{ borderColor: '#B4D1D7' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fce7ef' }}>
            <Zap className="w-4 h-4" style={{ color: '#E10867' }} />
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#E10867' }}>Tese de Inovação</p>
            <p className="text-sm" style={{ color: '#4B4F4B' }}>{thesis.thesis_text?.split("\n")[0]}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(thesis.macro_categories || []).map(c => (
                <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#fce7ef', color: '#E10867' }}>{c}</span>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(createPageUrl("StartupRadar") + `?session_id=${selectedSession?.id}`)}
            className="ml-auto flex-shrink-0 text-xs"
            style={{ borderColor: '#A7ADA7' }}
          >
            Radar <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}

      {loadingProjects ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin w-6 h-6" style={{ color: '#E10867' }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#A7ADA7' }}>
          <div className="text-4xl mb-3">📋</div>
          <h3 className="font-bold mb-2" style={{ color: '#111111' }}>Nenhum projeto neste diagnóstico</h3>
          <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>
            Adicione startups ao CRM a partir do Radar de Startups.
          </p>
          <Button
            onClick={() => navigate(createPageUrl("StartupRadar"))}
            className="text-white" style={{ background: '#E10867', border: 'none' }}
          >
            Ir ao Radar
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STAGES.map(stage => {
              const cols = stageGroups[stage] || [];
              const stageColor = STAGE_COLORS[stage];
              return (
                <div key={stage} className="w-64 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: stageColor }} />
                    <span className="font-semibold text-sm" style={{ color: '#111111' }}>{stage}</span>
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: '#ECEEEA', color: '#4B4F4B' }}>{cols.length}</span>
                  </div>
                  <div className="space-y-3">
                    {cols.map(proj => {
                      const startup = startups[proj.startup_id];
                      return (
                        <div key={proj.id}
                          className="bg-white rounded-xl border p-3 cursor-pointer hover:shadow-md transition-shadow"
                          style={{ borderColor: proj.include_in_super_crm === false ? '#A7ADA7' : '#A7ADA7', opacity: proj.include_in_super_crm === false ? 0.75 : 1 }}
                          onClick={() => openProject(proj)}>
                          <div className="flex items-start gap-2 mb-2">
                            {startup?.logo_url ? (
                              <img src={startup.logo_url} className="w-7 h-7 rounded-lg object-contain border" />
                            ) : (
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: '#fce7ef', color: '#E10867' }}>
                                {startup?.name?.[0] || "?"}
                              </div>
                            )}
                            <div className="overflow-hidden flex-1">
                              <p className="font-medium text-xs truncate" style={{ color: '#111111' }}>{proj.project_name}</p>
                              <p className="text-xs truncate" style={{ color: '#4B4F4B' }}>{startup?.name || "—"}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                              {proj.type === "Custom" ? proj.custom_type_label : proj.type}
                            </span>
                            <div className="flex items-center gap-1">
                              {proj.fit_score && (
                                <span className="text-xs font-bold" style={{ color: '#E10867' }}>{proj.fit_score}%</span>
                              )}
                              {proj.include_in_super_crm === false && (
                                <span className="text-xs px-1 py-0.5 rounded" style={{ background: '#ECEEEA', color: '#9E9E9E' }}>off</span>
                              )}
                            </div>
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
      )}

      {/* Project drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg" style={{ color: '#111111' }}>{selected.project_name}</h2>
                <button onClick={() => setSelected(null)}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
              </div>

              <StageBadge stage={selected.stage} />

              {/* SuperCRM toggle */}
              <div className="mt-4 p-3 rounded-xl flex items-center justify-between"
                style={{ background: selected.include_in_super_crm === false ? '#F5F5F5' : '#e8f5e9' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#111111' }}>Incluir no SuperCRM</p>
                  <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>
                    {selected.include_in_super_crm === false
                      ? "Este projeto não aparece no SuperCRM"
                      : "Este projeto aparece no SuperCRM consolidado"}
                  </p>
                </div>
                <button
                  onClick={() => toggleSuperCRM(selected)}
                  disabled={togglingCrm === selected.id}
                  className="flex-shrink-0"
                >
                  {togglingCrm === selected.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#A7ADA7' }} />
                  ) : selected.include_in_super_crm === false ? (
                    <ToggleLeft className="w-8 h-8" style={{ color: '#A7ADA7' }} />
                  ) : (
                    <ToggleRight className="w-8 h-8" style={{ color: '#2C4425' }} />
                  )}
                </button>
              </div>

              {/* Move stage */}
              <div className="mt-4 mb-5">
                <p className="text-xs font-semibold mb-2" style={{ color: '#4B4F4B' }}>Mover para:</p>
                <div className="flex flex-wrap gap-1.5">
                  {PIPELINE_STAGES.filter(s => s !== selected.stage).map(s => (
                    <button key={s}
                      onClick={() => moveStage(selected, s)}
                      disabled={movingStage === selected.id}
                      className="px-2.5 py-1 rounded-full text-xs border transition-all"
                      style={{ borderColor: '#A7ADA7', color: '#4B4F4B' }}>
                      {movingStage === selected.id ? "…" : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Startup info */}
              {startups[selected.startup_id] && (
                <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ background: '#ECEEEA' }}>
                  {startups[selected.startup_id].logo_url ? (
                    <img src={startups[selected.startup_id].logo_url} className="w-9 h-9 rounded-lg border object-contain" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold"
                      style={{ background: '#fce7ef', color: '#E10867' }}>
                      {startups[selected.startup_id].name?.[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{startups[selected.startup_id].name}</p>
                    <p className="text-xs" style={{ color: '#4B4F4B' }}>{startups[selected.startup_id].category}</p>
                  </div>
                  {startups[selected.startup_id].website && (
                    <a href={startups[selected.startup_id].website} target="_blank" rel="noreferrer" className="ml-auto">
                      <ExternalLink className="w-4 h-4" style={{ color: '#A7ADA7' }} />
                    </a>
                  )}
                </div>
              )}

              {selected.description && (
                <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>{selected.description}</p>
              )}

              {/* Tasks */}
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Tarefas</p>
                <div className="flex gap-2 mb-3">
                  <Input value={newTask} onChange={e => setNewTask(e.target.value)}
                    placeholder="Nova tarefa…" onKeyDown={e => e.key === "Enter" && addTask()} />
                  <Button onClick={addTask} className="text-white flex-shrink-0"
                    style={{ background: '#E10867', border: 'none' }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl border"
                      style={{ borderColor: '#ECEEEA', background: task.status === "done" ? '#f9f9f9' : '#fff' }}>
                      <button onClick={() => toggleTask(task)}
                        className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          borderColor: task.status === "done" ? '#2C4425' : '#A7ADA7',
                          background: task.status === "done" ? '#2C4425' : 'transparent'
                        }}>
                        {task.status === "done" && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className="flex-1 text-sm"
                        style={{
                          color: task.status === "done" ? '#A7ADA7' : '#111111',
                          textDecoration: task.status === "done" ? 'line-through' : 'none'
                        }}>{task.title}</span>
                      <button onClick={() => deleteTask(task.id)}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#A7ADA7' }} />
                      </button>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-xs text-center py-3" style={{ color: '#A7ADA7' }}>
                      Nenhuma tarefa. Adicione acima.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}