import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";
import { PIPELINE_STAGES, STAGE_COLORS, CRM_TYPES } from "@/components/ui/DesignTokens";
import { StageBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Loader2, X, ExternalLink, Trash2, Lightbulb, EyeOff } from "lucide-react";
import TaskDrawer from "@/components/crm/TaskDrawer";
import { createPageUrl } from "@/utils";

export default function MyCRM() {
  const { loading: accessLoading, corporate, hasSuperCRMAccess, corporateId } = useCorporateAccess();
  const [projects, setProjects] = useState([]);
  const [startups, setStartups] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [movingStage, setMovingStage] = useState(null);
  const [filterStage, setFilterStage] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (!accessLoading && corporateId) loadData();
    else if (!accessLoading) setLoading(false);
  }, [accessLoading, corporateId]);

  const [theses, setTheses] = useState({});
  const [matches, setMatches] = useState({});

  const loadData = async () => {
    setLoading(true);
    const [ps, ss, ts, ms] = await Promise.all([
      base44.entities.CRMProject.filter({ corporate_id: corporateId }, "-created_date"),
      base44.entities.Startup.filter({ is_deleted: false }),
      base44.entities.InnovationThesis.filter({ corporate_id: corporateId }, "-created_date"),
      base44.entities.StartupMatch.filter({ corporate_id: corporateId }, "-created_date"),
    ]);
    // SuperCRM: only include projects not explicitly excluded
    setProjects(ps.filter(p => p.include_in_super_crm !== false));
    const sMap = {};
    ss.forEach(s => { sMap[s.id] = s; });
    setStartups(sMap);
    const tMap = {};
    ts.forEach(t => { tMap[t.id] = t; });
    setTheses(tMap);
    // Map startup_id -> match (to get fit_reasons, risk_reasons, thesis_id)
    const mMap = {};
    ms.forEach(m => {
      if (!mMap[m.startup_id] || (m.fit_score || 0) > (mMap[m.startup_id].fit_score || 0)) {
        mMap[m.startup_id] = m;
      }
    });
    setMatches(mMap);
    setLoading(false);
  };

  const openProject = async (proj) => {
    setSelected(proj);
    const t = await base44.entities.CRMTask.filter({ project_id: proj.id });
    setTasks(t);
  };

  const addTask = async () => {
    if (!newTask.trim() || !selected) return;
    const me = await base44.auth.me();
    const t = await base44.entities.CRMTask.create({ project_id: selected.id, corporate_id: selected.corporate_id, title: newTask.trim(), created_by_name: me.full_name || me.email });
    setTasks(prev => [...prev, t]);
    setNewTask("");
  };

  const toggleTask = async (task) => {
    const updated = await base44.entities.CRMTask.update(task.id, { status: task.status === "done" ? "pending" : "done" });
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const deleteTask = async (taskId) => {
    await base44.entities.CRMTask.delete(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const deleteProject = async (proj) => {
    if (!window.confirm(`Remover "${proj.project_name}" do CRM?`)) return;
    await base44.entities.CRMProject.delete(proj.id);
    setProjects(prev => prev.filter(p => p.id !== proj.id));
    setSelected(null);
  };

  const moveStage = async (proj, stage) => {
    setMovingStage(proj.id);
    const updated = await base44.entities.CRMProject.update(proj.id, { stage });
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (selected?.id === proj.id) setSelected(updated);
    setMovingStage(null);
  };

  const stageGroups = {};
  PIPELINE_STAGES.forEach(s => { stageGroups[s] = []; });
  projects
    .filter(p => filterStage === "all" || p.stage === filterStage)
    .filter(p => filterType === "all" || p.type === filterType)
    .forEach(p => {
      if (stageGroups[p.stage]) stageGroups[p.stage].push(p);
    });

  if (loading || accessLoading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="animate-spin w-6 h-6" style={{ color: '#E10867' }} />
    </div>
  );

  if (!hasSuperCRMAccess) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#ECEEEA' }}>
        <EyeOff className="w-7 h-7" style={{ color: '#A7ADA7' }} />
      </div>
      <h2 className="font-bold text-lg mb-2" style={{ color: '#111111' }}>Acesso ao SuperCRM restrito</h2>
      <p className="text-sm" style={{ color: '#4B4F4B' }}>
        O gestor da sua empresa não habilitou o seu acesso ao SuperCRM. Entre em contato com ele para solicitar acesso.
      </p>
    </div>
  );

  return (
    <div className="max-w-full px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>SuperCRM</h1>
          <p className="text-sm mt-1" style={{ color: '#4B4F4B' }}>
            Todos os projetos ativos integrados de diferentes diagnósticos e teses
          </p>
        </div>
        <Button
          variant="outline"
          className="text-sm gap-2"
          style={{ borderColor: '#E10867', color: '#E10867' }}
          onClick={() => window.location.href = createPageUrl("DiagnosticCRM")}
        >
          ← CRM por Diagnóstico
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mt-6 mb-6">
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm" style={{ borderColor: '#A7ADA7' }}>
          <option value="all">Todos os estágios</option>
          {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm" style={{ borderColor: '#A7ADA7' }}>
          <option value="all">Todos os tipos</option>
          {CRM_TYPES.filter(t => t.value !== "Custom").map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Kanban */}
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
                    const typeObj = CRM_TYPES.find(t => t.value === proj.type);
                    return (
                      <div key={proj.id}
                        className="bg-white rounded-xl border p-3 cursor-pointer hover:shadow-md transition-shadow"
                        style={{ borderColor: '#A7ADA7' }}
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
                          <div className="overflow-hidden">
                            <p className="font-medium text-xs truncate" style={{ color: '#111111' }}>{proj.project_name}</p>
                            <p className="text-xs truncate" style={{ color: '#4B4F4B' }}>{startup?.name || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                            {typeObj?.icon} {proj.type === "Custom" ? proj.custom_type_label : proj.type}
                          </span>
                          {proj.fit_score && (
                            <span className="text-xs font-bold" style={{ color: '#E10867' }}>{proj.fit_score}%</span>
                          )}
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
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg" style={{ color: '#111111' }}>{selected.project_name}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => deleteProject(selected)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Remover do CRM">
                    <Trash2 className="w-4 h-4" style={{ color: '#A7ADA7' }} />
                  </button>
                  <button onClick={() => setSelected(null)}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
                </div>
              </div>
              <StageBadge stage={selected.stage} />

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
              {startups[selected.startup_id] && (() => {
                const s = startups[selected.startup_id];
                const match = matches[selected.startup_id];
                const thesis = match?.thesis_id ? theses[match.thesis_id] : null;
                return (
                  <div className="mb-5">
                    {/* Header */}
                    <div className="flex items-start gap-3 p-4 rounded-xl mb-3" style={{ background: '#ECEEEA' }}>
                      {s.logo_url ? (
                        <img src={s.logo_url} className="w-10 h-10 rounded-lg border object-contain flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0"
                          style={{ background: '#fce7ef', color: '#E10867' }}>
                          {s.name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{s.name}</p>
                          {match?.fit_score && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#fce7ef', color: '#E10867' }}>{match.fit_score}%</span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: '#4B4F4B' }}>{s.category}</p>
                      </div>
                      {s.website && (
                        <a href={s.website} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-4 h-4" style={{ color: '#A7ADA7' }} />
                        </a>
                      )}
                    </div>

                    {selected.added_by_name && (
                      <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: '#A7ADA7' }}>
                        <span>Adicionada por:</span>
                        <span className="font-medium" style={{ color: '#4B4F4B' }}>{selected.added_by_name}</span>
                      </div>
                    )}

                    {/* Description */}
                    {s.description && (
                      <p className="text-sm mb-3 leading-relaxed" style={{ color: '#4B4F4B' }}>{s.description}</p>
                    )}

                    {/* Metadata grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3 p-3 rounded-xl border" style={{ borderColor: '#ECEEEA' }}>
                      {s.vertical && (
                        <>
                          <span style={{ color: '#A7ADA7' }}>Vertical</span>
                          <span className="font-semibold text-right" style={{ color: '#111111' }}>{s.vertical}</span>
                        </>
                      )}
                      {s.business_model && (
                        <>
                          <span style={{ color: '#A7ADA7' }}>Modelo</span>
                          <span className="font-semibold text-right" style={{ color: '#111111' }}>{s.business_model}</span>
                        </>
                      )}
                      {s.stage && (
                        <>
                          <span style={{ color: '#A7ADA7' }}>Estágio</span>
                          <span className="font-semibold text-right" style={{ color: '#111111' }}>{s.stage}</span>
                        </>
                      )}
                      {(s.state || s.country) && (
                        <>
                          <span style={{ color: '#A7ADA7' }}>Localização</span>
                          <span className="font-semibold text-right" style={{ color: '#111111' }}>{[s.state, s.country].filter(Boolean).join(', ')}</span>
                        </>
                      )}
                      {s.price_range && (
                        <>
                          <span style={{ color: '#A7ADA7' }}>Investimento</span>
                          <span className="font-semibold text-right" style={{ color: '#111111' }}>{s.price_range}</span>
                        </>
                      )}
                    </div>

                    {/* Thesis origin */}
                    {thesis && (
                      <div className="flex items-start gap-2 p-3 rounded-xl mb-3"
                        style={{ background: '#f3e8ff', border: '1px solid #d8b4fe' }}>
                        <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#6B2FA0' }} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold mb-0.5" style={{ color: '#6B2FA0' }}>Tese de origem</p>
                          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#3B145A' }}>
                            {thesis.thesis_text?.slice(0, 120)}…
                          </p>
                          {thesis.macro_categories?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {thesis.macro_categories.slice(0, 3).map(c => (
                                <span key={c} className="text-xs px-1.5 py-0.5 rounded-full"
                                  style={{ background: '#d8b4fe', color: '#3B145A' }}>{c}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fit & risk reasons */}
                    {match?.fit_reasons?.length > 0 && (
                      <div className="p-3 rounded-xl mb-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: '#2C4425' }}>✓ Pontos de fit</p>
                        <ul className="space-y-1">
                          {match.fit_reasons.map((r, i) => (
                            <li key={i} className="text-xs" style={{ color: '#2C4425' }}>• {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {match?.risk_reasons?.length > 0 && (
                      <div className="p-3 rounded-xl mb-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: '#9a3412' }}>⚠ Pontos de atenção</p>
                        <ul className="space-y-1">
                          {match.risk_reasons.map((r, i) => (
                            <li key={i} className="text-xs" style={{ color: '#9a3412' }}>• {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Visit site */}
                    {s.website && (
                      <a href={s.website} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border text-sm font-medium transition-all hover:bg-gray-50"
                        style={{ borderColor: '#A7ADA7', color: '#111111' }}>
                        <ExternalLink className="w-4 h-4" /> Visitar site
                      </a>
                    )}
                  </div>
                );
              })()}



              {/* Tasks */}
              <TaskDrawer project={selected} showHeader={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}