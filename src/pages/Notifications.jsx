import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Calendar, Check, Loader2, ChevronRight, Clock, AlertTriangle, User, Tag } from "lucide-react";
import { format, isToday, isThisWeek, isThisMonth, isPast, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const TABS = [
  { key: "today", label: "Hoje" },
  { key: "week", label: "Esta semana" },
  { key: "month", label: "Este mês" },
  { key: "overdue", label: "Atrasados" },
  { key: "all", label: "Todos" },
];

export default function Notifications() {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState([]);
  const [projects, setProjects] = useState({});
  const [startups, setStartups] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("today");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [completing, setCompleting] = useState(null);

  const [me, setMe] = useState(null);
  const [myMembership, setMyMembership] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const currentUser = await base44.auth.me();
    setMe(currentUser);

    // Resolve corporate via CorporateMember (novo sistema) ou fallback legado
    const memberships = await base44.entities.CorporateMember.filter({ email: currentUser.email, status: "active" });
    let corp = null;
    let membership = null;
    if (memberships.length > 0) {
      membership = memberships[0];
      const corps = await base44.entities.Corporate.filter({ id: memberships[0].corporate_id });
      corp = corps[0] || null;
    } else {
      const [corpsByEmail, corpsByCreator] = await Promise.all([
        base44.entities.Corporate.filter({ contact_email: currentUser.email }),
        base44.entities.Corporate.filter({ created_by: currentUser.email }),
      ]);
      const seen = new Set();
      corp = [...corpsByEmail, ...corpsByCreator].filter(c => seen.has(c.id) ? false : seen.add(c.id))[0] || null;
    }
    setMyMembership(membership);

    if (!corp) { setLoading(false); return; }

    const isManager = currentUser.role === 'admin' || membership?.role === 'gestor';

    const [allTasks, allProjects, allStartups] = await Promise.all([
      base44.entities.CRMTask.filter({ corporate_id: corp.id }),
      base44.entities.CRMProject.filter({ corporate_id: corp.id }),
      base44.entities.Startup.filter({ is_deleted: false }),
    ]);

    // Managers see all; regular users see only their own tasks
    const visibleTasks = isManager
      ? allTasks
      : allTasks.filter(t => !t.created_by_name || t.created_by_name === (currentUser.full_name || currentUser.email) || t.created_by === currentUser.email);

    const fus = visibleTasks.filter(t => t.due_date);
    setFollowups(fus.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));

    const projMap = {};
    allProjects.forEach(p => { projMap[p.id] = p; });
    setProjects(projMap);

    const startupMap = {};
    allStartups.forEach(s => { startupMap[s.id] = s; });
    setStartups(startupMap);

    setLoading(false);
  };

  const markDone = async (fu) => {
    setCompleting(fu.id);
    const updated = await base44.entities.CRMTask.update(fu.id, {
      status: fu.status === "done" ? "pending" : "done"
    });
    setFollowups(prev => prev.map(f => f.id === updated.id ? updated : f));
    setCompleting(null);
  };

  const filterFollowups = () => {
    return followups.filter(fu => {
      const d = new Date(fu.due_date);
      // Date tab filter
      let dateMatch = true;
      if (tab === "today") dateMatch = isToday(d);
      else if (tab === "week") dateMatch = isThisWeek(d, { locale: ptBR }) && (!isPast(d) || isToday(d));
      else if (tab === "month") dateMatch = isThisMonth(d);
      else if (tab === "overdue") dateMatch = isPast(d) && !isToday(d) && fu.status !== "done";
      // Status filter
      let statusMatch = true;
      if (statusFilter === "pending") statusMatch = fu.status !== "done";
      else if (statusFilter === "resolved") statusMatch = fu.status === "done";
      return dateMatch && statusMatch;
    });
  };

  const counts = {
    today: followups.filter(fu => isToday(new Date(fu.due_date))).length,
    week: followups.filter(fu => { const d = new Date(fu.due_date); return isThisWeek(d, { locale: ptBR }); }).length,
    month: followups.filter(fu => isThisMonth(new Date(fu.due_date))).length,
    overdue: followups.filter(fu => isPast(new Date(fu.due_date)) && !isToday(new Date(fu.due_date)) && fu.status !== "done").length,
    all: followups.length,
  };

  const filtered = filterFollowups();

  const getDateChip = (fu) => {
    const d = new Date(fu.due_date);
    if (fu.status === "done") return { label: "Concluído", bg: '#f0fdf4', color: '#2C4425' };
    if (isToday(d)) return { label: "Hoje", bg: '#fce7ef', color: '#E10867' };
    if (isPast(d)) return { label: `Atrasado — ${format(d, "dd/MM", { locale: ptBR })}`, bg: '#fef2f2', color: '#dc2626' };
    return { label: format(d, "dd/MM/yyyy", { locale: ptBR }), bg: '#ECEEEA', color: '#4B4F4B' };
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="animate-spin w-6 h-6" style={{ color: '#E10867' }} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fce7ef' }}>
          <Bell className="w-5 h-5" style={{ color: '#E10867' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>Notificações</h1>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>Follow-ups e lembretes agendados</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border p-1 mb-6 overflow-x-auto" style={{ borderColor: '#ECEEEA' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? '#E10867' : 'transparent',
              color: tab === t.key ? '#fff' : '#4B4F4B',
            }}>
            {t.label}
            {counts[t.key] > 0 && (
              <span className="text-xs px-1.5 rounded-full"
                style={{
                  background: tab === t.key ? 'rgba(255,255,255,0.3)' : (t.key === "overdue" ? '#fef2f2' : '#fce7ef'),
                  color: tab === t.key ? '#fff' : (t.key === "overdue" ? '#dc2626' : '#E10867'),
                }}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overdue warning */}
      {counts.overdue > 0 && tab !== "overdue" && (
        <button onClick={() => setTab("overdue")}
          className="w-full flex items-center gap-2 p-3 rounded-xl border mb-4 text-left hover:opacity-90 transition-opacity"
          style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#dc2626' }} />
          <span className="text-sm font-medium" style={{ color: '#dc2626' }}>
            {counts.overdue} follow-up{counts.overdue > 1 ? 's' : ''} atrasado{counts.overdue > 1 ? 's' : ''}
          </span>
          <ChevronRight className="w-4 h-4 ml-auto" style={{ color: '#dc2626' }} />
        </button>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#ECEEEA' }}>
          <Bell className="w-10 h-10 mx-auto mb-3" style={{ color: '#A7ADA7' }} />
          <p className="font-semibold mb-1" style={{ color: '#111111' }}>Nenhum follow-up</p>
          <p className="text-sm" style={{ color: '#A7ADA7' }}>
            {tab === "today" ? "Nenhum follow-up para hoje." :
             tab === "week" ? "Nenhum follow-up esta semana." :
             tab === "overdue" ? "Nenhum follow-up atrasado. Ótimo!" :
             "Nenhum follow-up agendado."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(fu => {
            const proj = projects[fu.project_id];
            const startup = proj ? startups[proj.startup_id] : null;
            const chip = getDateChip(fu);
            const isDone = fu.status === "done";
            return (
              <div key={fu.id}
                className="bg-white rounded-2xl border p-4 flex items-start gap-3 transition-all"
                style={{ borderColor: isDone ? '#ECEEEA' : isPast(new Date(fu.due_date)) && !isToday(new Date(fu.due_date)) ? '#fecaca' : '#ECEEEA',
                  background: isPast(new Date(fu.due_date)) && !isToday(new Date(fu.due_date)) && !isDone ? '#fffbfb' : '#fff' }}>
                {/* Checkbox */}
                <button onClick={() => markDone(fu)} disabled={completing === fu.id}
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                  style={{
                    borderColor: isDone ? '#2C4425' : '#A7ADA7',
                    background: isDone ? '#2C4425' : 'transparent'
                  }}>
                  {completing === fu.id
                    ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: isDone ? '#fff' : '#A7ADA7' }} />
                    : isDone && <Check className="w-3 h-3 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: isDone ? '#A7ADA7' : '#111111',
                    textDecoration: isDone ? 'line-through' : 'none' }}>
                    {fu.title}
                  </p>
                  {fu.created_by_name && (
                    <p className="text-xs mt-0.5" style={{ color: '#A7ADA7' }}>
                      Criado por <span className="font-medium" style={{ color: '#4B4F4B' }}>{fu.created_by_name}</span>
                    </p>
                  )}
                  {/* Type + Priority badges */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {fu.type && fu.type !== "follow_up" && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md"
                        style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                        {{ reuniao: "Reunião", proposta: "Proposta", contrato: "Contrato", pesquisa: "Pesquisa", outro: "Outro" }[fu.type] || fu.type}
                      </span>
                    )}
                    {fu.priority === "high" && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                        style={{ background: '#fef2f2', color: '#dc2626' }}>Alta prioridade</span>
                    )}
                    {fu.responsible && (
                      <span className="flex items-center gap-0.5 text-xs" style={{ color: '#A7ADA7' }}>
                        <User className="w-3 h-3" /> {fu.responsible}
                      </span>
                    )}
                  </div>
                  {fu.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {fu.tags.map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: '#f3e8ff', color: '#6B2FA0' }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                  {fu.notes && (
                    <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>{fu.notes}</p>
                  )}
                  {/* Project/Startup info */}
                  {proj && (
                    <button
                      onClick={() => navigate(createPageUrl("DiagnosticCRM"))}
                      className="flex items-center gap-1.5 mt-2 text-xs hover:underline">
                      {startup?.logo_url ? (
                        <img src={startup.logo_url} className="w-4 h-4 rounded object-contain border" />
                      ) : (
                        <div className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold"
                          style={{ background: '#fce7ef', color: '#E10867', fontSize: 8 }}>
                          {startup?.name?.[0] || "?"}
                        </div>
                      )}
                      <span style={{ color: '#6B2FA0' }}>{proj.project_name}</span>
                      <ChevronRight className="w-3 h-3" style={{ color: '#6B2FA0' }} />
                    </button>
                  )}
                </div>

                {/* Date chip */}
                <span className="flex-shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: chip.bg, color: chip.color }}>
                  <Clock className="w-3 h-3" />
                  {chip.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}