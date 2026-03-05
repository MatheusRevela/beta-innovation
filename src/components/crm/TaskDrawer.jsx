import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X, Plus, Check, Trash2, Loader2, Calendar, Tag,
  AlertCircle, Clock, User, ChevronDown, Circle, CheckCircle2
} from "lucide-react";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const PRIORITY_CONFIG = {
  high:   { label: "Alta",   color: '#dc2626', bg: '#fef2f2' },
  medium: { label: "Média",  color: '#E10867', bg: '#fce7ef' },
  low:    { label: "Baixa",  color: '#4B4F4B', bg: '#ECEEEA' },
};

const STATUS_CONFIG = {
  pending:     { label: "Pendente",    color: '#4B4F4B', bg: '#ECEEEA',  icon: Circle },
  in_progress: { label: "Em andamento",color: '#6B2FA0', bg: '#f3e8ff',  icon: Clock },
  done:        { label: "Concluída",   color: '#2C4425', bg: '#f0fdf4',  icon: CheckCircle2 },
  cancelled:   { label: "Cancelada",   color: '#A7ADA7', bg: '#f5f5f5',  icon: X },
};

const TYPE_CONFIG = {
  follow_up: "Follow-up",
  reuniao:   "Reunião",
  proposta:  "Proposta",
  contrato:  "Contrato",
  pesquisa:  "Pesquisa",
  outro:     "Outro",
};

const DEFAULT_FORM = {
  title: "",
  description: "",
  responsible: "",
  due_date: "",
  status: "pending",
  priority: "medium",
  type: "follow_up",
  tags: [],
  notes: "",
};

function TaskCard({ task, onToggle, onDelete, onEdit }) {
  const pCfg  = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const sCfg  = STATUS_CONFIG[task.status]     || STATUS_CONFIG.pending;
  const StatusIcon = sCfg.icon;
  const overdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== "done";
  const daysLeft = task.due_date ? differenceInDays(new Date(task.due_date), new Date()) : null;
  const isDone = task.status === "done";

  return (
    <div className="rounded-xl border transition-all group"
      style={{
        borderColor: overdue ? '#fecaca' : '#E8EAE8',
        background: isDone ? '#fafafa' : overdue ? '#fffcfc' : '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>

      {/* Top accent bar for overdue */}
      {overdue && (
        <div className="h-0.5 rounded-t-xl w-full" style={{ background: '#fca5a5' }} />
      )}

      <div className="flex items-start gap-2.5 p-3">
        {/* Toggle */}
        <button onClick={() => onToggle(task)}
          className="w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
          style={{
            borderColor: isDone ? '#2C4425' : overdue ? '#fca5a5' : '#C8CAC8',
            background: isDone ? '#2C4425' : 'transparent',
            width: 18, height: 18,
          }}>
          {isDone && <Check className="w-2.5 h-2.5 text-white" />}
        </button>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(task)}>
          {/* Title */}
          <p className="text-sm font-semibold leading-snug"
            style={{
              color: isDone ? '#A7ADA7' : '#111111',
              textDecoration: isDone ? 'line-through' : 'none',
            }}>
            {task.title}
          </p>

          {/* Pill row: priority + status + type + due */}
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: pCfg.bg, color: pCfg.color, letterSpacing: '0.01em' }}>
              {pCfg.label}
            </span>
            <span className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: sCfg.bg, color: sCfg.color }}>
              <StatusIcon className="w-2.5 h-2.5" />
              {sCfg.label}
            </span>
            {task.type && task.type !== "follow_up" && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: '#F0F1F0', color: '#4B4F4B' }}>
                {TYPE_CONFIG[task.type] || task.type}
              </span>
            )}
            {task.type === "follow_up" && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: '#F0F1F0', color: '#4B4F4B' }}>
                Follow-up
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-0.5 text-xs font-medium"
                style={{ color: overdue ? '#dc2626' : isToday(new Date(task.due_date)) ? '#E10867' : '#A7ADA7' }}>
                <Calendar className="w-2.5 h-2.5" />
                {isToday(new Date(task.due_date))
                  ? "Hoje"
                  : overdue
                    ? `${Math.abs(daysLeft)}d atraso`
                    : format(new Date(task.due_date), "dd/MM", { locale: ptBR })}
              </span>
            )}
          </div>

          {/* Tags */}
          {task.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.tags.map(tag => (
                <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: '#f3e8ff', color: '#6B2FA0' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Responsible */}
          {(task.responsible || task.created_by_name) && (
            <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: '#B8BAB8' }}>
              <User className="w-2.5 h-2.5" />
              <span>{task.responsible || task.created_by_name}</span>
            </div>
          )}

          {/* Completion */}
          {isDone && task.completion_date && (
            <p className="text-xs mt-1 font-medium" style={{ color: '#2C4425' }}>
              ✓ {format(new Date(task.completion_date), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
        </div>

        <button onClick={() => onDelete(task.id)}
          className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="w-3.5 h-3.5" style={{ color: '#C8CAC8' }} />
        </button>
      </div>
    </div>
  );
}

function TaskForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || DEFAULT_FORM);
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput("");
  };

  const removeTag = (tag) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  return (
    <div className="space-y-3 p-4 rounded-2xl border" style={{ background: '#ECEEEA', borderColor: '#D5D8D5' }}>
      <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="Título da tarefa *" className="bg-white" />

      <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="Descrição (opcional)…"
        rows={2}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none bg-white"
        style={{ borderColor: '#D5D8D5' }} />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs mb-1 block font-medium" style={{ color: '#4B4F4B' }}>Tipo</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none"
            style={{ borderColor: '#D5D8D5' }}>
            {Object.entries(TYPE_CONFIG).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs mb-1 block font-medium" style={{ color: '#4B4F4B' }}>Prioridade</label>
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none"
            style={{ borderColor: '#D5D8D5' }}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div>
          <label className="text-xs mb-1 block font-medium" style={{ color: '#4B4F4B' }}>Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none"
            style={{ borderColor: '#D5D8D5' }}>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs mb-1 block font-medium" style={{ color: '#4B4F4B' }}>Vencimento</label>
          <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none"
            style={{ borderColor: '#D5D8D5' }} />
        </div>
      </div>

      <Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
        placeholder="Responsável (nome ou email)…" className="bg-white" />

      {/* Tags */}
      <div>
        <div className="flex gap-1.5">
          <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Adicionar tag…" className="bg-white text-sm" />
          <Button type="button" variant="outline" size="sm" onClick={addTag}
            style={{ borderColor: '#A7ADA7' }}>
            <Tag className="w-3.5 h-3.5" />
          </Button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {form.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full cursor-pointer"
                style={{ background: '#f3e8ff', color: '#6B2FA0' }}
                onClick={() => removeTag(tag)}>
                #{tag} <X className="w-2.5 h-2.5" />
              </span>
            ))}
          </div>
        )}
      </div>

      <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        placeholder="Notas adicionais…"
        rows={2}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none bg-white"
        style={{ borderColor: '#D5D8D5' }} />

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 text-sm" style={{ borderColor: '#A7ADA7' }}>
          Cancelar
        </Button>
        <Button type="button" disabled={saving || !form.title.trim()} onClick={() => onSave(form)}
          className="flex-1 text-white text-sm" style={{ background: '#E10867', border: 'none' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : initial ? "Salvar" : "Criar Tarefa"}
        </Button>
      </div>
    </div>
  );
}

