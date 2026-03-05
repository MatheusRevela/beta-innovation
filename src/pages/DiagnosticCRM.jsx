import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";
import { PIPELINE_STAGES, STAGE_COLORS, CRM_TYPES } from "@/components/ui/DesignTokens";
import { StageBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddManualStartupModal from "@/components/crm/AddManualStartupModal";
import FollowUpModal from "@/components/crm/FollowUpModal";
import {
  Plus, Loader2, X, ExternalLink, Check, Trash2,
  ChevronRight, Lightbulb, ToggleLeft, ToggleRight,
  Map, Bell, UserPlus, ArrowRight
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DiagnosticCRM() {
  const navigate = useNavigate();
  const { loading: accessLoading, corporate, corporateId } = useCorporateAccess();
  const [theses, setTheses] = useState([]);
  const [selectedThesis, setSelectedThesis] = useState(null);
  const [projects, setProjects] = useState([]);
  const [startups, setStartups] = useState({});
  const [followupCounts, setFollowupCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selected, setSelected] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [movingStage, setMovingStage] = useState(null);
  const [togglingCrm, setTogglingCrm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [filterStage, setFilterStage] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (!accessLoading && corporateId) loadData();
    else if (!accessLoading) setLoading(false);
  }, [accessLoading, corporateId]);

  const loadData = async () => {
    setLoading(true);
    const thesesData = await base44.entities.InnovationThesis.filter({ corporate_id: corporateId }, "-created_date");
    setTheses(thesesData);
    if (thesesData.length > 0) {
      await loadThesis(thesesData[0], corporateId);
    }
    setLoading(false);
  };

  const loadThesis = async (thesis, corpId) => {
    setSelectedThesis(thesis);
    setLoadingProjects(true);
    const effectiveCorpId = corpId || corporate?.id;
    const [ps, allProjects] = await Promise.all([
      base44.entities.CRMProject.filter({ corporate_id: effectiveCorpId, session_id: thesis.id }),
      base44.entities.CRMProject.filter({ corporate_id: effectiveCorpId }),
    ]);
    // Collect only the startup IDs we actually need instead of fetching all
    const startupIds = [...new Set(ps.map(p => p.startup_id).filter(Boolean))];
    const ss = startupIds.length > 0
      ? await Promise.all(startupIds.map(id => base44.entities.Startup.filter({ id }))).then(r => r.flat())
      : [];
    setProjects(ps);
    const map = {};
    ss.forEach(s => { map[s.id] = s; });
    setStartups(map);

    // Load follow-up counts (tasks with due_date)
    if (ps.length > 0) {
      const allTasks = await base44.entities.CRMTask.filter({ corporate_id: effectiveCorpId });
      const counts = {};
      allTasks.filter(t => t.due_date && t.status !== "done").forEach(t => {
        counts[t.project_id] = (counts[t.project_id] || 0) + 1;
      });
      setFollowupCounts(counts);
    }

    setLoadingProjects(false);
    setSelected(null);
  };

  const openProject = async (proj) => {
    setSelected(proj);
    const t = await base44.entities.CRMTask.filter({ project_id: proj.id });
    setTasks(t.filter(tk => !tk.due_date)); // regular tasks (no due_date)
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

  const deleteProject = async (proj) => {
    if (!window.confirm(`Remover "${proj.project_name}" do CRM?`)) return;
    await base44.entities.CRMProject.delete(proj.id);
    setProjects(prev => prev.filter(p => p.id !== proj.id));
    setSelected(null);
  };

  const handleProjectAdded = (proj, startupId, startupData) => {
    setProjects(prev => [...prev, proj]);
    if (startupData) {
      setStartups(prev => ({ ...prev, [startupId]: startupData }));
    }
    setShowAddModal(false);
  };

  const stageGroups = {};
  PIPELINE_STAGES.forEach(s => { stageGroups[s] = []; });
  projects
    .filter(p => filterStage === "all" || p.stage === filterStage)
    .filter(p => filterType === "all" || p.type === filterType)
    .forEach(p => {
      if (stageGroups[p.stage]) stageGroups[p.stage].push(p);
    });

  // Summary stats
  const totalActive = projects.filter(p => p.stage !== "Encerrado").length;
  const totalFollowups = Object.values(followupCounts).reduce((a, b) => a + b, 0);

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

  if (theses.length === 0) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fce7ef' }}>
        <Lightbulb className="w-7 h-7" style={{ color: '#E10867' }} />
      </div>
      <h2 className="font-bold text-lg mb-2" style={{ color: '#111111' }}>Nenhuma tese de inovação criada</h2>
      <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>
        Crie uma tese de inovação para começar a construir seu CRM de startups.
      </p>
      <Button onClick={() => navigate(createPageUrl("InnovationTheses"))} className="text-white" style={{ background: '#E10867', border: 'none' }}>
        Criar Tese de Inovação
      </Button>
    </div>
  );

  return (
    <div className="max-w-full px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>CRM por Tese</h1>
          <p className="text-sm mt-1" style={{ color: '#4B4F4B' }}>
            Pipeline de startups gerado a partir das suas teses de inovação
          </p>
        </div>
        <div className="flex gap-2">
          {selectedThesis && (
            <Button onClick={() => setShowAddModal(true)}
              className="text-white gap-2 text-sm" style={{ background: '#E10867', border: 'none' }}>
              <UserPlus className="w-4 h-4" /> Adicionar Startup
            </Button>
          )}
          <Button onClick={() => navigate(createPageUrl("MyCRM"))} variant="outline"
            className="gap-2 text-sm" style={{ borderColor: '#6B2FA0', color: '#6B2FA0' }}>
            SuperCRM →
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      {selectedThesis && projects.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Projetos ativos", value: totalActive, color: '#1E0B2E' },
            { label: "Estágios no pipeline", value: PIPELINE_STAGES.filter(s => stageGroups[s]?.length > 0).length, color: '#6B2FA0' },
            { label: "Follow-ups pendentes", value: totalFollowups, color: totalFollowups > 0 ? '#E10867' : '#4B4F4B' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: '#ECEEEA' }}>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
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

      {/* Thesis selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {theses.map(t => (
          <button key={t.id} onClick={() => loadThesis(t)}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left"
            style={{
              background: selectedThesis?.id === t.id ? '#1E0B2E' : '#fff',
              borderColor: selectedThesis?.id === t.id ? '#1E0B2E' : '#A7ADA7',
              color: selectedThesis?.id === t.id ? '#fff' : '#111111',
              maxWidth: 220
            }}>
            <span className="block text-xs opacity-70 mb-0.5">
              {format(new Date(t.created_date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
            <span className="block truncate">{(t.macro_categories || []).slice(0, 2).join(", ") || `Tese #${t.id?.slice(-6)}`}</span>
          </button>
        ))}
      </div>

      {/* Thesis summary */}
      {selectedThesis && (
        <div className="bg-white rounded-2xl border p-4 mb-6 flex items-start gap-3" style={{ borderColor: '#B4D1D7' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fce7ef' }}>
            <Lightbulb className="w-4 h-4" style={{ color: '#E10867' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-1" style={{ color: '#E10867' }}>Tese de Inovação</p>
            <p className="text-sm mb-2" style={{ color: '#4B4F4B' }}>{selectedThesis.thesis_text?.split("\n")[0]}</p>
            <div className="flex flex-wrap gap-1.5">
              {(selectedThesis.macro_categories || []).map(c => (
                <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#fce7ef', color: '#E10867' }}>{c}</span>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm"
            onClick={() => navigate(createPageUrl("StartupRadar") + `?thesis_id=${selectedThesis?.id}&corporate_id=${corporate?.id}`)}
            className="ml-auto flex-shrink-0 text-xs gap-1" style={{ borderColor: '#A7ADA7' }}>
            <Map className="w-3 h-3" /> Radar <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Pipeline progress bar */}
      {projects.length > 0 && (
        <div className="bg-white rounded-2xl border p-4 mb-6" style={{ borderColor: '#ECEEEA' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#4B4F4B' }}>Visão do Pipeline</p>
          <div className="flex items-center gap-1">
            {PIPELINE_STAGES.map((stage, idx) => {
              const count = stageGroups[stage]?.length || 0;
              const isLast = idx === PIPELINE_STAGES.length - 1;
              return (
                <div key={stage} className="flex items-center gap-1 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs truncate font-medium" style={{ color: '#111111' }}>{stage}</span>
                      <span className="text-xs font-bold ml-1 flex-shrink-0" style={{ color: STAGE_COLORS[stage] }}>{count}</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: '#ECEEEA' }}>
                      <div className="h-2 rounded-full transition-all"
                        style={{
                          background: STAGE_COLORS[stage],
                          width: `${projects.length ? Math.round((count / projects.length) * 100) : 0}%`
                        }} />
                    </div>
                  </div>
                  {!isLast && <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: '#A7ADA7' }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loadingProjects ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin w-6 h-6" style={{ color: '#E10867' }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#A7ADA7' }}>
          <div className="text-4xl mb-3">📋</div>
          <h3 className="font-bold mb-2" style={{ color: '#111111' }}>Nenhum projeto nesta tese</h3>
          <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>
            Adicione startups via Radar ou manualmente.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => navigate(createPageUrl("StartupRadar") + `?thesis_id=${selectedThesis?.id}&corporate_id=${corporate?.id}`)}
              className="text-white" style={{ background: '#1E0B2E', border: 'none' }}>
              Ir ao Radar
            </Button>
            <Button onClick={() => setShowAddModal(true)} variant="outline"
              className="gap-2" style={{ borderColor: '#E10867', color: '#E10867' }}>
              <UserPlus className="w-4 h-4" /> Adicionar Manualmente
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STAGES.map(stage => {
              const cols = stageGroups[stage] || [];
              const stageColor = STAGE_COLORS[stage];
              return (
                <div key={stage} className="w-64 flex-shrink-0">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: stageColor }} />
                    <span className="font-semibold text-sm" style={{ color: '#111111' }}>{stage}</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: cols.length > 0 ? stageColor + '22' : '#ECEEEA', color: cols.length > 0 ? stageColor : '#4B4F4B' }}>
                      {cols.length}
                    </span>
                  </div>
                  {/* Column drop zone */}
                  <div className="min-h-24 rounded-2xl p-2 space-y-3" style={{ background: '#F5F6F4' }}>
                    {cols.map(proj => {
                      const startup = startups[proj.startup_id];
                      const fuCount = followupCounts[proj.id] || 0;
                      return (
                        <div key={proj.id}
                          className="bg-white rounded-xl border p-3 cursor-pointer hover:shadow-md transition-all"
                          style={{ borderColor: '#E8EAE8', opacity: proj.include_in_super_crm === false ? 0.7 : 1 }}
                          onClick={() => openProject(proj)}>
                          {/* Startup avatar + name */}
                          <div className="flex items-start gap-2 mb-3">
                            {startup?.logo_url ? (
                              <img src={startup.logo_url} className="w-8 h-8 rounded-xl object-contain border flex-shrink-0" style={{ borderColor: '#ECEEEA' }} />
                            ) : (
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: '#fce7ef', color: '#E10867' }}>
                                {startup?.name?.[0] || "?"}
                              </div>
                            )}
                            <div className="overflow-hidden flex-1">
                              <p className="font-semibold text-xs leading-tight" style={{ color: '#111111' }}>{proj.project_name}</p>
                              <p className="text-xs truncate mt-0.5" style={{ color: '#4B4F4B' }}>{startup?.name || proj.project_name}</p>
                            </div>
                          </div>
                          {/* Tags row */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                              style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                              {proj.type === "Custom" ? proj.custom_type_label : proj.type}
                            </span>
                            {proj.fit_score && (
                              <span className="text-xs px-1.5 py-0.5 rounded-md font-bold"
                                style={{ background: '#fce7ef', color: '#E10867' }}>
                                {proj.fit_score}%
                              </span>
                            )}
                            {fuCount > 0 && (
                              <span className="ml-auto flex items-center gap-0.5 text-xs font-medium"
                                style={{ color: '#E10867' }}>
                                <Bell className="w-3 h-3" /> {fuCount}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {cols.length === 0 && (
                      <div className="flex items-center justify-center h-16 rounded-xl border-2 border-dashed"
                        style={{ borderColor: '#D5D8D5' }}>
                        <span className="text-xs" style={{ color: '#A7ADA7' }}>Sem projetos</span>
                      </div>
                    )}
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
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-5 border-b flex-shrink-0" style={{ borderColor: '#ECEEEA' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="overflow-hidden">
                  <h2 className="font-bold text-lg leading-tight" style={{ color: '#111111' }}>{selected.project_name}</h2>
                  <div className="mt-1"><StageBadge stage={selected.stage} /></div>
                </div>
                <button onClick={() => setSelected(null)} className="flex-shrink-0 mt-0.5">
                  <X className="w-5 h-5" style={{ color: '#A7ADA7' }} />
                </button>
              </div>
              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline"
                  onClick={() => setShowFollowUp(true)}
                  className="gap-1.5 text-xs flex-1" style={{ borderColor: '#E10867', color: '#E10867' }}>
                  <Bell className="w-3.5 h-3.5" />
                  Follow-up {followupCounts[selected.id] ? `(${followupCounts[selected.id]})` : ""}
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => toggleSuperCRM(selected)}
                  disabled={togglingCrm === selected.id}
                  className="gap-1.5 text-xs flex-1"
                  style={{
                    borderColor: selected.include_in_super_crm === false ? '#A7ADA7' : '#2C4425',
                    color: selected.include_in_super_crm === false ? '#4B4F4B' : '#2C4425'
                  }}>
                  {togglingCrm === selected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                    selected.include_in_super_crm === false ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                  {selected.include_in_super_crm === false ? "Off SuperCRM" : "No SuperCRM"}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Move stage */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#4B4F4B' }}>Mover para:</p>
                <div className="flex flex-wrap gap-1.5">
                  {PIPELINE_STAGES.filter(s => s !== selected.stage).map(s => (
                    <button key={s} onClick={() => moveStage(selected, s)}
                      disabled={movingStage === selected.id}
                      className="px-2.5 py-1 rounded-full text-xs border font-medium transition-all hover:shadow-sm"
                      style={{ borderColor: STAGE_COLORS[s], color: STAGE_COLORS[s], background: STAGE_COLORS[s] + '15' }}>
                      {movingStage === selected.id ? "…" : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Startup info */}
              {startups[selected.startup_id] && (
                <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#ECEEEA' }}>
                  {startups[selected.startup_id].logo_url ? (
                    <img src={startups[selected.startup_id].logo_url} className="w-10 h-10 rounded-xl border object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                      style={{ background: '#fce7ef', color: '#E10867' }}>
                      {startups[selected.startup_id].name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: '#111111' }}>{startups[selected.startup_id].name}</p>
                    <p className="text-xs truncate" style={{ color: '#4B4F4B' }}>{startups[selected.startup_id].category}</p>
                  </div>
                  {startups[selected.startup_id].website && (
                    <a href={startups[selected.startup_id].website} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-4 h-4" style={{ color: '#A7ADA7' }} />
                    </a>
                  )}
                </div>
              )}

              {selected.description && (
                <p className="text-sm" style={{ color: '#4B4F4B' }}>{selected.description}</p>
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
                    <p className="text-xs text-center py-3" style={{ color: '#A7ADA7' }}>Nenhuma tarefa. Adicione acima.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up modal */}
      {showFollowUp && selected && (
        <FollowUpModal
          project={selected}
          onClose={() => {
            setShowFollowUp(false);
            // refresh counts
            loadThesis(selectedThesis, corporate?.id);
          }}
        />
      )}

      {/* Add manual startup modal */}
      {showAddModal && selectedThesis && (
        <AddManualStartupModal
          thesis={selectedThesis}
          corporate={corporate}
          onClose={() => setShowAddModal(false)}
          onAdded={handleProjectAdded}
        />
      )}
    </div>
  );
}