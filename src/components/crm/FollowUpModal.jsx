import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, Bell, Trash2, Calendar, Check } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FollowUpModal({ project, onClose }) {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadFollowUps(); }, []);

  const loadFollowUps = async () => {
    setLoading(true);
    const tasks = await base44.entities.CRMTask.filter({ project_id: project.id });
    // Follow-ups are tasks with a due_date
    setFollowups(tasks.filter(t => t.due_date).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
    setLoading(false);
  };

  const addFollowUp = async () => {
    if (!title.trim() || !date) return;
    setSaving(true);
    const me = await base44.auth.me();
    const t = await base44.entities.CRMTask.create({
      project_id: project.id,
      corporate_id: project.corporate_id,
      title: title.trim(),
      notes,
      due_date: date,
      status: "pending",
      priority: "medium",
      created_by_name: me.full_name || me.email,
    });
    setFollowups(prev => [...prev, t].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
    setTitle(""); setDate(""); setNotes("");
    setSaving(false);
  };

  const toggleDone = async (fu) => {
    const updated = await base44.entities.CRMTask.update(fu.id, {
      status: fu.status === "done" ? "pending" : "done"
    });
    setFollowups(prev => prev.map(f => f.id === updated.id ? updated : f));
  };

  const deleteFollowUp = async (id) => {
    await base44.entities.CRMTask.delete(id);
    setFollowups(prev => prev.filter(f => f.id !== id));
  };

  const getDateStyle = (fu) => {
    if (fu.status === "done") return { color: '#A7ADA7' };
    if (isToday(new Date(fu.due_date))) return { color: '#E10867', fontWeight: 600 };
    if (isPast(new Date(fu.due_date))) return { color: '#dc2626', fontWeight: 600 };
    return { color: '#4B4F4B' };
  };

  const getDateLabel = (fu) => {
    if (isToday(new Date(fu.due_date))) return "Hoje";
    if (isPast(new Date(fu.due_date)) && fu.status !== "done") return `Atrasado — ${format(new Date(fu.due_date), "dd/MM", { locale: ptBR })}`;
    return format(new Date(fu.due_date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={e => { e.stopPropagation(); onClose(); }} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#ECEEEA' }}>
          <div>
            <h2 className="font-bold text-base flex items-center gap-2" style={{ color: '#111111' }}>
              <Bell className="w-4 h-4" style={{ color: '#E10867' }} /> Follow-ups & Lembretes
            </h2>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#4B4F4B', maxWidth: 260 }}>{project.project_name}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Add form */}
          <div className="p-4 rounded-2xl space-y-3" style={{ background: '#ECEEEA' }}>
            <p className="text-xs font-semibold" style={{ color: '#4B4F4B' }}>Novo follow-up</p>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do lembrete…" />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: '#4B4F4B' }}>Data</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: '#A7ADA7', background: '#fff' }} />
              </div>
            </div>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações (opcional)…" />
            <Button onClick={addFollowUp} disabled={saving || !title.trim() || !date}
              className="w-full text-white" style={{ background: '#E10867', border: 'none' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
              Agendar Follow-up
            </Button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#E10867' }} />
            </div>
          ) : followups.length === 0 ? (
            <p className="text-center text-sm py-4" style={{ color: '#A7ADA7' }}>Nenhum follow-up agendado.</p>
          ) : (
            <div className="space-y-2">
              {followups.map(fu => (
                <div key={fu.id}
                  className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{
                    borderColor: fu.status === "done" ? '#ECEEEA' :
                      isPast(new Date(fu.due_date)) ? '#fecaca' : '#ECEEEA',
                    background: fu.status === "done" ? '#fafafa' :
                      isPast(new Date(fu.due_date)) && !isToday(new Date(fu.due_date)) ? '#fef2f2' : '#fff'
                  }}>
                  <button onClick={() => toggleDone(fu)}
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                    style={{
                      borderColor: fu.status === "done" ? '#2C4425' : '#A7ADA7',
                      background: fu.status === "done" ? '#2C4425' : 'transparent'
                    }}>
                    {fu.status === "done" && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium"
                      style={{ color: fu.status === "done" ? '#A7ADA7' : '#111111',
                        textDecoration: fu.status === "done" ? 'line-through' : 'none' }}>
                      {fu.title}
                    </p>
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={getDateStyle(fu)}>
                      <Calendar className="w-3 h-3" /> {getDateLabel(fu)}
                    </p>
                    {fu.notes && (
                      <p className="text-xs mt-1" style={{ color: '#4B4F4B' }}>{fu.notes}</p>
                    )}
                  </div>
                  <button onClick={() => deleteFollowUp(fu.id)}>
                    <Trash2 className="w-3.5 h-3.5" style={{ color: '#A7ADA7' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}