export default function TaskDrawer({ project, onClose, showHeader = true }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("active"); // active | done | all

  useEffect(() => {
    loadTasks();
  }, [project?.id]);

  const loadTasks = async () => {
    if (!project?.id) return;
    setLoading(true);
    const t = await base44.entities.CRMTask.filter({ project_id: project.id });
    setTasks(t.sort((a, b) => {
      // Sort: overdue first, then by due_date, then by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aOverdue = a.due_date && isPast(new Date(a.due_date)) && a.status !== "done";
      const bOverdue = b.due_date && isPast(new Date(b.due_date)) && b.status !== "done";
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    }));
    setLoading(false);
  };

  const handleCreate = async (form) => {
    setSaving(true);
    const me = await base44.auth.me();
    const t = await base44.entities.CRMTask.create({
      ...form,
      project_id: project.id,
      corporate_id: project.corporate_id,
      created_by_name: me.full_name || me.email,
    });
    setTasks(prev => [t, ...prev]);
    setShowForm(false);
    setSaving(false);
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    const updated = await base44.entities.CRMTask.update(editingTask.id, form);
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTask(null);
    setSaving(false);
  };

  const handleToggle = async (task) => {
    const isDone = task.status !== "done";
    const updated = await base44.entities.CRMTask.update(task.id, {
      status: isDone ? "done" : "pending",
      completion_date: isDone ? new Date().toISOString() : null,
    });
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleDelete = async (id) => {
    await base44.entities.CRMTask.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const filtered = tasks.filter(t => {
    if (filter === "active") return t.status !== "done" && t.status !== "cancelled";
    if (filter === "done")   return t.status === "done";
    return true;
  });

  const overdueCount = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== "done").length;
  const activeCount  = tasks.filter(t => t.status !== "done" && t.status !== "cancelled").length;
  const doneCount    = tasks.filter(t => t.status === "done").length;

  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: '#ECEEEA' }}>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#111111' }}>Tarefas</p>
            <p className="text-xs" style={{ color: '#4B4F4B' }}>{project?.project_name}</p>
          </div>
          {onClose && (
            <button onClick={onClose}><X className="w-4 h-4" style={{ color: '#A7ADA7' }} /></button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary badges */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "active", label: `${activeCount} ativas`, active: filter === "active" },
            { key: "done",   label: `${doneCount} concluídas`, active: filter === "done" },
            { key: "all",    label: "Todas", active: filter === "all" },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="text-xs px-3 py-1 rounded-full font-medium transition-all"
              style={{
                background: f.active ? '#1E0B2E' : '#ECEEEA',
                color: f.active ? '#fff' : '#4B4F4B',
              }}>
              {f.label}
            </button>
          ))}
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
              style={{ background: '#fef2f2', color: '#dc2626' }}>
              <AlertCircle className="w-3 h-3" /> {overdueCount} atrasada{overdueCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Add button / form */}
        {showForm || editingTask ? (
          <TaskForm
            initial={editingTask}
            saving={saving}
            onSave={editingTask ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditingTask(null); }}
          />
        ) : (
          <button onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-all hover:bg-gray-50"
            style={{ borderColor: '#D5D8D5', color: '#4B4F4B' }}>
            <Plus className="w-4 h-4" /> Nova tarefa
          </button>
        )}

        {/* Task list */}
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#E10867' }} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs py-4" style={{ color: '#A7ADA7' }}>
            {filter === "done" ? "Nenhuma tarefa concluída ainda." : "Nenhuma tarefa ativa."}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={(t) => { setEditingTask(t); setShowForm(false); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}