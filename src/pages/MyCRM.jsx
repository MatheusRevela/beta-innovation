import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PIPELINE_STAGES, STAGE_COLORS, CRM_TYPES } from "@/components/ui/DesignTokens";
import { StageBadge } from "@/components/shared/StatusBadge";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronRight, Calendar, User, Loader2, X, ExternalLink, Check, Trash2 } from "lucide-react";

export default function MyCRM() {
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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [ps, ss] = await Promise.all([
      base44.entities.CRMProject.list("-created_date", 200),
      base44.entities.Startup.filter({ is_deleted: false })
    ]);
    setProjects(ps);
    const map = {};
    ss.forEach(s => { map[s.id] = s; });
    setStartups(map);
    setLoading(false);
  };

  const openProject = async (proj) => {
    setSelected(proj);
    const t = await base44.entities.CRMTask.filter({ project_id: proj.id });
    setTasks(t);
  };

  const addTask = async () => {
    if (!newTask.trim() || !selected) return;
    const t = await base44.entities.CRMTask.create({ project_id: selected.id, corporate_id: selected.corporate_id, title: newTask.trim() });
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="animate-spin w-6 h-6" style={{ color: '#E10867' }} />
    </div>
  );

  return (
    <div className="max-w-full px-4 sm:px-6 py-8">
      <PageHeader
        title="Meu CRM de Inovação"
        subtitle="Pipeline de projetos com startups"
      />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
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
                <button onClick={() => setSelected(null)}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
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
                    <a href={startups[selected.startup_id].website} target="_blank" rel="noreferrer"
                      className="ml-auto"><ExternalLink className="w-4 h-4" style={{ color: '#A7ADA7' }} /></a>
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