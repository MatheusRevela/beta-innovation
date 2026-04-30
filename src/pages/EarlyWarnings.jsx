import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertTriangle, Clock, Building2, Loader2, RefreshCw, ShieldAlert,
  TrendingDown, CalendarX, DatabaseZap, Star, ArrowRight,
  CheckCircle2, XCircle, Zap, Filter, ChevronDown, Target,
  Activity, BrainCircuit, LayoutDashboard, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, differenceInDays, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── SEVERITY ─────────────────────────────────────────────────────────────────
function getSeverity(score) {
  if (score >= 80) return { label: "Crítico", color: "#dc2626", bg: "#fef2f2", ring: "#fca5a5", level: 3 };
  if (score >= 50) return { label: "Alto", color: "#ea580c", bg: "#fff7ed", ring: "#fdba74", level: 2 };
  if (score >= 25) return { label: "Atenção", color: "#d97706", bg: "#fffbeb", ring: "#fcd34d", level: 1 };
  return { label: "Baixo", color: "#2563eb", bg: "#eff6ff", ring: "#93c5fd", level: 0 };
}

// ─── WARNING CATEGORIES ───────────────────────────────────────────────────────
const CATEGORY_META = {
  stalled_project:    { icon: Clock,        label: "Projeto Parado",          color: "#ea580c" },
  overdue_deadline:   { icon: CalendarX,    label: "Prazo Vencido",           color: "#dc2626" },
  no_tasks:           { icon: Target,       label: "Sem Tarefas Ativas",      color: "#d97706" },
  low_quality:        { icon: DatabaseZap,  label: "Qualidade Baixa",         color: "#7c3aed" },
  pending_approval:   { icon: ShieldAlert,  label: "Aprovação Pendente",      color: "#0891b2" },
  stalled_match:      { icon: TrendingDown, label: "Match Sem Ação",          color: "#16a34a" },
  orphan_thesis:      { icon: Star,         label: "Tese Sem Matching",       color: "#E10867" },
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function EarlyWarnings() {
  const navigate = useNavigate();
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRun, setLastRun] = useState(null);
  const [filter, setFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const buildWarnings = async () => {
    const now = new Date();
    const results = [];

    const [projects, tasks, startups, theses, matches, labStartups] = await Promise.all([
      base44.entities.CRMProject.filter({ is_active: true }),
      base44.entities.CRMTask.list("-created_date", 200),
      base44.entities.Startup.filter({ is_active: false }),
      base44.entities.InnovationThesis.list("-created_date", 50),
      base44.entities.StartupMatch.filter({ status: "suggested" }),
      base44.entities.LabStartup.filter({ status: "pending" }),
    ]);

    // 1. Projetos parados (>14d sem atualização)
    for (const p of projects) {
      const days = differenceInDays(now, new Date(p.updated_date || p.created_date));
      if (days > 14) {
        const score = Math.min(100, 30 + days * 2);
        results.push({
          id: `stalled_${p.id}`,
          category: "stalled_project",
          title: p.project_name,
          subtitle: `Etapa: ${p.stage || "—"} · Tipo: ${p.type || "—"}`,
          detail: `Sem atualização há ${days} dias. Última atividade em ${format(new Date(p.updated_date || p.created_date), "dd/MM/yyyy")}.`,
          score,
          meta: { days, projectId: p.id, stage: p.stage },
          action: { label: "Ver Projeto", page: "MyCRM" },
        });
      }
    }

    // 2. Prazos vencidos em projetos
    for (const p of projects) {
      if (p.deadline && isPast(parseISO(p.deadline)) && p.stage !== "Encerrado") {
        const overdueDays = differenceInDays(now, parseISO(p.deadline));
        const score = Math.min(100, 50 + overdueDays * 3);
        results.push({
          id: `deadline_${p.id}`,
          category: "overdue_deadline",
          title: p.project_name,
          subtitle: `Prazo: ${format(parseISO(p.deadline), "dd/MM/yyyy")} · Etapa: ${p.stage || "—"}`,
          detail: `Prazo vencido há ${overdueDays} dia${overdueDays !== 1 ? "s" : ""}. Projeto ainda ativo.`,
          score,
          meta: { overdueDays, projectId: p.id },
          action: { label: "Ver Projeto", page: "MyCRM" },
        });
      }
    }

    // 3. Projetos sem tarefas ativas
    const tasksByProject = {};
    for (const t of tasks) {
      if (!tasksByProject[t.project_id]) tasksByProject[t.project_id] = [];
      tasksByProject[t.project_id].push(t);
    }
    for (const p of projects) {
      const ptasks = tasksByProject[p.id] || [];
      const activeTasks = ptasks.filter(t => t.status === "pending" || t.status === "in_progress");
      if (activeTasks.length === 0 && p.stage !== "Encerrado") {
        const days = differenceInDays(now, new Date(p.created_date));
        if (days > 7) {
          results.push({
            id: `notasks_${p.id}`,
            category: "no_tasks",
            title: p.project_name,
            subtitle: `Etapa: ${p.stage || "—"} · ${ptasks.length} tarefas no total`,
            detail: `Projeto sem nenhuma tarefa ativa. Progresso pode estar estagnado.`,
            score: 40,
            meta: { totalTasks: ptasks.length, projectId: p.id },
            action: { label: "Adicionar Tarefa", page: "MyCRM" },
          });
        }
      }
    }

    // 4. Startups com baixa qualidade (score < 40) e ativas
    const activeStartups = await base44.entities.Startup.filter({ is_active: true });
    for (const s of activeStartups) {
      if (s.quality_score != null && s.quality_score < 40) {
        results.push({
          id: `quality_${s.id}`,
          category: "low_quality",
          title: s.name,
          subtitle: `Score de Qualidade: ${s.quality_score}/100 · ${s.category || "Sem categoria"}`,
          detail: `Startup ativa mas com dados incompletos ou de baixa qualidade. Risco de matching ruim.`,
          score: Math.round(100 - s.quality_score),
          meta: { qualityScore: s.quality_score, startupId: s.id },
          action: { label: "Enriquecer", page: "StartupManagement" },
        });
      }
    }

    // 5. Startups pendentes de aprovação há mais de 7 dias
    for (const ls of labStartups) {
      const days = differenceInDays(now, new Date(ls.created_date));
      if (days > 7) {
        results.push({
          id: `approval_${ls.id}`,
          category: "pending_approval",
          title: ls.name,
          subtitle: `Aguardando aprovação há ${days} dias · ${ls.category || "Sem categoria"}`,
          detail: `Cadastro de startup pendente de revisão. Risco de perder o contato com o founder.`,
          score: Math.min(100, 30 + days * 3),
          meta: { days, labId: ls.id },
          action: { label: "Revisar", page: "StartupPendingApproval" },
        });
      }
    }

    // 6. Matches sugeridos sem ação há mais de 10 dias
    for (const m of matches) {
      const days = differenceInDays(now, new Date(m.created_date));
      if (days > 10) {
        results.push({
          id: `match_${m.id}`,
          category: "stalled_match",
          title: `Match aguardando avaliação`,
          subtitle: `Sugerido há ${days} dias · Score: ${m.fit_score || "—"}%`,
          detail: `Match identificado ainda sem feedback. Oportunidade pode estar sendo desperdiçada.`,
          score: Math.min(80, 20 + days * 2),
          meta: { days, matchId: m.id },
          action: { label: "Ver Radar", page: "StartupRadar" },
        });
      }
    }

    // 7. Teses sem matching rodado
    for (const t of theses) {
      if (!t.matching_ran) {
        const days = differenceInDays(now, new Date(t.created_date));
        if (days > 3) {
          results.push({
            id: `thesis_${t.id}`,
            category: "orphan_thesis",
            title: t.name || "Tese sem nome",
            subtitle: `Criada há ${days} dias · Matching nunca rodado`,
            detail: `Tese de inovação sem startups mapeadas. Ative o matching para gerar oportunidades.`,
            score: Math.min(70, 30 + days),
            meta: { days, thesisId: t.id },
            action: { label: "Rodar Matching", page: "StartupRadar" },
          });
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    setWarnings(results);
    setLastRun(now);
    setLoading(false);
  };

  useEffect(() => { buildWarnings(); }, []);

  const filtered = useMemo(() => {
    return warnings.filter(w => {
      const catOk = filter === "all" || w.category === filter;
      const sev = getSeverity(w.score);
      const sevOk = severityFilter === "all" || String(sev.level) === severityFilter;
      return catOk && sevOk;
    });
  }, [warnings, filter, severityFilter]);

  // KPIs
  const critical = warnings.filter(w => getSeverity(w.score).level >= 3).length;
  const high = warnings.filter(w => getSeverity(w.score).level === 2).length;
  const attention = warnings.filter(w => getSeverity(w.score).level === 1).length;
  const categoryCounts = useMemo(() => {
    const c = {};
    for (const w of warnings) c[w.category] = (c[w.category] || 0) + 1;
    return c;
  }, [warnings]);

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto" style={{ background: "#ECEEEA" }}>

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5" style={{ color: "#E10867" }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#E10867" }}>
              Centro de Riscos
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#111111" }}>Early Warnings</h1>
          <p className="text-sm mt-0.5" style={{ color: "#4B4F4B" }}>
            Monitoramento proativo de riscos em projetos, startups e teses de inovação
            {lastRun && (
              <span className="ml-2 text-xs" style={{ color: "#A7ADA7" }}>
                · Atualizado às {format(lastRun, "HH:mm")}
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => { setLoading(true); buildWarnings(); }}
          disabled={loading}
          className="gap-2 text-white flex-shrink-0"
          style={{ background: "#E10867", border: "none" }}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analisando..." : "Atualizar Análise"}
        </Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* ── KPI CARDS ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KpiCard
              label="Total de Alertas"
              value={warnings.length}
              icon={<Activity className="w-4 h-4" />}
              color="#111111"
              bg="#fff"
              active={severityFilter === "all" && filter === "all"}
              onClick={() => { setSeverityFilter("all"); setFilter("all"); }}
            />
            <KpiCard
              label="Críticos"
              value={critical}
              icon={<XCircle className="w-4 h-4" />}
              color="#dc2626"
              bg="#fef2f2"
              active={severityFilter === "3"}
              onClick={() => setSeverityFilter(severityFilter === "3" ? "all" : "3")}
            />
            <KpiCard
              label="Alta Severidade"
              value={high}
              icon={<AlertTriangle className="w-4 h-4" />}
              color="#ea580c"
              bg="#fff7ed"
              active={severityFilter === "2"}
              onClick={() => setSeverityFilter(severityFilter === "2" ? "all" : "2")}
            />
            <KpiCard
              label="Em Atenção"
              value={attention}
              icon={<Eye className="w-4 h-4" />}
              color="#d97706"
              bg="#fffbeb"
              active={severityFilter === "1"}
              onClick={() => setSeverityFilter(severityFilter === "1" ? "all" : "1")}
            />
          </div>

          {/* ── CATEGORY PILLS ── */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilter("all")}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
              style={{
                background: filter === "all" ? "#111111" : "#fff",
                color: filter === "all" ? "#fff" : "#4B4F4B",
                borderColor: filter === "all" ? "#111111" : "#A7ADA7",
              }}>
              Todos ({warnings.length})
            </button>
            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const count = categoryCounts[key] || 0;
              if (count === 0) return null;
              const Icon = meta.icon;
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(active ? "all" : key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
                  style={{
                    background: active ? meta.color : "#fff",
                    color: active ? "#fff" : "#4B4F4B",
                    borderColor: active ? meta.color : "#A7ADA7",
                  }}>
                  <Icon className="w-3 h-3" />
                  {meta.label} ({count})
                </button>
              );
            })}
          </div>

          {/* ── CONTENT ── */}
          {filtered.length === 0 ? (
            warnings.length === 0 ? <EmptyState /> : (
              <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: "#A7ADA7" }}>
                <Filter className="w-8 h-8 mx-auto mb-3" style={{ color: "#A7ADA7" }} />
                <p className="font-semibold" style={{ color: "#111111" }}>Nenhum alerta neste filtro</p>
                <button onClick={() => { setFilter("all"); setSeverityFilter("all"); }}
                  className="text-sm mt-2 underline" style={{ color: "#E10867" }}>
                  Limpar filtros
                </button>
              </div>
            )
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#A7ADA7" }}>
                {filtered.length} alerta{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              </p>
              {filtered.map(w => (
                <WarningCard key={w.id} warning={w} navigate={navigate} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── WARNING CARD ─────────────────────────────────────────────────────────────
function WarningCard({ warning, navigate }) {
  const sev = getSeverity(warning.score);
  const meta = CATEGORY_META[warning.category];
  const Icon = meta?.icon || AlertTriangle;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md"
      style={{ borderColor: "#E5E7EB", borderLeft: `4px solid ${sev.color}` }}>
      <div className="p-5">
        <div className="flex items-start gap-4">

          {/* Icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: sev.bg }}>
            <Icon className="w-5 h-5" style={{ color: sev.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: sev.bg, color: sev.color }}>
                    {sev.label}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "#ECEEEA", color: "#4B4F4B" }}>
                    {meta?.label}
                  </span>
                </div>
                <p className="font-bold text-sm mt-1 truncate" style={{ color: "#111111" }}>
                  {warning.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#4B4F4B" }}>
                  {warning.subtitle}
                </p>
              </div>

              {/* Risk Score */}
              <div className="flex-shrink-0 text-center">
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                  style={{ background: sev.bg }}>
                  <span className="text-lg font-black leading-none" style={{ color: sev.color }}>
                    {warning.score}
                  </span>
                  <span className="text-[9px] font-semibold uppercase" style={{ color: sev.color }}>risco</span>
                </div>
              </div>
            </div>

            {/* Detail */}
            <p className="text-xs mt-2 leading-relaxed" style={{ color: "#6B7280" }}>
              {warning.detail}
            </p>

            {/* Risk bar + action */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "#ECEEEA" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${warning.score}%`, background: sev.color }} />
              </div>
              {warning.action && (
                <button
                  onClick={() => navigate(createPageUrl(warning.action.page))}
                  className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70 flex-shrink-0"
                  style={{ color: sev.color }}>
                  {warning.action.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, color, bg, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md w-full"
      style={{
        borderColor: active ? color : "#E5E7EB",
        boxShadow: active ? `0 0 0 2px ${color}22` : undefined,
      }}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: bg, color }}>
          {icon}
        </div>
        {active && <CheckCircle2 className="w-4 h-4" style={{ color }} />}
      </div>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: "#4B4F4B" }}>{label}</p>
    </button>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border p-14 text-center" style={{ borderColor: "#A7ADA7" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: "#e8f5e9" }}>
        <CheckCircle2 className="w-8 h-8" style={{ color: "#2C4425" }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "#111111" }}>Tudo em ordem!</h2>
      <p className="text-sm max-w-sm mx-auto" style={{ color: "#4B4F4B" }}>
        Nenhum alerta identificado. Projetos, startups e teses estão com boa saúde operacional.
      </p>
    </div>
  );
}

// ─── LOADING STATE ────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="relative">
        <ShieldAlert className="w-10 h-10" style={{ color: "#ECEEEA" }} />
        <Loader2 className="w-6 h-6 animate-spin absolute -bottom-1 -right-1" style={{ color: "#E10867" }} />
      </div>
      <div className="text-center">
        <p className="font-semibold" style={{ color: "#111111" }}>Analisando riscos...</p>
        <p className="text-xs mt-1" style={{ color: "#4B4F4B" }}>
          Verificando projetos, startups, teses e matches
        </p>
      </div>
    </div>
  );
}