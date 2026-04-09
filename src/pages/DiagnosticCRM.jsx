import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";
import { PIPELINE_STAGES, STAGE_COLORS } from "@/components/ui/DesignTokens";
import { StageBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Loader2, X, ExternalLink, Trash2, Bell, UserPlus, ArrowRight, ChevronRight,
  Lightbulb, ToggleLeft, ToggleRight, Map, BarChart3, Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AddManualStartupModal from "@/components/crm/AddManualStartupModal";
import FollowUpModal from "@/components/crm/FollowUpModal";
import TaskDrawer from "@/components/crm/TaskDrawer";

export default function DiagnosticCRM() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const initialThesisId = urlParams.get('thesis_id');
  const { loading: accessLoading, corporate, corporateId } = useCorporateAccess();

  // Data
  const [theses, setTheses] = useState([]);
  const [selectedThesis, setSelectedThesis] = useState(null);
  const [projects, setProjects] = useState([]);
  const [startups, setStartups] = useState({});
  const [matches, setMatches] = useState({});
  const [taskCounts, setTaskCounts] = useState({});

  // UI State
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterStage, setFilterStage] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  // Loading states
  const [movingStage, setMovingStage] = useState(null);
  const [togglingCrm, setTogglingCrm] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  useEffect(() => {
    if (!accessLoading && corporateId) loadData();
    else if (!accessLoading) setLoading(false);
  }, [accessLoading, corporateId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const thesesData = await base44.entities.InnovationThesis.filter(
        { corporate_id: corporateId },
        "-created_date"
      );
      setTheses(thesesData);

      if (thesesData.length > 0) {
        const thesis = initialThesisId
          ? thesesData.find(t => t.id === initialThesisId)
          : thesesData[0];
        if (thesis) await loadThesisData(thesis);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadThesisData = async (thesis) => {
    setSelectedThesis(thesis);

    // Load projects for this thesis
    const projectsData = await base44.entities.CRMProject.filter({
      corporate_id: corporateId,
      thesis_id: thesis.id
    }, "-created_date");

    // Load all startups
    const startupsData = await base44.entities.Startup.filter({ is_deleted: false });
    const startupMap = {};
    startupsData.forEach(s => { startupMap[s.id] = s; });
    setStartups(startupMap);

    // Load matches for insights
    const matchesData = await base44.entities.StartupMatch.filter({
      thesis_id: thesis.id
    });
    const matchMap = {};
    matchesData.forEach(m => { matchMap[m.startup_id] = m; });
    setMatches(matchMap);

    // Load task counts
    const tasksData = await base44.entities.CRMTask.filter({
      corporate_id: corporateId,
      project_id: { $in: projectsData.map(p => p.id) }
    });
    const counts = {};
    projectsData.forEach(p => {
      counts[p.id] = tasksData.filter(t => t.project_id === p.id && t.status !== 'done').length;
    });
    setTaskCounts(counts);

    setProjects(projectsData);
  };

  const moveStage = async (proj, stage) => {
    setMovingStage(proj.id);
    try {
      const updated = await base44.entities.CRMProject.update(proj.id, { stage });
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      if (selected?.id === proj.id) setSelected(updated);
    } finally {
      setMovingStage(null);
    }
  };

  const toggleSuperCRM = async (proj) => {
    setTogglingCrm(proj.id);
    try {
      const updated = await base44.entities.CRMProject.update(proj.id, {
        include_in_super_crm: !proj.include_in_super_crm
      });
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      if (selected?.id === proj.id) setSelected(updated);
    } finally {
      setTogglingCrm(null);
    }
  };

  const deleteProject = async (proj) => {
    if (!window.confirm(`Remover "${proj.project_name}" desta tese?`)) return;
    setDeletingProject(proj.id);
    try {
      await base44.entities.CRMProject.delete(proj.id);
      setProjects(prev => prev.filter(p => p.id !== proj.id));
      setSelected(null);
    } finally {
      setDeletingProject(null);
    }
  };

  const handleProjectAdded = (proj, startupId, startupData) => {
    setProjects(prev => [...prev, proj]);
    if (startupData) setStartups(prev => ({ ...prev, [startupId]: startupData }));
    setShowAddModal(false);
  };

  const handleFollowupClose = () => {
    setShowFollowUp(false);
    if (selectedThesis) loadThesisData(selectedThesis);
  };

  // Organize projects by stage
  const stageGroups = {};
  PIPELINE_STAGES.forEach(s => { stageGroups[s] = []; });
  projects
    .filter(p => filterStage === "all" || p.stage === filterStage)
    .forEach(p => {
      const stage = stageGroups[p.stage] ? p.stage : 'Shortlist';
      stageGroups[stage].push(p);
    });

  const totalActive = projects.filter(p => p.stage !== "Encerrado").length;
  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="animate-spin w-6 h-6" style={{ color: '#E10867' }} />
      </div>
    );
  }

  if (!corporate) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-3">🚀</div>
        <h2 className="font-bold text-lg mb-2">Configure sua empresa primeiro</h2>
        <Button onClick={() => navigate(createPageUrl("Onboarding"))} className="text-white" style={{ background: '#E10867', border: 'none' }}>
          Iniciar Onboarding
        </Button>
      </div>
    );
  }

  if (theses.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fce7ef' }}>
          <Lightbulb className="w-7 h-7" style={{ color: '#E10867' }} />
        </div>
        <h2 className="font-bold text-lg mb-2">Nenhuma tese de inovação</h2>
        <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>
          Crie uma tese para começar a construir seu pipeline.
        </p>
        <Button onClick={() => navigate(createPageUrl("InnovationTheses"))} className="text-white" style={{ background: '#E10867', border: 'none' }}>
          Criar Tese
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-full px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111111' }}>CRM por Tese</h1>
          <p className="text-sm mt-1" style={{ color: '#4B4F4B' }}>
            Pipeline de startups organizado por suas teses de inovação
          </p>
        </div>
        <div className="flex gap-2">
          {selectedThesis && (
            <Button onClick={() => setShowAddModal(true)} className="text-white gap-2" style={{ background: '#E10867', border: 'none' }}>
              <UserPlus className="w-4 h-4" /> Adicionar
            </Button>
          )}
          <Button onClick={() => navigate(createPageUrl("MyCRM"))} variant="outline" className="gap-2" style={{ borderColor: '#6B2FA0', color: '#6B2FA0' }}>
            SuperCRM <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Thesis tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
        {theses.map(t => (
          <button key={t.id} onClick={() => loadThesisData(t)}
            className="flex-shrink-0 px-4 py-3 rounded-xl border text-sm font-medium transition-all"
            style={{
              background: selectedThesis?.id === t.id ? '#1E0B2E' : '#fff',
              borderColor: selectedThesis?.id === t.id ? '#1E0B2E' : '#A7ADA7',
              color: selectedThesis?.id === t.id ? '#fff' : '#111111'
            }}>
            <div className="text-xs opacity-75 mb-1">
              {format(new Date(t.created_date), "MMM yyyy", { locale: ptBR })}
            </div>
            <div className="text-sm truncate max-w-56">
              {(t.macro_categories || []).slice(0, 2).join(", ") || "Tese"}
            </div>
          </button>
        ))}
      </div>

      {selectedThesis && (
        <>
          {/* Thesis info */}
          <div className="bg-white rounded-2xl border p-5 mb-6" style={{ borderColor: '#B4D1D7' }}>
            <div className="flex items-start gap-4 justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fce7ef' }}>
                  <Lightbulb className="w-5 h-5" style={{ color: '#E10867' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold mb-1" style={{ color: '#E10867' }}>Tese de Inovação</p>
                  <p className="text-sm mb-2 line-clamp-2" style={{ color: '#4B4F4B' }}>
                    {selectedThesis.thesis_text?.split("\n")[0] || "Tese de inovação"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedThesis.macro_categories || []).map(c => (
                      <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#fce7ef', color: '#E10867' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl("StartupRadar") + `?thesis_id=${selectedThesis.id}&corporate_id=${corporateId}`)}
                className="gap-2 flex-shrink-0" style={{ borderColor: '#6B2FA0', color: '#6B2FA0' }}>
                <Map className="w-3.5 h-3.5" /> Radar
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Ativos", value: totalActive, icon: BarChart3, color: '#1E0B2E' },
              { label: "Estágios", value: PIPELINE_STAGES.filter(s => stageGroups[s]?.length > 0).length, icon: ArrowRight, color: '#6B2FA0' },
              { label: "Tarefas", value: totalTasks, icon: Bell, color: totalTasks > 0 ? '#E10867' : '#4B4F4B' },
              { label: "Tipos", value: new Set(projects.map(p => p.type)).size, icon: BarChart3, color: '#2C4425' }
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-xl border p-3" style={{ borderColor: '#ECEEEA' }}>
                  <Icon className="w-4 h-4 mb-2" style={{ color: stat.color }} />
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-xs mt-1" style={{ color: '#4B4F4B' }}>{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Filter */}
          <div className="mb-6">
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#A7ADA7' }}>
              <option value="all">Todos os estágios</option>
              {PIPELINE_STAGES.map(s => (
                <option key={s} value={s}>{s} ({stageGroups[s]?.length || 0})</option>
              ))}
            </select>
          </div>

          {/* Pipeline Kanban */}
          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#A7ADA7' }}>
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-bold mb-2">Nenhum projeto nesta tese</h3>
              <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>
                Adicione startups via Radar ou manualmente.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => navigate(createPageUrl("StartupRadar") + `?thesis_id=${selectedThesis.id}&corporate_id=${corporateId}`)}
                  className="text-white" style={{ background: '#1E0B2E', border: 'none' }}>
                  Ir ao Radar
                </Button>
                <Button onClick={() => setShowAddModal(true)} variant="outline" className="gap-2" style={{ borderColor: '#E10867', color: '#E10867' }}>
                  <UserPlus className="w-4 h-4" /> Adicionar Manual
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
                    <div key={stage} className="w-72 flex-shrink-0">
                      {/* Column header */}
                      <div className="flex items-center gap-2 mb-4 px-1">
                        <div className="w-3 h-3 rounded-full" style={{ background: stageColor }} />
                        <span className="font-bold" style={{ color: '#111111' }}>{stage}</span>
                        <span className="ml-auto text-xs px-2.5 py-1 rounded-full font-bold" 
                          style={{ background: cols.length > 0 ? stageColor + '22' : '#ECEEEA', color: stageColor }}>
                          {cols.length}
                        </span>
                      </div>
                      {/* Cards */}
                      <div className="space-y-3 min-h-32">
                        {cols.map(proj => {
                          const startup = startups[proj.startup_id];
                          const match = matches[proj.startup_id];
                          const taskCount = taskCounts[proj.id] || 0;
                          return (
                            <div key={proj.id} onClick={() => setSelected(proj)}
                              className="bg-white rounded-xl border p-3.5 cursor-pointer hover:shadow-lg transition-all"
                              style={{ borderColor: '#E8EAE8', opacity: proj.include_in_super_crm === false ? 0.6 : 1 }}>
                              {/* Startup */}
                              <div className="flex items-start gap-2.5 mb-3">
                                {startup?.logo_url ? (
                                  <img src={startup.logo_url} alt={startup.name} className="w-8 h-8 rounded-lg object-contain border flex-shrink-0" style={{ borderColor: '#ECEEEA' }} />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#fce7ef', color: '#E10867' }}>
                                    {startup?.name?.[0] || "?"}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold leading-tight" style={{ color: '#111111' }}>{proj.project_name}</p>
                                  <p className="text-xs truncate mt-0.5" style={{ color: '#4B4F4B' }}>{startup?.category}</p>
                                </div>
                              </div>
                              {/* Tags */}
                              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                {match?.fit_score && (
                                  <span className="px-2 py-0.5 rounded-md font-bold" style={{ background: '#fce7ef', color: '#E10867' }}>
                                    {match.fit_score}%
                                  </span>
                                )}
                                {taskCount > 0 && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ background: '#fff3cd' }}>
                                    <Bell className="w-3 h-3" style={{ color: '#E10867' }} /> {taskCount}
                                  </span>
                                )}
                                {proj.include_in_super_crm === false && (
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                                    Privado
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {cols.length === 0 && (
                          <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed" style={{ borderColor: '#D5D8D5' }}>
                            <span className="text-xs" style={{ color: '#A7ADA7' }}>Vazio</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Project drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-6 border-b flex-shrink-0" style={{ borderColor: '#ECEEEA' }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="overflow-hidden flex-1">
                  <h2 className="font-bold text-lg leading-tight" style={{ color: '#111111' }}>{selected.project_name}</h2>
                  <div className="mt-2"><StageBadge stage={selected.stage} /></div>
                </div>
                <button onClick={() => setSelected(null)} className="flex-shrink-0 p-1">
                  <X className="w-5 h-5" style={{ color: '#A7ADA7' }} />
                </button>
              </div>
              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowFollowUp(true)}
                  className="gap-1.5 text-xs" style={{ borderColor: '#E10867', color: '#E10867' }}>
                  <Bell className="w-3.5 h-3.5" /> Follow-up
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleSuperCRM(selected)}
                  disabled={togglingCrm === selected.id}
                  className="gap-1.5 text-xs"
                  style={{
                    borderColor: selected.include_in_super_crm === false ? '#A7ADA7' : '#2C4425',
                    color: selected.include_in_super_crm === false ? '#4B4F4B' : '#2C4425'
                  }}>
                  {togglingCrm === selected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                    selected.include_in_super_crm === false ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteProject(selected)}
                  disabled={deletingProject === selected.id}
                  className="gap-1.5 text-xs" style={{ borderColor: '#A7ADA7', color: '#A7ADA7' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Move to stage */}
              <div>
                <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: '#4B4F4B' }}>Mover para:</p>
                <div className="flex flex-wrap gap-2">
                  {PIPELINE_STAGES.filter(s => s !== selected.stage).map(s => (
                    <button key={s} onClick={() => moveStage(selected, s)}
                      disabled={movingStage === selected.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                      style={{
                        borderColor: STAGE_COLORS[s],
                        color: STAGE_COLORS[s],
                        background: STAGE_COLORS[s] + '15'
                      }}>
                      {movingStage === selected.id ? "..." : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Startup info */}
              {startups[selected.startup_id] && (
                <div className="p-4 rounded-2xl" style={{ background: '#ECEEEA' }}>
                  <div className="flex items-start gap-3 mb-3">
                    {startups[selected.startup_id].logo_url ? (
                      <img src={startups[selected.startup_id].logo_url} alt={startups[selected.startup_id].name}
                        className="w-10 h-10 rounded-lg border object-contain" style={{ borderColor: '#ECEEEA' }} />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: '#fce7ef', color: '#E10867' }}>
                        {startups[selected.startup_id].name?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: '#111111' }}>{startups[selected.startup_id].name}</p>
                      <p className="text-xs truncate" style={{ color: '#4B4F4B' }}>{startups[selected.startup_id].category}</p>
                    </div>
                    {startups[selected.startup_id].website && (
                      <a href={startups[selected.startup_id].website} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4" style={{ color: '#A7ADA7' }} />
                      </a>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: '#4B4F4B' }}>
                    <p>{startups[selected.startup_id].description}</p>
                  </div>
                </div>
              )}

              {/* Match insights */}
              {matches[selected.startup_id] && (
                <div className="border-l-4 pl-4" style={{ borderColor: '#E10867' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#E10867' }}>Insights do Matching:</p>
                  {matches[selected.startup_id].fit_reasons?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-1" style={{ color: '#2C4425' }}>✓ Por que combina:</p>
                      {matches[selected.startup_id].fit_reasons.map((r, i) => (
                        <p key={i} className="text-xs mb-1" style={{ color: '#4B4F4B' }}>• {r}</p>
                      ))}
                    </div>
                  )}
                  {matches[selected.startup_id].risk_reasons?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#E10867' }}>⚠ Atenção:</p>
                      {matches[selected.startup_id].risk_reasons.map((r, i) => (
                        <p key={i} className="text-xs mb-1" style={{ color: '#4B4F4B' }}>• {r}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {selected.description && (
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: '#4B4F4B' }}>Notas:</p>
                  <p className="text-sm" style={{ color: '#4B4F4B' }}>{selected.description}</p>
                </div>
              )}

              {/* Created by */}
              {selected.added_by_name && (
                <div className="text-xs" style={{ color: '#A7ADA7' }}>
                  Adicionada por <span style={{ color: '#4B4F4B' }}>{selected.added_by_name}</span> em{' '}
                  {format(new Date(selected.created_date), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              )}

              {/* Tasks */}
              <div className="pt-4 border-t" style={{ borderColor: '#ECEEEA' }}>
                <p className="text-sm font-bold mb-3" style={{ color: '#111111' }}>Tarefas</p>
                <TaskDrawer project={selected} showHeader={false} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showFollowUp && selected && (
        <FollowUpModal
          project={selected}
          onClose={handleFollowupClose}
        />
      )}

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